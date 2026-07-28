import type { LiftSeed } from "../lifts";

/**
 * FURANO (JP · Hokkaido) - Furano Ski Resort (Prince, two linked zones)
 * plus the day-trip siblings Kamui Ski Links (near Asahikawa) and
 * Hoshino Resorts Tomamu. We model the summit ropeway/gondolas and the
 * exposed upper detachable/summit chairs - the ~1,074-1,209 m tops of
 * the Furano and Tokachi ranges catch a lot of wind, and the aerial
 * ropeway at Furano holds hard in it.
 *
 * Lift names/types from the official Prince (princehotels.com),
 * snowtomamu.jp and kamui-skilinks.com maps + skiresort.info; elevations
 * approximated from the published base/summit figures.
 */
const V = "2026-07-27";

export const FURANO: LiftSeed[] = [
  // ─── FURANO SKI RESORT · Furano zone (aerial ropeway to summit) ───
  { id: "furano-ropeway",           mountainId: "furano-ski-resort", name: "Furano Ropeway",             nameJa: "富良野ロープウェー",         baseElevation: 350, topElevation: 900,  exposure: "exposed",        windHoldThresholdKmh: 75, type: "gondola",          verifiedAt: V },
  { id: "furano-downhill-swift-1",  mountainId: "furano-ski-resort", name: "Furano Downhill Swift Lift No.1", nameJa: "富良野ダウンヒルスイフト第1", baseElevation: 900, topElevation: 1074, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  // ─── FURANO SKI RESORT · Kitanomine zone (gondola from village) ───
  { id: "furano-kitanomine-gondola", mountainId: "furano-ski-resort", name: "Kitanomine Gondola",        nameJa: "北の峰ゴンドラ",             baseElevation: 235, topElevation: 780,  exposure: "sheltered",      windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "furano-kitanomine-swift-1", mountainId: "furano-ski-resort", name: "Kitanomine Swift Lift No.1", nameJa: "北の峰スイフト第1",          baseElevation: 780, topElevation: 1010, exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },

  // ─── KAMUI SKI LINKS · Asahikawa's local powder hill ───
  { id: "kamui-gondola",            mountainId: "kamui-ski-links",   name: "Kamui Gondola",              nameJa: "カムイゴンドラ",             baseElevation: 100, topElevation: 751,  exposure: "moderate",       windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "kamui-lift-3",             mountainId: "kamui-ski-links",   name: "Kamui No.3 Pair Lift",       nameJa: "カムイ第3ペアリフト",         baseElevation: 480, topElevation: 751,  exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── HOSHINO RESORTS TOMAMU · Mt Tomamu (summit ~1,171 m) ───
  { id: "tomamu-unkai-gondola",     mountainId: "tomamu",            name: "Unkai Gondola",              nameJa: "雲海ゴンドラ",               baseElevation: 586, topElevation: 1171, exposure: "exposed",        windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "tomamu-tower-express",     mountainId: "tomamu",            name: "Tower Express",              nameJa: "タワーエクスプレス",         baseElevation: 586, topElevation: 900,  exposure: "moderate",       windHoldThresholdKmh: 78, type: "detachable",       verifiedAt: V },
  { id: "tomamu-express",           mountainId: "tomamu",            name: "Tomamu Express",             nameJa: "トマムエクスプレス",         baseElevation: 700, topElevation: 1100, exposure: "exposed",        windHoldThresholdKmh: 72, type: "detachable",       verifiedAt: V },
  { id: "tomamu-powder-express",    mountainId: "tomamu",            name: "Powder Express",             nameJa: "パウダーエクスプレス",       baseElevation: 800, topElevation: 1171, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
];
