/**
 * Curated lift seed data for the AU + JP mountains we cover. Used by
 * `windHoldPrediction.ts` to predict which lifts are likely to spin given
 * the next-24h wind forecast.
 *
 * No competitor surfaces this — it's a genuinely original signal that
 * matters massively in the Snowy Mountains (Perisher Mt P + V8 hold
 * constantly above 60km/h gusts) and at the highest Japanese summits
 * (Yokoteyama / Yakebitaiyama gondolas above 2,000m).
 *
 * SOURCING: thresholds are conservative best-estimates compiled from
 * resort lift maps + publicly visible historical lift-status pages.
 * `verifiedAt` is the date a human last validated the entry; surfaced
 * in the UI for transparency.
 */

export type LiftType =
  | "gondola"
  | "detachable"
  | "fixed_grip_chair"
  | "t-bar"
  | "rope_tow";

export type LiftExposure =
  | "sheltered"
  | "moderate"
  | "exposed"
  | "highly_exposed";

export interface LiftSeed {
  id: string;
  /** mountain.id from the region config */
  mountainId: string;
  name: string;
  nameJa?: string;
  baseElevation: number;
  topElevation: number;
  exposure: LiftExposure;
  /**
   * Approximate operating threshold (km/h sustained or gusts at top).
   * Above this and the lift typically holds.
   */
  windHoldThresholdKmh: number;
  type: LiftType;
  /** ISO date when this entry was last verified. */
  verifiedAt: string;
}

const V = "2026-05-05";

/**
 * SNOWY MOUNTAINS (AU) — Thredbo, Perisher, Charlotte Pass, Selwyn.
 * Thresholds compiled from public lift-status histories + resort maps.
 */
