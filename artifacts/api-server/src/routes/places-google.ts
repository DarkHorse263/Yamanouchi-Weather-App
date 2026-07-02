import { Router, type IRouter } from "express";

/**
 * Live Google Places (New) proxy. Keeps GOOGLE_PLACES_API_KEY server-side.
 * Frontend hits /api/places/nearby?lat=&lng=&radius=&kind=stay|eat|explore
 * and gets a small, stable shape back (no Google-internal field names leaked).
 */

const router: IRouter = Router();

// IMPORTANT: every value below MUST be a Table A type accepted by Google Places (New)
// `places:searchNearby`. The legacy v1 type `natural_feature` is NOT in Table A and
// caused the upstream to return INVALID_ARGUMENT 400 ("Unsupported types: natural_feature."),
// which surfaced to the client as 502 and a permanent loading skeleton on /:region/:town/explore.
// Replaced with `national_park` + `hiking_area`, which cover the same outdoor/nature intent.
// See: https://developers.google.com/maps/documentation/places/web-service/place-types#table-a
const KIND_TO_TYPES: Record<string, string[]> = {
  stay:    ["lodging"],
  eat:     ["restaurant", "cafe", "bakery", "bar"],
  explore: ["tourist_attraction", "museum", "park", "national_park", "hiking_area"],
};

interface PlaceOut {
  id: string;
  name: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: number; // 0-4
  primaryType?: string;
  address?: string;
  lat?: number;
  lng?: number;
  photoUrl?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  openNow?: boolean;
}

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

