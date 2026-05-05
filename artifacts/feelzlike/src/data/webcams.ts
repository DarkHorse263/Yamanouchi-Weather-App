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
  "yakebitaiyama": [
    {
      id: "yakebi-base",
      mountainId: "yakebitaiyama",
      name: "Yakebitaiyama base · Prince Hotel",
      nameJa: "焼額山 ベース · プリンスホテル前",
      description: "View across the lower slopes from the Prince Hotel base lodge.",
      descriptionJa: "プリンスホテル前から下部ゲレンデを望む",
      embedType: "external",
      pageUrl: "https://prince.jp/ski/shiga/livecamera/",
      vantage: "base",
      elevation: 1500,
      source: "Prince Hotels & Resorts",
      verifiedAt: VERIFIED,
    },
    {
      id: "yakebi-summit",
      mountainId: "yakebitaiyama",
      name: "Yakebitaiyama summit",
      nameJa: "焼額山 山頂",
      description: "1998 Olympic GS course start — 2,009m peak.",
      descriptionJa: "1998年五輪GS発走点 · 標高2,009m",
      embedType: "external",
      pageUrl: "https://prince.jp/ski/shiga/livecamera/",
      vantage: "summit",
      elevation: 2009,
      source: "Prince Hotels & Resorts",
      verifiedAt: VERIFIED,
    },
  ],
  "okushiga-kogen": [
    {
      id: "okushiga-1",
      mountainId: "okushiga-kogen",
      name: "Okushiga Kogen base",
      nameJa: "奥志賀高原 ベース",
      description: "Shiga's quietest, longest groomers.",
      descriptionJa: "志賀最奥のロングクルーザー",
      embedType: "external",
      pageUrl: "https://www.okushiga.jp/livecam.html",
      vantage: "base",
      elevation: 1530,
      source: "Okushiga Kogen Resort",
      verifiedAt: VERIFIED,
    },
  ],
  "ichinose": [
    {
      id: "ichinose-family",
      mountainId: "ichinose",
      name: "Ichinose Family base",
      nameJa: "一の瀬ファミリー ベース",
      description: "Central Shiga gateway — easiest access to the lift network.",
      descriptionJa: "志賀中心部 · リフトネット最大の起点",
      embedType: "external",
      pageUrl: "https://www.shigakogen.gr.jp/english/livecamera/",
      vantage: "base",
      elevation: 1600,
      source: "Shiga Kogen Tourism Association",
      verifiedAt: VERIFIED,
    },
  ],
  "yokoteyama-shibutoge": [
    {
      id: "shibutoge",
      mountainId: "yokoteyama-shibutoge",
      name: "Shibutoge Pass · Japan's highest lift-served cam",
      nameJa: "渋峠 · 日本最高所索道のライブカメラ",
      description: "2,307m — long-season Kumanoyu side.",
      descriptionJa: "標高2,307m · ロングシーズンの熊の湯側",
      embedType: "external",
      pageUrl: "https://yokoteyama-shibutoge.com/livecam/",
      vantage: "summit",
      elevation: 2307,
      source: "Yokoteyama / Shibutoge Resort",
      verifiedAt: VERIFIED,
    },
  ],
  "sunvalley-giant": [
    {
      id: "sunvalley-giant-base",
      mountainId: "sunvalley-giant",
      name: "Sun Valley / Giant base",
      nameJa: "サンバレー・ジャイアント ベース",
      description: "Hasuike-side gateway, beginner & family terrain.",
      descriptionJa: "蓮池側のゲートウェイ拠点",
      embedType: "external",
      pageUrl: "https://www.shigakogen.gr.jp/english/livecamera/",
      vantage: "base",
      elevation: 1500,
      source: "Shiga Kogen Tourism Association",
      verifiedAt: VERIFIED,
    },
  ],
  "ryuoo": [
    {
      id: "ryuoo-sora",
      mountainId: "ryuoo",
      name: "Ryuoo SORA terrace · sea of clouds",
      nameJa: "竜王 SORAテラス · 雲海",
      description: "Iconic 1,770m gondola summit terrace.",
      descriptionJa: "標高1,770m ゴンドラ山頂テラス",
      embedType: "external",
      pageUrl: "https://www.ryuoo.com/en/winter/livecamera/",
      vantage: "summit",
      elevation: 1770,
      source: "Ryuoo Ski Park",
      verifiedAt: VERIFIED,
    },
    {
      id: "ryuoo-base",
      mountainId: "ryuoo",
      name: "Ryuoo base · gondola plaza",
      nameJa: "竜王 ベース · ゴンドラ乗り場",
      embedType: "external",
      pageUrl: "https://www.ryuoo.com/en/winter/livecamera/",
      vantage: "base",
      elevation: 850,
      source: "Ryuoo Ski Park",
      verifiedAt: VERIFIED,
    },
  ],
  "kita-shiga": [
    {
      id: "kita-shiga-1",
      mountainId: "kita-shiga",
      name: "Kita-Shiga Kogen · X-Jam Takaifuji",
      nameJa: "北志賀高原 · X-JAM高井富士",
      description: "Family terrain + park, short hop from Yudanaka.",
      descriptionJa: "ファミリー向けゲレンデ + パーク",
      embedType: "external",
      pageUrl: "https://kitashiga.net/livecam/",
      vantage: "base",
      elevation: 1100,
      source: "Kita-Shiga Kogen Tourism",
      verifiedAt: VERIFIED,
    },
  ],
  "yomase-onsen": [
    {
      id: "yomase",
      mountainId: "yomase-onsen",
      name: "Yomase Onsen · river-side base",
      nameJa: "夜間瀬温泉スキー場 · 川沿いベース",
      description: "Locals' mountain · night skiing & onsen finish.",
      descriptionJa: "地元のスキー場 · ナイター + 温泉",
      embedType: "external",
      pageUrl: "https://www.yomase.jp/livecam/",
      vantage: "base",
      elevation: 600,
      source: "Yomase Onsen Resort",
      verifiedAt: VERIFIED,
    },
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
