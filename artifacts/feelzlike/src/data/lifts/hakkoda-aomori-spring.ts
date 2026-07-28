import type { LiftSeed } from "../lifts";

/**
 * HAKKODA & AOMORI SPRING (JP · Aomori) - two very different Aomori
 * hills either side of the city.
 *
 * HAKKODA is essentially a single lift: the Hakkoda Ropeway, a 101-
 * person aerial tramway (2 track cables + 2 haulage ropes) climbing Mt
 * Tamoyachi, ~660 m Sanroku to ~1,314 m Sancho-koen (2.4 km line, 650 m
 * vertical per Wikipedia). It is high, exposed juhyo terrain and holds
 * readily to wind - the whole day's riding hinges on this one line.
 *
 * AOMORI SPRING (formerly Naqua Shirakami) is a quiet gondola-served
 * powder resort on Mt Iwaki's NW slopes: one gondola up to ~921 m
 * (545 m vertical) plus a couple of quads and a lower lift.
 */
const V = "2026-07-27";

export const HAKKODA_AOMORI_SPRING: LiftSeed[] = [
  // ─── HAKKODA - the ropeway is the whole story ───
  { id: "hakkoda-ropeway",         mountainId: "hakkoda",       name: "Hakkoda Ropeway",              nameJa: "八甲田ロープウェー",         baseElevation: 660,  topElevation: 1314, exposure: "highly_exposed", windHoldThresholdKmh: 75, type: "gondola",          verifiedAt: V },

  // ─── AOMORI SPRING - gondola-served powder on Mt Iwaki ───
  { id: "aomori-spring-gondola",   mountainId: "aomori-spring", name: "Aomori Spring Gondola",        nameJa: "青森スプリングゴンドラ",     baseElevation: 376,  topElevation: 921,  exposure: "moderate",        windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "aomori-spring-quad-1",    mountainId: "aomori-spring", name: "Aomori Spring Quad 1",         nameJa: "青森スプリング第1クワッド", baseElevation: 700,  topElevation: 921,  exposure: "exposed",         windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "aomori-spring-quad-2",    mountainId: "aomori-spring", name: "Aomori Spring Quad 2",         nameJa: "青森スプリング第2クワッド", baseElevation: 500,  topElevation: 760,  exposure: "moderate",        windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
];
