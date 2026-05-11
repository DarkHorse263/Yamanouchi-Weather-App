import { LruTtlCache } from "./lru-cache";

const APP_ID = process.env["WEATHER_UNLOCKED_APP_ID"];
const APP_KEY = process.env["WEATHER_UNLOCKED_APP_KEY"];

const FRESH_MS = 30 * 60_000;
const STALE_MS = 6 * 60 * 60_000;
// Upstream is sometimes slow (15+ s) — generous timeout, then we bail.
// Replit's dev container appears to be unable to reach the WU origin
// reliably (TCP opens, no HTTP body). Production deploys use a different
// egress and may work; verify after publishing.
const FETCH_TIMEOUT_MS = 15_000;

export interface ElevationBandDay {
  date: string;
  weatherDescription: string;
  freezingLevelM: number | null;
  windAvgKmh: number | null;
  windMaxKmh: number | null;
  precipMm: number | null;
  bands: {
    upper: ElevationBand;
    mid: ElevationBand;
    lower: ElevationBand;
  };
}

export interface ElevationBand {
  tempMaxC: number | null;
  tempMinC: number | null;
  snowfallCm: number | null;
  rainfallMm: number | null;
}

export interface ElevationForecast {
  resortId: number;
  resortName: string;
  source: "weather-unlocked";
  upperLiftElevationM: number | null;
  midLiftElevationM: number | null;
  lowerLiftElevationM: number | null;
  fetchedAt: string;
  days: ElevationBandDay[];
}

export interface WeatherUnlockedStatus {
  configured: boolean;
  reason?: "missing-keys" | "upstream-error" | "timeout";
}

const cache = new LruTtlCache<ElevationForecast>({
  maxEntries: 200,
  freshMs: FRESH_MS,
  staleMs: STALE_MS,
});

export function isConfigured(): boolean {
  return !!(APP_ID && APP_KEY);
}

interface RawDay {
  date: string;
  wx_desc?: string;
  freezinglevel_m?: number;
  windspd_kmh?: number;
  windgst_kmh?: number;
  rain_mm?: number;
  upperslope?: RawSlope;
  midslope?: RawSlope;
  botslope?: RawSlope;
}

interface RawSlope {
  maxtemp_c?: number;
  mintemp_c?: number;
  snow_cm?: number;
  rain_mm?: number;
}

interface RawForecast {
  name?: string;
  resortid?: number;
  toplift_elevation_m?: number;
  midlift_elevation_m?: number;
  botlift_elevation_m?: number;
  forecast?: RawDay[];
}

function num(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

function mapBand(s: RawSlope | undefined): ElevationBand {
  return {
    tempMaxC: num(s?.maxtemp_c),
    tempMinC: num(s?.mintemp_c),
    snowfallCm: num(s?.snow_cm),
    rainfallMm: num(s?.rain_mm),
  };
}

function mapDay(d: RawDay): ElevationBandDay {
  return {
    date: d.date,
    weatherDescription: d.wx_desc ?? "",
    freezingLevelM: num(d.freezinglevel_m),
    windAvgKmh: num(d.windspd_kmh),
    windMaxKmh: num(d.windgst_kmh),
    precipMm: num(d.rain_mm),
    bands: {
      upper: mapBand(d.upperslope),
      mid: mapBand(d.midslope),
      lower: mapBand(d.botslope),
    },
  };
}

async function fetchUpstream(resortId: number): Promise<ElevationForecast | null> {
  if (!APP_ID || !APP_KEY) return null;
  const url = `https://api.weatherunlocked.com/api/resortforecast/${resortId}?app_id=${APP_ID}&app_key=${APP_KEY}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[weatherUnlocked] upstream ${res.status} for resort ${resortId}`);
      return null;
    }
    const raw = (await res.json()) as RawForecast;
    const days = (raw.forecast ?? []).slice(0, 7).map(mapDay);
    if (days.length === 0) return null;
    return {
      resortId,
      resortName: raw.name ?? "",
      source: "weather-unlocked",
      upperLiftElevationM: num(raw.toplift_elevation_m),
      midLiftElevationM: num(raw.midlift_elevation_m),
      lowerLiftElevationM: num(raw.botlift_elevation_m),
      fetchedAt: new Date().toISOString(),
      days,
    };
  } catch (err) {
    console.warn(`[weatherUnlocked] fetch error for resort ${resortId}:`, (err as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function getElevationForecast(resortId: number): Promise<ElevationForecast | null> {
  const key = String(resortId);
  const cached = cache.get(key);
  if (cached?.fresh) return cached.value;

  if (cached?.stale) {
    void fetchUpstream(resortId).then((fresh) => {
      if (fresh) cache.set(key, fresh);
    });
    return cached.value;
  }

  const fresh = await fetchUpstream(resortId);
  if (fresh) cache.set(key, fresh);
  return fresh;
}
