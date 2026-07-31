/**
 * Ensemble forecast service.
 *
 * Combines multiple independent forecast sources so we can show CONSENSUS,
 * not a single model's guess. The goal is radical honesty about uncertainty:
 * when models agree the user can trust the forecast; when they disagree we
 * say so explicitly instead of pretending we know.
 *
 * Sources (all free, no API keys required):
 *   - Open-Meteo, configured to return several specific named models in
 *     one request (ECMWF IFS 0.25°, GFS Seamless, ICON Seamless, BOM
 *     ACCESS-G for AU, JMA Seamless for JP). ECMWF is widely considered
 *     the world's most accurate global model; ICON is the German DWD
 *     model with strong mountain performance; GFS is the American model;
 *     BOM/JMA are the home-team national models.
 *   - MET Norway "Locationforecast 2.0" - Norwegian Met Office, considered
 *     one of the most accurate mountain forecast services in the world.
 *     Postprocesses ECMWF and adds their own corrections.
 *
 * Cached for 30 minutes per (lat,lon,elevation) tuple.
 */

import { partitionHourlySnowfallCm } from "./openMeteoElevation.js";

const FRESH_MS = 30 * 60 * 1000; // serve straight from cache for 30 min
const STALE_MS = 6 * 60 * 60 * 1000; // keep the last good outlook usable as a fallback for 6h
// Fail fast on a slow or throttled upstream instead of hanging the /forecast
// request · matches the 8s AbortSignal.timeout used across regions/weather.
const UPSTREAM_TIMEOUT_MS = 8000;

export interface EnsembleDay {
  date: string; // YYYY-MM-DD
  /** Mean across all models that produced a value for this day. */
  tempMaxMean: number;
  tempMinMean: number;
  /** Spread = max model value − min model value. Higher = less agreement. */
  tempMaxSpread: number;
  tempMinSpread: number;
  precipMean: number;
  precipSpread: number;
  snowMean: number;
  snowSpread: number;
  /** Number of independent sources that contributed to this day. */
  sourcesCount: number;
  /** "high" | "medium" | "low" derived from spread + count. */
  confidence: "high" | "medium" | "low";
  /** Each source's view of this day, for transparency. */
  perSource: Array<{
    source: string;
    tempMax?: number;
    tempMin?: number;
    precip?: number;
    snow?: number;
  }>;
}

export interface EnsembleSourceMeta {
  id: string;
  label: string;
  detail: string;
  status: "ok" | "failed";
  fetchedAt?: string;
}

export interface EnsembleForecast {
  days: EnsembleDay[];
  sources: EnsembleSourceMeta[];
  generatedAt: string;
  /**
   * Set only when every upstream failed on this refresh and we served the last
   * good outlook from cache instead. `generatedAt` still reflects when that
   * cached outlook was actually built, so the client can show an honest "as of"
   * line. Absent/null on a fresh response.
   */
  _stale?: { ageSeconds: number } | null;
}

interface CacheEntry {
  data: EnsembleForecast;
  freshUntil: number; // serve straight from cache until this time
  staleUntil: number; // still serveable as a fallback when every upstream fails
  builtAt: number; // when the cached outlook was actually assembled (for "as of")
}

const cache = new Map<string, CacheEntry>();
// Coalesce concurrent cold requests for the same key into one upstream call ·
// the multi-model request is ~3x heavier, so a burst of misses must not fan out
// into a burst of Open-Meteo calls (which is what triggers the 429s).
const inFlight = new Map<string, Promise<EnsembleForecast>>();

export interface EnsembleQuery {
  latitude: number;
  longitude: number;
  elevation: number;
  /** Two-letter region hint to pick the right national model. */
  region?: "AU" | "JP" | "OTHER";
  timezone?: string;
  days?: number;
}

