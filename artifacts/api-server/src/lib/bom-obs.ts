// BOM surface-observation reconciliation for Australian alpine resorts.
//
// Why this exists: the global forecast model (Open-Meteo / OpenWeatherMap) that
// drives "current conditions" routinely headlines "Clear sky, 0mm" for a single
// alpine peak while a localised snow shower is actually falling - the model's
// grid is too coarse to resolve it. Japan already corrects this against JMA
// AMeDAS surface stations (see amedas.ts). This module does the equivalent for
// Australia using the Bureau of Meteorology's automatic weather stations.
//
// The hard part: alpine AWS report air_temp, rel_hum and a rain gauge, but their
// cloud / present-weather / visibility fields are almost always "-" (unattended).
// Tipping-bucket gauges also under-catch snow. So we can't read a "snowing" flag
// off the station - we infer it conservatively from a rising rain gauge plus
// sub-freezing temperature, and fall back to a humidity-based "in cloud" check to
// at least stop the model claiming "Clear sky" while a peak sits at 100% RH.
//
// Philosophy (mirrors amedas.ts): RECONCILE, never replace. We only ever correct
// a model "dry/clear" headline towards wetter/cloudier reality - we never turn a
// wet model reading dry. This keeps the override safe even when the signal is noisy.

import { precipRateToWmo } from "./amedas.js";

// The subset of a BOM observation row this module needs. The full BomObservation
// shape in routes/weather.ts is a structural superset, so it passes directly.
export interface BomObsRow {
  air_temp: number | null;
  rel_hum: number | null;
  rain_trace: string | null;
  weather: string | null;
  local_date_time_full: string | null;
}

export interface BomReconcileResult {
  /** WMO weather code to display (drives both the icon and the description). */
  weatherCode: number;
  /** Which signal produced the override - useful for logging / debugging. */
  reconciledFrom: "bom-precip" | "bom-incloud";
  /** Rain-gauge increment over the trailing window, mm (null if uncomputable). */
  rainDeltaMm: number | null;
  /** Observed precipitation to surface, mm (only set on a precip override). */
  precipitationMm: number | null;
}

// One tipping-bucket increment is 0.2mm; treat any positive increment as real
// precipitation rather than gauge noise.
const GAUGE_TIP_MM = 0.2;
// At/above this humidity a peak is sitting inside cloud - "Clear sky" is then
// provably wrong, so we bump a clear model headline to overcast.
const INCLOUD_RH = 97;
// Trailing window for the rain-gauge delta. BOM reports at ~30-min cadence, so
// we look for the first reading at least ~1h old and ignore baselines older than
// ~2h (a data gap would make the rate estimate meaningless).
const WINDOW_MIN = 55;
const WINDOW_MAX_MIN = 130;
const PRECIP_TEXT = /\b(rain|snow|sleet|shower|drizzle|hail)\b/i;

