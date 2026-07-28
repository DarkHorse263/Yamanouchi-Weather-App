import type { LiftSeed } from "../lifts";

/**
 * HAKUBA VALLEY (JP) - ten resorts along the Ōito line beneath the
 * Northern Alps. We focus on each resort's main gondola/ropeway, the
 * high exposed summit chairs (Happo's Grat/Kurobishi, Cortina's ridge,
 * Tsugaike's Tsuga Pair) and 1-2 key mid-mountain lifts. Names + types
 * from official resort maps and skiresort.info; base/top from published
 * lift and summit elevations.
 */

const V = "2026-07-27";

export const HAKUBA_VALLEY: LiftSeed[] = [
  // ─── HAPPO-ONE · biggest/steepest, top ~1830m, Adam gondola + long Alpen Line ───
  { id: "happo-gondola-adam",   mountainId: "happo-one", name: "Gondola Adam",       nameJa: "ゴンドラ アダム",       baseElevation: 760,  topElevation: 1400, exposure: "sheltered",       windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "happo-alpen-quad",     mountainId: "happo-one", name: "Alpen Quad",         nameJa: "アルペンクワッド",     baseElevation: 1400, topElevation: 1560, exposure: "moderate",        windHoldThresholdKmh: 78, type: "detachable",       verifiedAt: V },
  { id: "happo-grat-quad",      mountainId: "happo-one", name: "Grat Quad",          nameJa: "グラートクワッド",     baseElevation: 1560, topElevation: 1680, exposure: "exposed",         windHoldThresholdKmh: 68, type: "detachable",       verifiedAt: V },
  { id: "happo-riesen-quad",    mountainId: "happo-one", name: "Happo Riesen Quad",  nameJa: "白馬リーゼンクワッド", baseElevation: 850,  topElevation: 1250, exposure: "moderate",        windHoldThresholdKmh: 78, type: "detachable",       verifiedAt: V },
  { id: "happo-kurobishi-quad", mountainId: "happo-one", name: "Kurobishi Quad",     nameJa: "黒菱クワッド",         baseElevation: 1550, topElevation: 1831, exposure: "highly_exposed", windHoldThresholdKmh: 62, type: "detachable",       verifiedAt: V },

  // ─── HAKUBA GORYU · Telecabine gondola to Alps Daira ~1520m ───
  { id: "goryu-telecabine",     mountainId: "hakuba-goryu", name: "Goryu Telecabine (Escal 8)", nameJa: "ゴンドラ テレキャビン", baseElevation: 820, topElevation: 1520, exposure: "moderate", windHoldThresholdKmh: 85, type: "gondola",    verifiedAt: V },
  { id: "goryu-alps1-pair",     mountainId: "hakuba-goryu", name: "Alps No.1 Pair",             nameJa: "アルプス第1ペア",       baseElevation: 1520, topElevation: 1676, exposure: "exposed",  windHoldThresholdKmh: 68, type: "fixed_grip_chair", verifiedAt: V },

  // ─── HAKUBA 47 · Line 8 express gondola, lift-linked with Goryu ───
  { id: "hakuba47-gondola",     mountainId: "hakuba-47", name: "Hakuba 47 Express Gondola (Line 8)", nameJa: "ゴンドラ ライン8", baseElevation: 900, topElevation: 1350, exposure: "sheltered", windHoldThresholdKmh: 85, type: "gondola", verifiedAt: V },
  { id: "hakuba47-line1-quad",  mountainId: "hakuba-47", name: "Line 1 Quad",                       nameJa: "ライン1クワッド",  baseElevation: 1350, topElevation: 1614, exposure: "exposed",   windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },

  // ─── HAKUBA IWATAKE · Noah gondola to the rounded 1289m summit ───
  { id: "iwatake-noah-gondola", mountainId: "hakuba-iwatake", name: "Gondola Noah", nameJa: "ゴンドラ ノア",   baseElevation: 750,  topElevation: 1289, exposure: "moderate",  windHoldThresholdKmh: 82, type: "gondola",          verifiedAt: V },
  { id: "iwatake-5sen-pair",    mountainId: "hakuba-iwatake", name: "5sen Pair",    nameJa: "第5ペアリフト", baseElevation: 1150, topElevation: 1289, exposure: "exposed",   windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── TSUGAIKE KOGEN · Eve gondola + Tsugaike ropeway to Tsuga Pond ~1900m ───
  { id: "tsugaike-eve-gondola", mountainId: "tsugaike-kogen", name: "Eve Gondola",       nameJa: "イブ ゴンドラ",     baseElevation: 800,  topElevation: 1250, exposure: "sheltered",       windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "tsugaike-ropeway",     mountainId: "tsugaike-kogen", name: "Tsugaike Ropeway",  nameJa: "つがいけロープウェイ", baseElevation: 1250, topElevation: 1560, exposure: "exposed",     windHoldThresholdKmh: 70, type: "gondola",          verifiedAt: V },
  { id: "tsugaike-hannoki-quad", mountainId: "tsugaike-kogen", name: "Han-no-ki No.1 High-Speed Quad", nameJa: "鐘の鳴る丘 ハンノキ第1高速", baseElevation: 1120, topElevation: 1500, exposure: "moderate", windHoldThresholdKmh: 78, type: "detachable", verifiedAt: V },

  // ─── HAKUBA NORIKURA ONSEN · quiet Otari, ticket-linked to Cortina ───
  { id: "norikura-gondola",     mountainId: "hakuba-norikura", name: "Norikura Gondola (Ai)", nameJa: "白馬乗鞍ゴンドラ", baseElevation: 800, topElevation: 1250, exposure: "sheltered", windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "norikura-alps11-pair", mountainId: "hakuba-norikura", name: "Alps No.11 Pair",       nameJa: "アルプス11号ペア", baseElevation: 1250, topElevation: 1598, exposure: "exposed",  windHoldThresholdKmh: 68, type: "fixed_grip_chair", verifiedAt: V },

  // ─── HAKUBA CORTINA · powder magnet, deep-snow ridge chairs ───
  { id: "cortina-itten-quad",   mountainId: "hakuba-cortina", name: "Cortina No.1 Quad", nameJa: "コルチナ第1クワッド", baseElevation: 830, topElevation: 1100, exposure: "sheltered", windHoldThresholdKmh: 82, type: "fixed_grip_chair", verifiedAt: V },
  { id: "cortina-itten-pair",   mountainId: "hakuba-cortina", name: "Cortina No.3 Pair", nameJa: "コルチナ第3ペア",     baseElevation: 1100, topElevation: 1402, exposure: "exposed",   windHoldThresholdKmh: 68, type: "fixed_grip_chair", verifiedAt: V },

  // ─── HAKUBA SANOSAKA · southern gateway by Lake Aoki, top ~1010m ───
  { id: "sanosaka-1st-pair",    mountainId: "hakuba-sanosaka", name: "No.1 Pair",  nameJa: "第1ペアリフト", baseElevation: 740,  topElevation: 1010, exposure: "moderate", windHoldThresholdKmh: 78, type: "fixed_grip_chair", verifiedAt: V },

  // ─── KASHIMAYARI (SUN ALPINA) · family resort in Omachi ───
  { id: "kashimayari-central-quad", mountainId: "kashimayari", name: "Central Quad", nameJa: "セントラルクワッド", baseElevation: 850, topElevation: 1350, exposure: "moderate", windHoldThresholdKmh: 78, type: "fixed_grip_chair", verifiedAt: V },

  // ─── JIIGATAKE · gentle south-end learner hill, top ~1205m ───
  { id: "jiigatake-1st-pair",   mountainId: "jiigatake", name: "No.1 Pair", nameJa: "第1ペアリフト", baseElevation: 850, topElevation: 1205, exposure: "moderate", windHoldThresholdKmh: 78, type: "fixed_grip_chair", verifiedAt: V },
];
