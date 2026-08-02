import type { LiftSeed } from "../lifts";

/**
 * VANCOUVER & THE ISLAND (CA · BC) - the three North Shore city hills
 * (Cypress, Grouse, Mt Seymour) plus Mount Washington on Vancouver Island.
 *
 * Lift names taken from each resort's official trail map / lift list
 * (cypressmountain.com, grousemountain.com, mtseymour.ca, mountwashington.ca),
 * cross-checked against public lift listings. Base/top elevations are
 * approximate on-mountain figures rounded from published stats. Wind-hold
 * thresholds are conservative best-estimates by lift type and exposure, not
 * published operating limits · surfaced in the UI with `verifiedAt`.
 */
const V = "2026-08-02";

export const VANCOUVER: LiftSeed[] = [
  // ─── CYPRESS (biggest North Shore hill · low, wet coastal snow) ───
  { id: "cy-lions-express",       mountainId: "cypress-mountain",  name: "Lions Express",       baseElevation: 960,  topElevation: 1440, exposure: "exposed",   windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "cy-eagle-express",       mountainId: "cypress-mountain",  name: "Eagle Express",       baseElevation: 960,  topElevation: 1370, exposure: "moderate",  windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "cy-sky-chair",           mountainId: "cypress-mountain",  name: "Sky Chair",           baseElevation: 1050, topElevation: 1420, exposure: "exposed",   windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "cy-raven-ridge",         mountainId: "cypress-mountain",  name: "Raven Ridge Quad",    baseElevation: 960,  topElevation: 1200, exposure: "sheltered", windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "cy-easy-rider",          mountainId: "cypress-mountain",  name: "Easy Rider Quad",     baseElevation: 960,  topElevation: 1080, exposure: "sheltered", windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },

  // ─── GROUSE (skyride-served city hill above Vancouver) ───
  { id: "gr-screaming-eagle",     mountainId: "grouse-mountain",   name: "The Screaming Eagle", baseElevation: 1020, topElevation: 1210, exposure: "moderate",  windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "gr-olympic-express",     mountainId: "grouse-mountain",   name: "Olympic Express",     baseElevation: 1020, topElevation: 1210, exposure: "moderate",  windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "gr-peak-chair",          mountainId: "grouse-mountain",   name: "The Peak Chair",      baseElevation: 1128, topElevation: 1250, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MT SEYMOUR (highest, quietest North Shore hill) ───
  { id: "se-mystery-peak-express", mountainId: "mount-seymour",    name: "Mystery Peak Express", baseElevation: 1010, topElevation: 1265, exposure: "exposed",   windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "se-lodge-chair",         mountainId: "mount-seymour",     name: "Lodge Chair 2.0",     baseElevation: 1010, topElevation: 1130, exposure: "sheltered", windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "se-brockton-chair",      mountainId: "mount-seymour",     name: "Brockton Chair",      baseElevation: 1010, topElevation: 1150, exposure: "moderate",  windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MOUNT WASHINGTON (Vancouver Island · deep maritime snowpack) ───
  { id: "mw-eagle-express",       mountainId: "mount-washington",  name: "Eagle Express",       baseElevation: 1110, topElevation: 1588, exposure: "exposed",   windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "mw-hawk-chair",          mountainId: "mount-washington",  name: "Hawk Six Pack Express", baseElevation: 1250, topElevation: 1560, exposure: "exposed", windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "mw-sunrise-chair",       mountainId: "mount-washington",  name: "Sunrise Quad",        baseElevation: 1110, topElevation: 1520, exposure: "moderate",  windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mw-boomerang-chair",     mountainId: "mount-washington",  name: "Boomerang",           baseElevation: 1350, topElevation: 1560, exposure: "exposed",   windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mw-whiskey-jack",        mountainId: "mount-washington",  name: "Whiskey Jack",        baseElevation: 1110, topElevation: 1320, exposure: "sheltered", windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
];
