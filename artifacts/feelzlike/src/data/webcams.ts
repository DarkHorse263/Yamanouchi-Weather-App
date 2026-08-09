/**
 * Curated mountain webcam metadata for Japan resorts (Yamanouchi + Iiyama
 * regions) and all seven New Zealand resorts. The Snowy Mountains side is
 * already covered by the API-driven grid in
 * `regions/snowy-mountains/pages/LocationDetail.tsx`, sourced from the live
 * BOM/resort scrape.
 *
 * EMBED HONESTY: Most Japanese resort webcams are protected by hotlink
 * referrers or CORS, which means a naive `<img src=...>` will be blocked
 * by the resort's CDN. The component (`MountainWebcams.tsx`) handles all
 * three `embedType` values and degrades gracefully:
 *
 *   - "image":    Try `<img>` first; on error fall back to the external card
 *   - "iframe":   Sandboxed `<iframe>`; if blocked, the iframe simply renders
 *                 empty - we still surface the "Open live cam" CTA underneath
 *   - "external": Render a branded hero card immediately with prominent
 *                 "Open live cam" CTA - no broken images, no waiting
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
  /** Always present - link to the resort's official cam page. */
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
 * Yamanouchi region - Shiga Kogen sub-resorts + Ryuoo + Kita-Shiga + Yomase.
 * Source URLs come from each operator's official cam index page.
 */
