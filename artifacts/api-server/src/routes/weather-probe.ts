import { Router } from "express";
import rateLimit from "express-rate-limit";
import { fetchOpenMeteo } from "../lib/openMeteoClient";

const router = Router();
const cache = new Map<string, { until: number; data: unknown }>();
router.get("/weather-probe", rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false }), async (req, res) => {
  const { latitude, longitude, metric } = req.query;
  const lat = typeof latitude === "string" && latitude.trim() ? Number(latitude) : NaN;
  const lon = typeof longitude === "string" && longitude.trim() ? Number(longitude) : NaN;
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180 || !["true", "false"].includes(String(metric))) {
    res.status(400).json({ error: "INVALID_COORDINATES_OR_UNITS" }); return;
  }
  const isMetric = metric === "true";
  const params = new URLSearchParams({
    latitude: lat.toFixed(3), longitude: lon.toFixed(3),
    current: "temperature_2m,wind_speed_10m,wind_direction_10m",
    daily: "snowfall_sum,precipitation_probability_max", forecast_days: "1", timezone: "auto",
    temperature_unit: isMetric ? "celsius" : "fahrenheit",
    wind_speed_unit: isMetric ? "kmh" : "mph", precipitation_unit: isMetric ? "mm" : "inch",
  });
  const key = params.toString();
  res.setHeader("Cache-Control", "no-store");
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) { res.json(hit.data); return; }
  try {
    const upstream = await fetchOpenMeteo(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(10000) });
    if (!upstream.ok) throw new Error("Weather provider unavailable");
    const raw = await upstream.json();
    const data = { current: raw.current, current_units: raw.current_units, daily: raw.daily, daily_units: raw.daily_units };
    if (cache.size >= 500) cache.delete(cache.keys().next().value!);
    cache.set(key, { data, until: Date.now() + 300_000 });
    res.json(data);
  } catch {
    res.status(503).json({ error: "WEATHER_TEMPORARILY_UNAVAILABLE" });
  }
});
export default router;
