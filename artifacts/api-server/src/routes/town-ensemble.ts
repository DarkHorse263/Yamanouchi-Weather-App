import { Router, type IRouter } from "express";
import { getEnsembleForecast } from "../lib/ensemble-forecast.js";

const router: IRouter = Router();

/**
 * GET /api/town-ensemble?lat=&lng=&region=&elevation=
 *
 * Multi-model ensemble forecast for an arbitrary town (lat/lng), powering
 * the per-day confidence indicator on the town weather card. Mirrors the
 * resort-keyed `/forecast/:locationId` endpoint but without requiring a
 * fixed location entry, so towns (which are not in the LOCATIONS table)
 * can show the same "models agree / models disagree" signal.
 *
 * `region` picks the national model to include alongside the global ones:
 *   - AU → ECMWF + GFS + ICON  (no national model on Open-Meteo for AU)
 *   - JP → ECMWF + GFS + ICON + JMA
 *   - other → ECMWF + GFS + ICON
 *
 * `elevation` is optional (default 800m) and used only by the MET Norway
 * fetcher to lapse-rate temperatures correctly. Town centres rarely sit
 * above 1500m so the default is fine for our three configured regions.
 *
 * Caching, source-failure handling, and confidence classification live in
 * `getEnsembleForecast` itself - we don't repeat the logic here.
 */
router.get("/town-ensemble", async (req, res): Promise<void> => {
  const lat = Number(req.query["lat"]);
  const lng = Number(req.query["lng"]);
  const elevation = req.query["elevation"] !== undefined
    ? Number(req.query["elevation"])
    : 800;
  const regionRaw = String(req.query["region"] ?? "OTHER").toUpperCase();
  const region: "AU" | "JP" | "OTHER" =
    regionRaw === "AU" || regionRaw === "JP" ? regionRaw : "OTHER";

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    res.status(400).json({
      error: "BAD_COORDS",
      message: "lat must be in [-90,90] and lng in [-180,180]",
    });
    return;
  }
  if (!Number.isFinite(elevation) || elevation < 0 || elevation > 9000) {
    res.status(400).json({
      error: "BAD_ELEVATION",
      message: "elevation must be a non-negative number under 9000",
    });
    return;
  }

  // Pick a sensible IANA timezone per region so per-day buckets line up with
  // local midnight. Open-Meteo also accepts "auto" but being explicit keeps
  // cache keys stable when called from different replicas.
  const timezone =
    region === "JP"
      ? "Asia/Tokyo"
      : region === "AU"
        ? "Australia/Sydney"
        : "UTC";

  try {
    const ensemble = await getEnsembleForecast({
      latitude: lat,
      longitude: lng,
      elevation,
      region,
      timezone,
      days: 7,
    });
    res.json(ensemble);
  } catch (error) {
    res.status(500).json({
      error: "ENSEMBLE_FETCH_ERROR",
      message: error instanceof Error ? error.message : "Failed to fetch ensemble forecast",
    });
  }
});

export default router;
