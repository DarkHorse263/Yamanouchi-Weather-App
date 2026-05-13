import { Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * In-memory stale-on-error cache for /town-weather. Keyed by rounded
 * lat/lng (≈110m precision so nearby town centres collide intentionally
 * and the cache hit-rate stays useful). When Open-Meteo blips, we serve
 * the most recent successful response for up to STALE_MAX_AGE_MS so
 * users see slightly old data instead of a 502/503 spinner.
 *
 * Bound: 200 entries (we only have a few dozen towns; this is a safety
 * cap for unexpected lat/lng query patterns).
 */
const STALE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6h
const STALE_CACHE_MAX_ENTRIES = 200;
const staleCache = new Map<string, { payload: unknown; storedAt: number }>();

function staleKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function rememberFresh(key: string, payload: unknown): void {
  // Delete existing entry first so re-inserting the same key doesn't
  // count against the capacity check (and refreshes insertion order).
  staleCache.delete(key);
  if (staleCache.size >= STALE_CACHE_MAX_ENTRIES) {
    const firstKey = staleCache.keys().next().value;
    if (firstKey !== undefined) staleCache.delete(firstKey);
  }
  staleCache.set(key, { payload, storedAt: Date.now() });
}

function readStale(key: string): { payload: unknown; ageMs: number } | null {
  const hit = staleCache.get(key);
  if (!hit) return null;
  const ageMs = Date.now() - hit.storedAt;
  if (ageMs > STALE_MAX_AGE_MS) {
    staleCache.delete(key);
    return null;
  }
  // True-LRU: bump recency on read by re-inserting at tail of insertion order.
  staleCache.delete(key);
  staleCache.set(key, hit);
  return { payload: hit.payload, ageMs };
}

/**
 * Comprehensive weather dashboard data for an arbitrary lat/lng (a base town,
 * not a fixed resort station). Powered by Open-Meteo (free, no key required).
 *
 * Returns: current conditions, today's headline, 24-hour outlook, 7-day forecast,
 * sunrise/sunset, plus computed "feels like" / wind-chill / UV index / snow depth.
 */
router.get("/town-weather", async (req, res) => {
  const lat = Number(req.query["lat"]);
  const lng = Number(req.query["lng"]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    res.status(400).json({ error: "BAD_COORDS", message: "Provide ?lat= and ?lng= as valid numbers." });
    return;
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: "auto",
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "is_day",
      "precipitation",
      "rain",
      "showers",
      "snowfall",
      "weather_code",
      "cloud_cover",
      "pressure_msl",
      "surface_pressure",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "visibility",
      "uv_index",
      "dew_point_2m",
    ].join(","),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation_probability",
      "precipitation",
      "snowfall",
      "snow_depth",
      "weather_code",
      "wind_speed_10m",
      "uv_index",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_sum",
      "rain_sum",
      "snowfall_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
    ].join(","),
    forecast_days: "7",
    forecast_hours: "24",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    temperature_unit: "celsius",
  });

  const cacheKey = staleKey(lat, lng);

  const serveStale = (reason: string, status: number): boolean => {
    const stale = readStale(cacheKey);
    if (!stale) return false;
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
    res.setHeader("X-Feelzlike-Stale", `1; reason=${reason}; age=${Math.round(stale.ageMs / 1000)}s; upstream-status=${status}`);
    res.json(stale.payload);
    return true;
  };

  try {
    const upstream = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "feelzlike/1.0 (mountain-weather-pwa; contact: hello@feelzlike.app)",
      },
    });
    if (!upstream.ok) {
      if (serveStale("upstream_not_ok", upstream.status)) return;
      res.status(502).json({ error: "UPSTREAM_FAILED", status: upstream.status });
      return;
    }
    const d = (await upstream.json()) as {
      current?: Record<string, number | string>;
      current_units?: Record<string, string>;
      hourly?: { time: string[]; [k: string]: unknown };
      daily?: { time: string[]; [k: string]: unknown };
      utc_offset_seconds?: number;
      timezone?: string;
    };

    const cur = d.current ?? {};
    const hourly = d.hourly ?? { time: [] };
    const daily = d.daily ?? { time: [] };

    const payload = {
      coords: { lat, lng },
      timezone: d.timezone ?? "UTC",
      utcOffsetSeconds: d.utc_offset_seconds ?? 0,
      current: {
        time: cur["time"] ?? null,
        temperature: numOrNull(cur["temperature_2m"]),
        feelsLike: numOrNull(cur["apparent_temperature"]),
        humidity: numOrNull(cur["relative_humidity_2m"]),
        isDay: cur["is_day"] === 1 || cur["is_day"] === "1",
        precipitation: numOrNull(cur["precipitation"]),
        rain: numOrNull(cur["rain"]),
        showers: numOrNull(cur["showers"]),
        snowfall: numOrNull(cur["snowfall"]), // cm in last hour
        weatherCode: numOrNull(cur["weather_code"]),
        weatherDescription: describe(numOrNull(cur["weather_code"])),
        cloudCover: numOrNull(cur["cloud_cover"]),
        pressure: numOrNull(cur["pressure_msl"]),
        windSpeed: numOrNull(cur["wind_speed_10m"]),
        windDirection: numOrNull(cur["wind_direction_10m"]),
        windDirectionCompass: compass(numOrNull(cur["wind_direction_10m"])),
        windGust: numOrNull(cur["wind_gusts_10m"]),
        visibility: numOrNull(cur["visibility"]),
        uvIndex: numOrNull(cur["uv_index"]),
        dewpoint: numOrNull(cur["dew_point_2m"]),
      },
      hourly: pickHourly(hourly),
      daily: pickDaily(daily),
    };

    rememberFresh(cacheKey, payload);
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=600");
    res.json(payload);
  } catch (err) {
    if (serveStale("fetch_threw", 0)) return;
    res.status(503).json({
      error: "FETCH_FAILED",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

function numOrNull(v: unknown): number | null {
  return Number.isFinite(v) ? Number(v) : null;
}

function compass(deg: number | null): string | null {
  if (deg == null) return null;
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16] ?? null;
}

function pickHourly(h: { time: string[]; [k: string]: unknown }): Array<Record<string, number | string | null>> {
  const arr = (k: string): number[] => (Array.isArray(h[k]) ? (h[k] as number[]) : []);
  const t = h.time ?? [];
  return t.slice(0, 24).map((time, i) => ({
    time,
    temperature: numOrNull(arr("temperature_2m")[i]),
    feelsLike: numOrNull(arr("apparent_temperature")[i]),
    precipitationProbability: numOrNull(arr("precipitation_probability")[i]),
    precipitation: numOrNull(arr("precipitation")[i]),
    snowfall: numOrNull(arr("snowfall")[i]),
    snowDepth: numOrNull(arr("snow_depth")[i]),
    weatherCode: numOrNull(arr("weather_code")[i]),
    windSpeed: numOrNull(arr("wind_speed_10m")[i]),
    uvIndex: numOrNull(arr("uv_index")[i]),
  }));
}

function pickDaily(d: { time: string[]; [k: string]: unknown }): Array<Record<string, number | string | null>> {
  const arr = (k: string): unknown[] => (Array.isArray(d[k]) ? (d[k] as unknown[]) : []);
  const t = d.time ?? [];
  return t.map((date, i) => ({
    date,
    weatherCode: numOrNull(arr("weather_code")[i]),
    weatherDescription: describe(numOrNull(arr("weather_code")[i])),
    tempMax: numOrNull(arr("temperature_2m_max")[i]),
    tempMin: numOrNull(arr("temperature_2m_min")[i]),
    feelsLikeMax: numOrNull(arr("apparent_temperature_max")[i]),
    feelsLikeMin: numOrNull(arr("apparent_temperature_min")[i]),
    sunrise: typeof arr("sunrise")[i] === "string" ? (arr("sunrise")[i] as string) : null,
    sunset: typeof arr("sunset")[i] === "string" ? (arr("sunset")[i] as string) : null,
    uvIndexMax: numOrNull(arr("uv_index_max")[i]),
    precipitationSum: numOrNull(arr("precipitation_sum")[i]),
    rainSum: numOrNull(arr("rain_sum")[i]),
    snowfallSum: numOrNull(arr("snowfall_sum")[i]),
    precipitationProbabilityMax: numOrNull(arr("precipitation_probability_max")[i]),
    windSpeedMax: numOrNull(arr("wind_speed_10m_max")[i]),
    windGustMax: numOrNull(arr("wind_gusts_10m_max")[i]),
  }));
}

/**
 * WMO weather-code → human description.
 * https://open-meteo.com/en/docs §"WMO Weather interpretation codes"
 */
function describe(code: number | null): string {
  if (code == null) return "Unknown";
  const map: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight showers",
    81: "Moderate showers",
    82: "Violent showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm w/ slight hail",
    99: "Thunderstorm w/ heavy hail",
  };
  return map[code] ?? `Code ${code}`;
}

export default router;
