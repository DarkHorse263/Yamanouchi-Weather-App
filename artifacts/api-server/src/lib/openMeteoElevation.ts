import { LruTtlCache } from "./lru-cache";
import { dailyConditionLabel } from "./dailyConditionLabel.js";

const FRESH_MS = 30 * 60_000;
const STALE_MS = 6 * 60 * 60_000;
const FETCH_TIMEOUT_MS = 12_000;

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
  resortName: string;
  source: "open-meteo";
  upperLiftElevationM: number | null;
  midLiftElevationM: number | null;
  lowerLiftElevationM: number | null;
  fetchedAt: string;
  days: ElevationBandDay[];
}

export interface ElevationForecastInput {
  lat: number;
  lng: number;
  summitElevationM: number;
  name?: string;
}

const cache = new LruTtlCache<ElevationForecast>({
  maxEntries: 200,
  freshMs: FRESH_MS,
  staleMs: STALE_MS,
});

function num(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

function bandElevations(summit: number): { upper: number; mid: number; lower: number } {
  // Mountains in our regions span ~1100-2300m summit.
  // Vertical drop varies (~100m at Selwyn to ~700m at Thredbo). Use a
  // proportional split so small hills don't end up with negative base
  // elevations: mid is summit minus min(300, 15% of summit), lower is
  // summit minus min(600, 30% of summit).
  const midDrop = Math.min(300, Math.round(summit * 0.15));
  const lowerDrop = Math.min(600, Math.round(summit * 0.3));
  const lower = Math.max(50, summit - lowerDrop);
  const mid = Math.max(lower + 50, summit - midDrop);
  return { upper: Math.round(summit), mid, lower };
}

function weatherCodeToDescription(code: number | null | undefined): string {
  if (code == null) return "";
  if (code === 0) return "clear";
  if (code <= 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code <= 48) return "fog";
  if (code <= 55) return "drizzle";
  if (code <= 65) return "rain";
  if (code <= 67) return "freezing rain";
  if (code <= 75) return "snow";
  if (code <= 77) return "snow grains";
  if (code <= 82) return "showers";
  if (code <= 86) return "snow showers";
  return "stormy";
}

interface OmDailyResponse {
  daily?: {
    time?: string[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    snowfall_sum?: (number | null)[];
    rain_sum?: (number | null)[];
    weather_code?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
    wind_gusts_10m_max?: (number | null)[];
  };
  hourly?: {
    time?: string[];
    freezing_level_height?: (number | null)[];
  };
}

async function fetchAtElevation(
  lat: number,
  lng: number,
  elevationM: number,
  signal: AbortSignal,
  includeHourly: boolean,
): Promise<OmDailyResponse | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    elevation: String(elevationM),
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "snowfall_sum",
      "rain_sum",
      "weather_code",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
    ].join(","),
    timezone: "auto",
    forecast_days: "7",
  });
  if (includeHourly) {
    params.set("hourly", "freezing_level_height");
  }

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    console.warn(`[openMeteoElevation] upstream ${res.status} for ${lat},${lng}@${elevationM}m`);
    return null;
  }
  return (await res.json()) as OmDailyResponse;
}

function dailyFreezingLevelM(om: OmDailyResponse | null): (number | null)[] {
  if (!om?.hourly?.time || !om.hourly.freezing_level_height) return [];
  const times = om.hourly.time;
  const heights = om.hourly.freezing_level_height;
  const byDay = new Map<string, number[]>();
  for (let i = 0; i < times.length; i++) {
    const day = times[i].slice(0, 10);
    const h = heights[i];
    if (typeof h !== "number") continue;
    const arr = byDay.get(day) ?? [];
    arr.push(h);
    byDay.set(day, arr);
  }
  const dayKeys = Array.from(byDay.keys()).sort();
  return dayKeys.map((d) => {
    const arr = byDay.get(d) ?? [];
    if (arr.length === 0) return null;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  });
}

function buildBand(om: OmDailyResponse | null, idx: number): ElevationBand {
  const d = om?.daily;
  return {
    tempMaxC: num(d?.temperature_2m_max?.[idx]),
    tempMinC: num(d?.temperature_2m_min?.[idx]),
    snowfallCm: num(d?.snowfall_sum?.[idx]),
    rainfallMm: num(d?.rain_sum?.[idx]),
  };
}

async function fetchUpstream(
  input: ElevationForecastInput,
): Promise<ElevationForecast | null> {
  const { lat, lng, summitElevationM, name } = input;
  const elevations = bandElevations(summitElevationM);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const [upperResp, midResp, lowerResp] = await Promise.all([
      fetchAtElevation(lat, lng, elevations.upper, controller.signal, true),
      fetchAtElevation(lat, lng, elevations.mid, controller.signal, false),
      fetchAtElevation(lat, lng, elevations.lower, controller.signal, false),
    ]);

    if (!upperResp?.daily?.time || upperResp.daily.time.length === 0) return null;

    const upperDaily = upperResp.daily;
    const dates = upperDaily.time ?? [];
    const wxCodes = upperDaily.weather_code ?? [];
    const windAvg = upperDaily.wind_speed_10m_max ?? [];
    const windMax = upperDaily.wind_gusts_10m_max ?? [];
    const rainMm = upperDaily.rain_sum ?? [];
    const freezing = dailyFreezingLevelM(upperResp);

    const days: ElevationBandDay[] = dates.slice(0, 7).map((date, i) => ({
      date,
      // Label from the upper band's daily totals — the daily WMO code is the
      // most-severe moment of the day, not the day's story.
      weatherDescription: dailyConditionLabel({
        code: wxCodes[i] ?? null,
        snowfallCm: num(upperDaily.snowfall_sum?.[i]),
        rainMm: num(rainMm[i]),
        fallback: weatherCodeToDescription(wxCodes[i] ?? null),
      }),
      freezingLevelM: freezing[i] ?? null,
      windAvgKmh: num(windAvg[i]),
      windMaxKmh: num(windMax[i]),
      precipMm: num(rainMm[i]),
      bands: {
        upper: buildBand(upperResp, i),
        mid: buildBand(midResp, i),
        lower: buildBand(lowerResp, i),
      },
    }));

    return {
      resortName: name ?? "",
      source: "open-meteo",
      upperLiftElevationM: elevations.upper,
      midLiftElevationM: elevations.mid,
      lowerLiftElevationM: elevations.lower,
      fetchedAt: new Date().toISOString(),
      days,
    };
  } catch (err) {
    console.warn(
      `[openMeteoElevation] fetch error for ${lat},${lng}:`,
      (err as Error).message,
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function cacheKey(input: ElevationForecastInput): string {
  return `${input.lat.toFixed(4)},${input.lng.toFixed(4)}@${Math.round(input.summitElevationM)}`;
}

export async function getElevationForecast(
  input: ElevationForecastInput,
): Promise<ElevationForecast | null> {
  const key = cacheKey(input);
  const cached = cache.get(key);
  if (cached?.fresh) return cached.value;

  if (cached?.stale) {
    void fetchUpstream(input).then((fresh) => {
      if (fresh) cache.set(key, fresh);
    });
    return cached.value;
  }

  const fresh = await fetchUpstream(input);
  if (fresh) cache.set(key, fresh);
  return fresh;
}
