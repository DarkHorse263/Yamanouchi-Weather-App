// Current precipitation amount, brand-voiced. Snow takes priority when it's
// actually snowing; otherwise rain. Returns null when nothing is falling so the
// caller renders nothing. `precipMm` is mm of rain and `snowfallCm` is cm of
// snow, each over the preceding hour. Tones match the rain/snow icon convention
// used across the app (rain blue, snow pink snow-accent).
export interface PrecipAmount {
  precipMm: number | null;
  snowfallCm: number | null;
}

export interface PrecipSummary {
  label: string;
  tone: string;
}

// Daily rain in mm for a forecast day. Open-Meteo's `precipitation_sum`
// INCLUDES the water equivalent of snowfall, so labelling it "rain"
// double-reports snow on snow days ("17cm snow / 31mm rain" when it never
// rained). Prefer the server's true `rainSum` (rain + showers); for stale
// cached responses that predate the field, derive rain by subtracting the
// snow water equivalent (Open-Meteo converts at ~0.7 cm snow per 1 mm water).
export function dailyRainMm(
  day:
    | { rainSum?: number | null; precipitationSum?: number | null; snowfallSum?: number | null }
    | null
    | undefined,
): number | null {
  if (!day) return null;
  if (day.rainSum != null && Number.isFinite(Number(day.rainSum))) {
    return Math.max(0, Number(day.rainSum));
  }
  if (day.precipitationSum == null) return null;
  const precip = Number(day.precipitationSum) || 0;
  const snowCm = Number(day.snowfallSum) || 0;
  return Math.max(0, Math.round((precip - snowCm / 0.7) * 10) / 10);
}

export function precipSummary(c: PrecipAmount | null): PrecipSummary | null {
  if (!c) return null;
  if (c.snowfallCm != null && c.snowfallCm > 0) {
    return { label: `snow \u00b7 ${c.snowfallCm} cm last hour`, tone: "text-snow-accent" };
  }
  if (c.precipMm != null && c.precipMm > 0) {
    return { label: `rain \u00b7 ${c.precipMm} mm last hour`, tone: "text-blue-600" };
  }
  return null;
}
