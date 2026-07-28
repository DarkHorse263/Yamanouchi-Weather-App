import type { LiftSeed } from "../lifts";

/**
 * RUSUTSU & KIRORO (JP · Hokkaido) - two big independent powder resorts.
 * Rusutsu spans West Mt, East Mt and Mt Isola (summit ~994 m); Kiroro
 * runs a long gondola to Asari Peak (~1,180 m) with Nagamine Peak
 * alongside. We model the gondolas + the exposed Isola/Asari summit
 * express chairs that hold to wind; the lower, tree-sheltered gondolas
 * ride through much higher.
 *
 * Lift names/types from the official rusutsu.com / kiroro.co.jp maps +
 * skiresort.info; elevations approximated from the published base
 * (~400 m West Mt / 570 m Kiroro) and summit figures.
 */
const V = "2026-07-27";

export const RUSUTSU_KIRORO: LiftSeed[] = [
  // ─── RUSUTSU RESORT · West Mt / East Mt / Mt Isola ───
  { id: "rusutsu-isola-gondola",  mountainId: "rusutsu-resort", name: "Isola Gondola",       nameJa: "イゾラゴンドラ",       baseElevation: 545, topElevation: 994, exposure: "exposed",        windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "rusutsu-east-1-gondola", mountainId: "rusutsu-resort", name: "East No.1 Gondola",    nameJa: "イースト第1ゴンドラ",   baseElevation: 400, topElevation: 700, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "rusutsu-east-2-gondola", mountainId: "rusutsu-resort", name: "East No.2 Gondola",    nameJa: "イースト第2ゴンドラ",   baseElevation: 545, topElevation: 750, exposure: "moderate",       windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "rusutsu-yotei-gondola",  mountainId: "rusutsu-resort", name: "Yotei Gondola",        nameJa: "ようていゴンドラ",     baseElevation: 400, topElevation: 545, exposure: "sheltered",      windHoldThresholdKmh: 90, type: "gondola",          verifiedAt: V },
  { id: "rusutsu-isola-4-quad",   mountainId: "rusutsu-resort", name: "Isola No.4 Quad",      nameJa: "イゾラ第4クワッド",     baseElevation: 750, topElevation: 994, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  { id: "rusutsu-west-1-quad",    mountainId: "rusutsu-resort", name: "West No.1 Quad Lift",  nameJa: "ウエスト第1クワッド",   baseElevation: 400, topElevation: 600, exposure: "moderate",       windHoldThresholdKmh: 78, type: "fixed_grip_chair", verifiedAt: V },

  // ─── KIRORO · Kiroro Gondola to Asari Peak (~1,180 m) ───
  { id: "kiroro-gondola",          mountainId: "kiroro-resort", name: "Kiroro Gondola",         nameJa: "キロロゴンドラ",         baseElevation: 570, topElevation: 1180, exposure: "exposed",        windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "kiroro-asari-2-express",  mountainId: "kiroro-resort", name: "Asari No.2 Express",     nameJa: "朝里第2エクスプレス",     baseElevation: 800, topElevation: 1180, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
  { id: "kiroro-nagamine-1-express", mountainId: "kiroro-resort", name: "Nagamine No.1 Express", nameJa: "長峰第1エクスプレス",   baseElevation: 570, topElevation: 1090, exposure: "exposed",        windHoldThresholdKmh: 72, type: "detachable",       verifiedAt: V },
  { id: "kiroro-center-express",   mountainId: "kiroro-resort", name: "Center Express",         nameJa: "センターエクスプレス",   baseElevation: 570, topElevation: 850,  exposure: "sheltered",      windHoldThresholdKmh: 85, type: "detachable",       verifiedAt: V },
  { id: "kiroro-yoichi-1-express", mountainId: "kiroro-resort", name: "Yoichi No.1 Express",    nameJa: "余市第1エクスプレス",     baseElevation: 700, topElevation: 1090, exposure: "exposed",        windHoldThresholdKmh: 72, type: "detachable",       verifiedAt: V },
];
