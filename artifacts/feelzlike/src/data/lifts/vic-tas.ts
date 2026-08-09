import type { LiftSeed } from "../lifts";

/**
 * VICTORIA'S HIGH COUNTRY (AU) - Mt Buller, Falls Creek, Mt Hotham.
 *
 * Lift names taken from each resort's official winter trail map / live
 * lift-status page (mtbuller.com.au, skifalls.com.au, mthotham.com.au),
 * focused on the main named lifts rather than learner carpets and
 * canyon tows. Snow-play / nordic-only areas (Lake Mountain,
 * Mt Stirling, Mt Donna Buang) intentionally have no seeds.
 *
 * Base/top elevations are approximate on-mountain figures derived from
 * published resort stats + lift verticals. Wind-hold thresholds are
 * conservative best-estimates by lift type and exposure, not published
 * operating limits - Hotham's ridge-top village and Buller's summit
 * lifts hold to wind often. Surfaced in the UI with `verifiedAt` for
 * transparency.
 */
const V = "2026-08-03";

export const VICTORIAS_HIGH_COUNTRY: LiftSeed[] = [
  // ─── MT BULLER ───
  { id: "mb-northside-express",  mountainId: "mt-buller",   name: "Northside Express",     baseElevation: 1375, topElevation: 1765, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "mb-abom-express",       mountainId: "mt-buller",   name: "ABOM Express",          baseElevation: 1520, topElevation: 1650, exposure: "moderate",       windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "mb-bourke-st-express",  mountainId: "mt-buller",   name: "Bourke Street Express", baseElevation: 1530, topElevation: 1600, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "detachable",       verifiedAt: V },
  { id: "mb-summit",             mountainId: "mt-buller",   name: "Summit",                baseElevation: 1580, topElevation: 1800, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mb-federation",         mountainId: "mt-buller",   name: "Federation",            baseElevation: 1450, topElevation: 1780, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mb-wombat",             mountainId: "mt-buller",   name: "Wombat",                baseElevation: 1560, topElevation: 1760, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mb-bull-run",           mountainId: "mt-buller",   name: "Bull Run",              baseElevation: 1500, topElevation: 1740, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mb-grimus",             mountainId: "mt-buller",   name: "Grimus",                baseElevation: 1600, topElevation: 1790, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mb-tirol-tbar",         mountainId: "mt-buller",   name: "Tirol T-Bar",           baseElevation: 1440, topElevation: 1795, exposure: "exposed",        windHoldThresholdKmh: 80, type: "t-bar",            verifiedAt: V },

  // ─── FALLS CREEK ───
  { id: "fc-halleys-comet",      mountainId: "falls-creek", name: "Halley's Comet Quad",   baseElevation: 1560, topElevation: 1740, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fc-eagle-express",      mountainId: "falls-creek", name: "Eagle Express Quad",    baseElevation: 1520, topElevation: 1720, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fc-summit-quad",        mountainId: "falls-creek", name: "Summit Quad",           baseElevation: 1600, topElevation: 1780, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fc-ruined-castle",      mountainId: "falls-creek", name: "Ruined Castle Quad",    baseElevation: 1580, topElevation: 1760, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fc-scott-quad",         mountainId: "falls-creek", name: "Scott Quad",            baseElevation: 1540, topElevation: 1720, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fc-towers-quad",        mountainId: "falls-creek", name: "Towers Quad",           baseElevation: 1540, topElevation: 1700, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fc-gully-triple",       mountainId: "falls-creek", name: "Gully Triple",          baseElevation: 1580, topElevation: 1720, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fc-drovers-dream",      mountainId: "falls-creek", name: "Drovers Dream Quad",    baseElevation: 1600, topElevation: 1720, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "fc-international-poma", mountainId: "falls-creek", name: "International Poma",    baseElevation: 1620, topElevation: 1780, exposure: "exposed",        windHoldThresholdKmh: 80, type: "rope_tow",         verifiedAt: V },

  // ─── MT HOTHAM ───
  { id: "mh-heavenly-valley",    mountainId: "mt-hotham",   name: "Heavenly Valley",       baseElevation: 1520, topElevation: 1834, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mh-village",            mountainId: "mt-hotham",   name: "Village",               baseElevation: 1560, topElevation: 1835, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mh-summit",             mountainId: "mt-hotham",   name: "Summit Quad",           baseElevation: 1750, topElevation: 1845, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mh-gotcha",             mountainId: "mt-hotham",   name: "Gotcha",                baseElevation: 1600, topElevation: 1720, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mh-keoghs",             mountainId: "mt-hotham",   name: "Keogh's",               baseElevation: 1500, topElevation: 1655, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mh-orchard",            mountainId: "mt-hotham",   name: "Orchard",               baseElevation: 1500, topElevation: 1655, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mh-road-runner",        mountainId: "mt-hotham",   name: "Road Runner",           baseElevation: 1450, topElevation: 1600, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mh-big-d",              mountainId: "mt-hotham",   name: "Big D",                 baseElevation: 1720, topElevation: 1785, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mh-blue-ribbon",        mountainId: "mt-hotham",   name: "Blue Ribbon",           baseElevation: 1470, topElevation: 1690, exposure: "moderate",       windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mh-drift-tbar",         mountainId: "mt-hotham",   name: "The Drift",             baseElevation: 1740, topElevation: 1830, exposure: "highly_exposed", windHoldThresholdKmh: 70, type: "t-bar",            verifiedAt: V },
];

/**
 * TASMANIA (AU) - Ben Lomond. All-surface-lift operation on an exposed
 * alpine plateau (the old chairlifts are gone); names from the resort's
 * official snow report lift-status table (benlomondalpineresort.com.au).
 * Pomas are modelled as rope_tow (closest surface-lift bucket).
 */
export const TASMANIA: LiftSeed[] = [
  { id: "bl-summit-tbar",  mountainId: "ben-lomond", name: "Summit T-Bar",  baseElevation: 1500, topElevation: 1570, exposure: "highly_exposed", windHoldThresholdKmh: 75, type: "t-bar",    verifiedAt: V },
  { id: "bl-fannies-tbar", mountainId: "ben-lomond", name: "Fannies T-Bar", baseElevation: 1470, topElevation: 1540, exposure: "exposed",        windHoldThresholdKmh: 75, type: "t-bar",    verifiedAt: V },
  { id: "bl-bills-tbar",   mountainId: "ben-lomond", name: "Bills T-Bar",   baseElevation: 1470, topElevation: 1530, exposure: "exposed",        windHoldThresholdKmh: 75, type: "t-bar",    verifiedAt: V },
  { id: "bl-bass-poma",    mountainId: "ben-lomond", name: "Bass Poma",     baseElevation: 1480, topElevation: 1530, exposure: "exposed",        windHoldThresholdKmh: 80, type: "rope_tow", verifiedAt: V },
  { id: "bl-giblin-poma",  mountainId: "ben-lomond", name: "Giblin Poma",   baseElevation: 1480, topElevation: 1540, exposure: "exposed",        windHoldThresholdKmh: 80, type: "rope_tow", verifiedAt: V },
  { id: "bl-village-poma", mountainId: "ben-lomond", name: "Village Poma",  baseElevation: 1470, topElevation: 1500, exposure: "moderate",       windHoldThresholdKmh: 80, type: "rope_tow", verifiedAt: V },
];
