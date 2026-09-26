/**
 * Model weather codes describe the dominant condition in a grid cell; the
 * same provider can report positive precipitation for the current hour while
 * returning a dry code. This is still a model reading, NOT an observation.
 * Do not use the day's chance of rain to infer what is falling now.
 */
export function precipitationAwareCode(
  code: number | null,
  precipMm: number | null,
  snowfallCm: number | null,
): number | null {
  if (code == null) return code;
  if (snowfallCm != null && snowfallCm > 0 && code < 51) return 71;
  if (precipMm != null && precipMm > 0 && code < 51) return 61;
  return code;
}