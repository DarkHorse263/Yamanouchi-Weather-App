import type { LiftSeed } from "../lifts";

/**
 * OKANAGAN (CA · BC Interior) - Big White, SilverStar and Apex Mountain.
 *
 * Lift names taken from each resort's official trail map / lift list
 * (bigwhite.com, skisilverstar.com, apexresort.com), cross-checked against
 * public lift-status pages. Base/top elevations are approximate on-mountain
 * figures rounded from the published stats. Wind-hold thresholds are
 * conservative best-estimates by lift type and exposure, not published
 * operating limits · surfaced in the UI with `verifiedAt` for transparency.
 */
const V = "2026-08-01";

export const OKANAGAN: LiftSeed[] = [
  // ─── BIG WHITE (dry interior snow · large exposed alpine plateau) ───
  { id: "bw-bullet-express",      mountainId: "big-white",   name: "Bullet Express",       baseElevation: 1755, topElevation: 2225, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "bw-ridge-rocket-express", mountainId: "big-white",  name: "Ridge Rocket Express", baseElevation: 1755, topElevation: 2225, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "bw-snow-ghost-express",  mountainId: "big-white",   name: "Snow Ghost Express",   baseElevation: 1755, topElevation: 2150, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "bw-gem-lake-express",    mountainId: "big-white",   name: "Gem Lake Express",     baseElevation: 1508, topElevation: 2225, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "bw-alpine-tbar",         mountainId: "big-white",   name: "Alpine T-Bar",         baseElevation: 2225, topElevation: 2319, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "t-bar",            verifiedAt: V },
  { id: "bw-cliff-chair",         mountainId: "big-white",   name: "The Cliff Chair",      baseElevation: 2100, topElevation: 2280, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "bw-powder-chair",        mountainId: "big-white",   name: "Powder Chair",         baseElevation: 1900, topElevation: 2225, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "bw-falcon-chair",        mountainId: "big-white",   name: "The Falcon Chair",     baseElevation: 1755, topElevation: 2010, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "bw-black-forest-express", mountainId: "big-white",  name: "Black Forest Express", baseElevation: 1755, topElevation: 1990, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "detachable",       verifiedAt: V },

  // ─── SILVERSTAR (gentle front side · exposed Powder Gulch back bowls) ───
  { id: "ss-comet-express",       mountainId: "silverstar",  name: "Comet Express",        baseElevation: 1609, topElevation: 1915, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "ss-powder-gulch-express", mountainId: "silverstar", name: "Powder Gulch Express", baseElevation: 1500, topElevation: 1900, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "ss-silver-woods-express", mountainId: "silverstar", name: "Silver Woods Express", baseElevation: 1550, topElevation: 1900, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "detachable",       verifiedAt: V },
  { id: "ss-silver-queen-chair",  mountainId: "silverstar",  name: "Silver Queen Chair",   baseElevation: 1609, topElevation: 1840, exposure: "moderate",       windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "ss-alpine-meadows-chair", mountainId: "silverstar", name: "Alpine Meadows Chair", baseElevation: 1580, topElevation: 1780, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },

  // ─── APEX (steep fall-line cruisers · quiet, dry Okanagan snow) ───
  { id: "apex-quad-chair",        mountainId: "apex-resort", name: "Quad Chair",           baseElevation: 1575, topElevation: 2178, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "apex-stocks-chair",      mountainId: "apex-resort", name: "Stocks Triple Chair",  baseElevation: 1575, topElevation: 1950, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "apex-t-bar",             mountainId: "apex-resort", name: "T-Bar",                baseElevation: 1575, topElevation: 1720, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "t-bar",            verifiedAt: V },
];
