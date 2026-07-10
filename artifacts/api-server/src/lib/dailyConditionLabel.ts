/**
 * Daily condition label · derived from the day's TOTALS, not the WMO code.
 *
 * Open-Meteo's DAILY weather_code is the single most-severe condition at any
 * moment of the day, so it routinely contradicts the totals shown next to it:
 * a day with one brief heavy burst (2.7cm total) reads "Heavy snow fall"
 * while a day of steady snow totalling 17cm reads plain "Snow". Worse, a day
 * that is mostly RAIN with a little snow can still carry a snow code and hide
 * the rain story entirely.
 *
 * Rule: when a day has meaningful snow, the label comes from the daily
 * snowfall total; when liquid rain rivals or beats the snow's water content,
 * the label says so ("Rain · snow" / "Snow · rain") — rain on snow is the
 * single most important warning for skiers and must never be hidden behind
 * an optimistic snow label. Days without meaningful snow keep the code-based
 * fallback description.
 *
 * Water-equivalent conversion mirrors the client's dailyRainMm(): Open-Meteo
 * derives snowfall at ~0.7cm per 1mm of water, so snowCm / 0.7 = water mm.
 */
/** WMO daily codes that read as snow ("Slight snow fall" … "Snow showers"). */
const SNOW_CODES = new Set([71, 72, 73, 74, 75, 77, 85, 86]);

export function dailyConditionLabel(opts: {
  code?: number | null;
  snowfallCm: number | null | undefined;
  rainMm: number | null | undefined;
  fallback: string;
}): string {
  const snow = typeof opts.snowfallCm === "number" && Number.isFinite(opts.snowfallCm) ? opts.snowfallCm : 0;
  const rain = typeof opts.rainMm === "number" && Number.isFinite(opts.rainMm) ? opts.rainMm : null;

  if (snow < 0.5) {
    // Inverse contradiction: a rain-dominant day (e.g. 5.9mm rain, 0.1cm
    // snow) can still carry a snow moment-code. Don't let "Slight snow"
    // headline a rain day.
    if (rain != null && rain >= 2 && opts.code != null && SNOW_CODES.has(opts.code)) return "Rain";
    return opts.fallback;
  }
  const snowWaterMm = snow / 0.7;
  if (rain != null && rain >= 2) {
    if (rain >= snowWaterMm) return "Rain · snow";
    if (rain >= 0.4 * snowWaterMm) return "Snow · rain";
  }

  if (snow >= 15) return "Heavy snow";
  if (snow >= 4) return "Snow";
  return "Light snow";
}
