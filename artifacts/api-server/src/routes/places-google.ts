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
// Bounding boxes for the three countries feelzlike serves (AU incl. Tasmania,
// JP, NZ). Google Text Search has no clean multi-country restriction
// (regionCode is single; includedRegionCodes is autocomplete-only), so we drop
// any result outside all three boxes. This strips same-named places on other
// continents and keeps AU/JP/NZ towns surfacing cleanly.
const SERVED_BBOXES: Array<[number, number, number, number]> = [
  [-44.0, -9.0, 112.0, 154.5], // Australia
  [24.0, 46.5, 122.0, 146.5], // Japan
  [-47.5, -33.5, 166.0, 179.5], // New Zealand
];
function inServedRegion(lat: number, lng: number): boolean {
  return SERVED_BBOXES.some(
    ([minLat, maxLat, minLng, maxLng]) =>
      lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng,
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
  ].join(",");

  try {
    const upstream = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        textQuery: q,
        // Over-fetch, then filter to AU/JP/NZ and slice below. An ambiguous
        // name (e.g. "Bright", "Marysville") can have all of its top few hits
        // abroad, so ask for the upstream max (20) or filtering could leave
        // zero served-region results.
        maxResultCount: 20,
        languageCode: "en",
      }),
      signal: AbortSignal.timeout(8000),
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
      }>;
    };

    const out = (data.places ?? [])
      .filter(
        (p) =>
          p.location &&
          Number.isFinite(p.location.latitude) &&
          Number.isFinite(p.location.longitude),
      )
      .map((p) => ({
        id: p.id,
        name: p.displayName?.text ?? "",
        address: p.formattedAddress ?? "",
        lat: p.location!.latitude,
        lng: p.location!.longitude,
      }))
      .filter((p) => inServedRegion(p.lat, p.lng))
      .slice(0, max);

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
