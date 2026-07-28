import type { LiftSeed } from "../lifts";

/**
 * APPI & SHIZUKUISHI (JP · Iwate) - the two big resorts either side
 * of Morioka.
 *
 * APPI runs a single gondola spine: the 2,820 m APPI Gondola from the
 * ~620 m base village to Mt Maemori (~1,305 m), backed by quads on the
 * Central and Sailer faces (SnowJapan: for recent seasons the gondola
 * plus three quads and three pair lifts operate; Nishimori is CAT-tour
 * terrain). The day hinges on the gondola · the summit ridge is
 * exposed and holds in strong wind.
 *
 * SHIZUKUISHI (Prince) climbs Takakura's east slopes from ~430 m to
 * 1,128 m via a gondola plus the short Shizukuishi Ropeway (~730 m
 * mid-station area) and a handful of chairs. Lift names follow the
 * resort's published lineup (gondola, ropeway, high-speed quad).
 */
const V = "2026-07-28";

export const APPI_SHIZUKUISHI: LiftSeed[] = [
  // ─── APPI - the gondola is the spine ───
  { id: "appi-gondola",            mountainId: "appi",               name: "APPI Gondola",                nameJa: "安比ゴンドラ",             baseElevation: 620, topElevation: 1305, exposure: "exposed",        windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "appi-central-quad-1",     mountainId: "appi",               name: "Central Quad 1",              nameJa: "セントラル第1クワッド",   baseElevation: 620, topElevation: 950,  exposure: "moderate",       windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "appi-central-quad-2",     mountainId: "appi",               name: "Central Quad 2",              nameJa: "セントラル第2クワッド",   baseElevation: 900, topElevation: 1230, exposure: "exposed",        windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "appi-second-pair",        mountainId: "appi",               name: "Second Pair",                 nameJa: "セカンドペア",             baseElevation: 620, topElevation: 820,  exposure: "sheltered",      windHoldThresholdKmh: 90, type: "fixed_grip_chair", verifiedAt: V },

  // ─── SHIZUKUISHI - gondola + ropeway on Takakura ───
  { id: "shizukuishi-gondola",     mountainId: "shizukuishi-resort", name: "Shizukuishi Gondola",         nameJa: "雫石ゴンドラ",             baseElevation: 430, topElevation: 915,  exposure: "moderate",       windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "shizukuishi-ropeway",     mountainId: "shizukuishi-resort", name: "Shizukuishi Ropeway",         nameJa: "雫石ロープウェー",         baseElevation: 540, topElevation: 730,  exposure: "moderate",       windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "shizukuishi-hs-quad",     mountainId: "shizukuishi-resort", name: "Shizukuishi High-Speed Lift", nameJa: "雫石高速リフト",           baseElevation: 900, topElevation: 1128, exposure: "exposed",        windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
];
