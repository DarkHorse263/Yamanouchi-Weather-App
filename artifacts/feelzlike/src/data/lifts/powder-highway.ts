import type { LiftSeed } from "../lifts";

/**
 * POWDER HIGHWAY (CA · BC Kootenays) - Revelstoke, Kicking Horse, Fernie,
 * Whitewater, Kimberley and Panorama.
 *
 * Lift names taken from each resort's official trail map / lift list
 * (revelstokemountainresort.com, kickinghorseresort.com, skifernie.com,
 * skiwhitewater.com, skikimberley.com, panoramaresort.com), cross-checked
 * against public lift-status pages. Base/top elevations are approximate
 * on-mountain figures rounded from the published stats. Wind-hold
 * thresholds are conservative best-estimates by lift type and exposure,
 * not published operating limits · surfaced in the UI with `verifiedAt`
 * for transparency.
 */
const V = "2026-08-02";

export const POWDER_HIGHWAY: LiftSeed[] = [
  // ─── REVELSTOKE (biggest vertical in North America · 1,713m) ───
  { id: "rv-revelation-gondola",  mountainId: "revelstoke-mountain-resort", name: "Revelation Gondola",   baseElevation: 512,  topElevation: 1680, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "rv-stoke-chair",         mountainId: "revelstoke-mountain-resort", name: "The Stoke",            baseElevation: 1680, topElevation: 2225, exposure: "exposed",        windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  { id: "rv-ripper-chair",        mountainId: "revelstoke-mountain-resort", name: "The Ripper",           baseElevation: 1450, topElevation: 1950, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "rv-stellar-chair",       mountainId: "revelstoke-mountain-resort", name: "Stellar Chair",        baseElevation: 1700, topElevation: 1950, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },

  // ─── KICKING HORSE (gondola-served ridgelines above Golden) ───
  { id: "kh-golden-eagle",        mountainId: "kicking-horse",   name: "Golden Eagle Express Gondola", baseElevation: 1190, topElevation: 2350, exposure: "exposed",        windHoldThresholdKmh: 75, type: "gondola",          verifiedAt: V },
  { id: "kh-stairway-to-heaven",  mountainId: "kicking-horse",   name: "Stairway to Heaven",           baseElevation: 2225, topElevation: 2420, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "kh-pioneer-chair",       mountainId: "kicking-horse",   name: "Pioneer Chair",                baseElevation: 1190, topElevation: 1710, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "kh-catamount-chair",     mountainId: "kicking-horse",   name: "Catamount Chair",              baseElevation: 1190, topElevation: 1300, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },

  // ─── FERNIE (five alpine bowls · Polar Peak holds first) ───
  { id: "fa-timber-bowl-express", mountainId: "fernie-alpine",   name: "Timber Bowl Express Quad",     baseElevation: 1068, topElevation: 1520, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "fa-white-pass-quad",     mountainId: "fernie-alpine",   name: "White Pass Quad",              baseElevation: 1520, topElevation: 1925, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fa-great-bear-express",  mountainId: "fernie-alpine",   name: "Great Bear Express Quad",      baseElevation: 1068, topElevation: 1580, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "fa-elk-quad",            mountainId: "fernie-alpine",   name: "Elk Quad Chair",               baseElevation: 1068, topElevation: 1400, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fa-deer-chair",          mountainId: "fernie-alpine",   name: "Deer Triple Chair",            baseElevation: 1080, topElevation: 1450, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fa-boomerang-chair",     mountainId: "fernie-alpine",   name: "Boomerang Triple Chair",       baseElevation: 1080, topElevation: 1525, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fa-polar-peak-chair",    mountainId: "fernie-alpine",   name: "Polar Peak Chair",             baseElevation: 1745, topElevation: 1925, exposure: "highly_exposed", windHoldThresholdKmh: 55, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fa-haul-back-tbar",      mountainId: "fernie-alpine",   name: "Haul Back T-Bar",              baseElevation: 1450, topElevation: 1520, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "t-bar",            verifiedAt: V },

  // ─── WHITEWATER (Nelson · deep Kootenay snow, simple lift network) ───
  { id: "ww-raven-quad",          mountainId: "whitewater",      name: "Raven Quad Chair",             baseElevation: 1640, topElevation: 2000, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "ww-glory-ridge-chair",   mountainId: "whitewater",      name: "Glory Ridge Chair",            baseElevation: 1585, topElevation: 2000, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "ww-silver-king-chair",   mountainId: "whitewater",      name: "Silver King Chair",            baseElevation: 1585, topElevation: 1860, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },

  // ─── KIMBERLEY (dry Purcell snow · one main express) ───
  { id: "kb-north-star-express",  mountainId: "kimberley-alpine", name: "North Star Express Quad",     baseElevation: 1230, topElevation: 1840, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "kb-easter-triple",       mountainId: "kimberley-alpine", name: "Easter Triple Chair",         baseElevation: 1660, topElevation: 1930, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "kb-owl-tbar",            mountainId: "kimberley-alpine", name: "Owl T-Bar",                   baseElevation: 1230, topElevation: 1330, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "t-bar",            verifiedAt: V },

  // ─── PANORAMA (long fall-line vertical above Invermere) ───
  { id: "pa-mile-1-express",      mountainId: "panorama",        name: "Mile 1 Express Quad",          baseElevation: 1160, topElevation: 1620, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "pa-champagne-express",   mountainId: "panorama",        name: "Champagne Express Quad",       baseElevation: 1620, topElevation: 2130, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "pa-summit-quad",         mountainId: "panorama",        name: "Summit Quad",                  baseElevation: 2130, topElevation: 2365, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "pa-sunbird-triple",      mountainId: "panorama",        name: "Sunbird Triple",               baseElevation: 1620, topElevation: 1830, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
];
