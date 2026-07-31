import type { LiftSeed } from "../lifts";

/**
 * TOMAMU & SAHORO (JP · Hokkaido) - the two Sekisho Line destination
 * resorts. Hoshino Resorts Tomamu runs a mix of express chairs off the
 * hotel base up Mt Tomamu (1,239m) - the upper mountain catches the
 * Tokachi-side wind while the lower village chairs are well sheltered.
 * Sahoro is a single-gondola hill on Mt Sahoro (1,030m top) above
 * Shintoku - the summit ridge is exposed to the north-west flow off
 * the Tokachi plain.
 *
 * Lift names/types from the official snowtomamu.jp and sahoro.co.jp
 * maps + skiresort.info; elevations approximated from the published
 * base/summit figures.
 */
const V = "2026-07-31";

export const TOMAMU_SAHORO: LiftSeed[] = [
  // ─── HOSHINO RESORTS TOMAMU · hotel-base resort on Mt Tomamu ───
  { id: "tomamu-resort-ex",           mountainId: "tomamu-resort", name: "Tomamu Express",        nameJa: "トマムエクスプレス",       baseElevation: 570,  topElevation: 1060, exposure: "moderate",       windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "tomamu-resort-unkai-gondola", mountainId: "tomamu-resort", name: "Unkai Gondola",         nameJa: "雲海ゴンドラ",             baseElevation: 570,  topElevation: 1088, exposure: "exposed",        windHoldThresholdKmh: 75, type: "gondola",          verifiedAt: V },
  { id: "tomamu-resort-powder-ex",    mountainId: "tomamu-resort", name: "Powder Express",        nameJa: "パウダーエクスプレス",     baseElevation: 820,  topElevation: 1170, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  { id: "tomamu-resort-village-pair", mountainId: "tomamu-resort", name: "Village Pair Lift",     nameJa: "ビレッジペアリフト",       baseElevation: 550,  topElevation: 680,  exposure: "sheltered",      windHoldThresholdKmh: 90, type: "fixed_grip_chair", verifiedAt: V },

  // ─── SAHORO RESORT · single-gondola hill on Mt Sahoro ───
  { id: "sahoro-gondola",             mountainId: "sahoro",        name: "Sahoro Gondola",        nameJa: "サホロゴンドラ",           baseElevation: 420,  topElevation: 1000, exposure: "exposed",        windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "sahoro-summit-pair",         mountainId: "sahoro",        name: "Summit Pair Lift",      nameJa: "山頂ペアリフト",           baseElevation: 850,  topElevation: 1030, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "sahoro-base-quad",           mountainId: "sahoro",        name: "Base Quad Lift",        nameJa: "ベースクワッドリフト",     baseElevation: 420,  topElevation: 640,  exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
];
