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
