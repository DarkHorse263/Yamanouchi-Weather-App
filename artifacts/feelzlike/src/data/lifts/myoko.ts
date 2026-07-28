import type { LiftSeed } from "../lifts";

/**
 * MYOKO (JP) - six resorts around Mt Myoko (2,454m) in Niigata, one of
 * Japan's deepest-snow areas. We model each resort's main gondola/cable
 * and the exposed upper chairs (Akakan Sky Cable, Suginohara's high
 * Mitahara lifts, Lotte Arai's gondola). Names + types from official
 * resort maps and skiresort.info; base/top from published lift and
 * summit elevations.
 */

const V = "2026-07-27";

export const MYOKO: LiftSeed[] = [
  // ─── AKAKURA ONSEN · lively slopes above the onsen village, top ~1200m ───
  { id: "akakura-onsen-kumado1",  mountainId: "akakura-onsen", name: "Kumado No.1 Pair",  nameJa: "くまどー第1ペア",   baseElevation: 750,  topElevation: 1050, exposure: "sheltered", windHoldThresholdKmh: 82, type: "fixed_grip_chair", verifiedAt: V },
  { id: "akakura-onsen-ginrei1",  mountainId: "akakura-onsen", name: "Ginrei No.1 Pair",  nameJa: "銀嶺第1ペア",       baseElevation: 950,  topElevation: 1200, exposure: "exposed",   windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── AKAKURA KANKO (Akakan) · Sky Cable gondola to ~1300m, high Champion chairs ───
  { id: "akakura-kanko-skycable", mountainId: "akakura-kanko", name: "Myoko Kogen Sky Cable", nameJa: "妙高高原スカイケーブル", baseElevation: 1010, topElevation: 1300, exposure: "moderate",        windHoldThresholdKmh: 82, type: "gondola",          verifiedAt: V },
  { id: "akakura-kanko-champion1", mountainId: "akakura-kanko", name: "Champion No.1 Lift",  nameJa: "チャンピオン第1リフト", baseElevation: 1300, topElevation: 1500, exposure: "highly_exposed", windHoldThresholdKmh: 62, type: "fixed_grip_chair", verifiedAt: V },
  { id: "akakura-kanko-champion3", mountainId: "akakura-kanko", name: "Champion No.3 Lift",  nameJa: "チャンピオン第3リフト", baseElevation: 1150, topElevation: 1350, exposure: "exposed",         windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── IKENOTAIRA ALPEN BLICK · broad open slopes on Mt Myoko's flank, top ~1413m ───
  { id: "ikenotaira-ropeway",     mountainId: "ikenotaira", name: "Ikenotaira Ropeway",   nameJa: "池の平ロープウェイ",   baseElevation: 780,  topElevation: 1250, exposure: "moderate", windHoldThresholdKmh: 82, type: "gondola",          verifiedAt: V },
  { id: "ikenotaira-alpenblick1", mountainId: "ikenotaira", name: "Alpenblick No.1 Pair", nameJa: "アルペンブリック第1ペア", baseElevation: 1250, topElevation: 1413, exposure: "exposed",  windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MYOKO SUGINOHARA · Japan's longest run, top ~1855m off high Mitahara lifts ───
  { id: "suginohara-gondola",     mountainId: "myoko-suginohara", name: "Suginohara Gondola",       nameJa: "杉ノ原ゴンドラ",           baseElevation: 745,  topElevation: 1500, exposure: "moderate",        windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "suginohara-mitahara2",   mountainId: "myoko-suginohara", name: "Mitahara High-Speed No.2", nameJa: "三田原高速第2リフト",     baseElevation: 1500, topElevation: 1855, exposure: "highly_exposed", windHoldThresholdKmh: 62, type: "detachable",       verifiedAt: V },
  { id: "suginohara-mitahara3",   mountainId: "myoko-suginohara", name: "Mitahara High-Speed No.3", nameJa: "三田原高速第3リフト",     baseElevation: 1300, topElevation: 1650, exposure: "exposed",         windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },

  // ─── SEKI ONSEN · two lifts, Japan's heaviest snow, top ~1200m ───
  { id: "seki-onsen-1st-pair",    mountainId: "seki-onsen", name: "No.1 Pair", nameJa: "第1ペアリフト", baseElevation: 900,  topElevation: 1120, exposure: "sheltered", windHoldThresholdKmh: 82, type: "fixed_grip_chair", verifiedAt: V },
  { id: "seki-onsen-2nd-pair",    mountainId: "seki-onsen", name: "No.2 Pair", nameJa: "第2ペアリフト", baseElevation: 1120, topElevation: 1200, exposure: "exposed",   windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── LOTTE ARAI · big-vertical freeride on Mt Okenashi, gondola to ~1280m ───
  { id: "lotte-arai-gondola",     mountainId: "lotte-arai", name: "Arai Gondola",       nameJa: "アライゴンドラ",     baseElevation: 340,  topElevation: 1000, exposure: "moderate",        windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "lotte-arai-zundoko",     mountainId: "lotte-arai", name: "Zundoko Lift",       nameJa: "ずんどこリフト",     baseElevation: 1000, topElevation: 1280, exposure: "highly_exposed", windHoldThresholdKmh: 62, type: "fixed_grip_chair", verifiedAt: V },
];
