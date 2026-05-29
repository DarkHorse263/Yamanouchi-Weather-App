/**
 * Trip planner · pure per-day scoring.
 *
 * Kept in its own module (no `@/regions` / asset imports) so it stays
 * unit-testable under `tsx --test` · the catalog + persistence helpers in
 * `tripPlanner.ts` pull in the region registry, which imports PNG wordmarks
 * that node/tsx can't load.
 *
 * The 7-day `daily` forecast (TownWeatherDaily) is thinner than the live
 * snapshot scoreMountain() uses · it has no snowDepth or cloudCover. So the
 * planner scores each day from what the daily payload actually gives us:
 * fresh snowfall, peak wind, the temp window, and precipitation odds. Tone
 * buckets mirror mountainScore's vocabulary so the two surfaces feel related.
 */
import type { TownWeatherDaily } from "@/lib/town-weather";

export type TripDayTone = "powder" | "bluebird" | "fair" | "marginal" | "no-go" | "no-data";

export interface TripDayScore {
  /** 0-100 composite · higher is a better day on the hill. */
  total: number;
  tone: TripDayTone;
  label: string;
}

function clampScore(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Score a single forecast day for a ski trip. Winter weighting:
 *   fresh snowfall      = 40 pts
 *   wind (calmer better)= 30 pts
 *   temp window         = 20 pts
 *   dryness (low precip)= 10 pts
 *
 * Honesty over optimism: a day missing every usable signal returns the
 * explicit "no-data" tone rather than coasting on calm/dry defaults · we
 * don't want to paint a blank forecast as a fair day.
 */
export function scoreTripDay(d: TownWeatherDaily): TripDayScore {
  const hasSnow = d.snowfallSum != null;
  const hasWind = d.windGustMax != null || d.windSpeedMax != null;
  const hasTemp = d.tempMax != null && d.tempMin != null;

  // Nothing usable upstream · be honest instead of defaulting to "fair".
  if (!hasSnow && !hasWind && !hasTemp) {
    return { total: 0, tone: "no-data", label: "no data" };
  }

  const snowfall = d.snowfallSum ?? 0;
  const wind = d.windGustMax ?? d.windSpeedMax ?? 0;
  const tMax = d.tempMax;
  const tMin = d.tempMin;

  // Fresh snow is the headline signal · 5cm+ is a strong day, 15cm+ caps it.
  const snowScore = clampScore((snowfall / 15) * 40, 0, 40);

  // Wind: calm (<20kph) keeps lifts spinning; gales (>70kph) shut them.
  const windScore = clampScore(30 - (wind / 70) * 30, 0, 30);

  // Temperature: a cold-but-not-brutal day skis best. Use the day's mean.
  let tempScore = 8;
  if (tMax != null && tMin != null) {
    const mean = (tMax + tMin) / 2;
    if (mean <= -15) tempScore = 6;
    else if (mean < -8) tempScore = 14;
    else if (mean <= -1) tempScore = 20;
    else if (mean < 3) tempScore = 14;
    else tempScore = clampScore(10 - (mean - 3) * 2, 0, 10);
  }

  // Precipitation odds · only penalise rain risk on warm days; on cold days
  // high precip just means more snow, which we already rewarded above.
  const precipProb = d.precipitationProbabilityMax ?? 0;
  const warm = tMax != null && tMax > 3;
  const dryScore = warm ? clampScore(10 - (precipProb / 100) * 10, 0, 10) : 10;

  const total = Math.round(snowScore + windScore + tempScore + dryScore);

  // Tone is driven by the measured numbers, not the dominant weather code:
  // a daily `weatherCode` is the day's headline condition and can read
  // "cloudy" even when 10cm fell overnight, so gating powder on a snow code
  // would mislabel real powder days. Fresh snow + manageable wind is enough.
  let tone: TripDayTone = "fair";
  let label = "fair";
  if (snowfall >= 5 && wind < 50) {
    tone = "powder";
    label = "powder";
  } else if (snowfall < 1 && wind < 25 && total >= 55) {
    tone = "bluebird";
    label = "bluebird";
  } else if (wind > 70 || total < 30) {
    tone = total < 20 ? "no-go" : "marginal";
    label = tone === "no-go" ? "no-go" : "marginal";
  }

  return { total, tone, label };
}
