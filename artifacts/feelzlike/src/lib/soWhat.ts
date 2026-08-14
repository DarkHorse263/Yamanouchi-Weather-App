/**
 * "so what?" annotations · a plain-english consequence next to a raw number,
 * so the page answers the decision ("will lifts spin, is it snow or rain")
 * instead of making the reader interpret data. lowercase, brand voice.
 *
 * wind thresholds mirror LiftHoldLikely (50 / 70 / 90 km/h) so the two
 * surfaces never disagree about the same wind figure.
 */

export interface SoWhat {
  en: string;
  ja: string;
}

/** incoming snow (cm, next 24h) → what it means for the skiing */
export function snowNext24SoWhat(cm: number | null | undefined): SoWhat | null {
  if (cm == null || !Number.isFinite(cm)) return null;
  if (cm < 0.5) return { en: "no fresh snow expected", ja: "新雪の予想なし" };
  if (cm < 5) return { en: "a light dusting", ja: "うっすら程度" };
  if (cm < 15) return { en: "a proper refresh", ja: "しっかりリフレッシュ" };
  return { en: "powder day brewing", ja: "パウダーデイの兆し" };
}

/** wind speed (km/h) → lift operations consequence · thresholds = LiftHoldLikely */
export function windSoWhat(kmh: number | null | undefined): SoWhat | null {
  if (kmh == null || !Number.isFinite(kmh)) return null;
  if (kmh < 50) return { en: "fine for lifts", ja: "リフト運行に支障なし" };
  if (kmh < 70) return { en: "slow operations possible", ja: "減速運転の可能性" };
  if (kmh < 90) return { en: "chairs may hold", ja: "リフト停止の可能性" };
  return { en: "wind-hold likely", ja: "強風によるリフト停止が濃厚" };
}

/**
 * freezing level (m) vs ONE forecast elevation → is precip snow or rain at
 * that height. snow line ≈ freezing level − 300m, same offset the server
 * partition uses. we only receive a single on-mountain forecast elevation
 * (registry heights may be summit or mid), so the copy only claims what one
 * height supports — never a vertical distribution across the hill.
 */
export function freezingLevelSoWhat(
  freezingLevelM: number | null | undefined,
  forecastElevationM: number | null | undefined,
): SoWhat | null {
  const phase = precipPhaseAt(freezingLevelM, forecastElevationM);
  if (phase === "snow") {
    return { en: "any precip falls as snow here", ja: "この高度では降水は雪" };
  }
  if (phase === "mixed") {
    return { en: "right on the rain-snow line", ja: "雨雪の境目の高度" };
  }
  if (phase === "rain") {
    return { en: "precip would fall as rain here", ja: "この高度では降水は雨" };
  }
  return null;
}

/** snow line sits ~300m below the freezing level · same offset the server's
 * FL−300 phase partition uses (see openMeteoElevation.ts) — keep in sync. */
export const SNOW_LINE_OFFSET_M = 300;

export type PrecipPhase = "snow" | "mixed" | "rain";

/** classify what precip does at ONE elevation given the freezing level ·
 * the raw read behind freezingLevelSoWhat (±100m buffer = "mixed") */
export function precipPhaseAt(
  freezingLevelM: number | null | undefined,
  elevationM: number | null | undefined,
): PrecipPhase | null {
  if (freezingLevelM == null || !Number.isFinite(freezingLevelM)) return null;
  if (elevationM == null || !Number.isFinite(elevationM)) return null;
  const snowLineM = freezingLevelM - SNOW_LINE_OFFSET_M;
  if (snowLineM <= elevationM - 100) return "snow";
  if (snowLineM <= elevationM + 100) return "mixed";
  return "rain";
}

/**
 * rain-snow split across the hill · returns the snow line (m) ONLY when the
 * freezing level truly sits between the two heights: the lower elevation
 * reads rain (or right on the line) while the upper elevation reads snow.
 * null in every other case — all-snow, all-rain, missing data, or a
 * degenerate elevation pair — so callers fail soft.
 */
export function rainSnowSplitM(
  freezingLevelM: number | null | undefined,
  lowerElevationM: number | null | undefined,
  upperElevationM: number | null | undefined,
): number | null {
  if (
    lowerElevationM == null ||
    upperElevationM == null ||
    !Number.isFinite(lowerElevationM) ||
    !Number.isFinite(upperElevationM) ||
    lowerElevationM >= upperElevationM
  ) {
    return null;
  }
  const low = precipPhaseAt(freezingLevelM, lowerElevationM);
  const high = precipPhaseAt(freezingLevelM, upperElevationM);
  if ((low === "rain" || low === "mixed") && high === "snow") {
    return Math.round((freezingLevelM as number) - SNOW_LINE_OFFSET_M);
  }
  return null;
}
