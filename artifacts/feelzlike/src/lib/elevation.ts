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
