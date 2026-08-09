import type { LiftSeed } from "../lifts";

/**
 * BANFF - LAKE LOUISE (CA · Alberta Rockies) - Banff Sunshine, Mt. Norquay
 * and Lake Louise Ski Resort.
 *
 * Lift names taken from each resort's official trail map / lift list
 * (skibanff.com, banffnorquay.com, skilouise.com), cross-checked against
 * public lift-status pages. Base/top elevations are approximate on-mountain
 * figures rounded from the published stats. Wind-hold thresholds are
 * conservative best-estimates by lift type and exposure, not published
 * operating limits · surfaced in the UI with `verifiedAt` for transparency.
 */
const V = "2026-08-02";

export const BANFF_LAKE_LOUISE: LiftSeed[] = [
  // ─── BANFF SUNSHINE (Continental Divide · very exposed alpine bowls) ───
  { id: "sun-village-gondola",    mountainId: "banff-sunshine",     name: "Sunshine Village Gondola", baseElevation: 1660, topElevation: 2160, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "sun-angel-express",      mountainId: "banff-sunshine",     name: "Angel Express",            baseElevation: 2160, topElevation: 2560, exposure: "exposed",        windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  { id: "sun-great-divide",       mountainId: "banff-sunshine",     name: "Great Divide Express",     baseElevation: 2160, topElevation: 2600, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "detachable",       verifiedAt: V },
  { id: "sun-standish-express",   mountainId: "banff-sunshine",     name: "Standish Express",         baseElevation: 2160, topElevation: 2430, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "sun-teepee-town-lx",     mountainId: "banff-sunshine",     name: "Teepee Town LX",           baseElevation: 2255, topElevation: 2500, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "sun-goats-eye-express",  mountainId: "banff-sunshine",     name: "Goat's Eye Express",       baseElevation: 2040, topElevation: 2610, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "detachable",       verifiedAt: V },
  { id: "sun-strawberry-express", mountainId: "banff-sunshine",     name: "Strawberry Express",       baseElevation: 2160, topElevation: 2385, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "sun-wolverine-express",  mountainId: "banff-sunshine",     name: "Wolverine Express",        baseElevation: 2160, topElevation: 2310, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },

  // ─── MT. NORQUAY (small, steep, close to Banff townsite) ───
  { id: "nq-mystic-express",      mountainId: "mt-norquay",         name: "Mystic Express",           baseElevation: 1705, topElevation: 2000, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "nq-north-american",      mountainId: "mt-norquay",         name: "North American Chair",     baseElevation: 1705, topElevation: 2133, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "nq-cascade-chair",       mountainId: "mt-norquay",         name: "Cascade Chair",            baseElevation: 1705, topElevation: 1900, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "nq-spirit-chair",        mountainId: "mt-norquay",         name: "Spirit Chair",             baseElevation: 1705, topElevation: 1850, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },

  // ─── LAKE LOUISE (big alpine back bowls · Summit Platter tops out at 2,637m) ───
  { id: "ll-grizzly-gondola",     mountainId: "lake-louise-resort", name: "Grizzly Express Gondola",  baseElevation: 1645, topElevation: 2090, exposure: "moderate",       windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "ll-glacier-express",     mountainId: "lake-louise-resort", name: "Glacier Express",          baseElevation: 1645, topElevation: 2210, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "ll-top-of-the-world",    mountainId: "lake-louise-resort", name: "Top of the World Express", baseElevation: 2030, topElevation: 2500, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "detachable",       verifiedAt: V },
  { id: "ll-summit-platter",      mountainId: "lake-louise-resort", name: "Summit Platter",           baseElevation: 2380, topElevation: 2637, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "t-bar",            verifiedAt: V },
  { id: "ll-larch-express",       mountainId: "lake-louise-resort", name: "Larch Express",            baseElevation: 1798, topElevation: 2260, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "ll-ptarmigan-quad",      mountainId: "lake-louise-resort", name: "Ptarmigan Quad",           baseElevation: 2030, topElevation: 2380, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "ll-paradise-triple",     mountainId: "lake-louise-resort", name: "Paradise Triple",          baseElevation: 2090, topElevation: 2450, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "ll-juniper-express",     mountainId: "lake-louise-resort", name: "Juniper Express",          baseElevation: 1645, topElevation: 1900, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
];
