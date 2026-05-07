import type { HourlyForecast } from "@workspace/api-client-react";

/**
 * Powder Factor - a 0–100 quality score for snow currently on the mountain
 * (or about to fall), distinct from Powder Window which finds *upcoming*
 * snowfall events. Powder Factor answers: "if I was skiing right now, how
 * good is the snow?"
 *
 * Inputs (last 48h of hourly weather):
 *   - snowfall amount  (more = better, asymptotic at ~30cm)
 *   - temp at fall     (sweet spot: -8°C to -3°C → light dry crystals)
 *   - humidity at fall (lower = lighter, fluffier)
 *   - wind during fall (high wind compacts snow + creates wind slabs)
 *   - freshness        (hours since last snow - peak when fresh)
 *   - destruction      (rain or thaw AFTER the snowfall = ice layer)
 *
 * Weights sum to 100 before destruction multiplier:
 *   amount 35 · temp 20 · humidity 15 · wind 15 · freshness 15
 *
 * Destruction multiplier: rain after snow → ×0.3, thaw (>+2°C) after snow → ×0.5
 */

export const RAIN_CODES: ReadonlySet<number> = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82,
]);
export const SNOW_CODES: ReadonlySet<number> = new Set([71, 73, 75, 77, 85, 86]);

export type PowderQuality =
  | "bottomless"
  | "premium"
  | "soft_fast"
  | "decent"
  | "hardpack"
  | "survival";

