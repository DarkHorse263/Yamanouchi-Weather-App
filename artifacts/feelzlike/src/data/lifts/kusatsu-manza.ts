import type { LiftSeed } from "../lifts";

/**
 * KUSATSU & MANZA (JP · Gunma) - the two onsen-town hills on the
 * Kusatsu-Shirane volcano. Kusatsu Onsen (formerly Kusatsu Kokusai)
 * runs a 460m pulse gondola across the base with the two Aobayama
 * pair lifts now the top of the scaled-back area (post-2018
 * eruption); Manza Onsen is a high Prince resort whose upper Prince
 * chair tops out at 1,994m on an exposed volcanic shoulder.
 *
 * Lift names/types from the official kusatsu-kokusai.com and
 * princehotels.com maps + skiresort.info; elevations approximated
 * from the published base/summit figures.
 */
const V = "2026-07-31";

export const KUSATSU_MANZA: LiftSeed[] = [
  // ─── KUSATSU ONSEN · base pulse gondola + the Aobayama top pairs ───
  { id: "kusatsu-pulse-gondola",   mountainId: "kusatsu-onsen-resort", name: "Pulse Gondola",         nameJa: "パルスゴンドラ",       baseElevation: 1245, topElevation: 1380, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "kusatsu-aobayama-pair-1", mountainId: "kusatsu-onsen-resort", name: "Aobayama No.1 Pair",    nameJa: "青葉山第1ペア",         baseElevation: 1380, topElevation: 1600, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "kusatsu-aobayama-pair-2", mountainId: "kusatsu-onsen-resort", name: "Aobayama No.2 Pair",    nameJa: "青葉山第2ペア",         baseElevation: 1400, topElevation: 1580, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MANZA ONSEN · high volcanic shoulder above the sulphur springs ───
  { id: "manza-prince-quad",       mountainId: "manza-onsen-resort",   name: "Prince Quad Lift",      nameJa: "プリンスクワッドリフト", baseElevation: 1800, topElevation: 1994, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "manza-pair-1",            mountainId: "manza-onsen-resort",   name: "No.1 Pair Lift",        nameJa: "第1ペアリフト",         baseElevation: 1700, topElevation: 1850, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "manza-baba-pair",         mountainId: "manza-onsen-resort",   name: "Baba Pair Lift",        nameJa: "馬場ペアリフト",         baseElevation: 1646, topElevation: 1780, exposure: "moderate",       windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
];
