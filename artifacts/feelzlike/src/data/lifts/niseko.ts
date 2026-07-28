import type { LiftSeed } from "../lifts";

/**
 * NISEKO (JP · Hokkaido) - the four Niseko United resorts on Mt Niseko
 * Annupuri (Grand Hirafu, Hanazono, Niseko Village, Annupuri) plus the
 * independent Moiwa. We model the main gondolas + the higher, exposed
 * upper-mountain chairs that actually hold to Niseko's notorious wind;
 * the peak above the top lifts is hike-only and wind-blasted, so the
 * uppermost chairs (King #3, Hanazono #1, Annupuri Gondola) hold often.
 *
 * Lift names/lengths from the official Niseko United resort maps
 * (niseko.ne.jp) and niseko-moiwa.jp; elevations approximated from the
 * ~255-340 m base areas up toward the ~1,200 m top-lift terrain.
 */
const V = "2026-07-27";

export const NISEKO: LiftSeed[] = [
  // ─── GRAND HIRAFU - Niseko's biggest, night skiing + peak gates ───
  { id: "hirafu-king-gondola",     mountainId: "grand-hirafu",   name: "King Gondola",             nameJa: "キングゴンドラ",           baseElevation: 340,  topElevation: 840,  exposure: "sheltered",       windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "hirafu-ace-gondola",      mountainId: "grand-hirafu",   name: "Ace Gondola",              nameJa: "エースゴンドラ",           baseElevation: 340,  topElevation: 780,  exposure: "sheltered",       windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "hirafu-king-hooded-3",    mountainId: "grand-hirafu",   name: "King Hooded Lift #3",      nameJa: "キングフード付リフト第3",   baseElevation: 840,  topElevation: 1200, exposure: "highly_exposed",  windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "hirafu-king-single-4",    mountainId: "grand-hirafu",   name: "King Lift #4 Single",      nameJa: "キングリフト第4シングル",   baseElevation: 1000, topElevation: 1200, exposure: "highly_exposed",  windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "hirafu-ace-pair-3",       mountainId: "grand-hirafu",   name: "Ace Pair Lift #3",         nameJa: "エースペアリフト第3",       baseElevation: 780,  topElevation: 1000, exposure: "exposed",         windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── HANAZONO - quieter NE flank, Symphony Gondola + high hooded chair ───
  { id: "hanazono-symphony-gondola", mountainId: "hanazono",     name: "Hanazono Symphony Gondola", nameJa: "HANAZONOシンフォニーゴンドラ", baseElevation: 410, topElevation: 700, exposure: "sheltered",     windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "hanazono-hooded-1",       mountainId: "hanazono",       name: "Hanazono Hooded Lift #1",  nameJa: "HANAZONO第1フード付リフト", baseElevation: 700,  topElevation: 1050, exposure: "exposed",         windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "hanazono-hooded-quad-3",  mountainId: "hanazono",       name: "Hanazono Hooded Quad #3",  nameJa: "HANAZONO第3フード付クワッド", baseElevation: 700, topElevation: 1000, exposure: "exposed",       windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── NISEKO VILLAGE - gondola from the village base (255 m) ───
  { id: "village-niseko-gondola",  mountainId: "niseko-village", name: "Niseko Gondola",           nameJa: "ニセコゴンドラ",           baseElevation: 300,  topElevation: 830,  exposure: "sheltered",       windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "village-express",         mountainId: "niseko-village", name: "Village Express",          nameJa: "ビレッジエクスプレス",     baseElevation: 830,  topElevation: 1000, exposure: "exposed",         windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  { id: "village-mori-no-chair",   mountainId: "niseko-village", name: "Mori-no Chair",            nameJa: "森のチェア",               baseElevation: 700,  topElevation: 1000, exposure: "exposed",         windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── ANNUPURI - gentlest of the four, single long gondola + upper chair ───
  { id: "annupuri-gondola",        mountainId: "annupuri",       name: "Annupuri Gondola",         nameJa: "アンヌプリゴンドラ",       baseElevation: 300,  topElevation: 1000, exposure: "exposed",         windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "annupuri-jumbo-hooded-quad", mountainId: "annupuri",    name: "Jumbo Hooded Quad Lift",   nameJa: "ジャンボフード付クワッド",   baseElevation: 720,  topElevation: 1050, exposure: "exposed",         windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MOIWA - small independent hill beside Annupuri ───
  { id: "moiwa-quad",              mountainId: "moiwa",          name: "Moiwa Quad Lift",          nameJa: "モイワクワッドリフト",     baseElevation: 430,  topElevation: 780,  exposure: "moderate",        windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "moiwa-pair-1",            mountainId: "moiwa",          name: "Moiwa Pair Lift #1",       nameJa: "モイワ第1ペアリフト",       baseElevation: 620,  topElevation: 840,  exposure: "exposed",         windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
];
