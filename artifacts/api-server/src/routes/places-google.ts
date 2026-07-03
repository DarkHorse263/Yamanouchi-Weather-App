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
 * Locality search · powers the "your current location" search bar so a visitor
 * can look up conditions for any suburb, town or city by name (not just GPS).
 *
 * Uses Google Places (New) Autocomplete rather than Text Search. Autocomplete is
 * the only Places endpoint that accepts BOTH a locality type filter and a
 * multi-country restriction in a single call, and that is exactly what a
 * ski-weather search needs: a generic word like "Orange" must resolve to the
 * TOWN of Orange, NSW - not a page of businesses ("orange college", "optus
 * orange", "ito orange beach") the way Text Search ranked it. We ask only for
 * locality-shaped predictions across the three countries feelzlike serves.
 *
 * Autocomplete returns a placeId + label but NO coordinates, so the picked
 * result is resolved to lat/lng on selection via /places/details below (one
 * cheap lookup per pick, versus Text Search's per-search fan-out). The key stays
 * server-side and we return a small, stable shape.
 */

// Locality-shaped primary types: suburbs (sublocality), towns / cities
// (locality, postal_town) and the town-sized administrative unit (level 3).
// Businesses, POIs and natural features are deliberately excluded so the search
// only ever offers real suburbs, towns and cities. Autocomplete accepts up to 5
// primary types; these four cover AU / JP / NZ localities.
const LOCALITY_TYPES = [
  "locality",
  "sublocality",
  "postal_town",
  "administrative_area_level_3",
];

// The countries feelzlike serves (AU incl. Tasmania, JP, NZ). Autocomplete's
// includedRegionCodes takes up to 15 CLDR region codes in ONE call, so - unlike
// Text Search, whose regionCode is single and whose rectangles leaked
// neighbouring countries - there is no per-country fan-out and no foreign-hit
// filtering to do afterwards. Google enforces the country scope for us.
const SEARCH_REGION_CODES = ["au", "jp", "nz"];

interface SearchResultOut {
  id: string;
  name: string;
  address: string;
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

  try {
    const upstream = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        input: q,
        includedPrimaryTypes: LOCALITY_TYPES,
        includedRegionCodes: SEARCH_REGION_CODES,
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
      suggestions?: Array<{
        placePrediction?: {
          placeId?: string;
          text?: { text?: string };
          structuredFormat?: {
            mainText?: { text?: string };
            secondaryText?: { text?: string };
          };
        };
      }>;
    };

    // mainText is the locality name ("Orange"), secondaryText the context
    // ("NSW, Australia"). Fall back to the full text when the structured split is
    // absent. Skip any prediction without a placeId - we need it to fetch coords.
    const out: SearchResultOut[] = [];
    for (const s of data.suggestions ?? []) {
      const p = s.placePrediction;
      if (!p?.placeId) continue;
      const name = p.structuredFormat?.mainText?.text ?? p.text?.text ?? "";
      if (!name) continue;
      out.push({
        id: p.placeId,
        name,
        address: p.structuredFormat?.secondaryText?.text ?? "",
      });
      if (out.length >= max) break;
    }

    // Short cache only. Predictions for a term are fairly stable, but a long TTL
    // means a search-behaviour change (e.g. the Text Search -> Autocomplete
    // rewrite) keeps serving the old shape from the browser cache for up to an
    // hour. Five minutes still absorbs rapid repeats without pinning stale data.
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    res.json({ results: out });
  } catch (err) {
    res.status(503).json({
      error: "FETCH_FAILED",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

/**
 * Resolve a picked Autocomplete prediction to coordinates. Autocomplete returns
 * a placeId only, so the search bar calls this once - on selection - to get the
 * lat/lng the /near-you view needs. The field mask is held to id + name +
 * address + location so this stays a cheap Place Details lookup.
 */
router.get("/places/details", async (req, res) => {
  const apiKey = process.env["GOOGLE_PLACES_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "PLACES_NOT_CONFIGURED", message: "GOOGLE_PLACES_API_KEY is not set on the server." });
    return;
  }

  const placeId = String(req.query["placeId"] ?? "").trim();
  // Google place ids are opaque URL-safe tokens. Validate the shape before
  // interpolating into the upstream URL (blocks path traversal / SSRF via a
  // crafted id).
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(placeId)) {
    res.status(400).json({ error: "BAD_PLACE_ID", message: "placeId is missing or malformed" });
    return;
  }

  try {
    const upstream = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=en`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      const code =
        upstream.status === 404
          ? 404
          : upstream.status >= 400 && upstream.status < 500
            ? 502
            : 503;
      res.status(code).json({
        error: "UPSTREAM_ERROR",
        status: upstream.status,
        message: text.slice(0, 400),
      });
      return;
    }

    const p = (await upstream.json()) as {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
    };

    const lat = p.location?.latitude;
    const lng = p.location?.longitude;
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(502).json({ error: "NO_LOCATION", message: "place has no coordinates" });
      return;
    }

    // Place geometry is stable, so cache for an hour at the edge.
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.json({
      id: p.id ?? placeId,
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
      lat,
      lng,
    });
  } catch (err) {
    res.status(503).json({
      error: "FETCH_FAILED",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default router;
