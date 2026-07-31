/**
 * Pure unit-preference conversion + formatting helpers.
 *
 * Canonical units app-wide stay METRIC (°C, cm) — the API always speaks
 * metric. These helpers convert at the display edge only, driven by the
 * member's saved `units` preference (users.units via /api/account).
 *
 * Deliberately dependency-free (no @/regions imports) so it stays safe for
 * `tsx --test` (see feelzlike test-isolation convention).
 */

export type UnitsPref = "metric" | "imperial";

export const cToF = (c: number): number => (c * 9) / 5 + 32;
export const cmToIn = (cm: number): number => cm / 2.54;
export const kmhToMph = (kmh: number): number => kmh / 1.609344;
export const mToFt = (m: number): number => m * 3.28084;

export function tempUnitLabel(units: UnitsPref): "°C" | "°F" {
  return units === "imperial" ? "°F" : "°C";
}

export function snowUnitLabel(units: UnitsPref): "cm" | "in" {
  return units === "imperial" ? "in" : "cm";
}

export function windUnitLabel(units: UnitsPref): "km/h" | "mph" {
  return units === "imperial" ? "mph" : "km/h";
}

export function elevationUnitLabel(units: UnitsPref): "m" | "ft" {
  return units === "imperial" ? "ft" : "m";
}

/** Converted wind speed, rounded to a whole number. Null-safe → null. */
export function windRounded(kmh: number | null | undefined, units: UnitsPref): number | null {
  if (kmh === null || kmh === undefined) return null;
  return Math.round(units === "imperial" ? kmhToMph(kmh) : kmh);
}

/** Converted elevation/height, rounded to a whole number. Null-safe → null. */
export function elevationRounded(m: number | null | undefined, units: UnitsPref): number | null {
  if (m === null || m === undefined) return null;
  return Math.round(units === "imperial" ? mToFt(m) : m);
}

/** Converted temperature, rounded to a whole degree. Null-safe → null. */
export function tempRounded(c: number | null | undefined, units: UnitsPref): number | null {
  if (c === null || c === undefined) return null;
  return Math.round(units === "imperial" ? cToF(c) : c);
}

/**
 * Converted snow amount as a display string (value only, no unit).
 * Metric keeps the caller's decimal convention; imperial always shows one
 * decimal (snow inches are small numbers — "4.7", not "5").
 */
export function snowValue(
  cm: number | null | undefined,
  units: UnitsPref,
  metricDecimals = 0,
): string {
  if (cm === null || cm === undefined) return "-";
  if (units === "imperial") return cmToIn(cm).toFixed(1);
  return metricDecimals > 0 ? cm.toFixed(metricDecimals) : String(Math.round(cm));
}

/** "12 cm" / "4.7 in" — value + unit, null-safe → "-". */
export function formatSnow(
  cm: number | null | undefined,
  units: UnitsPref,
  metricDecimals = 0,
): string {
  if (cm === null || cm === undefined) return "-";
  return `${snowValue(cm, units, metricDecimals)} ${snowUnitLabel(units)}`;
}
