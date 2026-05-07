/**
 * Wind-hold prediction for chairlifts and gondolas.
 *
 * Uses the next-24h wind forecast at the resort's reference elevation
 * and applies a simple lapse correction + exposure multiplier to
 * estimate effective wind at each lift's top station, then bucketed
 * against that lift's published operating threshold.
 *
 * This is a heuristic - actual lift operation depends on resort
 * decisions (mech inspections, ice loading, etc.) that we cannot
 * forecast. The UI surfaces this clearly via the disclaimer.
 *
 * Reference for the lapse rate: free-air wind speeds increase roughly
 * 10-15% per 1000m elevation gain in the lower troposphere; we use
 * 15% as a conservative high-side estimate (so we don't under-predict
 * holds).
 */

import type { LiftSeed, LiftExposure } from "@/data/lifts";

export type WindHoldStatus = "likely_open" | "possible_hold" | "likely_held";

export interface HourlyWindSample {
  /** ISO timestamp from Open-Meteo */
  time: string;
  /** km/h sustained wind at base elevation */
  windSpeed: number;
  /** km/h gust at base elevation */
  windGust?: number;
}

export interface WindHoldPrediction {
  liftId: string;
  status: WindHoldStatus;
  /** 0-1 - how confident the model is in the bucket */
  confidence: number;
  /** Human-readable explanation surfaced in the UI tooltip. */
  reason: string;
  /** Worst-case hour from the forecast window (for the tooltip) */
  worstHour: {
    timeIso: string;
    effectiveWindKmh: number;
    effectiveGustKmh: number;
  } | null;
  /** Effective threshold after the exposure multiplier */
  effectiveThresholdKmh: number;
  /**
   * What fraction of the next-24h window we expect the lift to be
   * exposed to wind > threshold. Useful for "lift will spin most of
   * the day but hold from 2-4pm" style copy.
   */
  hoursAtRisk: number;
}

/**
 * Exposure multipliers - applied to the published threshold to get
 * the *effective* threshold the lift's terrain actually allows.
 * sheltered terrain raises the threshold (more wind tolerated);
 * highly_exposed lowers it.
 */
const EXPOSURE_MULTIPLIER: Record<LiftExposure, number> = {
  sheltered: 1.3,
  moderate: 1.0,
  exposed: 0.85,
  highly_exposed: 0.7,
};

/** Per-1000m wind speed lapse rate (multiplicative) */
const WIND_LAPSE_PER_1000M = 0.15;

/**
 * Reference elevation for the location's wind reading. Open-Meteo
 * reports surface wind at the resort's nominal elevation; we don't
 * have an explicit height field per response, so callers pass it.
 */
function effectiveWindAtTop(baseWindKmh: number, baseElevationM: number, topElevationM: number): number {
  const dz = Math.max(0, topElevationM - baseElevationM) / 1000;
  return baseWindKmh * (1 + dz * WIND_LAPSE_PER_1000M);
}

/**
 * Predict wind-hold status for a single lift over the supplied forecast
 * window (typically the next 24h of hourly samples).
 */
