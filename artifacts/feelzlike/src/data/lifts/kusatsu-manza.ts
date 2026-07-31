import type { LiftSeed } from "../lifts";

/**
 * KUSATSU & MANZA (JP · Gunma) - the two onsen-town hills on the
 * Kusatsu-Shirane volcano. Kusatsu Onsen (formerly Kusatsu Kokusai)
 * runs six lifts: the 473m Pulse Gondola Tengu across the base, two
 * high-speed quads (Tenguyama + Shakunage) and three pairs, with the
 * two Aobayama pairs the top of the scaled-back area (post-2018
 * eruption, top 1,600m). Manza Onsen has been DOWNSIZED since the
 * September 2024 thefts: only the 330m Prince pair lift (A1/A2
 * courses) operated in 2024-25 and 2025-26; the 721m quad and the
 * other two pairs (732m/501m) are suspended, so they are deliberately
 * NOT seeded here. Re-add them if the 2026-27 map restores them.
 *
 * Re-verified July 2026 against the official 932-onsen.com winter
 * lift list + spec table (7 lifts incl. the kids snow escalator;
 * bottom 1,245m / top 1,600m) and SnowJapan/skiresort.info for Manza
 * (base 1,654m). 2026-27 trail maps not yet published; elevations
 * approximated from the published base/summit figures.
 */
const V = "2026-07-31";

export const KUSATSU_MANZA: LiftSeed[] = [
  // ─── KUSATSU ONSEN · base gondola + quads + the Aobayama top pairs ───
  { id: "kusatsu-pulse-gondola",     mountainId: "kusatsu-onsen-resort", name: "Pulse Gondola Tengu",     nameJa: "パルスゴンドラ天狗",       baseElevation: 1245, topElevation: 1350, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "kusatsu-tengu-quad",        mountainId: "kusatsu-onsen-resort", name: "Tenguyama Express Quad",  nameJa: "天狗山高速クワッド",       baseElevation: 1245, topElevation: 1350, exposure: "sheltered",      windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "kusatsu-tengu-family-pair", mountainId: "kusatsu-onsen-resort", name: "Tengu Family Pair",       nameJa: "天狗山ファミリーペアリフト", baseElevation: 1245, topElevation: 1300, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "kusatsu-shakunage-quad",    mountainId: "kusatsu-onsen-resort", name: "Shakunage Express Quad",  nameJa: "しゃくなげ高速クワッド",   baseElevation: 1330, topElevation: 1560, exposure: "moderate",       windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "kusatsu-aobayama-pair-1",   mountainId: "kusatsu-onsen-resort", name: "Aobayama No.1 Pair",      nameJa: "青葉山第1ペアリフト",     baseElevation: 1380, topElevation: 1600, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "kusatsu-aobayama-pair-2",   mountainId: "kusatsu-onsen-resort", name: "Aobayama No.2 Pair",      nameJa: "青葉山第2ペアリフト",     baseElevation: 1400, topElevation: 1580, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MANZA ONSEN · downsized: only the Prince pair spins (A1/A2) ───
  { id: "manza-prince-pair",         mountainId: "manza-onsen-resort",   name: "Prince Pair Lift",        nameJa: "プリンスリフト",           baseElevation: 1654, topElevation: 1760, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
];
