import type { LiftSeed } from "../lifts";

/**
 * CANMORE + JASPER (CA · Alberta Rockies) - Nakiska and Marmot Basin.
 *
 * Lift names taken from each resort's official trail map / lift list
 * (skinakiska.com, skimarmot.com), cross-checked against public
 * lift-status pages. Base/top elevations are approximate on-mountain
 * figures rounded from the published stats. Wind-hold thresholds are
 * conservative best-estimates by lift type and exposure, not published
 * operating limits · surfaced in the UI with `verifiedAt` for transparency.
 */
const V = "2026-08-02";

export const CANMORE_JASPER: LiftSeed[] = [
  // ─── NAKISKA (Kananaskis · 1988 Olympic race hill, chinook-wind prone) ───
  { id: "nk-gold-express",        mountainId: "nakiska",      name: "Gold Chair Express",       baseElevation: 1710, topElevation: 2260, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "nk-silver-quad",         mountainId: "nakiska",      name: "Silver Quad Chair",        baseElevation: 1525, topElevation: 1985, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "nk-olympic-quad",        mountainId: "nakiska",      name: "Olympic Quad Chair",       baseElevation: 1525, topElevation: 2075, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "nk-bronze-chair",        mountainId: "nakiska",      name: "Bronze Chair",             baseElevation: 1525, topElevation: 1710, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MARMOT BASIN (Jasper · high alpine upper mountain above treeline) ───
  { id: "mb-canadian-rockies",    mountainId: "marmot-basin", name: "Canadian Rockies Express", baseElevation: 1698, topElevation: 2160, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "mb-paradise-express",    mountainId: "marmot-basin", name: "Paradise Express",         baseElevation: 1930, topElevation: 2300, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "mb-eagle-express",       mountainId: "marmot-basin", name: "Eagle Express Quad",       baseElevation: 1900, topElevation: 2225, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "mb-eagle-ridge-quad",    mountainId: "marmot-basin", name: "Eagle Ridge Quad",         baseElevation: 2135, topElevation: 2470, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mb-knob-quad",           mountainId: "marmot-basin", name: "Knob Quad",                baseElevation: 2225, topElevation: 2560, exposure: "highly_exposed", windHoldThresholdKmh: 55, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mb-school-house",        mountainId: "marmot-basin", name: "School House Chair",       baseElevation: 1698, topElevation: 1800, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
];
