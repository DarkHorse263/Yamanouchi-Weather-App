import { Router, type IRouter } from "express";

const router: IRouter = Router();

type RegionStatus = "live" | "soon";

interface RegionConfig {
  id: string;
  name: string;
  country: string;
  countryCode: "AU" | "JP";
  region: string;
  status: RegionStatus;
  href: string;
  baseTowns: string[];
  mountains: string[];
  headlineLabel: string;
  lat?: number;
  lon?: number;
  elevation?: number;
  model?: string;
  timezone?: string;
  sourceLabel?: string;
}

const REGIONS: RegionConfig[] = [
  {
    id: "snowy-mountains",
    name: "Snowy Mountains",
    country: "Australia",
    countryCode: "AU",
    region: "New South Wales",
    status: "live",
    href: "/snowy-mountains/",
    baseTowns: ["Jindabyne", "Berridale", "Cooma"],
    mountains: ["Thredbo", "Perisher", "Charlotte Pass", "Selwyn"],
    headlineLabel: "Thredbo Top",
    lat: -36.5054,
    lon: 148.3089,
    elevation: 1957,
    timezone: "Australia/Sydney",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "yamanouchi",
    name: "Yamanouchi Town",
    country: "Japan",
    countryCode: "JP",
    region: "Nagano",
    status: "live",
    href: "/yamanouchi/",
    baseTowns: ["Yudanaka", "Shibu Onsen", "Yomase"],
    mountains: ["Shiga Kogen", "Yomase", "X-Jam", "Ryuoo"],
    headlineLabel: "Shiga Kogen",
    lat: 36.79,
    lon: 138.51,
    elevation: 1800,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "iiyama",
    name: "Iiyama",
    country: "Japan",
    countryCode: "JP",
    region: "Nagano",
    status: "soon",
    href: "/iiyama/",
    baseTowns: ["Iiyama", "Kijimadaira"],
    mountains: [
      "Madarao",
      "Tangram",
      "Nozawa Onsen",
      "Togari Onsen",
      "The Cupid of Romance",
      "Makinoiri Kogen Snow Park",
    ],
    headlineLabel: "Madarao",
  },
];

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
};

function describe(code: number | undefined): string {
  if (code == null) return "-";
  return WEATHER_DESCRIPTIONS[code] ?? "-";
}

