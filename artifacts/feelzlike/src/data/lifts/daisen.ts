import type { LiftSeed } from "../lifts";

/**
 * DAISEN (JP · Tottori) - Daisen White Resort, western Japan's biggest
 * ski hill on the sea-facing slopes of Mt Daisen (655-1,121 m across
 * the Kokusai, Uenohara, Nakanohara and Goenzan areas). The upper
 * Kokusai area faces the Japan Sea winds head-on, while the lower
 * family slopes around Nakanohara and Goenzan sit against the forest.
 *
 * Lift names/types from the official daisen-resort.jp area map +
 * skiresort.info; elevations approximated from the published
 * base/summit figures. Operator change from 2026-27 · re-verify the
 * lift lineup against the official site before the season.
 */
const V = "2026-07-31";

export const DAISEN: LiftSeed[] = [
  // ─── KOKUSAI area (upper mountain · exposed to the Japan Sea winds) ───
  { id: "daisen-kokusai-pair-1",   mountainId: "daisen-white-resort", name: "Kokusai No.1 Pair",   nameJa: "国際第1ペアリフト",   baseElevation: 800, topElevation: 960,  exposure: "exposed",        windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "daisen-kokusai-pair-2",   mountainId: "daisen-white-resort", name: "Kokusai No.2 Pair",   nameJa: "国際第2ペアリフト",   baseElevation: 950, topElevation: 1121, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  // ─── UENOHARA / NAKANOHARA areas (mid-mountain cruisers) ───
  { id: "daisen-uenohara-pair",    mountainId: "daisen-white-resort", name: "Uenohara Pair",       nameJa: "上の原ペアリフト",     baseElevation: 700, topElevation: 860,  exposure: "moderate",       windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "daisen-nakanohara-pair",  mountainId: "daisen-white-resort", name: "Nakanohara Pair",     nameJa: "中の原ペアリフト",     baseElevation: 690, topElevation: 850,  exposure: "moderate",       windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  // ─── GOENZAN area (sheltered beginner slope by Daisenji village) ───
  { id: "daisen-goenzan-pair",     mountainId: "daisen-white-resort", name: "Goenzan Pair",        nameJa: "豪円山ペアリフト",     baseElevation: 655, topElevation: 790,  exposure: "sheltered",      windHoldThresholdKmh: 90, type: "fixed_grip_chair", verifiedAt: V },
];
