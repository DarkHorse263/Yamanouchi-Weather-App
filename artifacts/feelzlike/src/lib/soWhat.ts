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
  if (freezingLevelM == null || !Number.isFinite(freezingLevelM)) return null;
  if (forecastElevationM == null || !Number.isFinite(forecastElevationM)) return null;
  const snowLineM = freezingLevelM - 300;
  if (snowLineM <= forecastElevationM - 100) {
    return { en: "any precip falls as snow here", ja: "この高度では降水は雪" };
  }
  if (snowLineM <= forecastElevationM + 100) {
    return { en: "right on the rain-snow line", ja: "雨雪の境目の高度" };
  }
  return { en: "precip would fall as rain here", ja: "この高度では降水は雨" };
}
