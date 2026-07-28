import type { LiftSeed } from "../lifts";

/**
 * YUZAWA (JP) - six Niigata snow-country resorts ~70min from Tokyo. We
 * model each resort's main gondola/ropeway, the highest exposed chairs
 * (Kagura's summit romance lift, Naeba's Takenoko chairs) and the
 * Dragondola linking Kagura and Naeba. Names + types from official
 * resort maps and skiresort.info; base/top from published lift and
 * summit elevations.
 */

const V = "2026-07-27";

export const YUZAWA: LiftSeed[] = [
  // ─── GALA YUZAWA · Shinkansen straight into the gondola base, top ~1181m ───
  { id: "gala-gondola",         mountainId: "gala-yuzawa", name: "GALA Gondola",     nameJa: "ガーラゴンドラ",       baseElevation: 358,  topElevation: 800,  exposure: "sheltered", windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "gala-cheick-quad",     mountainId: "gala-yuzawa", name: "Cheick Express",   nameJa: "チェアエクスプレス",   baseElevation: 800,  topElevation: 1181, exposure: "exposed",   windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },

  // ─── YUZAWA KOGEN · ropeway off the onsen street, gentle high bowl ~1000m ───
  { id: "yuzawa-kogen-ropeway", mountainId: "yuzawa-kogen", name: "Yuzawa Kogen Ropeway", nameJa: "湯沢高原ロープウェイ", baseElevation: 370,  topElevation: 1000, exposure: "moderate", windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "yuzawa-kogen-diligence", mountainId: "yuzawa-kogen", name: "Diligence Gondola",  nameJa: "ダイリジェンスゴンドラ", baseElevation: 1000, topElevation: 1000, exposure: "exposed",  windHoldThresholdKmh: 72, type: "gondola",          verifiedAt: V },

  // ─── ISHIUCHI MARUYAMA · broad historic hill, Sunrise Express gondola ───
  { id: "ishiuchi-sunrise",     mountainId: "ishiuchi-maruyama", name: "Sunrise Express Gondola", nameJa: "サンライズエクスプレス", baseElevation: 255, topElevation: 730,  exposure: "sheltered", windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "ishiuchi-sancho-quad", mountainId: "ishiuchi-maruyama", name: "Sancho High-Speed Lift",  nameJa: "山頂高速リフト",         baseElevation: 730, topElevation: 920,  exposure: "exposed",   windHoldThresholdKmh: 70, type: "detachable",       verifiedAt: V },

  // ─── IWAPPARA · wide open slopes on Mt Iiji, top ~985m ───
  { id: "iwappara-gondola",     mountainId: "iwappara", name: "Iwappara Gondola", nameJa: "岩原ゴンドラ",     baseElevation: 380, topElevation: 985,  exposure: "moderate", windHoldThresholdKmh: 82, type: "gondola",          verifiedAt: V },
  { id: "iwappara-8th-quad",    mountainId: "iwappara", name: "No.8 Quad",        nameJa: "第8クワッド",     baseElevation: 700, topElevation: 985,  exposure: "exposed",  windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // ─── KAGURA · highest terrain & longest season, three linked zones ───
  { id: "kagura-mitsumata-ropeway", mountainId: "kagura", name: "Mitsumata Ropeway",   nameJa: "みつまたロープウェー",   baseElevation: 655,  topElevation: 1020, exposure: "moderate",        windHoldThresholdKmh: 78, type: "gondola",          verifiedAt: V },
  { id: "kagura-gondola",           mountainId: "kagura", name: "Kagura Gondola",      nameJa: "かぐらゴンドラ",         baseElevation: 1020, topElevation: 1530, exposure: "exposed",         windHoldThresholdKmh: 78, type: "gondola",          verifiedAt: V },
  { id: "kagura-5-romance",         mountainId: "kagura", name: "Kagura No.5 Romance Lift", nameJa: "かぐら第5ロマンスリフト", baseElevation: 1530, topElevation: 1845, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "kagura-tashiro-ropeway",   mountainId: "kagura", name: "Tashiro Ropeway",     nameJa: "田代ロープウェー",       baseElevation: 640,  topElevation: 1413, exposure: "exposed",         windHoldThresholdKmh: 75, type: "gondola",          verifiedAt: V },

  // ─── NAEBA · big classic resort beneath Mt Takenoko, top ~1789m ───
  { id: "naeba-prince-gondola1",    mountainId: "naeba", name: "Prince No.1 Gondola", nameJa: "プリンス第1ゴンドラ",   baseElevation: 900,  topElevation: 1310, exposure: "moderate",        windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "naeba-dragondola",         mountainId: "naeba", name: "Dragondola",          nameJa: "田代ドラゴンドラ",       baseElevation: 1185, topElevation: 1346, exposure: "exposed",         windHoldThresholdKmh: 75, type: "gondola",          verifiedAt: V },
  { id: "naeba-takenokodaira1",     mountainId: "naeba", name: "Takenokodaira No.1 Lift", nameJa: "筍平第1リフト",       baseElevation: 1310, topElevation: 1550, exposure: "exposed",         windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "naeba-takenokoyama-pair",  mountainId: "naeba", name: "Takenokoyama Pair Lift",  nameJa: "筍山ペアリフト",       baseElevation: 1550, topElevation: 1789, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
];
