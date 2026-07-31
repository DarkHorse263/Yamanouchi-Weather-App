import type { LiftSeed } from "../lifts";

/**
 * HACHIMANTAI (JP · Iwate) - the two Hachimantai Resort hills on the
 * north side of Mt Iwate. Panorama runs a long quad plus two pairs on
 * gentle north-facing terrain behind the Mountain Hotel; Shimokura
 * sits in the lee of Mt Shimokura and is famous for a ~99% lift
 * operation rate, so its lifts are modelled as well sheltered.
 *
 * Lift names/types from the official hachimantai.co.jp winter maps +
 * SnowJapan; elevations approximated from the published base/summit
 * figures.
 */
const V = "2026-07-31";

export const HACHIMANTAI: LiftSeed[] = [
  // ─── PANORAMA · gentle family hill behind the Mountain Hotel ───
  { id: "hachimantai-panorama-quad",   mountainId: "hachimantai-panorama",  name: "Panorama Quad Lift",  nameJa: "パノラマクワッドリフト", baseElevation: 500, topElevation: 1000, exposure: "moderate",  windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "hachimantai-panorama-pair-1", mountainId: "hachimantai-panorama",  name: "No.1 Pair Lift",      nameJa: "第1ペアリフト",         baseElevation: 500, topElevation: 640,  exposure: "sheltered", windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },

  // ─── SHIMOKURA · wind-sheltered powder hill on Mt Shimokura ───
  { id: "hachimantai-shimokura-pair-1", mountainId: "hachimantai-shimokura", name: "No.1 Pair Lift",     nameJa: "第1ペアリフト",         baseElevation: 630, topElevation: 900,  exposure: "sheltered", windHoldThresholdKmh: 90, type: "fixed_grip_chair", verifiedAt: V },
  { id: "hachimantai-shimokura-pair-3", mountainId: "hachimantai-shimokura", name: "No.3 Pair Lift",     nameJa: "第3ペアリフト",         baseElevation: 850, topElevation: 1180, exposure: "moderate",  windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
];
