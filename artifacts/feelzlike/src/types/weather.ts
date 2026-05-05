import type { HourlyForecast } from "@workspace/api-client-react";

export type { HourlyForecast };

/**
 * Powder Window detection thresholds. Tuned per playbook:
 *   - Default ("Japow"): snowfall ≥ 1cm/hr AND wind < 20km/h, ≥3 consecutive hours.
 *   - AU/relaxed: snowfall ≥ 0.5cm/hr AND wind < 25km/h — Australian conditions
 *     rarely hit Japow thresholds, so we relax for the Snowy Mountains.
 *   - Temperature: must be < +2°C at fall (per Sprint 4 playbook spec).
 *   - Visibility: playbook specifies > 500m, but Open-Meteo's free tier does
 *     NOT expose hourly visibility. We treat it as "always met" with a TODO
 *     to wire when a paid feed lands. Cloud cover is a poor proxy and would
 *     produce false negatives on cold clear pow days.
 */
export interface PowderThresholds {
  minSnowfall?: number;
  maxWind?: number;
  minDuration?: number;
  /** Maximum air temperature at fall, °C. Default +2. */
  maxTemp?: number;
}

export const POWDER_THRESHOLDS_DEFAULT: Required<PowderThresholds> = {
  minSnowfall: 1,
  maxWind: 20,
  minDuration: 3,
  maxTemp: 2,
};

export const POWDER_THRESHOLDS_AU: Required<PowderThresholds> = {
  minSnowfall: 0.5,
  maxWind: 25,
  minDuration: 3,
  maxTemp: 2,
};

export type PowderGrade = "gold" | "silver" | "bronze";

export interface PowderWindow {
  /** Inclusive start index into the input hourly array. */
  startIdx: number;
  /** Exclusive end index — `endIdx - 1` is the last hour in the window. */
  endIdx: number;
  /** Number of hours covered (= endIdx - startIdx). */
  hours: number;
  /** Sum of snowfall over the window, rounded to 0.1cm. */
  totalSnow: number;
  /** Mean wind speed across the window, km/h, rounded to whole units. */
  avgWind: number;
  /**
   * Quality score 0–100. Formula (per playbook spec):
   *   raw = totalSnow × (1 / (1 + avgWind / 10)) × hours
   *   then clamped/scaled into 0–100 with sane caps.
   * Used purely for ranking + grade bucketing.
   */
  qualityScore: number;
  /** Bucketed grade: gold (≥75), silver (≥50), bronze otherwise. */
  grade: PowderGrade;
}

/**
 * Convert a raw quality value to a 0–100 score.
 * Rationale for the cap: a 6h Japow window with 12cm total at ~5km/h wind
 * scores about 48 raw → we want that to land near 90. We divide by 0.55 to
 * stretch the curve, then clamp.
 */
