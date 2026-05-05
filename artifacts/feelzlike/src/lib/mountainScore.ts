import type { Season } from "@workspace/feelzlike-shell";

export interface WeatherSnapshot {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  windGust?: number;
  snowDepth: number;
  weatherCode: number;
  cloudCover?: number;
  freezingLevel?: number | null;
}

export type ScoreTone = "powder" | "bluebird" | "fair" | "marginal" | "no-go";

export interface MountainScore {
  total: number;
  sub: { snow: number; wind: number; temp: number; visibility: number };
  headline: string;
  headlineJa: string;
  tone: ScoreTone;
}

const SNOW_CODES: ReadonlySet<number> = new Set([71, 73, 75, 77, 85, 86]);

/** Clamp `n` to the inclusive range `[lo, hi]`. Re-exported for callers
 * that share the same scoring vocabulary (e.g. dial gauges that mirror
 * the score's 0–100 range). */
export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Single source of truth for the "Today's Call" mountain scoring algorithm.
 * Returns a 0-100 composite score from live weather, with a tone bucket
 * and a localised headline.
 *
 * Scoring weights (winter):
 *   snow base + active snowfall  = 40 pts
 *   wind speed (calmer better)   = 25 pts
 *   temperature sweet spot       = 20 pts
 *   cloud cover / visibility     = 15 pts
 *
 * Green-season scoring drops the snow component and bakes a 40-pt baseline
 * into the total so summer days stay comparable to winter scores.
 *
 * Both `TodaysCall` (the dashboard) and `useTodaysWinner` (consumed by the
 * Stay page sort) call this; keep changes here in sync with both.
 */
export function scoreMountain(
  w: WeatherSnapshot | null,
  season: Season,
): MountainScore {
  if (!w) {
    return {
      total: 0,
      sub: { snow: 0, wind: 0, temp: 0, visibility: 0 },
      headline: "No data",
      headlineJa: "データなし",
      tone: "marginal",
    };
  }

  const isSnowing = SNOW_CODES.has(w.weatherCode);

  let snow = 0;
  if (season === "winter") {
    const depthScore = clamp(w.snowDepth * 25, 0, 30);
    const fallBonus = isSnowing ? 10 : 0;
    snow = clamp(depthScore + fallBonus, 0, 40);
  }

  const wind = clamp(25 - (w.windSpeed / 60) * 25, 0, 25);

  let temp = 0;
  if (season === "winter") {
    const t = w.temperature;
    if (t <= -15) temp = 5;
    else if (t < -8) temp = 14;
    else if (t <= -2) temp = 20;
    else if (t < 2) temp = 14;
    else temp = clamp(8 - (t - 2) * 2, 0, 8);
  } else {
    const t = w.temperature;
    if (t >= 12 && t <= 22) temp = 20;
    else if (t > 22 && t <= 28) temp = 14;
    else if (t >= 6 && t < 12) temp = 14;
    else temp = clamp(8 - Math.abs(t - 17) * 0.5, 0, 8);
  }

  const visibility =
    w.cloudCover !== undefined
      ? clamp(15 - (w.cloudCover / 100) * 15, 0, 15)
      : 8;

  const total = Math.round(
    season === "winter"
      ? snow + wind + temp + visibility
      : wind + temp + visibility + 40,
  );

  let headline = "Fair";
  let headlineJa = "まずまず";
  let tone: ScoreTone = "fair";

  if (season === "winter") {
    if (isSnowing && w.snowDepth > 0.5 && w.windSpeed < 40) {
      headline = "POWDER DAY";
      headlineJa = "パウダーデー";
      tone = "powder";
    } else if (
      (w.cloudCover ?? 100) < 30 &&
      w.windSpeed < 25 &&
      w.snowDepth > 0.3
    ) {
      headline = "BLUEBIRD";
      headlineJa = "快晴";
      tone = "bluebird";
    } else if (w.windSpeed > 60 || total < 30) {
      headline = "MARGINAL";
      headlineJa = "厳しい";
      tone = total < 20 ? "no-go" : "marginal";
    }
  } else {
    if ((w.cloudCover ?? 100) < 30 && w.windSpeed < 20 && w.temperature > 12) {
      headline = "BLUEBIRD";
      headlineJa = "快晴";
      tone = "bluebird";
    } else if (w.windSpeed > 50 || total < 40) {
      headline = "MARGINAL";
      headlineJa = "厳しい";
      tone = "marginal";
    }
  }

  return { total, sub: { snow, wind, temp, visibility }, headline, headlineJa, tone };
}
