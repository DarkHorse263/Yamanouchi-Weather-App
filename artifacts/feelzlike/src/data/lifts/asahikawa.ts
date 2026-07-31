import type { LiftSeed } from "../lifts";

/**
 * ASAHIKAWA (JP · Hokkaido) - Kamui Ski Links (the city's local powder
 * hill, one gondola plus chairs on a 751m summit) and the Asahidake
 * Ropeway (a single 101-person tram from Asahidake Onsen to Sugatami
 * at ~1,600m on Hokkaido's highest peak). The ropeway is genuinely
 * alpine and holds readily in the Daisetsuzan wind; Kamui's gondola is
 * lower and better protected.
 *
 * Lift names/types from the official kamui-skilinks.com and
 * asahidake.hokkaido.jp maps + skiresort.info; elevations approximated
 * from the published base/summit figures.
 */
const V = "2026-07-31";

export const ASAHIKAWA: LiftSeed[] = [
  // ─── KAMUI SKI LINKS · local powder hill west of the city ───
  { id: "asahikawa-kamui-gondola",       mountainId: "kamui",     name: "Kamui Gondola",        nameJa: "カムイゴンドラ",       baseElevation: 150,  topElevation: 751,  exposure: "moderate",       windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "asahikawa-kamui-no5-pair",      mountainId: "kamui",     name: "No.5 Pair Lift",       nameJa: "第5ペアリフト",         baseElevation: 420,  topElevation: 700,  exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "asahikawa-kamui-no1-pair",      mountainId: "kamui",     name: "No.1 Pair Lift",       nameJa: "第1ペアリフト",         baseElevation: 150,  topElevation: 380,  exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },

  // ─── ASAHIDAKE · Daisetsuzan ropeway above Asahidake Onsen ───
  { id: "asahidake-ropeway",   mountainId: "asahidake", name: "Asahidake Ropeway",    nameJa: "旭岳ロープウェイ",     baseElevation: 1100, topElevation: 1600, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "gondola",          verifiedAt: V },
];
