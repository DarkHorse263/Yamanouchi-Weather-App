/**
 * On-mountain (mid-mountain) elevation for a resort, in metres.
 *
 * Snow falls higher up than the village, so deriving the HEADLINE snow
 * outlook at mid-mountain (rather than the base village) is both more
 * honest and far closer to the figures riders see on the hill. The split
 * here mirrors the mid band in the api-server's `openMeteoElevation.ts`
 * `bandElevations()` exactly, so the snapshot's labelled height lines up
 * with the elevation-banded forecast's mid band. Keep the two in sync:
 *   mid = summit - min(300, round(summit * 0.15)), floored against the
 *   lower band so tiny hills never collapse.
 */
export function midMountainElevation(summitM: number): number {
  if (!Number.isFinite(summitM) || summitM <= 0) return Math.round(summitM);
  const summit = Math.round(summitM);
  const midDrop = Math.min(300, Math.round(summit * 0.15));
  const lowerDrop = Math.min(600, Math.round(summit * 0.3));
  const lower = Math.max(50, summit - lowerDrop);
  return Math.max(lower + 50, summit - midDrop);
}

/**
 * Base-area (lower band) elevation for a resort, in metres. Mirrors the
 * `lower` band in the api-server's `bandElevations()` exactly — the stand-in
 * for "the village" when a resort's base elevation isn't separately known:
 *   lower = max(50, summit - min(600, round(summit * 0.3)))
 */
export function baseBandElevation(summitM: number): number {
  if (!Number.isFinite(summitM) || summitM <= 0) return Math.round(summitM);
  const summit = Math.round(summitM);
  const lowerDrop = Math.min(600, Math.round(summit * 0.3));
  return Math.max(50, summit - lowerDrop);
}

/**
 * Prefer a resort's real village / base-area elevation when configured.
 * Resorts without one retain the lower-band estimate used before real base
 * elevations were supported.
 */
export function resolveVillageElevation(
  baseElevationM?: number | null,
  summitM?: number | null,
): number | undefined {
  if (baseElevationM != null) return baseElevationM;
  return summitM != null ? baseBandElevation(summitM) : undefined;
}
