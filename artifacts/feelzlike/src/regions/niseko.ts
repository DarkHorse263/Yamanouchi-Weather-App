import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Niseko · sixth JP region and the first in Hokkaido. Five resorts on and
 * around Mt Niseko Annupuri (1,308 m), Japan's most famous powder area:
 *
 *   Hirafu village (main hub)   → Grand Hirafu, Hanazono (linked at the top)
 *   Kutchan (service town)      → Grand Hirafu, Hanazono (nearest station)
 *   Niseko Town (south-west)    → Niseko Village, Annupuri, Moiwa
 *
 * Grand Hirafu, Hanazono, Niseko Village and Annupuri are interlinked at
 * the peak and share the Niseko United all-mountain pass (on the Ikon
 * Pass 2025-26) · noted in their blurbs. Moiwa sits beside Annupuri but
 * is independent and NOT part of the united pass, so it is listed as an
 * honest sibling (same precedent as Myoko / Hakuba Valley).
 *
 * Coordinates are base-area points; elevationM is the top-lift height
 * for each resort (not the 1,308 m summit, which is hike-only).
 */
export const nisekoRegion: RegionConfig = {
  id: "niseko",
  name: "Niseko",
  subtitle: "Hokkaido · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: [
    "Grand Hirafu · Hanazono",
    "Niseko Village · Annupuri",
    "Moiwa",
  ],
  resorts: [
    { path: "/mountain/grand-hirafu",   label: "Grand Hirafu",   labelJa: "グラン・ヒラフ" },
    { path: "/mountain/hanazono",       label: "Hanazono",       labelJa: "HANAZONO" },
    { path: "/mountain/niseko-village", label: "Niseko Village", labelJa: "ニセコビレッジ" },
    { path: "/mountain/annupuri",       label: "Annupuri",       labelJa: "アンヌプリ国際" },
    { path: "/mountain/moiwa",          label: "Moiwa",          labelJa: "モイワ" },
  ],
  mountains: [
    {
      id: "grand-hirafu",
      name: "Niseko Grand Hirafu",
      nameJa: "ニセコマウンテンリゾート グラン・ヒラフ",
      elevationM: 1200,
      lat: 42.8590,
      lng: 140.6900,
      blurb: "Niseko's biggest resort · night skiing above Hirafu village and peak gates to the Annupuri summit, on the Niseko United pass (Ikon)",
      blurbJa: "ニセコ最大のリゾート · ヒラフの街の上でナイター営業、山頂ゲートからアンヌプリピークへ、Niseko Unitedパス対象（Ikon）",
      websiteUrl: "https://en.grand-hirafu.jp/",
      beginner_friendly: true,
      kids_lessons: true,
      backcountry_access: true,
    },
    {
      id: "hanazono",
      name: "Niseko Hanazono",
      nameJa: "ニセコHANAZONOリゾート",
      elevationM: 1080,
      lat: 42.8869,
      lng: 140.7028,
      blurb: "Quieter north-east flank linked to Hirafu · powder bowls, tree runs and terrain parks, on the Niseko United pass (Ikon)",
      blurbJa: "ヒラフとつながる静かな北東斜面 · パウダーボウル、ツリーラン、パーク、Niseko Unitedパス対象（Ikon）",
      websiteUrl: "https://hanazononiseko.com/",
      beginner_friendly: true,
      kids_lessons: true,
      backcountry_access: true,
    },
    {
      id: "niseko-village",
      name: "Niseko Village",
      nameJa: "ニセコビレッジスキーリゾート",
      elevationM: 1170,
      lat: 42.8365,
      lng: 140.6851,
      blurb: "Gondola from the village base into long fall-line runs · quiet trees between Hirafu and Annupuri, on the Niseko United pass (Ikon)",
      blurbJa: "ビレッジベースからゴンドラでロングランへ · ヒラフとアンヌプリの間の静かなツリーラン、Niseko Unitedパス対象（Ikon）",
      websiteUrl: "https://www.niseko-village.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "annupuri",
      name: "Niseko Annupuri",
      nameJa: "ニセコアンヌプリ国際スキー場",
      elevationM: 1156,
      lat: 42.8390,
      lng: 140.6570,
      blurb: "Gentlest of the four united resorts · wide mellow groomers and well-known side-country gates, on the Niseko United pass (Ikon)",
      blurbJa: "4つの連結リゾートで最も穏やか · ワイドな緩斜面と有名なサイドカントリーゲート、Niseko Unitedパス対象（Ikon）",
      websiteUrl: "https://annupuri.info/",
      beginner_friendly: true,
      kids_lessons: true,
      backcountry_access: true,
    },
    {
      id: "moiwa",
      name: "Niseko Moiwa",
      nameJa: "ニセコモイワスキーリゾート",
      elevationM: 840,
      lat: 42.8318,
      lng: 140.6479,
      blurb: "Small independent hill beside Annupuri · quiet lifts and deep snow, not part of the united pass",
      blurbJa: "アンヌプリの隣にある小さな独立系スキー場 · 静かなリフトと深い雪、Niseko Unitedパス対象外",
      websiteUrl: "https://niseko-moiwa.jp/",
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "hirafu",
      name: "Hirafu",
      nameJa: "ヒラフ",
      lat: 42.8577,
      lng: 140.6982,
      // Hirafu village core (~260 m) · Niseko's main hub where most
      // international guests stay, with the largest strip of restaurants
      // and bars. Radius covers the village and the Grand Hirafu base
      // immediately above it; Hanazono's base is ~4 km around the hill
      // but linked by lifts at the top and its own shuttle.
      radiusM: 2500,
      blurb: "Niseko's main hub village · Grand Hirafu on the doorstep, Hanazono linked over the hill",
      blurbJa: "ニセコの中心となる集落 · グラン・ヒラフが目の前、HANAZONOへはリフトとシャトルで",
      nearbyMountainIds: ["grand-hirafu", "hanazono"],
    },
    {
      id: "kutchan",
      name: "Kutchan",
      nameJa: "倶知安",
      lat: 42.9010,
      lng: 140.7545,
      // Kutchan town centre (~180 m) · the working service town of the
      // Niseko area with the nearest train station (Kutchan Station on
      // the JR Hakodate Line), supermarkets and everyday shops. Wider
      // radius reaches west toward the Hirafu resort road.
      radiusM: 5000,
      blurb: "The area's working service town · supermarkets, everyday shops and the nearest train station to Hirafu",
      blurbJa: "エリアの生活を支えるサービスタウン · スーパーや日常の店、ヒラフに最も近い倶知安駅",
      nearbyMountainIds: ["grand-hirafu", "hanazono"],
    },
    {
      id: "niseko-town",
      name: "Niseko Town",
      nameJa: "ニセコ町",
      lat: 42.8051,
      lng: 140.6880,
      // Niseko Town centre (~180 m) on the south-west side, with Niseko
      // Station on the JR Hakodate Line. The quieter gateway to Niseko
      // Village, Annupuri and Moiwa up the hill road.
      radiusM: 5000,
      blurb: "Quieter town on the south-west side · gateway to Niseko Village, Annupuri and Moiwa",
      blurbJa: "南西側の静かな町 · ニセコビレッジ・アンヌプリ・モイワへの玄関口",
      nearbyMountainIds: ["niseko-village", "annupuri", "moiwa"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Niseko Tourism · official destination guide", labelJa: "ニセコリゾート観光協会", url: "https://www.nisekotourism.com/" },
    { category: "Tourism", categoryJa: "観光", label: "Niseko Hirafu · Kutchan tourist association", labelJa: "倶知安観光協会", url: "https://www.niseko-ta.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Niseko United · all-mountain pass and shuttle", labelJa: "Niseko United（ニセコユナイテッド）", url: "https://www.niseko.ne.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Niseko Grand Hirafu", labelJa: "ニセコマウンテンリゾート グラン・ヒラフ", url: "https://en.grand-hirafu.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Niseko Hanazono Resort", labelJa: "ニセコHANAZONOリゾート", url: "https://hanazononiseko.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Niseko Village", labelJa: "ニセコビレッジスキーリゾート", url: "https://www.niseko-village.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Niseko Annupuri Kokusai", labelJa: "ニセコアンヌプリ国際スキー場", url: "https://annupuri.info/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Niseko Moiwa", labelJa: "ニセコモイワスキーリゾート", url: "https://niseko-moiwa.jp/" },
    { category: "Transport", categoryJa: "交通", label: "JR Hokkaido · trains to Kutchan and Niseko stations", labelJa: "JR北海道 · 函館本線（倶知安・ニセコ駅）", url: "https://www.jrhokkaido.co.jp/global/" },
    { category: "Transport", categoryJa: "交通", label: "Hokkaido Resort Liner · New Chitose Airport coaches", labelJa: "北海道リゾートライナー · 新千歳空港からの直行バス", url: "https://www.access-n.jp/" },
    // Backcountry safety · Niseko pioneered Japan's gate system and runs
    // its own daily avalanche bulletin (Niseko Avalanche Information).
    { category: "Backcountry safety", categoryJa: "バックカントリー安全情報", label: "Niseko Avalanche Information · daily bulletin", labelJa: "ニセコ雪崩情報", url: "https://niseko.nadare.info/" },
    { category: "Backcountry safety", categoryJa: "バックカントリー安全情報", label: "Japan Avalanche Network (JAN) · avalanche bulletins", labelJa: "日本雪崩ネットワーク · 雪崩情報", url: "https://nadare.jp/" },
  ],
  weatherSource: {
    label: "Open-Meteo + JMA",
    labelJa: "Open-Meteo・気象庁",
  },
  roadsSource: {
    label: "Japan Road Traffic Information Center (JARTIC)",
    labelJa: "日本道路交通情報センター (JARTIC)",
    url: "https://www.jartic.or.jp/",
    dataAvailable: false,
  },
};
