/** No schema migration: DB defaults to metric, so historic imperial rows are
 * known choices; only explicitly marked metric rows may override region units. */
export function accountUnitsExplicit(
  units: string,
  metadata: unknown,
): boolean {
  return units === "imperial" || (
    metadata !== null &&
    typeof metadata === "object" &&
    !Array.isArray(metadata) &&
    (metadata as Record<string, unknown>).unitsPreferenceExplicit === true
  );
}