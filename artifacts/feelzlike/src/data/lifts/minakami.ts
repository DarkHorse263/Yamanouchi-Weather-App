import type { LiftSeed } from "../lifts";

/**
 * MINAKAMI (JP · Gunma) - the three valley anchors: Tanigawadake
 * Tenjindaira (Mt.T by Hoshino Resorts · the 2,400m ropeway to the
 * 1,319m bowl plus the peak pair lift on Tanigawa-dake), Minakami
 * Kogen (a high-speed quad and three pair lifts around the Hotel 200)
 * and Norn Minakami (compact tree-lined day-trip hill). Tenjindaira's
 * ropeway and Tenjin-toge pair catch serious ridge-line wind on
 * Tanigawa-dake; Norn and Kogen sit lower and more sheltered.
 *
 * Lift names/types re-verified July 2026 against the official Mt.T
 * lift-status page (tanigawadake-joch.com: ropeway + 天神峠ペア +
 * 天神平ペア + 高倉山第一), gunma-snow.com, SnowJapan and
 * skiresort.info (Kogen: 1,047m quad + 544/648/427m pairs; Norn:
 * lifts 1 & 3 are fixed quads, 2 & 4 pairs). 2026-27 trail maps are
 * not yet published; elevations remain approximations from the
 * published base/summit figures (Mt.T 750-1,502m, Kogen 850-1,248m,
 * Norn 820-1,220m).
 */
const V = "2026-07-31";

export const MINAKAMI: LiftSeed[] = [
  // ─── TANIGAWADAKE TENJINDAIRA (Mt.T) · ropeway bowl on Tanigawa-dake ───
  { id: "tenjindaira-ropeway",        mountainId: "tenjindaira",    name: "Tanigawadake Ropeway",   nameJa: "谷川岳ロープウェイ",       baseElevation: 750,  topElevation: 1319, exposure: "exposed",        windHoldThresholdKmh: 70, type: "gondola",          verifiedAt: V },
  { id: "tenjindaira-tenjin-pair",    mountainId: "tenjindaira",    name: "Tenjin-toge Pair Lift",  nameJa: "天神峠ペアリフト",         baseElevation: 1319, topElevation: 1502, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "tenjindaira-taira-pair",     mountainId: "tenjindaira",    name: "Tenjindaira Pair Lift",  nameJa: "天神平ペアリフト",         baseElevation: 1319, topElevation: 1440, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "tenjindaira-takakura-1",     mountainId: "tenjindaira",    name: "Takakurayama No.1 Lift", nameJa: "高倉山第一リフト",         baseElevation: 1319, topElevation: 1450, exposure: "exposed",        windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },

  // ─── MINAKAMI KOGEN · family resort around Hotel 200 ───
  { id: "minakami-kogen-quad",        mountainId: "minakami-kogen", name: "Kogen High-speed Quad",  nameJa: "高原クワッドリフト",       baseElevation: 850,  topElevation: 1150, exposure: "moderate",       windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "minakami-kogen-pair-1",      mountainId: "minakami-kogen", name: "No.1 Pair Lift",         nameJa: "第1ペアリフト",           baseElevation: 850,  topElevation: 1000, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "minakami-kogen-pair-2",      mountainId: "minakami-kogen", name: "No.2 Pair Lift",         nameJa: "第2ペアリフト",           baseElevation: 1000, topElevation: 1248, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "minakami-kogen-pair-3",      mountainId: "minakami-kogen", name: "No.3 Pair Lift",         nameJa: "第3ペアリフト",           baseElevation: 850,  topElevation: 940,  exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },

  // ─── NORN MINAKAMI · sheltered tree-lined day-trip hill ───
  { id: "norn-quad-1",                mountainId: "norn-minakami",  name: "No.1 Quad Lift",         nameJa: "第1クワッドリフト",       baseElevation: 820,  topElevation: 1150, exposure: "moderate",       windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "norn-pair-2",                mountainId: "norn-minakami",  name: "No.2 Pair Lift",         nameJa: "第2ペアリフト",           baseElevation: 820,  topElevation: 900,  exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "norn-quad-3",                mountainId: "norn-minakami",  name: "No.3 Quad Lift",         nameJa: "第3クワッドリフト",       baseElevation: 950,  topElevation: 1220, exposure: "moderate",       windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "norn-pair-4",                mountainId: "norn-minakami",  name: "No.4 Pair Lift",         nameJa: "第4ペアリフト",           baseElevation: 980,  topElevation: 1220, exposure: "moderate",       windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
];