function num(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const t = String(v).trim();
  // "-" = not reported, "T" = trace (below gauge resolution); neither is a number.
  if (t === "" || t === "-" || t === "T") return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

// "YYYYMMDDHHmmss" -> epoch ms. We only use this for time *differences* between
// readings from the same station, so parsing the naive local string as UTC is fine.
function tsToMs(s: string | null | undefined): number | null {
  if (!s || s.length < 12) return null;
  const y = +s.slice(0, 4);
  const mo = +s.slice(4, 6) - 1;
  const d = +s.slice(6, 8);
  const h = +s.slice(8, 10);
  const mi = +s.slice(10, 12);
  const ms = Date.UTC(y, mo, d, h, mi);
  return Number.isFinite(ms) ? ms : null;
}

// rain_trace is cumulative mm since 9am local and resets to 0 at 9am. Returns the
// increment over the trailing window together with that window's true length (so
// the caller can normalise to an mm/h rate), or null when it can't be computed. A
// negative delta means the 9am reset fell inside the window - we return 0 there
// (conservative: infer no precipitation rather than a false spike).
function rainDelta(rows: BomObsRow[]): { deltaMm: number; windowMin: number } | null {
  const latest = rows[0];
  const latestMs = tsToMs(latest?.local_date_time_full);
  const latestRain = num(latest?.rain_trace);
  if (latestMs == null || latestRain == null) return null;

  let older: BomObsRow | null = null;
  let olderAgeMin = 0;
  for (let i = 1; i < rows.length; i++) {
    const ms = tsToMs(rows[i].local_date_time_full);
    if (ms == null) continue;
    const ageMin = (latestMs - ms) / 60000;
    if (ageMin >= WINDOW_MIN) {
      older = rows[i];
      olderAgeMin = ageMin;
      break;
    }
  }
  if (!older || olderAgeMin > WINDOW_MAX_MIN) return null;

  const olderRain = num(older.rain_trace);
  if (olderRain == null) return null;
  const delta = latestRain - olderRain;
  if (delta < 0) return { deltaMm: 0, windowMin: olderAgeMin }; // 9am reset inside the window
  return { deltaMm: Math.round(delta * 10) / 10, windowMin: olderAgeMin };
}

/**
 * Decide whether a BOM station contradicts a "dry/clear" model headline.
 * Returns an override to apply, or null to leave the model reading untouched.
 *
 * Pure and synchronous so it is trivially unit-testable - the caller is
 * responsible for fetching the (freshness-checked, newest-first) station rows.
 */
export function reconcileBomCondition(input: {
  rows: BomObsRow[];
  modelWeatherCode: number | null;
}): BomReconcileResult | null {
  const { rows, modelWeatherCode } = input;
  if (!Array.isArray(rows) || rows.length === 0) return null;

  // Only ever correct a "dry" model headline (WMO < 50 = clear/cloud/fog).
  const modelIsDry = modelWeatherCode == null || modelWeatherCode < 50;
  if (!modelIsDry) return null;

  const latest = rows[0];
  const tempC = num(latest.air_temp);
  const rh = num(latest.rel_hum);
  const wx = latest.weather;
  const hasPrecipText = !!wx && wx !== "-" && PRECIP_TEXT.test(wx);

  const rd = rainDelta(rows);
  const deltaMm = rd ? rd.deltaMm : null;
  const gaugeWet = deltaMm != null && deltaMm >= GAUGE_TIP_MM;

  // Tier 1 - precipitation is actually falling: rising gauge or (rare) a present-
  // weather text. Split snow vs rain by temperature.
  if (hasPrecipText || gaugeWet) {
    // Normalise the gauge increment to an mm/h rate over its true window (the
    // baseline can be older than 60min after a data gap, which would otherwise
    // overstate intensity). Default to a light rate when only the text fired.
    let rateMmh = 0.4;
    if (rd && rd.deltaMm > 0) {
      const hours = Math.max(rd.windowMin / 60, 0.25);
      rateMmh = Math.max(rd.deltaMm / hours, 0.2);
    }
    // If the gauge says wet but temp is missing, precipRateToWmo defaults to rain;
    // honour an explicit "snow"/"sleet" present-weather text instead (pass 0C).
    const snowText = !!wx && /\b(snow|sleet)\b/i.test(wx);
    const splitTempC = tempC == null && snowText ? 0 : tempC;
    const code = precipRateToWmo(rateMmh, splitTempC);
    if (code != null) {
      return {
        weatherCode: code,
        reconciledFrom: "bom-precip",
        rainDeltaMm: deltaMm,
        precipitationMm: deltaMm != null && deltaMm > 0 ? deltaMm : null,
      };
    }
  }

  // Tier 2 - in-cloud sanity: the model says clear but the station is saturated.
  // Don't invent precipitation; just stop the false "Clear sky".
  const modelClear = modelWeatherCode === 0 || modelWeatherCode === 1;
  if (modelClear && rh != null && rh >= INCLOUD_RH) {
    return {
      weatherCode: 3, // Overcast
      reconciledFrom: "bom-incloud",
      rainDeltaMm: deltaMm,
      precipitationMm: null,
    };
  }

  return null;
}