export interface PowderFactor {
  /** Composite 0–100 score (after destruction multiplier). */
  score: number;
  /** Quality bucket - drives label + colour. */
  quality: PowderQuality;
  /** EN label, e.g. "Premium powder". */
  label: string;
  /** JP label, e.g. "極上パウダー". */
  labelJa: string;
  /** Short EN reason, e.g. "12cm fresh, light & dry". */
  reason: string;
  /** Short JP reason. */
  reasonJa: string;
  /** Sub-scores for transparency / debugging. */
  sub: {
    amount: number;
    temp: number;
    humidity: number;
    wind: number;
    freshness: number;
  };
  /** Total snowfall (cm) detected in the window. */
  totalSnow: number;
  /** Hours since the last snowing hour (Infinity if none in window). */
  hoursSinceSnow: number;
  /** True if rain occurred after the last snow hour. */
  rainedAfterSnow: boolean;
  /** True if temp went above +2°C after the last snow hour. */
  thawedAfterSnow: boolean;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Score amount: asymptotic - 0cm=0, 5cm≈11, 10cm≈19, 20cm≈28, 30cm≈32, ∞→35.
 * Formula: 35 * (1 - exp(-snow/15))
 */
function scoreAmount(totalSnowCm: number): number {
  if (totalSnowCm <= 0) return 0;
  return Math.round(35 * (1 - Math.exp(-totalSnowCm / 15)));
}

/**
 * Sweet-spot temp curve. Peak at -5.5°C, drops off either side.
 *   -5.5°C → 20 (peak)
 *   -3°C / -8°C → ~18
 *   0°C / -12°C → ~12
 *   +2°C / -16°C → ~5
 *   ≥+3°C / ≤-20°C → 0
 */
function scoreTemp(avgTempC: number): number {
  const dist = Math.abs(avgTempC - -5.5);
  if (dist >= 10) return 0;
  return Math.round(clamp(20 - (dist * dist) / 5, 0, 20));
}

/** Lower humidity = lighter snow. 30%→15, 60%→9, 80%→5, 100%→0. */
function scoreHumidity(avgHumidity: number): number {
  return Math.round(clamp(15 * (1 - avgHumidity / 100), 0, 15));
}

/** Calmer = better. 0km/h→15, 20km/h→7.5, 40+km/h→0. */
function scoreWind(avgWindKmh: number): number {
  return Math.round(clamp(15 - (avgWindKmh / 40) * 15, 0, 15));
}

/**
 * Freshness: hours since last snowing hour.
 *   0–6h   → 15 (fresh)
 *   6–24h  → linear 15→8
 *   24–48h → linear 8→3
 *   >48h   → 0
 */
function scoreFreshness(hoursSinceSnow: number): number {
  if (!isFinite(hoursSinceSnow)) return 0;
  if (hoursSinceSnow <= 6) return 15;
  if (hoursSinceSnow <= 24) return Math.round(15 - ((hoursSinceSnow - 6) / 18) * 7);
  if (hoursSinceSnow <= 48) return Math.round(8 - ((hoursSinceSnow - 24) / 24) * 5);
  return 0;
}

function classify(score: number): PowderQuality {
  if (score >= 88) return "bottomless";
  if (score >= 73) return "premium";
  if (score >= 58) return "soft_fast";
  if (score >= 40) return "decent";
  if (score >= 20) return "hardpack";
  return "survival";
}

const QUALITY_LABELS: Record<PowderQuality, { en: string; ja: string }> = {
  bottomless: { en: "Bottomless Japow", ja: "底なしジャパウ" },
  premium: { en: "Premium powder", ja: "極上パウダー" },
  soft_fast: { en: "Soft and fast", ja: "ソフト＆高速" },
  decent: { en: "Decent turns", ja: "まずまず" },
  hardpack: { en: "Hardpack", ja: "ハードパック" },
  survival: { en: "Tough conditions", ja: "厳しいコンディション" },
};

/**
 * Build a short reason string highlighting the dominant signal(s).
 * Always single-clause, never uses " + " (reserved punctuation in this codebase).
 */
function buildReason(
  totalSnowCm: number,
  hoursSinceSnow: number,
  avgTempC: number | null,
  avgWindKmh: number | null,
  rainedAfter: boolean,
  thawedAfter: boolean,
): { en: string; ja: string } {
  if (rainedAfter) {
    return { en: "Rain after snow - icy crust", ja: "降雪後に雨、アイスバーン" };
  }
  if (thawedAfter) {
    return { en: "Thawed after snow - refrozen", ja: "降雪後に融解、再凍結" };
  }
  if (totalSnowCm <= 0 || !isFinite(hoursSinceSnow)) {
    return { en: "No fresh snowfall on record", ja: "新雪の記録なし" };
  }
  const fresh = hoursSinceSnow <= 6;
  const cold = avgTempC !== null && avgTempC <= -5;
  const calm = avgWindKmh !== null && avgWindKmh < 15;
  const cm = Math.round(totalSnowCm);

  if (fresh && cold && calm && totalSnowCm >= 15) {
    return { en: `${cm}cm fresh, cold and light`, ja: `新雪${cm}cm、軽くドライ` };
  }
  if (fresh && totalSnowCm >= 10) {
    return { en: `${cm}cm fresh in last 6h`, ja: `直近6時間で${cm}cm` };
  }
  if (hoursSinceSnow <= 24 && totalSnowCm >= 5) {
    return { en: `${cm}cm in last 24h`, ja: `24時間で${cm}cm` };
  }
  if (hoursSinceSnow > 24) {
    const days = Math.round(hoursSinceSnow / 24);
    return { en: `Last snow ${days}d ago`, ja: `最終降雪${days}日前` };
  }
  return { en: `${cm}cm recent`, ja: `直近${cm}cm` };
}

/**
 * Compute the Powder Factor for a single mountain.
 *
 * @param hourly  Hourly forecast array (may include past + future hours).
 * @param nowIso  Current time as ISO string. Defaults to Date.now().
 * @param windowHours  How far back to look. Default 48.
 */
export function computePowderFactor(
  hourly: HourlyForecast[] | null | undefined,
  nowIso?: string,
  windowHours = 48,
): PowderFactor {
  const empty: PowderFactor = {
    score: 0,
    quality: "survival",
    label: QUALITY_LABELS.survival.en,
    labelJa: QUALITY_LABELS.survival.ja,
    reason: "No data",
    reasonJa: "データなし",
    sub: { amount: 0, temp: 0, humidity: 0, wind: 0, freshness: 0 },
    totalSnow: 0,
    hoursSinceSnow: Infinity,
    rainedAfterSnow: false,
    thawedAfterSnow: false,
  };

  if (!hourly || hourly.length === 0) return empty;

  const now = nowIso ? new Date(nowIso).getTime() : Date.now();
  if (!isFinite(now)) return empty;

  // Filter to past hours within the window. We score what's already happened -
  // the powder you'd ski *right now*, not what's coming. (Powder Window
  // handles forward-looking detection.)
  const windowStart = now - windowHours * 3600_000;
  const past = hourly.filter((h) => {
    const t = new Date(h.time).getTime();
    return isFinite(t) && t <= now && t >= windowStart;
  });
  if (past.length === 0) return empty;

  // Sort chronologically just in case the API returned out-of-order.
  past.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  let totalSnow = 0;
  let snowHours = 0;
  let snowTempSum = 0;
  let snowTempCount = 0;
  let snowHumiditySum = 0;
  let snowHumidityCount = 0;
  let snowWindSum = 0;
  let snowWindCount = 0;
  let lastSnowTime: number | null = null;

  for (const h of past) {
    const snowfall = isFinite(h.snowfall ?? NaN) ? (h.snowfall as number) : 0;
    const isSnowing = snowfall > 0 || SNOW_CODES.has(h.weatherCode);
    if (isSnowing && snowfall > 0) {
      totalSnow += snowfall;
      snowHours += 1;
      // Per-field finite guards - Open-Meteo can return null/missing for
      // any of these on edge data (e.g. station outages). Skip the field
      // independently rather than poisoning the whole average with NaN.
      if (isFinite(h.temperature)) {
        snowTempSum += h.temperature;
        snowTempCount += 1;
      }
      if (isFinite(h.humidity)) {
        snowHumiditySum += h.humidity;
        snowHumidityCount += 1;
      }
      if (isFinite(h.windSpeed)) {
        snowWindSum += h.windSpeed;
        snowWindCount += 1;
      }
      lastSnowTime = new Date(h.time).getTime();
    } else if (SNOW_CODES.has(h.weatherCode)) {
      // Snowing but snowfall amount missing - count for freshness only.
      lastSnowTime = new Date(h.time).getTime();
    }
  }

  const hoursSinceSnow =
    lastSnowTime !== null ? (now - lastSnowTime) / 3600_000 : Infinity;

  // Detect destruction events AFTER the last snow.
  // Thaw heuristic: a single brief warm hour shouldn't condemn the snow,
  // so require either (a) 2+ hours above +2°C, or (b) any single hour
  // above +4°C (sustained warm spell vs brief midday spike).
  let rainedAfter = false;
  let warmHourCount = 0;
  let strongThaw = false;
  if (lastSnowTime !== null) {
    for (const h of past) {
      const t = new Date(h.time).getTime();
      if (t <= lastSnowTime) continue;
      const temp = isFinite(h.temperature) ? h.temperature : -999;
      const precip = isFinite(h.precipitation) ? h.precipitation : 0;
      if (RAIN_CODES.has(h.weatherCode) || (precip > 0 && temp > 1)) {
        rainedAfter = true;
      }
      if (temp > 2) warmHourCount += 1;
      if (temp > 4) strongThaw = true;
    }
  }
  const thawedAfter = strongThaw || warmHourCount >= 2;

  const avgTemp = snowTempCount > 0 ? snowTempSum / snowTempCount : null;
  const avgHumidity = snowHumidityCount > 0 ? snowHumiditySum / snowHumidityCount : null;
  const avgWind = snowWindCount > 0 ? snowWindSum / snowWindCount : null;

  const sub = {
    amount: scoreAmount(totalSnow),
    // If no snow hours, skip temp/humidity contribution - neither helps nor hurts.
    temp: avgTemp !== null ? scoreTemp(avgTemp) : 0,
    humidity: avgHumidity !== null ? scoreHumidity(avgHumidity) : 0,
    wind: avgWind !== null ? scoreWind(avgWind) : 0,
    freshness: scoreFreshness(hoursSinceSnow),
  };

  let raw = sub.amount + sub.temp + sub.humidity + sub.wind + sub.freshness;

  // Destruction multipliers stack (rain is harsher than thaw).
  if (rainedAfter) raw = Math.round(raw * 0.3);
  else if (thawedAfter) raw = Math.round(raw * 0.5);

  const score = clamp(Math.round(raw), 0, 100);
  const quality = classify(score);
  const reason = buildReason(
    totalSnow,
    hoursSinceSnow,
    avgTemp,
    avgWind,
    rainedAfter,
    thawedAfter,
  );

  return {
    score,
    quality,
    label: QUALITY_LABELS[quality].en,
    labelJa: QUALITY_LABELS[quality].ja,
    reason: reason.en,
    reasonJa: reason.ja,
    sub,
    totalSnow: Math.round(totalSnow * 10) / 10,
    hoursSinceSnow:
      isFinite(hoursSinceSnow) ? Math.round(hoursSinceSnow * 10) / 10 : Infinity,
    rainedAfterSnow: rainedAfter,
    thawedAfterSnow: thawedAfter,
  };
}

/** Quality → tailwind colour classes for badge styling. */
export const POWDER_QUALITY_STYLES: Record<
  PowderQuality,
  { bg: string; text: string; border: string; ring: string }
> = {
  bottomless: {
    bg: "bg-violet-500/10",
    text: "text-violet-700",
    border: "border-violet-300/60",
    ring: "ring-violet-400/40",
  },
  premium: {
    bg: "bg-sky-500/10",
    text: "text-sky-700",
    border: "border-sky-300/60",
    ring: "ring-sky-400/40",
  },
  soft_fast: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-700",
    border: "border-cyan-300/60",
    ring: "ring-cyan-400/40",
  },
  decent: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    border: "border-emerald-300/60",
    ring: "ring-emerald-400/40",
  },
  hardpack: {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    border: "border-amber-300/60",
    ring: "ring-amber-400/40",
  },
  survival: {
    bg: "bg-rose-500/10",
    text: "text-rose-700",
    border: "border-rose-300/60",
    ring: "ring-rose-400/40",
  },
};
