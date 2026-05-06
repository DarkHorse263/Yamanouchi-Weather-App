/**
 * Curated mountain webcam metadata for Japan resorts (Yamanouchi + Iiyama
 * regions). The Snowy Mountains side is already covered by the API-driven
 * grid in `regions/snowy-mountains/pages/LocationDetail.tsx`, sourced from
 * the live BOM/resort scrape.
 *
 * EMBED HONESTY: Most Japanese resort webcams are protected by hotlink
 * referrers or CORS, which means a naive `<img src=...>` will be blocked
 * by the resort's CDN. The component (`MountainWebcams.tsx`) handles all
 * three `embedType` values and degrades gracefully:
 *
 *   - "image":    Try `<img>` first; on error fall back to the external card
 *   - "iframe":   Sandboxed `<iframe>`; if blocked, the iframe simply renders
 *                 empty — we still surface the "Open live cam" CTA underneath
 *   - "external": Render a branded hero card immediately with prominent
 *                 "Open live cam" CTA — no broken images, no waiting
 *
 * Default to "external" unless a URL has been verified to embed cleanly.
 * `verifiedAt` is the date a human last opened the source page and confirmed
 * the cam is live; surfaced in the UI caption for transparency.
 */

export type WebcamEmbedType = "image" | "iframe" | "external";
export type WebcamVantage = "base" | "mid" | "summit" | "village";

export interface MountainWebcam {
  id: string;
  /** mountain.id from the region config */
  mountainId: string;
  name: string;
  nameJa?: string;
  description?: string;
  descriptionJa?: string;
  embedType: WebcamEmbedType;
  /** Required for "image" + "iframe". Not used for "external". */
  embedUrl?: string;
  /** Always present — link to the resort's official cam page. */
  pageUrl: string;
  vantage?: WebcamVantage;
  /** Metres above sea level if the source publishes it. */
  elevation?: number;
  /** Human-readable source attribution shown in the caption. */
  source: string;
  /** ISO date (yyyy-mm-dd) when a human last verified the source page. */
  verifiedAt: string;
}

const VERIFIED = "2026-05-05";

/**
 * Yamanouchi region — Shiga Kogen sub-resorts + Ryuoo + Kita-Shiga + Yomase.
 * Source URLs come from each operator's official cam index page.
 */
