/**
 * Viewport-gated impression eligibility · pure so it's unit-testable.
 *
 * A below-the-fold banner's "shown" ping must mean the visitor actually SAW
 * it (>= half visible), not that the component mounted. Note the observer's
 * `threshold` option alone is NOT enough: IntersectionObserver also delivers
 * an initial entry (and boundary-cross entries) whose ratio sits below the
 * configured threshold, so eligibility must re-check the ratio itself.
 */
export interface ImpressionEntry {
  isIntersecting: boolean;
  intersectionRatio: number;
}

export const IMPRESSION_MIN_RATIO = 0.5;

export function shouldCountImpression(entries: readonly ImpressionEntry[]): boolean {
  return entries.some((e) => e.isIntersecting && e.intersectionRatio >= IMPRESSION_MIN_RATIO);
}
