import type { LiftSeed } from "../lifts";

/**
 * ZAO ONSEN (JP · Yamagata) - Tohoku's biggest resort, spread across a
 * broad juhyo-covered mountainside up to Jizo Sancho at 1,661 m. Three
 * separate cableway systems climb off the onsen village (Zao Ropeway,
 * Zao Chuo Ropeway, Zao Sky Cable) plus the upper-mountain detachable
 * quads and the exposed summit-area Utopia chairs. Station elevations
 * from the operators' pages (蔵王山麓駅 855 m / 樹氷高原駅 1,331 m /
 * 地蔵山頂駅 1,661 m; 温泉駅→鳥兜 1,387 m) and skiresort.info.
 *
 * The Sancho Line (Zao Top Line) is a Nippon Cable funitel with two
 * parallel haul ropes - genuinely wind-stable, hence the high threshold.
 */
const V = "2026-07-27";

export const ZAO_ONSEN: LiftSeed[] = [
  // ─── Zao Ropeway - the iconic two-stage line up to Jizo Sancho ───
  { id: "zao-ropeway-sanroku",   mountainId: "zao-onsen-resort", name: "Zao Ropeway Sanroku Line",       nameJa: "蔵王ロープウェイ 山麓線",          baseElevation: 855,  topElevation: 1331, exposure: "sheltered",       windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "zao-ropeway-sancho",    mountainId: "zao-onsen-resort", name: "Zao Ropeway Sancho Line (Top)",  nameJa: "蔵王ロープウェイ 山頂線",          baseElevation: 1331, topElevation: 1661, exposure: "highly_exposed", windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },

  // ─── Zao Chuo Ropeway - 101-person cabin up to Torikabuto ───
  { id: "zao-chuo-ropeway",      mountainId: "zao-onsen-resort", name: "Zao Chuo Ropeway",               nameJa: "蔵王中央ロープウェイ",             baseElevation: 840,  topElevation: 1387, exposure: "moderate",        windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },

  // ─── Zao Sky Cable - 4-person gondola into the Chuo Kogen bowl ───
  { id: "zao-sky-cable",         mountainId: "zao-onsen-resort", name: "Zao Sky Cable",                  nameJa: "蔵王スカイケーブル",               baseElevation: 940,  topElevation: 1400, exposure: "sheltered",       windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },

  // ─── Upper-mountain detachable quads (Juhyo Kogen area) ───
  { id: "zao-onsen-no2-quad",    mountainId: "zao-onsen-resort", name: "Zao Onsen No.2 Quad",            nameJa: "蔵王温泉第2高速リフト",            baseElevation: 1331, topElevation: 1520, exposure: "exposed",         windHoldThresholdKmh: 75, type: "detachable",       verifiedAt: V },
  { id: "zao-onsen-no4-quad",    mountainId: "zao-onsen-resort", name: "Zao Onsen No.4 Quad",            nameJa: "蔵王温泉第4高速リフト",            baseElevation: 1400, topElevation: 1600, exposure: "exposed",         windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },

  // ─── Exposed summit-area chairs feeding the Jizo / Utopia ridge ───
  { id: "zao-utopia-no1-pair",   mountainId: "zao-onsen-resort", name: "Utopia Pair No.1",               nameJa: "ユートピア第1ペア",                baseElevation: 1450, topElevation: 1600, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "zao-utopia-no2-pair",   mountainId: "zao-onsen-resort", name: "Utopia Pair No.2",               nameJa: "ユートピア第2ペア",                baseElevation: 1400, topElevation: 1560, exposure: "exposed",         windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
];