export function predictLiftStatus(
  lift: LiftSeed,
  hourlyWind: HourlyWindSample[],
  /** Resort's reference (base) elevation, in m. Falls back to lift base. */
  resortReferenceElevationM?: number,
): WindHoldPrediction {
  const refElev = resortReferenceElevationM ?? lift.baseElevation;
  const exposureMult = EXPOSURE_MULTIPLIER[lift.exposure];
  const effectiveThreshold = Math.round(lift.windHoldThresholdKmh * exposureMult);

  if (hourlyWind.length === 0) {
    return {
      liftId: lift.id,
      status: "likely_open",
      confidence: 0,
      reason: "No wind forecast available",
      worstHour: null,
      effectiveThresholdKmh: effectiveThreshold,
      hoursAtRisk: 0,
    };
  }

  // Walk the forecast - track worst-case hour + count hours over threshold
  let worstScore = -Infinity;
  let worstHour: WindHoldPrediction["worstHour"] = null;
  let hoursAtRisk = 0;

  for (const sample of hourlyWind) {
    const effWind = effectiveWindAtTop(sample.windSpeed, refElev, lift.topElevation);
    const effGust = sample.windGust !== undefined
      ? effectiveWindAtTop(sample.windGust, refElev, lift.topElevation)
      : effWind * 1.4; // gust ~ 1.4× sustained when gust missing
    // Score combines sustained wind + a partial gust contribution
    const score = Math.max(effWind, effGust * 0.85);
    if (score > worstScore) {
      worstScore = score;
      worstHour = {
        timeIso: sample.time,
        effectiveWindKmh: Math.round(effWind),
        effectiveGustKmh: Math.round(effGust),
      };
    }
    if (score > effectiveThreshold) hoursAtRisk++;
  }

  // Bucket
  const ratio = worstScore / effectiveThreshold;
  let status: WindHoldStatus;
  if (ratio < 0.7) status = "likely_open";
  else if (ratio <= 1.1) status = "possible_hold";
  else status = "likely_held";

  // Confidence - how far from the bucket boundary we are
  let confidence: number;
  if (status === "likely_open") {
    // The further below 0.7, the more confident
    confidence = Math.min(1, 0.6 + (0.7 - ratio) * 1.2);
  } else if (status === "likely_held") {
    confidence = Math.min(1, 0.6 + (ratio - 1.1) * 1.0);
  } else {
    // Possible hold - inherently uncertain
    const distFromMid = Math.abs(ratio - 0.9);
    confidence = Math.max(0.35, 0.55 - distFromMid * 0.4);
  }
  confidence = Math.round(confidence * 100) / 100;

  // Reason copy
  const reason = buildReason({
    status,
    worstHour,
    effectiveThreshold,
    hoursAtRisk,
    totalHours: hourlyWind.length,
    exposure: lift.exposure,
    liftType: lift.type,
  });

  return {
    liftId: lift.id,
    status,
    confidence,
    reason,
    worstHour,
    effectiveThresholdKmh: effectiveThreshold,
    hoursAtRisk,
  };
}

function buildReason(args: {
  status: WindHoldStatus;
  worstHour: WindHoldPrediction["worstHour"];
  effectiveThreshold: number;
  hoursAtRisk: number;
  totalHours: number;
  exposure: LiftExposure;
  liftType: LiftSeed["type"];
}): string {
  const { status, worstHour, effectiveThreshold, hoursAtRisk, totalHours } = args;
  if (!worstHour) return "No wind forecast available";

  const peakStr = `${worstHour.effectiveGustKmh}km/h gusts at top, threshold ${effectiveThreshold}km/h`;

  if (status === "likely_open") {
    return `Likely open - peak ${peakStr}`;
  }
  if (status === "likely_held") {
    if (hoursAtRisk >= totalHours * 0.6) {
      return `Likely held most of the day - ${peakStr}`;
    }
    return `Likely held - ${peakStr}, ${hoursAtRisk}h above threshold`;
  }
  // possible_hold
  if (hoursAtRisk === 0) {
    return `Borderline - peak ${peakStr}`;
  }
  return `Possible hold ${hoursAtRisk}h - ${peakStr}`;
}

/**
 * Predict for many lifts at once - common case for the mountain page.
 */
export function predictMountainLifts(
  lifts: LiftSeed[],
  hourlyWind: HourlyWindSample[],
  resortReferenceElevationM?: number,
): WindHoldPrediction[] {
  return lifts.map((l) => predictLiftStatus(l, hourlyWind, resortReferenceElevationM));
}

/**
 * Roll up an overall mountain-level outlook for the next-24h window:
 * what fraction of the lifts are likely to spin?
 */
export interface MountainWindHoldOutlook {
  totalLifts: number;
  likelyOpen: number;
  possibleHold: number;
  likelyHeld: number;
  /** 0-1 - share of capacity expected open */
  openFraction: number;
  /** Worst-affected lift's prediction (for the headline copy) */
  worstLift: WindHoldPrediction | null;
}

export function summariseMountainWindHold(predictions: WindHoldPrediction[]): MountainWindHoldOutlook {
  let likelyOpen = 0;
  let possibleHold = 0;
  let likelyHeld = 0;
  let worstLift: WindHoldPrediction | null = null;
  let worstScore = -Infinity;
  for (const p of predictions) {
    if (p.status === "likely_open") likelyOpen++;
    else if (p.status === "possible_hold") possibleHold++;
    else likelyHeld++;
    const score = p.worstHour ? p.worstHour.effectiveGustKmh / Math.max(1, p.effectiveThresholdKmh) : 0;
    if (score > worstScore) {
      worstScore = score;
      worstLift = p;
    }
  }
  const total = predictions.length;
  return {
    totalLifts: total,
    likelyOpen,
    possibleHold,
    likelyHeld,
    openFraction: total === 0 ? 0 : likelyOpen / total,
    worstLift,
  };
}
