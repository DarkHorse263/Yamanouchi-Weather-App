import type { LiftSeed } from "../lifts";

/**
 * BANDAI (JP · Fukushima) - Hoshino Resorts NEKOMA Mountain (former
 * Alts Bandai south side + former Nekoma north side, linked by a
 * connecting lift since 2023-24) and Grandeco Snow Resort in
 * Urabandai. We model the main uphill spine of each side: the south
 * face above Lake Inawashiro is the more wind-exposed aspect, the
 * north bowl sits in the trees and holds powder, and Grandeco's
 * gondola plus its top quad reach the 1,590 m high point.
 *
 * Lift names/types from the official nekoma.co.jp and
 * grandecoresort.co.jp trail maps + skiresort.info; elevations
 * approximated from the published base/summit figures (south
 * 733-1,282 m, north 1,026-1,337 m, Grandeco 1,010-1,590 m).
 */
const V = "2026-07-31";

export const BANDAI: LiftSeed[] = [
  // ─── NEKOMA MOUNTAIN · south area (former Alts Bandai, sunny Lake Inawashiro side) ───
  { id: "nekoma-south-express",     mountainId: "nekoma-mountain", name: "South Area Express Quad",    nameJa: "南エリア高速クワッド",       baseElevation: 733,  topElevation: 1100, exposure: "moderate",       windHoldThresholdKmh: 80, type: "detachable",       verifiedAt: V },
  { id: "nekoma-south-summit-pair", mountainId: "nekoma-mountain", name: "South Summit Pair",          nameJa: "南エリア山頂ペアリフト",     baseElevation: 1100, topElevation: 1282, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  // ─── NEKOMA MOUNTAIN · connecting lift over the ridge to the north side ───
  { id: "nekoma-connect-lift",      mountainId: "nekoma-mountain", name: "South-North Connecting Lift", nameJa: "南北連絡リフト",             baseElevation: 1180, topElevation: 1300, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  // ─── NEKOMA MOUNTAIN · north area (former Nekoma · sheltered powder bowl) ───
  { id: "nekoma-north-quad",        mountainId: "nekoma-mountain", name: "North Area Quad",            nameJa: "北エリアクワッドリフト",     baseElevation: 1026, topElevation: 1250, exposure: "sheltered",      windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "nekoma-north-top-pair",    mountainId: "nekoma-mountain", name: "North Top Pair",             nameJa: "北エリア山頂ペアリフト",     baseElevation: 1150, topElevation: 1337, exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── GRANDECO · high-base gondola hill in Urabandai ───
  { id: "grandeco-gondola",         mountainId: "grandeco",        name: "Grandeco Gondola",           nameJa: "ゴンドラリフト",             baseElevation: 1010, topElevation: 1390, exposure: "exposed",        windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "grandeco-quad-2",          mountainId: "grandeco",        name: "No.2 Quad Lift",             nameJa: "第2クワッドリフト",           baseElevation: 1040, topElevation: 1260, exposure: "moderate",       windHoldThresholdKmh: 85, type: "detachable",       verifiedAt: V },
  { id: "grandeco-quad-4",          mountainId: "grandeco",        name: "No.4 Quad Lift",             nameJa: "第4クワッドリフト",           baseElevation: 1390, topElevation: 1590, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "detachable",       verifiedAt: V },
];
