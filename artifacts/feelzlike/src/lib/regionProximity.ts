// ─────────────────────────────────────────────────────────────────────────────
// regionProximity.ts - the far-vs-near framing decision for the "near you"
// region suggestion, extracted as a pure helper so the honest copy can't be
// silently flipped by an unrelated refactor of NearYou.tsx.
//
// Pure on purpose: no React, no PNG/region asset imports. Safe to load under
// `tsx --test` (see the tsx test-isolation convention) so the boundary is
// guarded by a test that doesn't drag in the whole region catalog.
// ─────────────────────────────────────────────────────────────────────────────

// Past this real distance the "nearest mountain region" framing reads oddly (a
// visitor in Europe is ~16,000 km from the closest live region). Beyond it we
// keep the honest distance but soften the copy so we never imply it's close.
export const FAR_REGION_KM = 1000;

/**
 * How a suggested region relates to the visitor:
 *   - "suggested": no real distance known (location off / fallback pick)
 *   - "nearest":   distance known and within the "this is close" threshold
 *   - "far":       distance known but beyond the threshold - drop "nearest"
 *
 * `distanceKm` is null whenever we don't have the visitor's coordinates (the
 * softer fallback row), so that maps to "suggested" rather than a near/far call.
 */
export type RegionProximity = "suggested" | "nearest" | "far";

export function classifyRegionProximity(distanceKm: number | null): RegionProximity {
  if (distanceKm == null) return "suggested";
  return distanceKm >= FAR_REGION_KM ? "far" : "nearest";
}

/**
 * Convenience boolean for the "soften the copy" branches. Only true when a real
 * distance is known and it's beyond the threshold; null distance is never "far".
 */
export function isFarRegion(distanceKm: number | null): boolean {
  return classifyRegionProximity(distanceKm) === "far";
}
