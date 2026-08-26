/**
 * Coverage pins can share a mountain/town id across regions. Keep the React
 * identity scoped to its semantic map entity rather than concatenating ids.
 */
export function coveragePinKey({
  country,
  regionId,
  id,
}: {
  country: string;
  regionId: string;
  id: string;
}): string {
  return `coverage-pin:${country}:${regionId}:${id}`;
}

/**
 * Authored pins are projected before catalogue pins. Keeping the first object
 * therefore preserves authored precedence as well as the established order.
 */
export function dedupeCoveragePins<
  T extends { country: string; regionId: string; id: string },
>(pins: readonly T[]): T[] {
  const seen = new Set<string>();
  return pins.filter((pin) => {
    const key = coveragePinKey(pin);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}