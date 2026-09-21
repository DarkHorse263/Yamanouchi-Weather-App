/**
 * Return provider-published daily apparent-temperature extrema only when the
 * same source also supplied a complete actual-temperature pair for that local
 * day. This intentionally does not derive apparent temperature from other
 * weather variables.
 */
export function validDailyApparentExtrema(
  actualMax: unknown,
  actualMin: unknown,
  apparentMax: unknown,
  apparentMin: unknown,
): { max: number; min: number } | null {
  if (
    typeof actualMax !== "number" ||
    !Number.isFinite(actualMax) ||
    typeof actualMin !== "number" ||
    !Number.isFinite(actualMin) ||
    typeof apparentMax !== "number" ||
    !Number.isFinite(apparentMax) ||
    typeof apparentMin !== "number" ||
    !Number.isFinite(apparentMin) ||
    apparentMax < apparentMin
  ) {
    return null;
  }

  return { max: apparentMax, min: apparentMin };
}