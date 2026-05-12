import { Router, type IRouter } from "express";
import { getElevationForecast } from "../lib/openMeteoElevation";

const router: IRouter = Router();

/**
 * GET /api/elevation-forecast?lat=&lng=&summitElevationM=&name=
 *
 * Returns a 7-day elevation-banded forecast (upper / mid / lower) for an
 * arbitrary mountain, sourced from Open-Meteo. The API server makes three
 * calls (one per elevation band) so that the temperature lapse rate is
 * applied per band.
 *
 * Responses:
 *   200 → { configured: true, forecast: ElevationForecast | null }
 *   400 → invalid query parameters
 */
router.get("/elevation-forecast", async (req, res) => {
  const lat = Number(req.query["lat"]);
  const lng = Number(req.query["lng"]);
  const summitElevationM = Number(req.query["summitElevationM"]);
  const name =
    typeof req.query["name"] === "string" ? req.query["name"] : undefined;

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
  if (!Number.isFinite(summitElevationM) || summitElevationM <= 0 || summitElevationM > 9000) {
    res.status(400).json({
      error: "BAD_ELEVATION",
      message: "summitElevationM must be a positive number under 9000",
    });
    return;
  }

  const forecast = await getElevationForecast({ lat, lng, summitElevationM, name });
  res.json({ configured: true, forecast });
});

export default router;
