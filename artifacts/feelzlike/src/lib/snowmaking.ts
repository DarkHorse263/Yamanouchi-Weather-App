/**
 * Snowmaking · two honest layers so the app reflects how AU resorts really
 * run (largely on man-made snow), not just natural snowfall.
 *
 *  1. COMPUTED window · a wet-bulb based read on whether CONVENTIONAL snow
 *     guns can run right now / over the next 24h. Guns need cold, dry air;
 *     wet-bulb (not air temp) is the number that decides it.
 *  2. CURATED capability · per-resort facts, including all-weather snow
 *     factories that make snow in almost any temperature (e.g. thredbo's
 *     friday flat unit).
 *
 * Pure module · NO imports (so it stays safe to run under `tsx --test`, which
 * crashes if a test transitively pulls the region catalog's PNG assets).
 */

/** Wet-bulb temperature (°C) via Stull (2011) from air temp (°C) + relative
 * humidity (%). Returns null when either input is missing. RH is clamped to
 * [1, 100] so out-of-range model values can't blow up the formula. */
export function wetBulbC(
  tempC: number | null | undefined,
  humidityPct: number | null | undefined,
): number | null {
  if (tempC == null || humidityPct == null) return null;
  // Reject NaN and +/-Infinity · only finite readings can be modelled.
  if (!Number.isFinite(tempC) || !Number.isFinite(humidityPct)) return null;
  const t = tempC;
  const rh = Math.min(100, Math.max(1, humidityPct));
  const tw =
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  // Wet-bulb can never exceed dry-bulb air temp · clamp to guard against the
  // Stull approximation's small overshoot at the cold, very-dry corner.
  return Math.min(Math.round(tw * 10) / 10, tempC);
}

export type SnowmakingViability = "good" | "marginal" | "too_warm";

/** Map a wet-bulb reading to how well conventional guns can run.
 *  good      · wet-bulb <= -5  · reliable production
 *  marginal  · -5 < wet-bulb <= -2 · borderline, only the coldest hours
 *  too_warm  · wet-bulb > -2   · too warm for conventional guns */
export function snowmakingViability(
  wetBulb: number | null,
): SnowmakingViability | null {
  if (wetBulb == null) return null;
  if (wetBulb <= -5) return "good";
  if (wetBulb <= -2) return "marginal";
  return "too_warm";
}

/** Tone keys map to the dark-theme chip colours used in the panel. */
export const SNOWMAKING_VIABILITY_COPY: Record<
  SnowmakingViability,
  { label: string; detail: string; tone: "good" | "marginal" | "warm" }
> = {
  good: {
    label: "good",
    detail: "cold and dry enough for the guns to run well",
    tone: "good",
  },
  marginal: {
    label: "marginal",
    detail: "borderline · only the coldest, driest hours",
    tone: "marginal",
  },
  too_warm: {
    label: "too warm",
    detail: "too warm for conventional guns right now",
    tone: "warm",
  },
};

/** Minimal hour shape the window scan needs · matches the location-weather
 * HourlyForecast fields (time, temperature, humidity). */
export interface SnowmakingHour {
  time: string;
  temperature: number | null;
  humidity: number | null;
}

export interface SnowmakingWindow {
  /** Lowest (best) wet-bulb found in the scanned range. */
  wetBulbC: number;
  /** Viability at that best hour. */
  viability: SnowmakingViability;
  /** ISO time of the best hour. */
  atISO: string;
  /** How many scanned hours are cold enough (wet-bulb <= -2). */
  viableHours: number;
  /** How many hours had usable temp + humidity. */
  scannedHours: number;
}

/** Scan the next `withinHours` hourly buckets for the coldest (best) snowmaking
 * window for conventional guns. Returns null when there's no usable data. */
export function bestSnowmakingWindow(
  hourly: SnowmakingHour[] | null | undefined,
  withinHours = 24,
): SnowmakingWindow | null {
  if (!Array.isArray(hourly) || hourly.length === 0) return null;
  const slice = hourly.slice(0, Math.max(1, withinHours));
  let best: { wb: number; at: string } | null = null;
  let viableHours = 0;
  let scannedHours = 0;
  for (const h of slice) {
    const wb = wetBulbC(h.temperature, h.humidity);
    if (wb == null) continue;
    scannedHours++;
    if (wb <= -2) viableHours++;
    if (best == null || wb < best.wb) best = { wb, at: h.time };
  }
  if (best == null) return null;
  const viability = snowmakingViability(best.wb);
  if (viability == null) return null;
  return {
    wetBulbC: best.wb,
    viability,
    atISO: best.at,
    viableHours,
    scannedHours,
  };
}

export type SnowmakingType = "all-weather" | "conventional";

export interface SnowmakingArea {
  /** Area / run the unit covers (e.g. "friday flat"). */
  name: string;
  /** The machine, in lowercase brand voice (e.g. "demaclenko snowpro 260"). */
  system: string;
  /** Highest air temp the unit can still make snow at, °C. */
  maxTempC: number;
  /** Daily output where published, cubic metres. */
  outputM3PerDay?: number;
}

export interface SnowmakingCapability {
  type: SnowmakingType;
  /** Headline shown in the panel, brand voice (lowercase). */
  headline: string;
  /** One-line plain-language summary, brand voice (lowercase). */
  summary: string;
  /** All-weather units, if any. Empty for conventional-only resorts. */
  areas: SnowmakingArea[];
  /** Where the facts come from. */
  source: string;
}

/**
 * Curated, per-resort snowmaking facts · first slice covers the Snowy
 * Mountains. Keyed by the resort's location id (see LocationDetail).
 * Keep copy in brand voice: all lowercase, middot separators, no em/en
 * dashes, no emojis.
 */
export const SNOWMAKING_CAPABILITY: Record<string, SnowmakingCapability> = {
  thredbo: {
    type: "all-weather",
    headline: "all-weather snowmaking",
    summary:
      "thredbo runs an all-weather snow machine, so the lower runs can open and stay covered even when it is warm.",
    areas: [
      {
        name: "friday flat",
        system: "demaclenko snowpro 260",
        maxTempC: 20,
        outputM3PerDay: 260,
      },
    ],
    source: "thredbo · snowy hydro",
  },
  perisher: {
    type: "conventional",
    headline: "conventional snowmaking",
    summary:
      "perisher makes snow with conventional guns · they need cold, dry air, so the live window below shows when they can run.",
    areas: [],
    source: "perisher",
  },
};

/** Look up curated capability for a resort. Null when we have no data, which
 * the panel treats as "do not render". */
export function getSnowmakingCapability(
  locationId: string | null | undefined,
): SnowmakingCapability | null {
  if (!locationId) return null;
  return SNOWMAKING_CAPABILITY[locationId] ?? null;
}