const YAMANOUCHI: Record<string, MountainWebcam[]> = {
  // ─── Shiga Kogen central area ────────────────────────────
  // The central sub-resorts (Sun Valley / Maruike / Hasuike / Giant /
  // Hoppo Bunadaira / Tateyama / Takamagahara / Ichinose / Tannenomori)
  // share the Shiga Kogen Tourism Association's central livecam page —
  // we link each to it so users always get a verified live source.
  "shiga-sun-valley": [
    { id: "central-sun-valley", mountainId: "shiga-sun-valley", name: "Sun Valley base",            nameJa: "サンバレー ベース",            description: "Entry-level base on the Shiga loop road.",            descriptionJa: "志賀の入口の初心者向けベース",            embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/livecamera/", vantage: "base",   elevation: 1500, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-hasuike": [
    { id: "central-hasuike",    mountainId: "shiga-hasuike",    name: "Hasuike base · Shiga Kogen", nameJa: "蓮池 · 志賀高原センター",        description: "Pondside gateway to the eastern Shiga lift network.", descriptionJa: "蓮池のほとり · 東部リフト網の起点",          embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/livecamera/", vantage: "base",   elevation: 1550, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-higashidateyama": [
    { id: "central-higashidate", mountainId: "shiga-higashidateyama", name: "Higashidateyama summit", nameJa: "東館山 山頂",                  description: "Central Shiga summit · gondola-served alpine bowls.",  descriptionJa: "中央の山頂 · ゴンドラの高所バーン",          embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/livecamera/", vantage: "summit", elevation: 1994, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-terakoya": [
    { id: "central-terakoya",   mountainId: "shiga-terakoya",   name: "Terakoya · Shiga's highest central", nameJa: "寺子屋 · 中央エリア最高所", description: "Steep mogul faces and powder pockets.",                descriptionJa: "急なコブ斜面とパウダー",                     embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/livecamera/", vantage: "summit", elevation: 2125, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-ichinose-family": [
    { id: "central-ichinose-family", mountainId: "shiga-ichinose-family", name: "Ichinose Family base", nameJa: "一の瀬ファミリー ベース",  description: "Central Shiga gateway — easiest access to the lift network.", descriptionJa: "志賀中心部 · リフトネット最大の起点",       embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/livecamera/", vantage: "base",   elevation: 1850, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],

  // ─── East Shiga — Prince Hotels operates Yakebitaiyama livecams ───
  "shiga-yakebitaiyama": [
    { id: "yakebi-base",        mountainId: "shiga-yakebitaiyama", name: "Yakebitaiyama base · Prince Hotel", nameJa: "焼額山 ベース · プリンスホテル前", description: "View across the lower slopes from the Prince Hotel base lodge.", descriptionJa: "プリンスホテル前から下部ゲレンデを望む", embedType: "external", pageUrl: "https://prince.jp/ski/shiga/livecamera/", vantage: "base",   elevation: 1500, source: "Prince Hotels & Resorts", verifiedAt: VERIFIED },
    { id: "yakebi-summit",      mountainId: "shiga-yakebitaiyama", name: "Yakebitaiyama summit",              nameJa: "焼額山 山頂",                       description: "1998 Olympic GS course start — 2,009m peak.",                  descriptionJa: "1998年五輪GS発走点 · 標高2,009m",         embedType: "external", pageUrl: "https://prince.jp/ski/shiga/livecamera/", vantage: "summit", elevation: 2009, source: "Prince Hotels & Resorts", verifiedAt: VERIFIED },
  ],
  "shiga-okushiga-kogen": [
    { id: "okushiga-1",         mountainId: "shiga-okushiga-kogen", name: "Okushiga Kogen base", nameJa: "奥志賀高原 ベース", description: "Shiga's quietest, longest groomers.", descriptionJa: "志賀最奥のロングクルーザー", embedType: "external", pageUrl: "https://www.okushiga.jp/livecam.html", vantage: "base", elevation: 1960, source: "Okushiga Kogen Resort", verifiedAt: VERIFIED },
  ],

  // ─── Highest lift-served zone — operated by Yokoteyama/Shibutoge resort ───
  "shiga-kumanoyu": [
    { id: "kumanoyu-base",      mountainId: "shiga-kumanoyu",   name: "Kumanoyu base", nameJa: "熊の湯 ベース", description: "North-facing high alpine · long-season natural snow.", descriptionJa: "北向き高所 · 自然雪のロングシーズン", embedType: "external", pageUrl: "https://www.kumanoyu.com/", vantage: "base", elevation: 2000, source: "Kumanoyu Ski Area", verifiedAt: VERIFIED },
  ],
  "shiga-yokoteyama": [
    { id: "yokoteyama-summit",  mountainId: "shiga-yokoteyama", name: "Yokoteyama summit · 2,305m", nameJa: "横手山 山頂 · 標高2,305m", description: "Japan's highest lift-served summit · alpine views to the JP Alps.", descriptionJa: "日本最高所の索道山頂 · 日本アルプスを望む", embedType: "external", pageUrl: "https://yokoteyama-shibutoge.com/livecam/", vantage: "summit", elevation: 2305, source: "Yokoteyama / Shibutoge Resort", verifiedAt: VERIFIED },
  ],
  "shiga-shibutoge": [
    { id: "shibutoge-pass",     mountainId: "shiga-shibutoge",  name: "Shibutoge Pass · Honshu's highest road",                              nameJa: "渋峠 · 本州最高所の道路",          description: "2,172m — sea-of-clouds backdrop, road closes Nov–Apr.",                       descriptionJa: "標高2,172m · 雲海と冬季閉鎖の峠",            embedType: "external", pageUrl: "https://yokoteyama-shibutoge.com/livecam/", vantage: "summit", elevation: 2172, source: "Yokoteyama / Shibutoge Resort", verifiedAt: VERIFIED },
  ],

  // ─── Kita-Shiga (4 standalone resorts, each runs its own cam page) ───
  "ryuoo": [
    { id: "ryuoo-sora",         mountainId: "ryuoo",            name: "Ryuoo SORA terrace · sea of clouds", nameJa: "竜王 SORAテラス · 雲海",        description: "Iconic 1,770m gondola summit terrace.",                                       descriptionJa: "標高1,770m ゴンドラ山頂テラス",            embedType: "external", pageUrl: "https://www.ryuoo.com/en/winter/livecamera/", vantage: "summit", elevation: 1770, source: "Ryuoo Ski Park", verifiedAt: VERIFIED },
    { id: "ryuoo-base",         mountainId: "ryuoo",            name: "Ryuoo base · gondola plaza",         nameJa: "竜王 ベース · ゴンドラ乗り場",  description: "Base lodge gondola plaza.",                                                   descriptionJa: "ゴンドラ乗り場のベース",                    embedType: "external", pageUrl: "https://www.ryuoo.com/en/winter/livecamera/", vantage: "base",   elevation: 850,  source: "Ryuoo Ski Park", verifiedAt: VERIFIED },
  ],
  "xjam-takaifuji": [
    { id: "xjam-takaifuji-base", mountainId: "xjam-takaifuji",  name: "X-Jam Takaifuji · park base",        nameJa: "X-JAM高井富士 · パークベース", description: "Park-focused base · biggest jib & jump features in north Nagano.",            descriptionJa: "パーク特化のベース · 北信最大のアイテム",   embedType: "external", pageUrl: "https://www.kitashiga.co.jp/livecam/",       vantage: "base",   elevation: 1100, source: "Kita-Shiga Kogen Tourism", verifiedAt: VERIFIED },
  ],
  "yomase-onsen": [
    { id: "yomase",             mountainId: "yomase-onsen",     name: "Yomase Onsen · river-side base",     nameJa: "夜間瀬温泉スキー場 · 川沿いベース", description: "Locals' mountain · night skiing & onsen finish.",                          descriptionJa: "地元のスキー場 · ナイター + 温泉",          embedType: "external", pageUrl: "https://www.yomase.jp/livecam/",             vantage: "base",   elevation: 600,  source: "Yomase Onsen Resort", verifiedAt: VERIFIED },
  ],
  "kita-shiga-komaruyama": [
    { id: "komaruyama-base",    mountainId: "kita-shiga-komaruyama", name: "Komaruyama · base lifts",       nameJa: "小丸山 · ベースリフト",         description: "Smallest Kita-Shiga resort · gentle beginner laps under the lifts.",          descriptionJa: "北志賀最小のスキー場 · 緩斜面の初心者向け", embedType: "external", pageUrl: "https://www.kitashiga.co.jp/livecam/",       vantage: "base",   elevation: 950,  source: "Kita-Shiga Kogen Tourism", verifiedAt: VERIFIED },
  ],
};

/**
 * Iiyama region — Madarao, Tangram, Togari Onsen, Nozawa Onsen.
 */
const IIYAMA: Record<string, MountainWebcam[]> = {
  "madarao": [
    {
      id: "madarao-base",
      mountainId: "madarao",
      name: "Madarao Kogen · base lodge",
      nameJa: "斑尾高原 · ベースロッジ",
      description: "Tree-run paradise · linked with Tangram.",
      descriptionJa: "ツリーランの聖地 · タングラムと連結",
      embedType: "external",
      pageUrl: "https://www.madarao.jp/ski/en/livecamera/",
      vantage: "base",
      elevation: 1000,
      source: "Madarao Kogen Resort",
      verifiedAt: VERIFIED,
    },
    {
      id: "madarao-summit",
      mountainId: "madarao",
      name: "Madarao summit",
      nameJa: "斑尾山頂",
      embedType: "external",
      pageUrl: "https://www.madarao.jp/ski/en/livecamera/",
      vantage: "summit",
      elevation: 1382,
      source: "Madarao Kogen Resort",
      verifiedAt: VERIFIED,
    },
  ],
  "tangram": [
    {
      id: "tangram-base",
      mountainId: "tangram",
      name: "Tangram Ski Circus · base",
      nameJa: "タングラムスキーサーカス · ベース",
      description: "Family-friendly · interconnected with Madarao.",
      descriptionJa: "ファミリー向け · 斑尾と接続",
      embedType: "external",
      pageUrl: "https://www.tangram.jp/winter/livecamera/",
      vantage: "base",
      elevation: 950,
      source: "Hotel Tangram Resort",
      verifiedAt: VERIFIED,
    },
  ],
  "togari": [
    {
      id: "togari-base",
      mountainId: "togari",
      name: "Togari Onsen · base",
      nameJa: "戸狩温泉 · ベース",
      description: "Quieter local mountain · long groomers.",
      descriptionJa: "地元密着の静かな山 · ロングコース",
      embedType: "external",
      pageUrl: "https://www.togari.jp/livecamera/",
      vantage: "base",
      elevation: 600,
      source: "Togari Onsen Ski Resort",
      verifiedAt: VERIFIED,
    },
  ],
  "nozawa-onsen": [
    {
      id: "nozawa-uenotaira",
      mountainId: "nozawa-onsen",
      name: "Nozawa Onsen · Uenotaira gondola top",
      nameJa: "野沢温泉 · 上ノ平ゴンドラ山頂",
      description: "Top-of-mountain view across the Nagano basin.",
      descriptionJa: "山頂から長野盆地を一望",
      embedType: "external",
      pageUrl: "https://nozawaski.com/en/live-camera/",
      vantage: "summit",
      elevation: 1650,
      source: "Nozawa Onsen Snow Resort",
      verifiedAt: VERIFIED,
    },
    {
      id: "nozawa-village",
      mountainId: "nozawa-onsen",
      name: "Nozawa Onsen village square",
      nameJa: "野沢温泉村 ・ 中心街",
      description: "Iconic ski-in onsen village.",
      descriptionJa: "象徴的なスキーイン温泉郷",
      embedType: "external",
      pageUrl: "https://nozawaski.com/en/live-camera/",
      vantage: "village",
      elevation: 590,
      source: "Nozawa Onsen Snow Resort",
      verifiedAt: VERIFIED,
    },
  ],
};

/**
 * Snowy Mountains has an existing API-driven webcam grid wired into
 * `LocationDetail.tsx` (sourced from the BOM/resort scrape). We don't
 * duplicate that here — the curated dataset only fills gaps where the
 * API doesn't reach (i.e. the JP region).
 */
const SNOWY_MOUNTAINS: Record<string, MountainWebcam[]> = {};

export const MOUNTAIN_WEBCAMS: Record<string, MountainWebcam[]> = {
  ...YAMANOUCHI,
  ...IIYAMA,
  ...SNOWY_MOUNTAINS,
};

export function getMountainWebcams(mountainId: string): MountainWebcam[] {
  return MOUNTAIN_WEBCAMS[mountainId] ?? [];
}