// Note: BOM ACCESS-G is intentionally omitted. Open-Meteo accepts the name
// but currently returns nulls for it, so including it would just clutter the
// "sources unavailable" list. We keep ECMWF (the world-leading global model),
// GFS (American), and ICON (German DWD, strong in mountains), then add the
// home-team national model where we have one.
const REGION_MODELS: Record<string, string[]> = {
  AU: ["ecmwf_ifs025", "gfs_seamless", "icon_seamless"],
  JP: ["ecmwf_ifs025", "gfs_seamless", "icon_seamless", "jma_seamless"],
  OTHER: ["ecmwf_ifs025", "gfs_seamless", "icon_seamless"],
};

const MODEL_LABELS: Record<string, { label: string; detail: string }> = {
  ecmwf_ifs025: {
    label: "ECMWF IFS",
    detail: "European Centre - world's most accurate global model",
  },
  gfs_seamless: { label: "GFS", detail: "NOAA / US National Weather Service" },
  icon_seamless: { label: "ICON", detail: "German DWD - strong mountain performance" },
  bom_access_global: { label: "BOM ACCESS-G", detail: "Australian Bureau of Meteorology" },
  jma_seamless: { label: "JMA", detail: "Japan Meteorological Agency" },
};

interface OpenMeteoModelDaily {
  time: string[];
  temperature_2m_max?: (number | null)[];
  temperature_2m_min?: (number | null)[];
  precipitation_sum?: (number | null)[];
  snowfall_sum?: (number | null)[];
  /**
   * Freezing-level phase-partitioned daily snowfall (cm) keyed by YYYY-MM-DD,
   * derived from the model's own hourly precipitation + freezing level via the
   * shared FL−300m partition (same physics as the headline /weather figures and
   * the elevation bands). `null` for a day means the partition was unreliable
   * (a precip hour had no usable freezing level) — fall back to the model's raw
   * snowfall_sum for that day.
   */
  partitionedSnowCmByDate?: Map<string, number | null>;
}

