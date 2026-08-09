import type { LiftSeed } from "../lifts";

/**
 * WHISTLER (CA · BC Coast Mountains) - Whistler Mountain and Blackcomb.
 *
 * Lift names taken from the official Whistler Blackcomb winter 2025-26
 * trail map (whistlerblackcomb.com), cross-checked against public
 * lift-status pages. Base/top elevations are approximate on-mountain
 * figures rounded from the published stats. Wind-hold thresholds are
 * conservative best-estimates by lift type and exposure, not published
 * operating limits · surfaced in the UI with `verifiedAt` for transparency.
 */
const V = "2026-08-02";

export const WHISTLER: LiftSeed[] = [
  // ─── WHISTLER MOUNTAIN (village gondolas sheltered · alpine chairs very exposed) ───
  { id: "wm-village-gondola",     mountainId: "whistler-mountain",  name: "Whistler Village Gondola", baseElevation: 675,  topElevation: 1850, exposure: "moderate",       windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "wm-creekside-gondola",   mountainId: "whistler-mountain",  name: "Creekside Gondola",        baseElevation: 653,  topElevation: 1000, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "wm-fitzsimmons-express", mountainId: "whistler-mountain",  name: "Fitzsimmons 8 Express",    baseElevation: 675,  topElevation: 1005, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "detachable",       verifiedAt: V },
  { id: "wm-garbanzo-express",    mountainId: "whistler-mountain",  name: "Garbanzo Express",         baseElevation: 1005, topElevation: 1520, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "detachable",       verifiedAt: V },
  { id: "wm-big-red-express",     mountainId: "whistler-mountain",  name: "Big Red Express",          baseElevation: 1195, topElevation: 1850, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "wm-emerald-6-express",   mountainId: "whistler-mountain",  name: "Emerald 6 Express",        baseElevation: 1400, topElevation: 1690, exposure: "moderate",       windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "wm-peak-express",        mountainId: "whistler-mountain",  name: "Peak Express",             baseElevation: 1855, topElevation: 2160, exposure: "highly_exposed", windHoldThresholdKmh: 55, type: "detachable",       verifiedAt: V },
  { id: "wm-harmony-6-express",   mountainId: "whistler-mountain",  name: "Harmony 6 Express",        baseElevation: 1850, topElevation: 2115, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "detachable",       verifiedAt: V },
  { id: "wm-symphony-express",    mountainId: "whistler-mountain",  name: "Symphony Express",         baseElevation: 1745, topElevation: 2000, exposure: "exposed",        windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  { id: "wm-t-bars",              mountainId: "whistler-mountain",  name: "Whistler T-Bars",          baseElevation: 1850, topElevation: 2000, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "t-bar",            verifiedAt: V },
  { id: "wm-peak-2-peak",         mountainId: "whistler-mountain",  name: "Peak 2 Peak Gondola",      baseElevation: 1850, topElevation: 1860, exposure: "exposed",        windHoldThresholdKmh: 90, type: "gondola",          verifiedAt: V },

  // ─── BLACKCOMB (7th Heaven + Glacier hold first in a storm) ───
  { id: "bc-blackcomb-gondola",   mountainId: "blackcomb-mountain", name: "Blackcomb Gondola",        baseElevation: 675,  topElevation: 1860, exposure: "moderate",       windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "bc-excalibur-gondola",   mountainId: "blackcomb-mountain", name: "Excalibur Gondola",        baseElevation: 675,  topElevation: 1190, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "bc-excelerator-express", mountainId: "blackcomb-mountain", name: "Excelerator Express",      baseElevation: 1035, topElevation: 1545, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "detachable",       verifiedAt: V },
  { id: "bc-jersey-cream-express", mountainId: "blackcomb-mountain", name: "Jersey Cream Express",    baseElevation: 1580, topElevation: 1860, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "bc-glacier-express",     mountainId: "blackcomb-mountain", name: "Glacier Express",          baseElevation: 1680, topElevation: 2140, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "bc-7th-heaven-express",  mountainId: "blackcomb-mountain", name: "7th Heaven Express",       baseElevation: 1860, topElevation: 2280, exposure: "highly_exposed", windHoldThresholdKmh: 55, type: "detachable",       verifiedAt: V },
  { id: "bc-crystal-ridge-express", mountainId: "blackcomb-mountain", name: "Crystal Ridge Express",  baseElevation: 1235, topElevation: 1855, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "bc-catskinner-express",  mountainId: "blackcomb-mountain", name: "Catskinner Express",       baseElevation: 1580, topElevation: 1860, exposure: "moderate",       windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
];
