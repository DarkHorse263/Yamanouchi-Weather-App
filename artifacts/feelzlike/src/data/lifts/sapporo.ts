import type { LiftSeed } from "../lifts";

/**
 * SAPPORO (JP · Hokkaido) - the three ski hills that ring the city:
 * Sapporo Teine (Olympia and Highland zones on Mt Teine), Sapporo
 * Kokusai (a single 8-person gondola above Jozankei onsen) and the
 * in-city night-skiing hill Sapporo Bankei. We model the gondola and
 * the exposed upper chairs - Mt Teine's summit ridge and Kokusai's
 * upper terrain catch the sea-of-Japan wind, while Bankei's low
 * sheltered slopes hold only in the strongest gusts.
 *
 * Lift names/types from the official sapporo-teine.com,
 * sapporo-kokusai.jp and bankei.co.jp maps + skiresort.info;
 * elevations approximated from the published base/summit figures.
 */
const V = "2026-07-27";

export const SAPPORO: LiftSeed[] = [
  // ─── SAPPORO TEINE · Highland zone (exposed summit ridge on Mt Teine) ───
  { id: "sapporo-teine-summit-express", mountainId: "sapporo-teine",   name: "Summit Express Pair",       nameJa: "サミットエクスプレス",       baseElevation: 780, topElevation: 980,  exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "sapporo-teine-highland-quad",  mountainId: "sapporo-teine",   name: "Highland Zone Quad",        nameJa: "ハイランドゾーンクワッド",   baseElevation: 680, topElevation: 900,  exposure: "exposed",        windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },
  // ─── SAPPORO TEINE · Olympia zone (sheltered family slopes lower down) ───
  { id: "sapporo-teine-olympia-quad",   mountainId: "sapporo-teine",   name: "Olympia Zone Quad",         nameJa: "オリンピアゾーンクワッド",   baseElevation: 520, topElevation: 680,  exposure: "sheltered",      windHoldThresholdKmh: 85, type: "detachable",       verifiedAt: V },

  // ─── SAPPORO KOKUSAI · deep-snow hill above Jozankei onsen ───
  { id: "sapporo-kokusai-sky-cabin-8",  mountainId: "sapporo-kokusai", name: "Sky Cabin 8 Gondola",       nameJa: "スカイキャビン8ゴンドラ",     baseElevation: 630, topElevation: 1100, exposure: "exposed",        windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "sapporo-kokusai-first-quad",   mountainId: "sapporo-kokusai", name: "No.1 Quad Lift",            nameJa: "第1クワッドリフト",           baseElevation: 900, topElevation: 1100, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },

  // ─── SAPPORO BANKEI · sheltered in-city night-skiing hill ───
  { id: "sapporo-bankei-pair-1",        mountainId: "sapporo-bankei",  name: "No.1 Pair Lift",            nameJa: "第1ペアリフト",               baseElevation: 300, topElevation: 482,  exposure: "sheltered",      windHoldThresholdKmh: 90, type: "fixed_grip_chair", verifiedAt: V },
  { id: "sapporo-bankei-pair-2",        mountainId: "sapporo-bankei",  name: "No.2 Pair Lift",            nameJa: "第2ペアリフト",               baseElevation: 340, topElevation: 482,  exposure: "moderate",       windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
];
