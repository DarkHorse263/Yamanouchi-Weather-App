import { Router, type IRouter } from "express";
import { getElevationForecast, isConfigured } from "../lib/weatherUnlocked";

const router: IRouter = Router();

/**
 * GET /api/elevation-forecast/:resortId
 *
 * Returns a 7-day elevation-banded forecast (upper / mid / lower lift)
 * for a Weather Unlocked Ski Resort. The :resortId is the numeric WU
 * resort id, which is mapped per-mountain in the feelzlike region
 * config (`MountainLink.weatherUnlockedId`).
 *
 * Responses:
 *   200 → { configured: true, forecast: ElevationForecast }
 *   200 → { configured: true, forecast: null }   when upstream had no data
 *   200 → { configured: false }                  when API keys are unset
 *   400 → invalid resort id
 */
router.get("/elevation-forecast/:resortId", async (req, res) => {
  const resortId = Number(req.params.resortId);
  if (!Number.isInteger(resortId) || resortId <= 0) {
    res.status(400).json({
      error: "BAD_RESORT_ID",
      message: "resortId must be a positive integer",
    });
    return;
  }

  if (!isConfigured()) {
    res.json({ configured: false, forecast: null });
    return;
  }

  const forecast = await getElevationForecast(resortId);
  res.json({ configured: true, forecast });
});

export default router;