function scaleQuality(raw: number): number {
  const scaled = raw / 0.55;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

function gradeFor(score: number): PowderGrade {
  if (score >= 75) return "gold";
  if (score >= 50) return "silver";
  return "bronze";
}

/**
 * Find ALL non-overlapping powder windows in the hourly array, each meeting
 * the thresholds for at least `minDuration` consecutive hours. Returns an
 * array sorted by `qualityScore` DESC (best first). Empty array if none.
 *
 * Algorithm: walk the array tracking the current run; whenever the run
 * breaks (or we hit the end) and is ≥ minDuration, emit a window and reset.
 * This produces maximal non-overlapping windows — adjacent qualifying hours
 * always belong to the same window, never split.
 */
export function detectPowderWindows(
  hourly: HourlyForecast[],
  thresholds?: PowderThresholds,
): PowderWindow[] {
  const { minSnowfall, maxWind, minDuration, maxTemp } = {
    ...POWDER_THRESHOLDS_DEFAULT,
    ...thresholds,
  };
  const out: PowderWindow[] = [];
  let curStart = -1;
  for (let i = 0; i <= hourly.length; i++) {
    const h = hourly[i];
    const meets =
      h !== undefined &&
      (h.snowfall ?? 0) >= minSnowfall &&
      (h.windSpeed ?? 0) < maxWind &&
      (h.temperature ?? 0) <= maxTemp;
    if (meets) {
      if (curStart < 0) curStart = i;
    } else if (curStart >= 0) {
      // Run ended at i (or end of array). Close it out.
      const end = i;
      const len = end - curStart;
      if (len >= minDuration) {
        const slice = hourly.slice(curStart, end);
        const totalSnow = slice.reduce((acc, x) => acc + (x.snowfall ?? 0), 0);
        const avgWindRaw =
          slice.reduce((acc, x) => acc + (x.windSpeed ?? 0), 0) / len;
        const avgWind = Math.round(avgWindRaw);
        const raw = totalSnow * (1 / (1 + avgWindRaw / 10)) * len;
        const qualityScore = scaleQuality(raw);
        out.push({
          startIdx: curStart,
          endIdx: end,
          hours: len,
          totalSnow: Math.round(totalSnow * 10) / 10,
          avgWind,
          qualityScore,
          grade: gradeFor(qualityScore),
        });
      }
      curStart = -1;
    }
  }
  return out.sort((a, b) => b.qualityScore - a.qualityScore);
}

/**
 * Convenience: return the single best window (highest quality), or null.
 * Kept as a separate export so the HourlyForecast badge code can stay
 * concise when only one window is shown in collapsed UIs.
 */
export function detectBestPowderWindow(
  hourly: HourlyForecast[],
  thresholds?: PowderThresholds,
): PowderWindow | null {
  const all = detectPowderWindows(hourly, thresholds);
  return all[0] ?? null;
}

/**
 * Backward-compat alias. Old call sites used `detectPowderWindow` (singular)
 * to fetch the longest window. The new "best" definition is the highest
 * quality window, which is a more useful default.
 *
 * @deprecated use `detectBestPowderWindow` for clarity, or
 * `detectPowderWindows` for the full multi-window list.
 */
export const detectPowderWindow = detectBestPowderWindow;

// ---------------------------------------------------------------------------
// 7-day Powder Calendar — daily best-window summary
// ---------------------------------------------------------------------------

export interface DailyPowderSummary {
  /** Local-date stamp ("YYYY-MM-DD") sliced from the hour ISO. */
  dateIso: string;
  /** Best window for this calendar day, or null if none qualified. */
  best: PowderWindow | null;
  /** Total snowfall across the entire day (cm), regardless of windows. */
  daySnow: number;
}

/**
 * Group `hourly` by local date (the YYYY-MM-DD prefix of the naive ISO
 * timestamp — already in resort-local time per Open-Meteo) and run
 * `detectPowderWindows` per day. Returns the next `days` entries starting
 * at the first date in `hourly`.
 *
 * Indexes inside the returned `best` are LOCAL to that day's hourly slice
 * (0..23), not into the original input array — safe for daily-row UI.
 */
export function dailyBestPowderWindows(
  hourly: HourlyForecast[],
  days: number,
  thresholds?: PowderThresholds,
): DailyPowderSummary[] {
  const byDate = new Map<string, HourlyForecast[]>();
  for (const h of hourly) {
    const date = h.time.slice(0, 10);
    const arr = byDate.get(date) ?? [];
    arr.push(h);
    byDate.set(date, arr);
  }
  const dates = Array.from(byDate.keys()).sort().slice(0, days);
  return dates.map((dateIso) => {
    const dayHours = byDate.get(dateIso)!;
    const windows = detectPowderWindows(dayHours, thresholds);
    const daySnow = dayHours.reduce((acc, h) => acc + (h.snowfall ?? 0), 0);
    return {
      dateIso,
      best: windows[0] ?? null,
      daySnow: Math.round(daySnow * 10) / 10,
    };
  });
}