const SNOWY_MOUNTAINS: LiftSeed[] = [
  // THREDBO
  { id: "kosciuszko-express", mountainId: "thredbo", name: "Kosciuszko Express", baseElevation: 1365, topElevation: 1928, exposure: "exposed", windHoldThresholdKmh: 70, type: "detachable", verifiedAt: V },
  { id: "merritts-gondola", mountainId: "thredbo", name: "Merritts Gondola", baseElevation: 1365, topElevation: 1670, exposure: "sheltered", windHoldThresholdKmh: 90, type: "gondola", verifiedAt: V },
  { id: "snowgums-chair", mountainId: "thredbo", name: "Snowgums Chair", baseElevation: 1670, topElevation: 1825, exposure: "sheltered", windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "cruiser", mountainId: "thredbo", name: "Cruiser", baseElevation: 1670, topElevation: 1995, exposure: "exposed", windHoldThresholdKmh: 70, type: "detachable", verifiedAt: V },
  { id: "karels-tbar", mountainId: "thredbo", name: "Karels T-Bar", baseElevation: 1880, topElevation: 2030, exposure: "highly_exposed", windHoldThresholdKmh: 85, type: "t-bar", verifiedAt: V },
  { id: "antons-tbar", mountainId: "thredbo", name: "Antons T-Bar", baseElevation: 1670, topElevation: 1855, exposure: "exposed", windHoldThresholdKmh: 85, type: "t-bar", verifiedAt: V },
  { id: "easy-does-it", mountainId: "thredbo", name: "Easy Does It", baseElevation: 1670, topElevation: 1700, exposure: "sheltered", windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "friday-flat", mountainId: "thredbo", name: "Friday Flat", baseElevation: 1365, topElevation: 1450, exposure: "sheltered", windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },

  // PERISHER
  { id: "front-valley-quad", mountainId: "perisher", name: "Front Valley Quad", baseElevation: 1720, topElevation: 1840, exposure: "exposed", windHoldThresholdKmh: 70, type: "detachable", verifiedAt: V },
  { id: "v8", mountainId: "perisher", name: "V8 Express", baseElevation: 1720, topElevation: 1900, exposure: "exposed", windHoldThresholdKmh: 75, type: "detachable", verifiedAt: V },
  { id: "mt-perisher-double", mountainId: "perisher", name: "Mt Perisher Double", baseElevation: 1740, topElevation: 2034, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "mt-perisher-triple", mountainId: "perisher", name: "Mt Perisher Triple", baseElevation: 1740, topElevation: 2034, exposure: "highly_exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "blue-cow-quad", mountainId: "perisher", name: "Blue Cow Quad", baseElevation: 1640, topElevation: 1990, exposure: "exposed", windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "smiggin-holes-quad", mountainId: "perisher", name: "Smiggin Holes Quad", baseElevation: 1680, topElevation: 1840, exposure: "moderate", windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "olympic-tbar", mountainId: "perisher", name: "Olympic T-Bar", baseElevation: 1740, topElevation: 1900, exposure: "highly_exposed", windHoldThresholdKmh: 80, type: "t-bar", verifiedAt: V },
  { id: "eyre-tbar", mountainId: "perisher", name: "Eyre T-Bar", baseElevation: 1740, topElevation: 1900, exposure: "highly_exposed", windHoldThresholdKmh: 80, type: "t-bar", verifiedAt: V },

  // CHARLOTTE PASS
  { id: "kosciuszko-triple", mountainId: "charlottes-pass", name: "Kosciuszko Triple", baseElevation: 1760, topElevation: 1837, exposure: "exposed", windHoldThresholdKmh: 65, type: "fixed_grip_chair", verifiedAt: V },
  { id: "stillwell-quad", mountainId: "charlottes-pass", name: "Stillwell Quad", baseElevation: 1760, topElevation: 1820, exposure: "sheltered", windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "pulpit-tbar", mountainId: "charlottes-pass", name: "Pulpit T-Bar", baseElevation: 1760, topElevation: 1840, exposure: "exposed", windHoldThresholdKmh: 80, type: "t-bar", verifiedAt: V },

  // SELWYN
  { id: "selwyn-quad", mountainId: "selwyn", name: "Main Quad", baseElevation: 1492, topElevation: 1614, exposure: "moderate", windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
];

/**
 * YAMANOUCHI (JP) — top gondolas + key chairs at the major sub-resorts.
 * Japan has way more lifts than we model; we focus on the high-altitude
 * gondolas + key chairs that actually hold to wind.
 */
const YAMANOUCHI: LiftSeed[] = [
  // ─── Shiga Kogen central area (Sun Valley / Maruike / Hasuike / Giant) ───
  { id: "sun-valley-pair",       mountainId: "shiga-sun-valley",          name: "Sun Valley Pair",                nameJa: "サンバレーペア",          baseElevation: 1340, topElevation: 1500, exposure: "sheltered",       windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "maruike-pair",          mountainId: "shiga-maruike",             name: "Maruike Pair",                   nameJa: "丸池ペア",                 baseElevation: 1500, topElevation: 1620, exposure: "sheltered",       windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "hasuike-pair",          mountainId: "shiga-hasuike",             name: "Hasuike Pair",                   nameJa: "蓮池ペア",                 baseElevation: 1490, topElevation: 1620, exposure: "sheltered",       windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "giant-pair",            mountainId: "shiga-giant",               name: "Giant Pair",                     nameJa: "ジャイアントペア",         baseElevation: 1500, topElevation: 1700, exposure: "moderate",        windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },

  // ─── Hoppo / Tateyama cluster — gondola access ────────────
  { id: "hoppo-gondola",         mountainId: "shiga-hoppo-bunadaira",     name: "Hoppo Bunadaira Gondola",        nameJa: "発哺ブナ平ゴンドラ",       baseElevation: 1500, topElevation: 1830, exposure: "moderate",        windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "higashidate-gondola",   mountainId: "shiga-higashidateyama",     name: "Higashidateyama Gondola",        nameJa: "東館山ゴンドラ",           baseElevation: 1530, topElevation: 1994, exposure: "exposed",         windHoldThresholdKmh: 80, type: "gondola",          verifiedAt: V },
  { id: "nishidate-pair",        mountainId: "shiga-nishidateyama",       name: "Nishidateyama Pair",             nameJa: "西館山ペア",               baseElevation: 1500, topElevation: 1900, exposure: "moderate",        windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },

  // ─── Terakoya / Takamagahara / Tannenomori ────────────────
  { id: "terakoya-quad",         mountainId: "shiga-terakoya",            name: "Terakoya Quad",                  nameJa: "寺子屋クワッド",           baseElevation: 1900, topElevation: 2125, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "takamagahara-pair",     mountainId: "shiga-takamagahara",        name: "Takamagahara Pair",              nameJa: "高天ヶ原ペア",             baseElevation: 1800, topElevation: 2000, exposure: "exposed",         windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "tannenomori-quad",      mountainId: "shiga-tannenomori-okojo",   name: "Tannenomori Okojo Quad",         nameJa: "タンネの森オコジョクワッド", baseElevation: 1620, topElevation: 1800, exposure: "sheltered",       windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },

  // ─── Ichinose cluster ─────────────────────────────────────
  { id: "ichinose-family-quad",  mountainId: "shiga-ichinose-family",     name: "Ichinose Family Quad",           nameJa: "一の瀬ファミリークワッド",  baseElevation: 1600, topElevation: 1850, exposure: "moderate",        windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "ichinose-diamond-quad", mountainId: "shiga-ichinose-diamond",    name: "Ichinose Diamond Quad",          nameJa: "一の瀬ダイヤモンドクワッド", baseElevation: 1650, topElevation: 1900, exposure: "exposed",         windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "ichinose-yamano-pair",  mountainId: "shiga-ichinose-yamanokami", name: "Yama-no-kami Pair",              nameJa: "山の神ペア",               baseElevation: 1700, topElevation: 1850, exposure: "sheltered",       windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },

  // ─── East Shiga (Yakebitaiyama / Okushiga) ───────────────
  { id: "yakebi-gondola-1",      mountainId: "shiga-yakebitaiyama",       name: "Yakebitaiyama Gondola No.1",     nameJa: "焼額山 第1ゴンドラ",       baseElevation: 1500, topElevation: 2009, exposure: "exposed",         windHoldThresholdKmh: 85, type: "gondola",          verifiedAt: V },
  { id: "yakebi-gondola-2",      mountainId: "shiga-yakebitaiyama",       name: "Yakebitaiyama Gondola No.2",     nameJa: "焼額山 第2ゴンドラ",       baseElevation: 1500, topElevation: 1900, exposure: "moderate",        windHoldThresholdKmh: 90, type: "gondola",          verifiedAt: V },
  { id: "okushiga-gondola",      mountainId: "shiga-okushiga-kogen",      name: "Okushiga Gondola",               nameJa: "奥志賀ゴンドラ",           baseElevation: 1530, topElevation: 1900, exposure: "moderate",        windHoldThresholdKmh: 90, type: "gondola",          verifiedAt: V },

  // ─── Kumanoyu / Yokoteyama / Shibutoge — highest lift-served ───
  { id: "kumanoyu-pair",         mountainId: "shiga-kumanoyu",            name: "Kumanoyu Pair",                  nameJa: "熊の湯ペア",               baseElevation: 1650, topElevation: 2000, exposure: "exposed",         windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "yokoteyama-skyator",    mountainId: "shiga-yokoteyama",          name: "Yokoteyama Skyator",             nameJa: "横手山 スカイレーター",    baseElevation: 2000, topElevation: 2305, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },
  { id: "shibutoge-pair",        mountainId: "shiga-shibutoge",           name: "Shibutoge Pair Lift",            nameJa: "渋峠ペアリフト",           baseElevation: 2050, topElevation: 2172, exposure: "highly_exposed", windHoldThresholdKmh: 60, type: "fixed_grip_chair", verifiedAt: V },

  // ─── Kita-Shiga (4 standalone resorts) ────────────────────
  { id: "ryuoo-gondola",         mountainId: "ryuoo",                     name: "Ryuoo Ropeway (SORA)",           nameJa: "竜王ロープウェイ (SORA)",  baseElevation: 850,  topElevation: 1770, exposure: "exposed",         windHoldThresholdKmh: 75, type: "gondola",          verifiedAt: V },
  { id: "ryuoo-paradise",        mountainId: "ryuoo",                     name: "Paradise Quad",                  nameJa: "パラダイスクワッド",       baseElevation: 1500, topElevation: 1900, exposure: "exposed",         windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },
  { id: "xjam-quad",             mountainId: "xjam-takaifuji",            name: "X-Jam Takaifuji Quad",           nameJa: "X-JAM高井富士クワッド",     baseElevation: 1100, topElevation: 1330, exposure: "moderate",        windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "yomase-pair",           mountainId: "yomase-onsen",              name: "Yomase Onsen Pair",              nameJa: "夜間瀬温泉ペア",           baseElevation: 600,  topElevation: 1240, exposure: "sheltered",       windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
  { id: "komaruyama-pair",       mountainId: "kita-shiga-komaruyama",     name: "Komaruyama Pair",                nameJa: "小丸山ペア",               baseElevation: 950,  topElevation: 1100, exposure: "sheltered",       windHoldThresholdKmh: 85, type: "fixed_grip_chair", verifiedAt: V },
];

/**
 * IIYAMA (JP) — Madarao, Tangram, Togari, Nozawa Onsen.
 */
const IIYAMA: LiftSeed[] = [
  // NOZAWA ONSEN — Hikage gondola is the iconic top-to-bottom lift
  { id: "nozawa-hikage-gondola", mountainId: "nozawa-onsen", name: "Hikage Gondola", nameJa: "日影ゴンドラ", baseElevation: 590, topElevation: 1085, exposure: "sheltered", windHoldThresholdKmh: 90, type: "gondola", verifiedAt: V },
  { id: "nozawa-yamabiko-quad", mountainId: "nozawa-onsen", name: "Yamabiko Quad", nameJa: "やまびこクワッド", baseElevation: 1260, topElevation: 1650, exposure: "exposed", windHoldThresholdKmh: 75, type: "fixed_grip_chair", verifiedAt: V },
  { id: "nozawa-paradise-quad", mountainId: "nozawa-onsen", name: "Paradise Express", nameJa: "パラダイスエクスプレス", baseElevation: 1200, topElevation: 1500, exposure: "moderate", windHoldThresholdKmh: 80, type: "detachable", verifiedAt: V },

  // MADARAO
  { id: "madarao-pair-1", mountainId: "madarao", name: "Madarao Hotel Quad", nameJa: "斑尾ホテルクワッド", baseElevation: 1000, topElevation: 1350, exposure: "moderate", windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },
  { id: "madarao-summit-pair", mountainId: "madarao", name: "Summit Pair", nameJa: "サミットペア", baseElevation: 1200, topElevation: 1382, exposure: "exposed", windHoldThresholdKmh: 70, type: "fixed_grip_chair", verifiedAt: V },

  // TANGRAM
  { id: "tangram-quad", mountainId: "tangram", name: "Tangram Quad", nameJa: "タングラムクワッド", baseElevation: 950, topElevation: 1300, exposure: "moderate", windHoldThresholdKmh: 80, type: "fixed_grip_chair", verifiedAt: V },

  // TOGARI ONSEN
  { id: "togari-pair", mountainId: "togari", name: "Togari Pair", nameJa: "戸狩ペア", baseElevation: 600, topElevation: 1050, exposure: "sheltered", windHoldThresholdKmh: 90, type: "fixed_grip_chair", verifiedAt: V },
];

export const LIFT_SEED: LiftSeed[] = [
  ...SNOWY_MOUNTAINS,
  ...YAMANOUCHI,
  ...IIYAMA,
];

const BY_MOUNTAIN = new Map<string, LiftSeed[]>();
for (const lift of LIFT_SEED) {
  const arr = BY_MOUNTAIN.get(lift.mountainId) ?? [];
  arr.push(lift);
  BY_MOUNTAIN.set(lift.mountainId, arr);
}

export function getLiftsForMountain(mountainId: string): LiftSeed[] {
  return BY_MOUNTAIN.get(mountainId) ?? [];
}
