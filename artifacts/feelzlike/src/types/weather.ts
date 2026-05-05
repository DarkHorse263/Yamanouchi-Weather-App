import type { HourlyForecast } from "@workspace/api-client-react";

export type { HourlyForecast };

/**
 * Powder Window detection thresholds. Tuned per playbook:
 *   - Default ("Japow"): snowfall ≥ 1cm/hr AND wind < 20km/h, ≥3 consecutive hours.
 *   - AU/relaxed: snowfall ≥ 0.5cm/hr AND wind < 25km/h — Australian conditions
 *     rarely hit Japow thresholds, so we relax for the Snowy Mountains.
 */
export interface PowderThresholds {
  minSnowfall?: number;
  maxWind?: number;
  minDuration?: number;
}

export const POWDER_THRESHOLDS_DEFAULT: Required<PowderThresholds> = {
  minSnowfall: 1,
  maxWind: 20,
  minDuration: 3,
};

export const POWDER_THRESHOLDS_AU: Required<PowderThresholds> = {
  minSnowfall: 0.5,
  maxWind: 25,
  minDuration: 3,
};

export interface PowderWindow {
  startIdx: number;
  endIdx: number;
  hours: number;
  totalSnow: number;
}

/**
 * Find the longest run of consecutive hours meeting the powder thresholds.
 * Returns null if no run of `minDuration` hours satisfies the criteria.
 * Indexes are into the input array.
 */
export function detectPowderWindow(
  hourly: HourlyForecast[],
  thresholds?: PowderThresholds,
): PowderWindow | null {
  const { minSnowfall, maxWind, minDuration } = {
    ...POWDER_THRESHOLDS_DEFAULT,
    ...thresholds,
  };
  let bestStart = -1;
  let bestEnd = -1;
  let bestLen = 0;
  let curStart = -1;
  for (let i = 0; i < hourly.length; i++) {
    const h = hourly[i];
    const snow = h.snowfall ?? 0;
    const wind = h.windSpeed ?? 0;
    const meets = snow >= minSnowfall && wind < maxWind;
    if (meets) {
      if (curStart < 0) curStart = i;
      const len = i - curStart + 1;
      if (len > bestLen) {
        bestLen = len;
        bestStart = curStart;
        bestEnd = i + 1;
      }
    } else {
      curStart = -1;
    }
  }
  if (bestLen < minDuration) return null;
  const totalSnow = hourly
    .slice(bestStart, bestEnd)
    .reduce((acc, h) => acc + (h.snowfall ?? 0), 0);
  return {
    startIdx: bestStart,
    endIdx: bestEnd,
    hours: bestLen,
    totalSnow: Math.round(totalSnow * 10) / 10,
  };
}
