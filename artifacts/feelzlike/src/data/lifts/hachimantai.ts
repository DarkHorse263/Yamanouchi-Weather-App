import type { LiftSeed } from "../lifts";

/**
 * HACHIMANTAI (JP · Iwate) - the two Hachimantai Resort hills on the
 * north side of Mt Iwate. Panorama runs a 2,000m bubble high-speed
 * quad plus a 1,200m pair and a short family pair on gentle
 * north-facing terrain behind the Mountain Hotel; Shimokura sits in
 * the lee of Mt Shimokura (one 783m triple + two pairs, 859m/956m)
 * and is famous for a ~99% lift operation rate, so its lifts are
 * modelled as well sheltered.
 *
 * Re-verified July 2026 against hachimantai.co.jp/winter, SnowJapan
 * (Panorama: quad + 400m and 1,200m pairs, base 540m top 1,000m;
 * Shimokura: triple + 859m/956m pairs, base 580m top 1,130m) and
 * skiresort.info. 2026-27 trail maps not yet published; elevations
 * approximated from the published base/summit figures.
 */
const V = "2026-07-31";

export const HACHIMANTAI: LiftSeed[] = [
  // ─── PANORAMA · gentle family hill behind the Mountain Hotel ───
  { id: "hachimantai-panorama-quad",        mountainId: "hachimantai-panorama",  name: "Center Quad Lift",    nameJa: "センタークワッドリフト", baseElevation: 540, topElevation: 1000, exposure: "moderate",  windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "hachimantai-panorama-pair-2",      mountainId: "hachimantai-panorama",  name: "No.2 Pair Lift",      nameJa: "第2ペアリフト",         baseElevation: 560, topElevation: 830,  exposure: "moderate",  windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "hachimantai-panorama-family-pair", mountainId: "hachimantai-panorama",  name: "Family Pair Lift",    nameJa: "ファミリーペアリフト",   baseElevation: 540, topElevation: 600,  exposure: "sheltered", windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },

  // ─── SHIMOKURA · wind-sheltered powder hill on Mt Shimokura ───
  { id: "hachimantai-shimokura-triple-1",   mountainId: "hachimantai-shimokura", name: "No.1 Triple Lift",    nameJa: "第1トリプルリフト",     baseElevation: 580, topElevation: 790,  exposure: "sheltered", windHoldThresholdKmh: 90, type: "fixed_grip_chair", verifiedAt: V },
  { id: "hachimantai-shimokura-pair-2",     mountainId: "hachimantai-shimokura", name: "No.2 Pair Lift",      nameJa: "第2ペアリフト",         baseElevation: 620, topElevation: 900,  exposure: "sheltered", windHoldThresholdKmh: 90, type: "fixed_grip_chair", verifiedAt: V },
  { id: "hachimantai-shimokura-pair-3",     mountainId: "hachimantai-shimokura", name: "No.3 Pair Lift",      nameJa: "第3ペアリフト",         baseElevation: 780, topElevation: 1130, exposure: "moderate",  windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
];
