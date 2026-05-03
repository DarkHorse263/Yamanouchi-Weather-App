import { Router, type IRouter } from "express";

/**
 * Live Google Places (New) proxy. Keeps GOOGLE_PLACES_API_KEY server-side.
 * Frontend hits /api/places/nearby?lat=&lng=&radius=&kind=stay|eat|explore
 * and gets a small, stable shape back (no Google-internal field names leaked).
 */

const router: IRouter = Router();

const KIND_TO_TYPES: Record<string, string[]> = {
  stay:    ["lodging"],
  eat:     ["restaurant", "cafe", "bakery", "bar"],
  explore: ["tourist_attraction", "museum", "park", "natural_feature"],
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
      const photoUrl = photoName
        ? `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=480&key=${encodeURIComponent(apiKey)}`
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

    // Cache for 1 hour at the edge — Places data doesn't change minute to minute
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.json({ places: out });
  } catch (err) {
    res.status(503).json({
      error: "FETCH_FAILED",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default router;