async function fetchOpenMeteoMulti(q: EnsembleQuery): Promise<{
  perModel: Record<string, OpenMeteoModelDaily>;
  sources: EnsembleSourceMeta[];
}> {
  const region = q.region ?? "OTHER";
  const models = REGION_MODELS[region];
  const params = new URLSearchParams({
    latitude: String(q.latitude),
    longitude: String(q.longitude),
    elevation: String(q.elevation),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum",
    // Hourly precipitation + freezing level per model so we can phase-partition
    // each model's precip at the requested elevation (FL−300m snow line) — the
    // raw snowfall_sum is phased at each model's own grid terrain, which is how
    // the ensemble card ended up telling a different snow story than the
    // headline on marginal freezing-level days.
    hourly: "precipitation,freezing_level_height",
    timezone: q.timezone ?? "auto",
    forecast_days: String(q.days ?? 7),
    models: models.join(","),
  });

  const sources: EnsembleSourceMeta[] = [];
  const perModel: Record<string, OpenMeteoModelDaily> = {};

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const json = (await res.json()) as any;
    const daily = json.daily ?? {};
    const hourly = json.hourly ?? {};
    const hourlyTimes: string[] = hourly.time ?? [];

    // When multiple models are requested Open-Meteo suffixes each variable
    // with `_<modelname>`, e.g. `temperature_2m_max_ecmwf_ifs025`. When
    // exactly one model is requested it returns unsuffixed field names.
    const singleModel = models.length === 1;
    for (const m of models) {
      const meta = MODEL_LABELS[m] ?? { label: m, detail: "" };
      const sfx = singleModel ? "" : `_${m}`;
      const modelDaily: OpenMeteoModelDaily = {
        time: daily.time ?? [],
        temperature_2m_max: daily[`temperature_2m_max${sfx}`],
        temperature_2m_min: daily[`temperature_2m_min${sfx}`],
        precipitation_sum: daily[`precipitation_sum${sfx}`],
        snowfall_sum: daily[`snowfall_sum${sfx}`],
      };
      // Phase-partition this model's own hourly precip at the requested
      // elevation using its own freezing level (shared FL−300m helper). Days
      // where the partition is unreliable stay null → raw snowfall fallback.
      const hourlyPrecip: (number | null | undefined)[] = hourly[`precipitation${sfx}`] ?? [];
      const hourlyFl: (number | null | undefined)[] = hourly[`freezing_level_height${sfx}`] ?? [];
      if (hourlyTimes.length > 0 && hourlyPrecip.length > 0 && hourlyFl.length > 0) {
        const perHour = partitionHourlySnowfallCm(hourlyPrecip, hourlyFl, q.elevation);
        const byDate = new Map<string, number | null>();
        for (let i = 0; i < hourlyTimes.length; i++) {
          const date = hourlyTimes[i]?.slice(0, 10);
          if (!date) continue;
          const prev = byDate.has(date) ? byDate.get(date) : 0;
          const h = perHour[i];
          // A null hour (precip with no usable freezing level) poisons the
          // whole day → fall back to that day's raw snowfall_sum.
          byDate.set(date, prev === null || h === null ? null : (prev ?? 0) + h);
        }
        for (const [date, v] of byDate) {
          if (typeof v === "number") byDate.set(date, Math.round(v * 10) / 10);
        }
        modelDaily.partitionedSnowCmByDate = byDate;
      }
      const hasData = modelDaily.temperature_2m_max?.some((v) => v !== null && v !== undefined);
      perModel[m] = modelDaily;
      sources.push({
        id: m,
        label: meta.label,
        detail: meta.detail,
        status: hasData ? "ok" : "failed",
        fetchedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    for (const m of models) {
      const meta = MODEL_LABELS[m] ?? { label: m, detail: "" };
      sources.push({ id: m, label: meta.label, detail: meta.detail, status: "failed" });
    }
  }

  return { perModel, sources };
}

interface MetNorwayDaily {
  byDate: Map<string, { tempMax: number; tempMin: number; precip: number; sampleCount: number }>;
}

/**
 * Convert a UTC ISO timestamp to a YYYY-MM-DD date string in the requested
 * IANA timezone, so MET Norway days line up with Open-Meteo's local-time days.
 */
function localDate(isoUtc: string, timezone: string): string {
  try {
    const d = new Date(isoUtc);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${day}`;
  } catch {
    return isoUtc.slice(0, 10);
  }
}

async function fetchMetNorway(q: EnsembleQuery): Promise<{
  data: MetNorwayDaily | null;
  source: EnsembleSourceMeta;
}> {
  // MET Norway requires a descriptive User-Agent identifying the app + contact.
  const ua = "feelzlike/1.0 (https://feelzlike.com) mountain-weather";
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${q.latitude}&lon=${q.longitude}&altitude=${Math.round(q.elevation)}`;
  const tz = q.timezone ?? "UTC";

  const meta: EnsembleSourceMeta = {
    id: "met_norway",
    label: "MET Norway",
    detail: "Norwegian Met Office - gold standard mountain forecast (yr.no)",
    status: "failed",
  };

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": ua, Accept: "application/json" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) return { data: null, source: meta };
    const json = (await res.json()) as any;
    const series: any[] = json.properties?.timeseries ?? [];

    // Build daily aggregates. For temperature use instantaneous samples
    // (typically hourly for the first ~2 days, then 6-hourly). For
    // precipitation prefer non-overlapping `next_1_hours` buckets when
    // available, otherwise fall back to the non-overlapping 6-hour bucket
    // attached to that timestamp (MET only attaches one of these per slot).
    const byDate = new Map<string, { temps: number[]; precip1h: number; precip6h: number }>();
    for (const point of series) {
      const isoTime: string = point.time;
      const date = localDate(isoTime, tz);
      const entry = byDate.get(date) ?? { temps: [], precip1h: 0, precip6h: 0 };
      const t = point.data?.instant?.details?.air_temperature;
      if (typeof t === "number") entry.temps.push(t);
      const p1 = point.data?.next_1_hours?.details?.precipitation_amount;
      const p6 = point.data?.next_6_hours?.details?.precipitation_amount;
      if (typeof p1 === "number") {
        entry.precip1h += p1;
      } else if (typeof p6 === "number") {
        entry.precip6h += p6;
      }
      byDate.set(date, entry);
    }

    const out: MetNorwayDaily = { byDate: new Map() };
    for (const [date, { temps, precip1h, precip6h }] of byDate) {
      if (temps.length === 0) continue;
      out.byDate.set(date, {
        tempMax: Math.max(...temps),
        tempMin: Math.min(...temps),
        // Prefer 1h non-overlapping accumulation; otherwise 6h non-overlapping.
        precip: precip1h > 0 ? precip1h : precip6h,
        sampleCount: temps.length,
      });
    }

    meta.status = "ok";
    meta.fetchedAt = new Date().toISOString();
    return { data: out, source: meta };
  } catch {
    return { data: null, source: meta };
  }
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function spread(xs: number[]): number {
  if (xs.length < 2) return 0;
  return Math.max(...xs) - Math.min(...xs);
}

function classifyConfidence(
  tempSpread: number,
  snowSpread: number,
  precipSpread: number,
  count: number,
): "high" | "medium" | "low" {
  if (count < 2) return "low";
  // High agreement = tight spread on temperature, snow, AND precipitation
  if (tempSpread <= 2 && snowSpread <= 3 && precipSpread <= 3) return "high";
  if (tempSpread <= 4 && snowSpread <= 8 && precipSpread <= 8) return "medium";
  return "low";
}

async function buildEnsemble(q: EnsembleQuery): Promise<EnsembleForecast> {
  const [{ perModel, sources: omSources }, { data: metData, source: metSource }] = await Promise.all([
    fetchOpenMeteoMulti(q),
    fetchMetNorway(q),
  ]);

  // Prefer Open-Meteo's date grid. When every OM model failed (throttled or
  // timed out) fall back to MET Norway's own dates so a single working source
  // still produces a forecast instead of an empty card · the >=12-sample gate
  // below then drops MET's partial "today" and the empty-day filter removes any
  // date no source could speak to.
  const firstModelWithTime = Object.values(perModel).find((m) => m.time && m.time.length > 0);
  const maxDays = q.days ?? 7;
  const dates = firstModelWithTime?.time?.length
    ? firstModelWithTime.time
    : metData
      ? [...metData.byDate.keys()].sort().slice(0, maxDays)
      : [];

  const days: EnsembleDay[] = dates
    .map((date, idx) => {
      const perSource: EnsembleDay["perSource"] = [];
      const tempMaxes: number[] = [];
      const tempMins: number[] = [];
      const precips: number[] = [];
      const snows: number[] = [];

      for (const [modelId, daily] of Object.entries(perModel)) {
        const tMax = daily.temperature_2m_max?.[idx];
        const tMin = daily.temperature_2m_min?.[idx];
        const p = daily.precipitation_sum?.[idx];
        // Prefer the freezing-level partitioned snow (matches the headline and
        // elevation-band story); fail-soft to the model's raw snowfall_sum when
        // the partition was unavailable/unreliable for this day.
        const partitioned = daily.partitionedSnowCmByDate?.get(date);
        const rawSnow = daily.snowfall_sum?.[idx];
        const s = typeof partitioned === "number" ? partitioned : rawSnow;
        const label = MODEL_LABELS[modelId]?.label ?? modelId;
        const hasAny =
          (typeof tMax === "number" && tMax !== null) ||
          (typeof tMin === "number" && tMin !== null);
        if (!hasAny) continue;
        if (typeof tMax === "number") tempMaxes.push(tMax);
        if (typeof tMin === "number") tempMins.push(tMin);
        if (typeof p === "number") precips.push(p);
        if (typeof s === "number") snows.push(s);
        perSource.push({
          source: label,
          tempMax: typeof tMax === "number" ? tMax : undefined,
          tempMin: typeof tMin === "number" ? tMin : undefined,
          precip: typeof p === "number" ? p : undefined,
          snow: typeof s === "number" ? s : undefined,
        });
      }

      if (metData?.byDate.has(date)) {
        const m = metData.byDate.get(date)!;
        // Only include MET if it has at least 12 hourly samples for this local
        // day. Otherwise the day is partial (typically: "today" started before
        // we made the request) and the daily max/min would be biased.
        if (m.sampleCount >= 12) {
          tempMaxes.push(m.tempMax);
          tempMins.push(m.tempMin);
          precips.push(m.precip);
          perSource.push({
            source: "MET Norway",
            tempMax: m.tempMax,
            tempMin: m.tempMin,
            precip: m.precip,
          });
        }
      }

      const tempMaxSpread = spread(tempMaxes);
      const snowSpread = spread(snows);
      const precipSpread = spread(precips);
      const sourcesCount = perSource.length;

      const tempMaxMean = Math.round(mean(tempMaxes) * 10) / 10;
      const precipMean = Math.round(mean(precips) * 10) / 10;
      // MET Norway carries no snowfall channel, so a MET-only (single source)
      // freezing day would otherwise render as rain. When no model supplied a
      // snow figure and the daytime high is at/below freezing, derive snow from
      // the liquid precip using the same 0.7 cm-per-mm ratio the OWM fallback
      // uses · keeps the paths consistent and never calls a snowstorm "rain".
      let snowMean = Math.round(mean(snows) * 10) / 10;
      if (snows.length === 0 && precipMean > 0 && tempMaxMean <= 1) {
        snowMean = Math.round(precipMean * 0.7 * 10) / 10;
      }

      return {
        date,
        tempMaxMean,
        tempMinMean: Math.round(mean(tempMins) * 10) / 10,
        tempMaxSpread: Math.round(tempMaxSpread * 10) / 10,
        tempMinSpread: Math.round(spread(tempMins) * 10) / 10,
        precipMean,
        precipSpread: Math.round(precipSpread * 10) / 10,
        snowMean,
        snowSpread: Math.round(snowSpread * 10) / 10,
        sourcesCount,
        confidence: classifyConfidence(tempMaxSpread, snowSpread, precipSpread, sourcesCount),
        perSource,
      };
    })
    // Drop any day no source could speak to rather than rendering a meaningless
    // 0 / 0 / 0 row (e.g. MET's partial "today" excluded by the >=12 gate).
    .filter((d) => d.sourcesCount > 0);

  return {
    days,
    sources: [...omSources, metSource],
    generatedAt: new Date().toISOString(),
  };
}

export async function getEnsembleForecast(q: EnsembleQuery): Promise<EnsembleForecast> {
  const cacheKey = `${q.latitude.toFixed(3)},${q.longitude.toFixed(3)},${q.elevation},${q.region ?? "OTHER"},${q.timezone ?? "auto"},${q.days ?? 7}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.freshUntil > now) return cached.data;

  // Serve the last good outlook (within the stale window) instead of blanking
  // the card when every upstream fails. Never let an empty refresh overwrite a
  // still-usable entry · that was the original bug (one failure blanked the
  // forecast for the full TTL).
  const serveStale = (): EnsembleForecast | null => {
    const fallback = cache.get(cacheKey);
    if (fallback && fallback.staleUntil > Date.now()) {
      return {
        ...fallback.data,
        _stale: { ageSeconds: Math.round((Date.now() - fallback.builtAt) / 1000) },
      };
    }
    return null;
  };

  // Coalesce concurrent refreshes for the same key into one upstream call.
  let refresh = inFlight.get(cacheKey);
  if (!refresh) {
    refresh = (async () => {
      const data = await buildEnsemble(q);
      if (data.days.length > 0) {
        const builtAt = Date.now();
        cache.set(cacheKey, {
          data,
          freshUntil: builtAt + FRESH_MS,
          staleUntil: builtAt + STALE_MS,
          builtAt,
        });
        return data;
      }
      // Total upstream failure · serve the last good outlook if we still have
      // one, otherwise hand back the empty result so the client can show an
      // honest "temporarily unavailable" notice.
      return serveStale() ?? data;
    })().finally(() => inFlight.delete(cacheKey));
    inFlight.set(cacheKey, refresh);
  }

  try {
    return await refresh;
  } catch (err) {
    const stale = serveStale();
    if (stale) return stale;
    throw err;
  }
}
