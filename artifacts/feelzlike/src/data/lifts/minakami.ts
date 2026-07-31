import type { LiftSeed } from "../lifts";

/**
 * MINAKAMI (JP · Gunma) - the three valley anchors: Tanigawadake
 * Tenjindaira (Mt.T · the 2,400m ropeway to the 1,319m bowl plus the
 * exposed upper pair lifts on Tanigawa-dake), Minakami Kogen (a quad
 * and pair lifts around the Hotel 200) and Norn Minakami (compact
 * tree-lined day-trip hill). Tenjindaira's ropeway and upper chairs
 * catch serious ridge-line wind on Tanigawa-dake; Norn and Kogen sit
 * lower and more sheltered.
 *
 * Lift names/types from the official tanigawadake-joch.com,
 * minakamikogen200.jp and norn.co.jp maps + skiresort.info;
 * elevations approximated from the published base/summit figures.
 */
const V = "2026-07-31";

export const MINAKAMI: LiftSeed[] = [
  // ─── TANIGAWADAKE TENJINDAIRA (Mt.T) · ropeway bowl on Tanigawa-dake ───
  { id: "tenjindaira-ropeway",        mountainId: "tenjindaira",    name: "Tanigawadake Ropeway",   nameJa: "谷川岳ロープウェイ",       baseElevation: 750,  topElevation: 1319, exposure: "exposed",        windHoldThresholdKmh: 70, type: "gondola",          verifiedAt: V },
  { id: "tenjindaira-tenjin-pair",    mountainId: "tenjindaira",    name: "Tenjin Pair Lift",       nameJa: "天神峠ペアリフト",         baseElevation: 1319, topElevation: 1500, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "tenjindaira-hodaigi-pair",   mountainId: "tenjindaira",    name: "Bowl Pair Lift",         nameJa: "ゲレンデペアリフト",       baseElevation: 1319, topElevation: 1450, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MINAKAMI KOGEN · family resort around Hotel 200 ───
  { id: "minakami-kogen-quad",        mountainId: "minakami-kogen", name: "Kogen Quad Lift",        nameJa: "高原クワッドリフト",       baseElevation: 850,  topElevation: 1100, exposure: "moderate",       windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "minakami-kogen-pair-2",      mountainId: "minakami-kogen", name: "No.2 Pair Lift",         nameJa: "第2ペアリフト",           baseElevation: 1000, topElevation: 1248, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── NORN MINAKAMI · sheltered tree-lined day-trip hill ───
  { id: "norn-pair-1",                mountainId: "norn-minakami",  name: "No.1 Pair Lift",         nameJa: "第1ペアリフト",           baseElevation: 820,  topElevation: 1000, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "norn-pair-4",                mountainId: "norn-minakami",  name: "No.4 Pair Lift",         nameJa: "第4ペアリフト",           baseElevation: 980,  topElevation: 1220, exposure: "moderate",       windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
];