router.get("/places/nearby", async (req, res) => {
  const apiKey = process.env["GOOGLE_PLACES_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "PLACES_NOT_CONFIGURED", message: "GOOGLE_PLACES_API_KEY is not set on the server." });
    return;
  }

  const lat = Number(req.query["lat"]);
  const lng = Number(req.query["lng"]);
  const radiusRaw = Number(req.query["radius"] ?? 5000);
  const kind = String(req.query["kind"] ?? "stay").toLowerCase();
  const max = Math.min(20, Math.max(1, Number(req.query["max"] ?? 20)));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: "BAD_INPUT", message: "lat and lng query params required" });
    return;
  }
  const radius = Math.min(50000, Math.max(50, Number.isFinite(radiusRaw) ? radiusRaw : 5000));
  const includedTypes = KIND_TO_TYPES[kind] ?? KIND_TO_TYPES["stay"]!;

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.primaryType",
    "places.googleMapsUri",
    "places.websiteUri",
    "places.currentOpeningHours.openNow",
    "places.photos.name",
  ].join(",");

  try {
    const upstream = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        includedTypes,
        maxResultCount: max,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius,
          },
        },
        rankPreference: "POPULARITY",
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      res.status(upstream.status >= 400 && upstream.status < 500 ? 502 : 503).json({
        error: "UPSTREAM_ERROR",
        status: upstream.status,
        message: text.slice(0, 400),
      });
      return;
    }

    const data = (await upstream.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude: number; longitude: number };
        rating?: number;
        userRatingCount?: number;
        priceLevel?: string;
        primaryType?: string;
        googleMapsUri?: string;
        websiteUri?: string;
        currentOpeningHours?: { openNow?: boolean };
        photos?: Array<{ name?: string }>;
      }>;
    };

    const out: PlaceOut[] = (data.places ?? []).map((p) => {
      const photoName = p.photos?.[0]?.name;
      // Proxy photo through our server so the API key never reaches the browser.
      const photoUrl = photoName
        ? `/api/places/photo?name=${encodeURIComponent(photoName)}&w=480`
        : undefined;
      return {
        id: p.id,
        name: p.displayName?.text ?? "",
        rating: p.rating,
        ratingCount: p.userRatingCount,
        priceLevel: p.priceLevel ? PRICE_LEVEL_MAP[p.priceLevel] : undefined,
        primaryType: p.primaryType,
        address: p.formattedAddress,
        lat: p.location?.latitude,
        lng: p.location?.longitude,
        photoUrl,
        googleMapsUri: p.googleMapsUri,
        websiteUri: p.websiteUri,
        openNow: p.currentOpeningHours?.openNow,
      };
    });

    // Cache for 1 hour at the edge - Places data doesn't change minute to minute
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.json({ places: out });
  } catch (err) {
    res.status(503).json({
      error: "FETCH_FAILED",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

/**
 * Photo proxy: fetches the actual image bytes from Google with the server-side
 * key and streams them back to the client. Keeps the key off the wire.
 * Names look like "places/<placeId>/photos/<photoId>".
 */
router.get("/places/photo", async (req, res) => {
  const apiKey = process.env["GOOGLE_PLACES_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "PLACES_NOT_CONFIGURED" });
    return;
  }
  const name = String(req.query["name"] ?? "");
  const widthRaw = Number(req.query["w"] ?? 480);
  const width = Math.min(1600, Math.max(80, Number.isFinite(widthRaw) ? widthRaw : 480));

  // Defensive: only allow well-formed photo names - must look like
  // "places/<id>/photos/<id>" with safe characters. Blocks open-redirect / SSRF abuse.
  if (!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name)) {
    res.status(400).json({ error: "BAD_NAME" });
    return;
  }

  try {
    const upstream = await fetch(
      `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}&key=${encodeURIComponent(apiKey)}`,
      { redirect: "follow" },
    );
    if (!upstream.ok || !upstream.body) {
      res.status(upstream.status === 404 ? 404 : 502).end();
      return;
    }
    const ct = upstream.headers.get("content-type") ?? "image/jpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, immutable");

    // Stream the bytes through; works in Node 18+ where fetch returns a Web ReadableStream.
    const reader = upstream.body.getReader();
    res.on("close", () => { reader.cancel().catch(() => {}); });
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(value)) {
        await new Promise<void>((resolve) => res.once("drain", resolve));
      }
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(503).json({
        error: "FETCH_FAILED",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } else {
      res.end();
    }
  }
});

/**
 * Forward place search · powers the "your current location" search bar so a
 * visitor can look up conditions for any town or city by name (not just GPS).
 * Uses Google Places (New) places:searchText - one call returns the display
 * name, address and coordinates. The key stays server-side and we return a
 * small, stable shape (no Google-internal field names leaked).
 */
// The three countries feelzlike serves (AU incl. Tasmania, JP, NZ). Google
// Text Search has no clean multi-country restriction (regionCode is single;
// includedRegionCodes is autocomplete-only), so each country is queried with
// its own locationRestriction rectangle and results are kept only when they
// resolve to that country. `allowNullCountry` rescues the odd mountain / ski
// field that Google returns without an addressComponents country: the AU and NZ
// rectangles cover only their own country plus ocean, so a country-less hit
// inside them is safely theirs · the JP rectangle overlaps South Korea,
// eastern China and the Russian far east, so it stays strict.
interface ServedRegion {
  country: string;
  box: [number, number, number, number];
  allowNullCountry: boolean;
}
const SERVED_REGIONS: ServedRegion[] = [
  { country: "AU", box: [-44.0, -9.0, 112.0, 154.5], allowNullCountry: true },
  { country: "JP", box: [24.0, 46.5, 122.0, 146.5], allowNullCountry: false },
  { country: "NZ", box: [-47.5, -33.5, 166.0, 179.5], allowNullCountry: true },
];
const SERVED_BBOXES: Array<[number, number, number, number]> = SERVED_REGIONS.map(
  (r) => r.box,
);
function inServedRegion(lat: number, lng: number): boolean {
  return SERVED_BBOXES.some(
    ([minLat, maxLat, minLng, maxLng]) =>
      lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng,
  );
}

interface SearchResultOut {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

// Internal shape carrying the signals we rank + filter on before trimming down
// to the public SearchResultOut.
interface ScoredResult extends SearchResultOut {
  country: string | null;
  placeLike: boolean;
}

// Place types that read as a town / city / region / mountain rather than a
// business. Results carrying one of these are ranked ahead of shops and other
// POIs, so typing "orange" surfaces the town of Orange NSW, not "Orange
// tobacco". Resort + natural-feature types are included so a searched ski field
// still ranks well.
const PLACE_LIKE_TYPES = new Set([
  "locality",
  "sublocality",
  "sublocality_level_1",
  "postal_town",
  "colloquial_area",
  "neighborhood",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "administrative_area_level_3",
  "administrative_area_level_4",
  "administrative_area_level_5",
  "political",
  "natural_feature",
  "national_park",
  "ski_resort",
]);

function countryCodeOf(
  components?: Array<{ types?: string[]; shortText?: string }>,
): string | null {
  if (!components) return null;
  for (const c of components) {
    if (c.types?.includes("country")) return c.shortText ?? null;
  }
  return null;
}

// One Text Search restricted to a single served-country rectangle. Restricting
// the query upstream (rather than searching globally then dropping foreign
// hits) is what lets an ambiguous name surface its AU/JP/NZ match: a global
// search for "Orange" is dominated by Orange, France / Orange, California and
// none of the served-region towns make the top 20, so the post-filter used to
// leave zero results. `locationRestriction` accepts a single rectangle, so we
// run one call per country and merge. Each result is tagged with its resolved
// country code (to drop Korea/China/Russia that fall inside the JP rectangle)
// and whether it looks like a place vs a business (for ranking). Throws on a
// hard upstream failure; the caller runs these under Promise.allSettled so one
// country failing still lets the others answer.
async function searchTextInBox(
  apiKey: string,
  q: string,
  region: ServedRegion,
  fieldMask: string,
): Promise<ScoredResult[]> {
  const [minLat, maxLat, minLng, maxLng] = region.box;
  const upstream = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({
      textQuery: q,
      maxResultCount: 10,
      languageCode: "en",
      // Rectangle is the only shape Text Search accepts for a hard
      // restriction. low = SW corner, high = NE corner.
      locationRestriction: {
        rectangle: {
          low: { latitude: minLat, longitude: minLng },
          high: { latitude: maxLat, longitude: maxLng },
        },
      },
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    throw new Error(`upstream ${upstream.status}: ${text.slice(0, 200)}`);
  }

  const data = (await upstream.json()) as {
    places?: Array<{
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
      types?: string[];
      addressComponents?: Array<{ types?: string[]; shortText?: string }>;
    }>;
  };

  return (data.places ?? [])
    .filter(
      (p) =>
        p.location &&
        Number.isFinite(p.location.latitude) &&
        Number.isFinite(p.location.longitude),
    )
    .map((p) => {
      const types = p.types ?? [];
      return {
        id: p.id,
        name: p.displayName?.text ?? "",
        address: p.formattedAddress ?? "",
        lat: p.location!.latitude,
        lng: p.location!.longitude,
        country: countryCodeOf(p.addressComponents),
        placeLike: types.some((t) => PLACE_LIKE_TYPES.has(t)),
      };
    })
    .filter((p) =>
      p.country == null ? region.allowNullCountry : p.country === region.country,
    );
}

router.get("/places/search", async (req, res) => {
  const apiKey = process.env["GOOGLE_PLACES_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "PLACES_NOT_CONFIGURED", message: "GOOGLE_PLACES_API_KEY is not set on the server." });
    return;
  }

  const q = String(req.query["q"] ?? "").trim().slice(0, 80);
  if (q.length < 3) {
    res.status(400).json({ error: "QUERY_TOO_SHORT", message: "q must be at least 3 characters" });
    return;
  }
  const max = Math.min(5, Math.max(1, Number(req.query["max"] ?? 5)));

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    // types drives the town-vs-business ranking; addressComponents gives the
    // authoritative country code that trims foreign hits out of the JP box.
    // Both stay within the Text Search Pro tier already used by location +
    // formattedAddress, so they add no billing cost.
    "places.types",
    "places.addressComponents",
  ].join(",");

  try {
    // Fan out one restricted search per served country in parallel, then merge.
    // allSettled so a single country's timeout/error doesn't sink the whole
    // search - the remaining countries still return results.
    const settled = await Promise.allSettled(
      SERVED_REGIONS.map((region) => searchTextInBox(apiKey, q, region, fieldMask)),
    );
    const lists = settled
      .filter(
        (s): s is PromiseFulfilledResult<ScoredResult[]> => s.status === "fulfilled",
      )
      .map((s) => s.value);

    if (lists.length === 0) {
      // Every country's upstream call failed.
      res.status(502).json({
        error: "UPSTREAM_ERROR",
        message: "place search is unavailable right now",
      });
      return;
    }

    // Round-robin across the countries (AU first each round, matching the
    // served-region order) so no single country crowds the others out of the
    // capped list. Within that traversal, split into place-like (towns, cities,
    // regions, mountains) and everything else, so a searched town always ranks
    // above a same-named business · then concatenate place-like first. Dedupe
    // by place id; the served-region box stays as a defensive net alongside the
    // country-code filter already applied upstream.
    const seen = new Set<string>();
    const placeLike: SearchResultOut[] = [];
    const other: SearchResultOut[] = [];
    const longest = Math.max(...lists.map((l) => l.length));
    for (let i = 0; i < longest; i++) {
      for (const list of lists) {
        const item = list[i];
        if (!item || seen.has(item.id)) continue;
        if (!inServedRegion(item.lat, item.lng)) continue;
        seen.add(item.id);
        const { id, name, address, lat, lng } = item;
        (item.placeLike ? placeLike : other).push({ id, name, address, lat, lng });
      }
    }
    const out = [...placeLike, ...other].slice(0, max);

    // Place geometry is stable, so cache for an hour at the edge.
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.json({ results: out });
  } catch (err) {
    res.status(503).json({
      error: "FETCH_FAILED",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default router;