function compass(deg: number | undefined): string {
  if (deg == null || Number.isNaN(deg)) return "";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

interface HeadlineReading {
  locationName: string;
  tempC: number;
  feelsLikeC: number;
  windKph: number;
  windDirection: string;
  windDirectionDeg: number | null;
  description: string;
  weatherCode: number | null;
  snowfallMmNext24h: number;
  observedAt: string;
  source: string;
  forecast: Array<{
    date: string;
    maxC: number;
    minC: number;
    weatherCode: number | null;
    description: string;
    precipMm: number;
    snowfallMm: number;
  }>;
}

interface RegionPayload extends Omit<RegionConfig, "lat" | "lon" | "elevation" | "model" | "timezone" | "sourceLabel"> {
  elevation?: number;
  sourceLabel?: string;
  headline: HeadlineReading | null;
}

const cache = new Map<string, { data: HeadlineReading; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchHeadline(r: RegionConfig): Promise<HeadlineReading | null> {
  if (r.status === "soon" || !r.lat || !r.lon) return null;

  const cacheKey = r.id;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > now) return cached.data;

  const params = new URLSearchParams({
    latitude: String(r.lat),
    longitude: String(r.lon),
    elevation: String(r.elevation ?? ""),
    current: "temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,snowfall",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,weather_code",
    hourly: "snowfall",
    forecast_days: "7",
    forecast_hours: "24",
    timezone: r.timezone ?? "auto",
    ...(r.model ? { models: r.model } : {}),
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const d: any = await res.json();
    const cur = d.current ?? {};
    const daily = d.daily ?? {};
    const hourly = d.hourly ?? {};

    // ── Open-Meteo returns naive local time + utc_offset_seconds; build proper ISO UTC
    const utcOffsetSec = Number.isFinite(d.utc_offset_seconds) ? Number(d.utc_offset_seconds) : 0;
    const toIsoUtc = (localStr: string | undefined): string => {
      if (!localStr) return new Date().toISOString();
      const epochAsIfUtc = new Date(`${localStr}Z`).getTime();
      if (Number.isNaN(epochAsIfUtc)) return new Date().toISOString();
      return new Date(epochAsIfUtc - utcOffsetSec * 1000).toISOString();
    };

    // Open-Meteo snowfall default unit is cm — *10 converts to mm
    const snowfallCm24 = Array.isArray(hourly.snowfall)
      ? hourly.snowfall.slice(0, 24).reduce((a: number, b: number) => a + (Number.isFinite(b) ? Number(b) : 0), 0)
      : 0;
    const snowfallMm24 = Math.round(snowfallCm24 * 10 * 10) / 10;

    const numOrNull = (v: unknown): number | null => (Number.isFinite(v) ? Number(v) : null);
    const tempC = numOrNull(cur.temperature_2m);
    const feelsLikeC = numOrNull(cur.apparent_temperature);
    const windKph = numOrNull(cur.wind_speed_10m);

    if (tempC == null) {
      console.warn(`[regions] ${r.id}: upstream returned no temperature, skipping cache`);
      return null;
    }

    const headline: HeadlineReading = {
      locationName: r.headlineLabel,
      tempC,
      feelsLikeC: feelsLikeC ?? tempC,
      windKph: windKph != null ? Math.round(windKph) : 0,
      windDirection: compass(cur.wind_direction_10m),
      windDirectionDeg: numOrNull(cur.wind_direction_10m),
      description: describe(cur.weather_code),
      weatherCode: numOrNull(cur.weather_code),
      snowfallMmNext24h: snowfallMm24,
      observedAt: toIsoUtc(cur.time),
      source: r.sourceLabel ?? "Open-Meteo",
      forecast: (daily.time ?? []).slice(0, 6).map((date: string, i: number) => {
        const max = numOrNull(daily.temperature_2m_max?.[i]);
        const min = numOrNull(daily.temperature_2m_min?.[i]);
        return {
          date,
          maxC: max != null ? Math.round(max) : 0,
          minC: min != null ? Math.round(min) : 0,
          weatherCode: numOrNull(daily.weather_code?.[i]),
          description: describe(daily.weather_code?.[i]),
          precipMm: Math.round((Number.isFinite(daily.precipitation_sum?.[i]) ? Number(daily.precipitation_sum[i]) : 0) * 10) / 10,
          snowfallMm: Math.round((Number.isFinite(daily.snowfall_sum?.[i]) ? Number(daily.snowfall_sum[i]) : 0) * 10 * 10) / 10,
        };
      }),
    };

    cache.set(cacheKey, { data: headline, expires: now + CACHE_TTL_MS });
    return headline;
  } catch (err) {
    console.warn(`[regions] headline fetch failed for ${r.id}:`, err);
    return null;
  }
}

router.get("/regions", async (_req, res) => {
  try {
    const headlines = await Promise.all(REGIONS.map((r) => fetchHeadline(r)));
    const regions: RegionPayload[] = REGIONS.map((r, i) => {
      const { lat, lon, model, timezone, ...rest } = r;
      void lat; void lon; void model; void timezone;
      return { ...rest, headline: headlines[i] };
    });
    res.json({
      regions,
      generatedAt: new Date().toISOString(),
      sourceCount: 7,
      refreshIntervalMin: 15,
    });
  } catch (err) {
    console.error("[regions] error:", err);
    res.status(500).json({ error: "REGIONS_FETCH_ERROR", message: String(err) });
  }
});

export default router;
