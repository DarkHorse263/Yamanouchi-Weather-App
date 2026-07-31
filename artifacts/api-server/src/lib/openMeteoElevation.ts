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
    precipitation?: (number | null)[];
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
    // Pin ALL band requests to the SAME model grid cell. The default
    // cell_selection=land picks the cell whose TERRAIN matches the requested
    // elevation, so upper/mid/lower ended up sampling three different
    // physical places with genuinely different precipitation — which showed
    // impossible stories like mid-mountain getting MORE snow than the summit.
    // With one pinned cell there is one precip story; only temperature is
    // downscaled per elevation, and we derive snow-vs-rain per band from the
    // freezing level (see partitionPrecipByBand).
    cell_selection: "nearest",
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
    params.set("hourly", "freezing_level_height,precipitation");
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

/**
 * Snow line sits ~300m below the freezing level — the standard heuristic
 * (falling snow survives a few hundred metres of above-zero air before
 * melting out). A band gets snow for an hour when bandElev >= FL - 300m.
 */
const SNOW_LINE_OFFSET_M = 300;

/** Open-Meteo derives snowfall at ~0.7cm per 1mm of water (app-wide convention). */
const CM_SNOW_PER_MM_WATER = 0.7;

export interface BandDayPartition {
  snowfallCm: number;
  rainfallMm: number;
  /** false when any precip hour lacked a usable freezing level — caller
   * should fall back to the model's own daily sums for that day. */
  reliable: boolean;
}

/**
 * Partition ONE pinned grid cell's hourly precipitation into snow vs rain
 * for a given band elevation, using the hourly freezing level. Open-Meteo
 * downscales temperature per requested elevation but does NOT re-partition
 * precipitation phase, so with a pinned cell every band would otherwise
 * report identical snowfall (a +3° base day would claim summit-sized snow).
 * Missing FL hours carry the last known FL forward (fail-soft).
 */
export function partitionPrecipByBand(
  hourlyTimes: string[],
  precipMm: (number | null | undefined)[],
  freezingLevelM: (number | null | undefined)[],
  bandElevationM: number,
): Map<string, BandDayPartition> {
  const out = new Map<string, BandDayPartition>();
  let lastFl: number | null = null;
  for (let i = 0; i < hourlyTimes.length; i++) {
    const day = hourlyTimes[i]?.slice(0, 10);
    if (!day) continue;
    const flRaw = freezingLevelM[i];
    if (typeof flRaw === "number" && Number.isFinite(flRaw)) lastFl = flRaw;
    const fl = lastFl;
    const pRaw = precipMm[i];
    const p = typeof pRaw === "number" && Number.isFinite(pRaw) && pRaw > 0 ? pRaw : 0;

    const entry = out.get(day) ?? { snowfallCm: 0, rainfallMm: 0, reliable: true };
    if (p > 0) {
      if (fl == null) {
        entry.reliable = false;
      } else if (bandElevationM >= fl - SNOW_LINE_OFFSET_M) {
        entry.snowfallCm += p * CM_SNOW_PER_MM_WATER;
      } else {
        entry.rainfallMm += p;
      }
    }
    out.set(day, entry);
  }
  for (const e of out.values()) {
    e.snowfallCm = Math.round(e.snowfallCm * 10) / 10;
    e.rainfallMm = Math.round(e.rainfallMm * 10) / 10;
  }
  return out;
}

/**
 * Per-hour freezing-level phase partition for headline snow figures
 * (next-24/48/72h and past-24h windows). Same physics as
 * `partitionPrecipByBand` — one coherent snow story between the headline
 * and the elevation bands. Returns one entry per hour:
 *   - number: partitioned snow cm for that hour (0 when it falls as rain)
 *   - null:   no usable freezing level for a precip hour — caller should
 *             fall back to the model's own snowfall value for that hour.
 * Missing FL hours carry the last known FL forward (fail-soft), mirroring
 * partitionPrecipByBand.
 */
export function partitionHourlySnowfallCm(
  precipMm: (number | null | undefined)[],
  freezingLevelM: (number | null | undefined)[],
  elevationM: number,
): (number | null)[] {
  const out: (number | null)[] = [];
  let lastFl: number | null = null;
  for (let i = 0; i < precipMm.length; i++) {
    const flRaw = freezingLevelM[i];
    if (typeof flRaw === "number" && Number.isFinite(flRaw)) lastFl = flRaw;
    const pRaw = precipMm[i];
    const p = typeof pRaw === "number" && Number.isFinite(pRaw) && pRaw > 0 ? pRaw : 0;
    if (p === 0) {
      out.push(0);
    } else if (lastFl == null) {
      out.push(null);
    } else if (elevationM >= lastFl - SNOW_LINE_OFFSET_M) {
      out.push(p * CM_SNOW_PER_MM_WATER);
    } else {
      out.push(0);
    }
  }
  return out;
}

function buildBand(
  om: OmDailyResponse | null,
  idx: number,
  derived: BandDayPartition | undefined,
): ElevationBand {
  const d = om?.daily;
  return {
    tempMaxC: num(d?.temperature_2m_max?.[idx]),
    tempMinC: num(d?.temperature_2m_min?.[idx]),
    // Phase comes from the freezing-level partition (one coherent precip
    // story across bands). Fall back to the model's own daily sums only
    // when the partition had no usable freezing level for that day.
    snowfallCm: derived?.reliable ? derived.snowfallCm : num(d?.snowfall_sum?.[idx]),
    rainfallMm: derived?.reliable ? derived.rainfallMm : num(d?.rain_sum?.[idx]),
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

    // One pinned cell, one precip story: partition the upper request's
    // hourly precipitation into snow vs rain per band via the freezing level.
    const hourlyTimes = upperResp.hourly?.time ?? [];
    const hourlyPrecip = upperResp.hourly?.precipitation ?? [];
    const hourlyFl = upperResp.hourly?.freezing_level_height ?? [];
    const partition = {
      upper: partitionPrecipByBand(hourlyTimes, hourlyPrecip, hourlyFl, elevations.upper),
      mid: partitionPrecipByBand(hourlyTimes, hourlyPrecip, hourlyFl, elevations.mid),
      lower: partitionPrecipByBand(hourlyTimes, hourlyPrecip, hourlyFl, elevations.lower),
    };

    const days: ElevationBandDay[] = dates.slice(0, 7).map((date, i) => {
      const upperPart = partition.upper.get(date);
      const upperSnow = upperPart?.reliable ? upperPart.snowfallCm : num(upperDaily.snowfall_sum?.[i]);
      const upperRain = upperPart?.reliable ? upperPart.rainfallMm : num(rainMm[i]);
      return {
        date,
        // Label from the upper band's DERIVED daily totals so it matches the
        // numbers shown — the daily WMO code is the most-severe moment of
        // the day, not the day's story.
        weatherDescription: dailyConditionLabel({
          code: wxCodes[i] ?? null,
          snowfallCm: upperSnow,
          rainMm: upperRain,
          fallback: weatherCodeToDescription(wxCodes[i] ?? null),
        }),
        freezingLevelM: freezing[i] ?? null,
        windAvgKmh: num(windAvg[i]),
        windMaxKmh: num(windMax[i]),
        precipMm: upperRain,
        bands: {
          upper: buildBand(upperResp, i, upperPart),
          mid: buildBand(midResp, i, partition.mid.get(date)),
          lower: buildBand(lowerResp, i, partition.lower.get(date)),
        },
      };
    });

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