const YAMANOUCHI: Record<string, MountainWebcam[]> = {
  // ─── Shiga Kogen central area ────────────────────────────
  // The central sub-resorts (Sun Valley / Maruike / Hasuike / Giant /
  // Hoppo Bunadaira / Tateyama / Takamagahara / Ichinose / Tannenomori)
  // share the Shiga Kogen Tourism Association's central livecam page -
  // we link each to it so users always get a verified live source.
  "shiga-sun-valley": [
    { id: "central-sun-valley", mountainId: "shiga-sun-valley", name: "Sun Valley base",            nameJa: "サンバレー ベース",            description: "Entry-level base on the Shiga loop road.",            descriptionJa: "志賀の入口の初心者向けベース",            embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "base",   elevation: 1500, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-hasuike": [
    { id: "central-hasuike",    mountainId: "shiga-hasuike",    name: "Hasuike base · Shiga Kogen", nameJa: "蓮池 · 志賀高原センター",        description: "Pondside gateway to the eastern Shiga lift network.", descriptionJa: "蓮池のほとり · 東部リフト網の起点",          embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "base",   elevation: 1550, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-maruike": [
    { id: "central-maruike",    mountainId: "shiga-maruike",    name: "Maruike base · Shiga Kogen", nameJa: "丸池 · 志賀高原センター",       description: "Wide intermediate carving on the central Shiga loop.",  descriptionJa: "中央エリアの幅広中級バーン",                embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "base",   elevation: 1620, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-giant": [
    { id: "central-giant",      mountainId: "shiga-giant",      name: "Giant slalom course base", nameJa: "ジャイアント大回転コース ベース", description: "Steep central pitches off the loop road.",              descriptionJa: "メインロード沿いの急斜面",                  embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "base",   elevation: 1700, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-hoppo-bunadaira": [
    { id: "central-hoppo",      mountainId: "shiga-hoppo-bunadaira", name: "Hoppo Bunadaira mid-mountain", nameJa: "発哺ブナ平 中腹",         description: "Sunny mid-mountain cruisers above the central road.",   descriptionJa: "中腹の日当たり良好なクルーザー",            embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "mid",    elevation: 1830, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-nishidateyama": [
    { id: "central-nishidate",  mountainId: "shiga-nishidateyama", name: "Nishidateyama north-face", nameJa: "西館山 北向き斜面",            description: "North-facing carving · holds snow latest in the central area.", descriptionJa: "北向きカービング斜面 · 中央エリア最良の雪持ち", embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "mid",    elevation: 1900, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-higashidateyama": [
    { id: "central-higashidate", mountainId: "shiga-higashidateyama", name: "Higashidateyama summit", nameJa: "東館山 山頂",                  description: "Central Shiga summit · gondola-served alpine bowls.",  descriptionJa: "中央の山頂 · ゴンドラの高所バーン",          embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "summit", elevation: 1994, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-terakoya": [
    { id: "central-terakoya",   mountainId: "shiga-terakoya",   name: "Terakoya · Shiga's highest central", nameJa: "寺子屋 · 中央エリア最高所", description: "Steep mogul faces and powder pockets.",                descriptionJa: "急なコブ斜面とパウダー",                     embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "summit", elevation: 2125, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-takamagahara": [
    { id: "central-takamagahara", mountainId: "shiga-takamagahara", name: "Takamagahara plateau", nameJa: "高天ヶ原 プラトー",            description: "Wide intermediate plateau · feeds Terakoya & Ichinose.", descriptionJa: "広い中級プラトー · 寺子屋と一の瀬への接続点", embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "mid",    elevation: 2000, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-tannenomori-okojo": [
    { id: "central-tannenomori", mountainId: "shiga-tannenomori-okojo", name: "Tannenomori Okojo · tree zone", nameJa: "タンネの森オコジョ · 樹林帯", description: "Tree-lined family zone between Takamagahara and Yakebitai.", descriptionJa: "高天ヶ原と焼額の間のツリー系ファミリーゾーン", embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "mid",    elevation: 1800, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-ichinose-family": [
    { id: "central-ichinose-family", mountainId: "shiga-ichinose-family", name: "Ichinose Family base", nameJa: "一の瀬ファミリー ベース",  description: "Central Shiga gateway - easiest access to the lift network.", descriptionJa: "志賀中心部 · リフトネット最大の起点",       embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "base",   elevation: 1850, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-ichinose-diamond": [
    { id: "central-ichinose-diamond", mountainId: "shiga-ichinose-diamond", name: "Ichinose Diamond race course", nameJa: "一の瀬ダイヤモンド レースコース", description: "Steep race-spec pitches · home of the FIS-grade Diamond course.", descriptionJa: "急傾斜のレース仕様 · FIS規格ダイヤモンドコース", embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "mid",    elevation: 1900, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-ichinose-yamanokami": [
    { id: "central-ichinose-yamanokami", mountainId: "shiga-ichinose-yamanokami", name: "Ichinose Yama-no-kami annex", nameJa: "一の瀬山の神 付帯エリア", description: "Quiet Ichinose annex · short laps for warm-ups and lessons.", descriptionJa: "静かな一の瀬の隣接エリア · ウォームアップとレッスン", embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "base",   elevation: 1850, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],

  // ─── East Shiga - Prince Hotels operates Yakebitaiyama livecams ───
  "shiga-yakebitaiyama": [
    { id: "yakebi-base",        mountainId: "shiga-yakebitaiyama", name: "Yakebitaiyama base · Prince Hotel", nameJa: "焼額山 ベース · プリンスホテル前", description: "View across the lower slopes from the Prince Hotel base lodge.", descriptionJa: "プリンスホテル前から下部ゲレンデを望む", embedType: "external", pageUrl: "https://www.princehotels.co.jp/ski/shiga/livecamera/", vantage: "base",   elevation: 1500, source: "Prince Hotels & Resorts", verifiedAt: VERIFIED },
    { id: "yakebi-summit",      mountainId: "shiga-yakebitaiyama", name: "Yakebitaiyama summit",              nameJa: "焼額山 山頂",                       description: "1998 Olympic GS course start - 2,009m peak.",                  descriptionJa: "1998年五輪GS発走点 · 標高2,009m",         embedType: "external", pageUrl: "https://www.princehotels.co.jp/ski/shiga/livecamera/", vantage: "summit", elevation: 2009, source: "Prince Hotels & Resorts", verifiedAt: VERIFIED },
  ],
  "shiga-okushiga-kogen": [
    { id: "okushiga-1",         mountainId: "shiga-okushiga-kogen", name: "Okushiga Kogen base", nameJa: "奥志賀高原 ベース", description: "Shiga's quietest, longest groomers.", descriptionJa: "志賀最奥のロングクルーザー", embedType: "external", pageUrl: "https://www.okushiga.jp/livecam.html", vantage: "base", elevation: 1960, source: "Okushiga Kogen Resort", verifiedAt: VERIFIED },
  ],

  // ─── Highest lift-served zone - operated by Yokoteyama/Shibutoge resort ───
  "shiga-kumanoyu": [
    { id: "kumanoyu-base",      mountainId: "shiga-kumanoyu",   name: "Kumanoyu base", nameJa: "熊の湯 ベース", description: "North-facing high alpine · long-season natural snow.", descriptionJa: "北向き高所 · 自然雪のロングシーズン", embedType: "external", pageUrl: "https://www.kumanoyu.co.jp/", vantage: "base", elevation: 2000, source: "Kumanoyu Ski Area", verifiedAt: VERIFIED },
  ],
  "shiga-yokoteyama": [
    { id: "yokoteyama-summit",  mountainId: "shiga-yokoteyama", name: "Yokoteyama summit · 2,305m", nameJa: "横手山 山頂 · 標高2,305m", description: "Japan's highest lift-served summit · alpine views to the JP Alps.", descriptionJa: "日本最高所の索道山頂 · 日本アルプスを望む", embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "summit", elevation: 2305, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],
  "shiga-shibutoge": [
    { id: "shibutoge-pass",     mountainId: "shiga-shibutoge",  name: "Shibutoge Pass · Honshu's highest road",                              nameJa: "渋峠 · 本州最高所の道路",          description: "2,172m - sea-of-clouds backdrop, road closes Nov-Apr.",                       descriptionJa: "標高2,172m · 雲海と冬季閉鎖の峠",            embedType: "external", pageUrl: "https://www.shigakogen.gr.jp/english/live/index.html", vantage: "summit", elevation: 2172, source: "Shiga Kogen Tourism Association", verifiedAt: VERIFIED },
  ],

  // ─── Kita-Shiga · only Ryuoo runs an official cam page. The old shared
  //     kitashiga.co.jp portal is gone; X-JAM/Yomase/Komaruyama publish no
  //     official cams, so Yomase links a relabeled unofficial directory and
  //     X-JAM/Komaruyama have no webcam entries (honesty over filler). ───
  "ryuoo": [
    { id: "ryuoo-sora",         mountainId: "ryuoo",            name: "Ryuoo SORA terrace · sea of clouds", nameJa: "竜王 SORAテラス · 雲海",        description: "Iconic 1,770m gondola summit terrace.",                                       descriptionJa: "標高1,770m ゴンドラ山頂テラス",            embedType: "external", pageUrl: "https://www.ryuoo.com/en/winter/livecamera/", vantage: "summit", elevation: 1770, source: "Ryuoo Ski Park", verifiedAt: VERIFIED },
    { id: "ryuoo-base",         mountainId: "ryuoo",            name: "Ryuoo base · gondola plaza",         nameJa: "竜王 ベース · ゴンドラ乗り場",  description: "Base lodge gondola plaza.",                                                   descriptionJa: "ゴンドラ乗り場のベース",                    embedType: "external", pageUrl: "https://www.ryuoo.com/en/winter/livecamera/", vantage: "base",   elevation: 850,  source: "Ryuoo Ski Park", verifiedAt: VERIFIED },
  ],
  "yomase-onsen": [
    { id: "yomase",             mountainId: "yomase-onsen",     name: "Yomase Onsen · river-side base",     nameJa: "夜間瀬温泉スキー場 · 川沿いベース", description: "Locals' mountain · night skiing & onsen finish.",                          descriptionJa: "地元のスキー場 · ナイター + 温泉",          embedType: "external", pageUrl: "https://livejapan.fujiyamasan.com/nagano-yamanouchi-yomase-forest-plaza/", vantage: "base",   elevation: 600,  source: "LiveJapan cam directory (unofficial)", verifiedAt: VERIFIED },
  ],
};

/**
 * Iiyama region webcams kept here as a dormant dataset. The region itself
 * is no longer in the active region registry (see regions/index.ts), so
 * `IIYAMA_DORMANT` is intentionally not spread into MOUNTAIN_WEBCAMS.
 * Restore by spreading it back in if iiyama is ever re-enabled.
 */
const IIYAMA_DORMANT: Record<string, MountainWebcam[]> = {
  "madarao": [
    {
      id: "madarao-base",
      mountainId: "madarao",
      name: "Madarao Kogen · base lodge",
      nameJa: "斑尾高原 · ベースロッジ",
      description: "Tree-run paradise · linked with Tangram.",
      descriptionJa: "ツリーランの聖地 · タングラムと連結",
      embedType: "external",
      pageUrl: "https://madaraokogen.com/madarao-webcam/",
      vantage: "base",
      elevation: 1000,
      source: "madaraokogen.com (local guide)",
      verifiedAt: VERIFIED,
    },
    {
      id: "madarao-summit",
      mountainId: "madarao",
      name: "Madarao summit",
      nameJa: "斑尾山頂",
      embedType: "external",
      pageUrl: "https://madaraokogen.com/madarao-webcam/",
      vantage: "summit",
      elevation: 1382,
      source: "madaraokogen.com (local guide)",
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
      pageUrl: "https://madaraokogen.com/madarao-webcam/",
      vantage: "base",
      elevation: 950,
      source: "madaraokogen.com (local guide)",
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
      pageUrl: "https://steep.jp/en/ski-area/togarionsen/",
      vantage: "base",
      elevation: 600,
      source: "steep.jp (ski media)",
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
 * duplicate that here - the curated dataset only fills gaps where the
 * API doesn't reach (i.e. the JP region).
 */
const SNOWY_MOUNTAINS: Record<string, MountainWebcam[]> = {};

const NZ_VERIFIED = "2026-07-24";

/**
 * New Zealand - all seven resorts. None of the NZ operators expose a
 * hotlink-clean still image (NZSki renders cams client-side on the
 * weather-report page, Cardrona · Treble Cone and Pure Turoa serve them
 * behind players), so every entry is an "external" card straight to the
 * operator's official cam page - honest link-out, no broken embeds.
 */
const NEW_ZEALAND: Record<string, MountainWebcam[]> = {
  "mt-hutt": [
    {
      id: "mt-hutt-official",
      mountainId: "mt-hutt",
      name: "Mt Hutt snow cams",
      description: "Live mountain cams on the official weather report page.",
      embedType: "external",
      pageUrl: "https://www.mthutt.co.nz/weather-report",
      source: "Mt Hutt (NZSki)",
      verifiedAt: NZ_VERIFIED,
    },
  ],
  "coronet-peak": [
    {
      id: "coronet-peak-official",
      mountainId: "coronet-peak",
      name: "Coronet Peak snow cams",
      description: "Live mountain cams on the official weather report page.",
      embedType: "external",
      pageUrl: "https://www.coronetpeak.co.nz/weather-report",
      source: "Coronet Peak (NZSki)",
      verifiedAt: NZ_VERIFIED,
    },
  ],
  "the-remarkables": [
    {
      id: "the-remarkables-official",
      mountainId: "the-remarkables",
      name: "The Remarkables snow cams",
      description: "Live mountain cams on the official weather report page.",
      embedType: "external",
      pageUrl: "https://www.theremarkables.co.nz/weather-report/",
      source: "The Remarkables (NZSki)",
      verifiedAt: NZ_VERIFIED,
    },
  ],
  cardrona: [
    {
      id: "cardrona-official",
      mountainId: "cardrona",
      name: "Cardrona snow cams",
      description: "Official snow cams · shared Cardrona · Treble Cone cam page.",
      embedType: "external",
      pageUrl: "https://cardrona-treblecone.com/webcams",
      source: "Cardrona · Treble Cone",
      verifiedAt: NZ_VERIFIED,
    },
  ],
  "treble-cone": [
    {
      id: "treble-cone-official",
      mountainId: "treble-cone",
      name: "Treble Cone snow cams",
      description: "Official snow cams · shared Cardrona · Treble Cone cam page.",
      embedType: "external",
      pageUrl: "https://cardrona-treblecone.com/webcams",
      source: "Cardrona · Treble Cone",
      verifiedAt: NZ_VERIFIED,
    },
  ],
  whakapapa: [
    {
      id: "whakapapa-official",
      mountainId: "whakapapa",
      name: "Whakapapa mountain cams",
      description: "Live cams on the official snow report page.",
      embedType: "external",
      pageUrl: "https://www.whakapapa.com/report",
      source: "Whakapapa · Mt Ruapehu",
      verifiedAt: NZ_VERIFIED,
    },
  ],
  turoa: [
    {
      id: "turoa-official",
      mountainId: "turoa",
      name: "Turoa mountain cams",
      description: "Official webcams above Ohakune on Ruapehu's southwest face.",
      embedType: "external",
      pageUrl: "https://www.pureturoa.nz/webcams",
      source: "Pure Turoa",
      verifiedAt: NZ_VERIFIED,
    },
  ],
};

const CA_VERIFIED = "2026-08-01";
// New CA regions (Okanagan + Vancouver & the Island) verified in this pass.
const OKANAGAN_VERIFIED = "2026-08-01";

/**
 * Canada (BC, Alberta, Québec). Same posture as NZ: none of these operators
 * serve a hotlink-clean still image, so every entry is an "external" card
 * straight to the operator's official cam page. Marmot Basin has no public
 * cam page at all (only a snow report), so Jasper has no entry rather than a
 * guessed URL · Mont Sutton is the same, its cams are embedded in the
 * conditions page with no standalone cam route.
 */
const CANADA: Record<string, MountainWebcam[]> = {
  "whistler-mountain": [
    {
      id: "whistler-mountain-official",
      mountainId: "whistler-mountain",
      name: "Whistler Blackcomb mountain cams",
      description: "Official cams across both mountains and the village.",
      embedType: "external",
      pageUrl: "https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
      source: "Whistler Blackcomb",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "blackcomb-mountain": [
    {
      id: "blackcomb-mountain-official",
      mountainId: "blackcomb-mountain",
      name: "Whistler Blackcomb mountain cams",
      description: "Official cams across both mountains and the village.",
      embedType: "external",
      pageUrl: "https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
      source: "Whistler Blackcomb",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "revelstoke-mountain-resort": [
    {
      id: "revelstoke-official",
      mountainId: "revelstoke-mountain-resort",
      name: "Revelstoke webcams",
      description: "Official cams from the village base up to Mt Mackenzie.",
      embedType: "external",
      pageUrl: "https://www.revelstokemountainresort.com/mountain/conditions/webcams/",
      source: "Revelstoke Mountain Resort",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "kicking-horse": [
    {
      id: "kicking-horse-official",
      mountainId: "kicking-horse",
      name: "Kicking Horse mountain cam",
      description: "Official mountain cam above Golden.",
      embedType: "external",
      pageUrl: "https://kickinghorseresort.com/conditions/mountain-cam/",
      source: "Kicking Horse",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "fernie-alpine": [
    {
      id: "fernie-alpine-official",
      mountainId: "fernie-alpine",
      name: "Fernie mountain cam",
      description: "Official cams across the Lizard Range bowls.",
      embedType: "external",
      pageUrl: "https://skifernie.com/conditions/mountain-cam/",
      source: "Fernie Alpine Resort",
      verifiedAt: CA_VERIFIED,
    },
  ],
  whitewater: [
    {
      id: "whitewater-official",
      mountainId: "whitewater",
      name: "Whitewater webcams",
      description: "Official base and mid-mountain cams above Nelson.",
      embedType: "external",
      pageUrl: "https://skiwhitewater.com/webcams/",
      source: "Whitewater",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "kimberley-alpine": [
    {
      id: "kimberley-alpine-official",
      mountainId: "kimberley-alpine",
      name: "Kimberley webcams",
      description: "Official cams on North Star Mountain.",
      embedType: "external",
      pageUrl: "https://skikimberley.com/conditions/webcams/",
      source: "Kimberley Alpine Resort",
      verifiedAt: CA_VERIFIED,
    },
  ],
  panorama: [
    {
      id: "panorama-official",
      mountainId: "panorama",
      name: "Panorama webcams",
      description: "Official cams from the village up to Taynton Bowl.",
      embedType: "external",
      pageUrl: "https://www.panoramaresort.com/webcams/",
      source: "Panorama",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "sun-peaks-resort": [
    {
      id: "sun-peaks-official",
      mountainId: "sun-peaks-resort",
      name: "Sun Peaks webcams",
      description: "Official cams across Tod, Sundance and Morrisey.",
      embedType: "external",
      pageUrl: "https://www.sunpeaksresort.com/ski-ride/weather-webcams/webcams",
      source: "Sun Peaks Resort",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "banff-sunshine": [
    {
      id: "banff-sunshine-official",
      mountainId: "banff-sunshine",
      name: "Sunshine Village webcams",
      description: "Official cams on the Continental Divide.",
      embedType: "external",
      pageUrl: "https://www.skibanff.com/webcams",
      source: "Banff Sunshine Village",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "mt-norquay": [
    {
      id: "mt-norquay-official",
      mountainId: "mt-norquay",
      name: "Mt. Norquay webcam",
      description: "Official cam on the hill above Banff townsite.",
      embedType: "external",
      pageUrl: "https://banffnorquay.com/webcam/",
      source: "Mt. Norquay",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "lake-louise-resort": [
    {
      id: "lake-louise-resort-official",
      mountainId: "lake-louise-resort",
      name: "Lake Louise webcams",
      description: "Official cams across the four mountain faces.",
      embedType: "external",
      pageUrl: "https://www.skilouise.com/webcams/",
      source: "Lake Louise Ski Resort",
      verifiedAt: CA_VERIFIED,
    },
  ],
  nakiska: [
    {
      id: "nakiska-official",
      mountainId: "nakiska",
      name: "Nakiska mountain cam",
      description: "Official cam on Mount Allan in Kananaskis Country.",
      embedType: "external",
      pageUrl: "https://skinakiska.com/conditions/mountain-cam/",
      source: "Nakiska",
      verifiedAt: CA_VERIFIED,
    },
  ],
  tremblant: [
    {
      id: "tremblant-official",
      mountainId: "tremblant",
      name: "Tremblant webcams",
      description: "Official cams from the pedestrian village up to the Pic White summit.",
      embedType: "external",
      pageUrl: "https://www.tremblant.ca/mountain-village/webcams",
      source: "Tremblant",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "mont-sainte-anne": [
    {
      id: "mont-sainte-anne-official",
      mountainId: "mont-sainte-anne",
      name: "Mont-Sainte-Anne webcams",
      description: "Official cams across the south, north and west faces.",
      embedType: "external",
      pageUrl: "https://mont-sainte-anne.com/webcams-ski-alpin/",
      source: "Mont-Sainte-Anne",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "le-massif": [
    {
      id: "le-massif-official",
      mountainId: "le-massif",
      name: "Le Massif snow, weather & webcams",
      description: "Official cams looking down the vertical toward the St. Lawrence.",
      embedType: "external",
      pageUrl: "https://www.lemassif.com/en/the-mountain/winter/snow-weather-webcams",
      source: "Le Massif de Charlevoix",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "bromont-resort": [
    {
      id: "bromont-resort-official",
      mountainId: "bromont-resort",
      name: "Ski Bromont webcams",
      description: "Official cams across the seven sectors of Mont Brome.",
      embedType: "external",
      pageUrl: "https://www.bromontmontagne.com/en/webcams/",
      source: "Ski Bromont",
      verifiedAt: CA_VERIFIED,
    },
  ],
  "big-white": [
    {
      id: "big-white-official",
      mountainId: "big-white",
      name: "Big White webcams",
      description: "Official cams across the village and the alpine.",
      embedType: "external",
      pageUrl: "https://www.bigwhite.com/mountain-conditions/webcams",
      source: "Big White Ski Resort",
      verifiedAt: OKANAGAN_VERIFIED,
    },
  ],
  silverstar: [
    {
      id: "silverstar-official",
      mountainId: "silverstar",
      name: "SilverStar webcams",
      description: "Official village and pow cams.",
      embedType: "external",
      pageUrl: "https://www.skisilverstar.com/the-mountain/webcams/",
      source: "SilverStar Mountain Resort",
      verifiedAt: OKANAGAN_VERIFIED,
    },
  ],
  "apex-resort": [
    {
      id: "apex-resort-official",
      mountainId: "apex-resort",
      name: "Apex Mountain webcams",
      description: "Official live cams on the resort weather page.",
      embedType: "external",
      pageUrl: "https://apexresort.com/weather/",
      source: "Apex Mountain Resort",
      verifiedAt: OKANAGAN_VERIFIED,
    },
  ],
  "cypress-mountain": [
    {
      id: "cypress-mountain-official",
      mountainId: "cypress-mountain",
      name: "Cypress Mountain webcams",
      description: "Official cams on the downhill mountain report.",
      embedType: "external",
      pageUrl: "https://www.cypressmountain.com/mountain-report",
      source: "Cypress Mountain",
      verifiedAt: OKANAGAN_VERIFIED,
    },
  ],
  "grouse-mountain": [
    {
      id: "grouse-mountain-official",
      mountainId: "grouse-mountain",
      name: "Grouse Mountain webcams",
      description: "Official cams above the North Shore.",
      embedType: "external",
      pageUrl: "https://www.grousemountain.com/web-cams",
      source: "Grouse Mountain",
      verifiedAt: OKANAGAN_VERIFIED,
    },
  ],
  "mount-seymour": [
    {
      id: "mount-seymour-official",
      mountainId: "mount-seymour",
      name: "Mt Seymour webcams",
      description: "Official cams on today's conditions page.",
      embedType: "external",
      pageUrl: "https://mtseymour.ca/the-mountain/todays-conditions-hours",
      source: "Mt Seymour",
      verifiedAt: OKANAGAN_VERIFIED,
    },
  ],
  "mount-washington": [
    {
      id: "mount-washington-official",
      mountainId: "mount-washington",
      name: "Mount Washington webcams",
      description: "Official Vancouver Island alpine cams.",
      embedType: "external",
      pageUrl: "https://mountwashington.ca/the-mountain/conditions-terrain/webcams.html",
      source: "Mount Washington Alpine Resort",
      verifiedAt: OKANAGAN_VERIFIED,
    },
  ],
};

const USA_VERIFIED = "2026-08-09";

/**
 * USA - Colorado, Tahoe, Utah and Vermont majors. Same posture as NZ/Canada:
 * none of these operators serve a hotlink-clean still image (Vail Resorts
 * pages are JS-rendered, most others sit behind player embeds), so every
 * entry is an "external" card straight to the operator's official cam page.
 * Every URL below was human-verified to render live cam content on the
 * verifiedAt date (not just a 200 - several old paths now 404 or 403).
 *
 * Intentional gaps (rather than guessed URLs):
 *   - Homewood: suspended operations, no live cams to point at.
 *   - Burke Mountain + Magic Mountain: no official standalone cam page.
 *   - Brighton: cams are embedded in the conditions page (no cam route).
 *   - Jay Peak: cams live on the official "A Look Around" page.
 */
const USA: Record<string, MountainWebcam[]> = {
  // ─── Colorado ────────────────────────────────────────────
  "breckenridge-resort": [
    { id: "breckenridge-official", mountainId: "breckenridge-resort", name: "Breckenridge mountain cams", description: "Official cams across all five peaks plus the snow stake.", embedType: "external", pageUrl: "https://www.breckenridge.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Breckenridge Ski Resort", verifiedAt: USA_VERIFIED },
  ],
  "keystone-resort": [
    { id: "keystone-official", mountainId: "keystone-resort", name: "Keystone mountain cams", description: "Official cams from River Run village to the Outback.", embedType: "external", pageUrl: "https://www.keystoneresort.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Keystone Resort", verifiedAt: USA_VERIFIED },
  ],
  "copper-mountain-resort": [
    { id: "copper-official", mountainId: "copper-mountain-resort", name: "Copper Mountain webcams", description: "Official cams across Center, East and West villages.", embedType: "external", pageUrl: "https://www.coppercolorado.com/the-mountain/webcams/", source: "Copper Mountain", verifiedAt: USA_VERIFIED },
  ],
  "arapahoe-basin": [
    { id: "abasin-official", mountainId: "arapahoe-basin", name: "Arapahoe Basin mountain cams", description: "Official cams up the Legend's high-alpine terrain.", embedType: "external", pageUrl: "https://www.arapahoebasin.com/mountain-cams/", source: "Arapahoe Basin", verifiedAt: USA_VERIFIED },
  ],
  loveland: [
    { id: "loveland-official", mountainId: "loveland", name: "Loveland webcams", description: "Official cams and live weather station on the Divide.", embedType: "external", pageUrl: "https://skiloveland.com/webcams/", source: "Loveland Ski Area", verifiedAt: USA_VERIFIED },
  ],
  "vail-mountain": [
    { id: "vail-official", mountainId: "vail-mountain", name: "Vail mountain cams", description: "Official cams from Vail Village to the Back Bowls.", embedType: "external", pageUrl: "https://www.vail.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Vail Mountain", verifiedAt: USA_VERIFIED },
  ],
  "beaver-creek": [
    { id: "beaver-creek-official", mountainId: "beaver-creek", name: "Beaver Creek mountain cams", description: "Official cams across the village and upper mountain.", embedType: "external", pageUrl: "https://www.beavercreek.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Beaver Creek Resort", verifiedAt: USA_VERIFIED },
  ],
  snowmass: [
    { id: "snowmass-official", mountainId: "snowmass", name: "Aspen Snowmass mountain cams", description: "Official live cams across all four Aspen Snowmass mountains.", embedType: "external", pageUrl: "https://www.aspensnowmass.com/four-mountains/mountain-cams", source: "Aspen Snowmass", verifiedAt: USA_VERIFIED },
  ],
  "aspen-mountain": [
    { id: "aspen-mountain-official", mountainId: "aspen-mountain", name: "Aspen Snowmass mountain cams", description: "Official live cams across all four Aspen Snowmass mountains.", embedType: "external", pageUrl: "https://www.aspensnowmass.com/four-mountains/mountain-cams", source: "Aspen Snowmass", verifiedAt: USA_VERIFIED },
  ],
  "aspen-highlands": [
    { id: "aspen-highlands-official", mountainId: "aspen-highlands", name: "Aspen Snowmass mountain cams", description: "Official live cams across all four Aspen Snowmass mountains.", embedType: "external", pageUrl: "https://www.aspensnowmass.com/four-mountains/mountain-cams", source: "Aspen Snowmass", verifiedAt: USA_VERIFIED },
  ],
  buttermilk: [
    { id: "buttermilk-official", mountainId: "buttermilk", name: "Aspen Snowmass mountain cams", description: "Official live cams across all four Aspen Snowmass mountains.", embedType: "external", pageUrl: "https://www.aspensnowmass.com/four-mountains/mountain-cams", source: "Aspen Snowmass", verifiedAt: USA_VERIFIED },
  ],
  "steamboat-resort": [
    { id: "steamboat-official", mountainId: "steamboat-resort", name: "Steamboat live cams", description: "Official cams from the gondola to the Champagne Powder bowls.", embedType: "external", pageUrl: "https://www.steamboat.com/the-mountain/live-cams", source: "Steamboat Resort", verifiedAt: USA_VERIFIED },
  ],
  "winter-park-resort": [
    { id: "winter-park-official", mountainId: "winter-park-resort", name: "Winter Park mountain cams", description: "Official cams across Winter Park and Mary Jane.", embedType: "external", pageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams", source: "Winter Park Resort", verifiedAt: USA_VERIFIED },
  ],
  "crested-butte-mountain-resort": [
    { id: "crested-butte-official", mountainId: "crested-butte-mountain-resort", name: "Crested Butte mountain cams", description: "Official cams around the base area and upper mountain.", embedType: "external", pageUrl: "https://www.skicb.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Crested Butte Mountain Resort", verifiedAt: USA_VERIFIED },
  ],

  // ─── Lake Tahoe ──────────────────────────────────────────
  "palisades-tahoe": [
    { id: "palisades-official", mountainId: "palisades-tahoe", name: "Palisades Tahoe webcams", description: "Official cams across both the Palisades and Alpine sides.", embedType: "external", pageUrl: "https://www.palisadestahoe.com/mountain-information/webcams", source: "Palisades Tahoe", verifiedAt: USA_VERIFIED },
  ],
  "northstar-california": [
    { id: "northstar-official", mountainId: "northstar-california", name: "Northstar mountain cams", description: "Official cams from the village to the summit.", embedType: "external", pageUrl: "https://www.northstarcalifornia.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Northstar California", verifiedAt: USA_VERIFIED },
  ],
  "sugar-bowl": [
    { id: "sugar-bowl-official", mountainId: "sugar-bowl", name: "Sugar Bowl webcams", description: "Official cams across the Donner Summit ridgeline.", embedType: "external", pageUrl: "https://www.sugarbowl.com/webcams", source: "Sugar Bowl Resort", verifiedAt: USA_VERIFIED },
  ],
  heavenly: [
    { id: "heavenly-official", mountainId: "heavenly", name: "Heavenly mountain cams", description: "Official cams with lake views from both states of the mountain.", embedType: "external", pageUrl: "https://www.skiheavenly.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Heavenly Mountain Resort", verifiedAt: USA_VERIFIED },
  ],
  kirkwood: [
    { id: "kirkwood-official", mountainId: "kirkwood", name: "Kirkwood mountain cams", description: "Official cams across the Kirkwood cirque.", embedType: "external", pageUrl: "https://www.kirkwood.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Kirkwood Mountain Resort", verifiedAt: USA_VERIFIED },
  ],
  "sierra-at-tahoe": [
    { id: "sierra-at-tahoe-official", mountainId: "sierra-at-tahoe", name: "Sierra-at-Tahoe live cams", description: "Official cams around the base and upper mountain.", embedType: "external", pageUrl: "https://sierraattahoe.com/live-cams/", source: "Sierra-at-Tahoe", verifiedAt: USA_VERIFIED },
  ],

  // ─── Utah ────────────────────────────────────────────────
  alta: [
    { id: "alta-official", mountainId: "alta", name: "Alta mountain cams", description: "Official cams on the weather and snow page.", embedType: "external", pageUrl: "https://www.alta.com/weather", source: "Alta Ski Area", verifiedAt: USA_VERIFIED },
  ],
  snowbird: [
    { id: "snowbird-official", mountainId: "snowbird", name: "Snowbird webcams", description: "Official cams from the tram deck to Mineral Basin.", embedType: "external", pageUrl: "https://www.snowbird.com/the-mountain/webcams/view-all-webcams/", source: "Snowbird", verifiedAt: USA_VERIFIED },
  ],
  "brighton-resort": [
    { id: "brighton-official", mountainId: "brighton-resort", name: "Brighton conditions & cams", description: "Official cams embedded in the live conditions page.", embedType: "external", pageUrl: "https://www.brightonresort.com/conditions", source: "Brighton Resort", verifiedAt: USA_VERIFIED },
  ],
  "solitude-mountain-resort": [
    { id: "solitude-official", mountainId: "solitude-mountain-resort", name: "Solitude webcams", description: "Official cams across the village and Honeycomb Canyon.", embedType: "external", pageUrl: "https://www.solitudemountain.com/mountain-and-village/webcams", source: "Solitude Mountain Resort", verifiedAt: USA_VERIFIED },
  ],
  "park-city-mountain": [
    { id: "park-city-official", mountainId: "park-city-mountain", name: "Park City mountain cams", description: "Official cams across Park City and Canyons Village.", embedType: "external", pageUrl: "https://www.parkcitymountain.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Park City Mountain", verifiedAt: USA_VERIFIED },
  ],
  "deer-valley-resort": [
    { id: "deer-valley-official", mountainId: "deer-valley-resort", name: "Deer Valley webcams", description: "Official cams across the expanded resort.", embedType: "external", pageUrl: "https://www.deervalley.com/explore-the-mountain/webcams", source: "Deer Valley Resort", verifiedAt: USA_VERIFIED },
  ],

  // ─── Vermont ─────────────────────────────────────────────
  "killington-resort": [
    { id: "killington-official", mountainId: "killington-resort", name: "Killington live webcams", description: "Official cams across all six peaks of the Beast.", embedType: "external", pageUrl: "https://killington.com/webcams", source: "Killington Resort", verifiedAt: USA_VERIFIED },
  ],
  "pico-mountain": [
    { id: "pico-official", mountainId: "pico-mountain", name: "Pico Mountain webcams", description: "Official cams at the base and summit.", embedType: "external", pageUrl: "https://picomountain.com/webcams", source: "Pico Mountain", verifiedAt: USA_VERIFIED },
  ],
  "stowe-mountain-resort": [
    { id: "stowe-official", mountainId: "stowe-mountain-resort", name: "Stowe mountain cams", description: "Official cams from Spruce Peak to the Mansfield summit.", embedType: "external", pageUrl: "https://www.stowe.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Stowe Mountain Resort", verifiedAt: USA_VERIFIED },
  ],
  "smugglers-notch": [
    { id: "smugglers-notch-official", mountainId: "smugglers-notch", name: "Smugglers' Notch web cams", description: "Official cams across Morse, Madonna and Sterling.", embedType: "external", pageUrl: "https://www.smuggs.com/conditions-stats/web-cams/", source: "Smugglers' Notch Resort", verifiedAt: USA_VERIFIED },
  ],
  "okemo-mountain-resort": [
    { id: "okemo-official", mountainId: "okemo-mountain-resort", name: "Okemo mountain cams", description: "Official cams above Ludlow including the snow stake.", embedType: "external", pageUrl: "https://www.okemo.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Okemo Mountain Resort", verifiedAt: USA_VERIFIED },
  ],
  "stratton-mountain-resort": [
    { id: "stratton-official", mountainId: "stratton-mountain-resort", name: "Stratton webcams", description: "Official cams from the village to the summit fire tower.", embedType: "external", pageUrl: "https://www.stratton.com/the-mountain/webcams", source: "Stratton Mountain Resort", verifiedAt: USA_VERIFIED },
  ],
  "mount-snow": [
    { id: "mount-snow-official", mountainId: "mount-snow", name: "Mount Snow mountain cams", description: "Official cams across the main face and Carinthia.", embedType: "external", pageUrl: "https://www.mountsnow.com/the-mountain/mountain-conditions/mountain-cams.aspx", source: "Mount Snow", verifiedAt: USA_VERIFIED },
  ],
  "bromley-mountain": [
    { id: "bromley-official", mountainId: "bromley-mountain", name: "Bromley webcams", description: "Official cams on Vermont's sun mountain.", embedType: "external", pageUrl: "https://bromley.com/webcams", source: "Bromley Mountain", verifiedAt: USA_VERIFIED },
  ],
  sugarbush: [
    { id: "sugarbush-official", mountainId: "sugarbush", name: "Sugarbush webcams", description: "Official cams across Lincoln Peak and Mt Ellen.", embedType: "external", pageUrl: "https://www.sugarbush.com/mountain/webcams", source: "Sugarbush Resort", verifiedAt: USA_VERIFIED },
  ],
  "mad-river-glen": [
    { id: "mad-river-glen-official", mountainId: "mad-river-glen", name: "Mad River Glen live webcams", description: "Official cams including the famous Single Chair.", embedType: "external", pageUrl: "https://www.madriverglen.com/live-web-cam/", source: "Mad River Glen", verifiedAt: USA_VERIFIED },
  ],
  "jay-peak": [
    { id: "jay-peak-official", mountainId: "jay-peak", name: "Jay Peak live cams", description: "Official cams on Jay's \"A Look Around\" page.", embedType: "external", pageUrl: "https://jaypeakresort.com/resort/photo-day", source: "Jay Peak Resort", verifiedAt: USA_VERIFIED },
  ],
};

// Reference IIYAMA_DORMANT once so TS doesn't drop it as an unused export.
void IIYAMA_DORMANT;

export const MOUNTAIN_WEBCAMS: Record<string, MountainWebcam[]> = {
  ...YAMANOUCHI,
  ...SNOWY_MOUNTAINS,
  ...NEW_ZEALAND,
  ...CANADA,
  ...USA,
};

export function getMountainWebcams(mountainId: string): MountainWebcam[] {
  return MOUNTAIN_WEBCAMS[mountainId] ?? [];
}
