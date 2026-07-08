import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Hakuba Valley · fourth JP region and the first of the wider Nagano
 * roll-out. Ten resorts strung along the Ōito line beneath the Northern
 * Alps, marketed jointly as the HAKUBA VALLEY alliance on one lift pass
 * but each a distinct mountain with its own base, website and character:
 *
 *   Hakuba village (central) → Happo-One, Hakuba Goryu, Hakuba 47,
 *                              Hakuba Iwatake, Hakuba Sanosaka
 *   Otari (north)            → Tsugaike Kogen, Hakuba Norikura Onsen,
 *                              Hakuba Cortina (the valley's deepest snow)
 *   Omachi (south)           → Kashimayari (Sun Alpina), Jiigatake
 *
 * All ten are listed as sibling mountains rather than under synthetic
 * parent groups · they share the valley pass and a shuttle network but
 * are physically separate ski areas, so siblings keep the IA honest
 * (same precedent as Iiyama's Madarao/Tangram). Goryu + Hakuba 47 are
 * the one lift-linked pair and share a combined ticket · that's noted in
 * their blurbs rather than forced into a parent umbrella.
 *
 * Coordinates are base/centroid points; elevationM is the top-lift
 * summit for each resort. Southern Omachi resorts sit on the valley
 * floor (~137.83E), not up in the Alps backcountry.
 */
export const hakubaValleyRegion: RegionConfig = {
  id: "hakuba-valley",
  name: "Hakuba Valley",
  subtitle: "Nagano · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: [
    "Happo-One · Hakuba 47 · Goryu",
    "Tsugaike · Cortina · Norikura",
    "Kashimayari · Sanosaka · Jiigatake",
  ],
  resorts: [
    { path: "/mountain/happo-one",      label: "Happo-One",       labelJa: "白馬八方尾根" },
    { path: "/mountain/hakuba-goryu",   label: "Hakuba Goryu",    labelJa: "白馬五竜" },
    { path: "/mountain/hakuba-47",      label: "Hakuba 47",       labelJa: "Hakuba47" },
    { path: "/mountain/hakuba-iwatake", label: "Hakuba Iwatake",  labelJa: "白馬岩岳" },
    { path: "/mountain/tsugaike-kogen", label: "Tsugaike Kogen",  labelJa: "栂池高原" },
    { path: "/mountain/hakuba-norikura", label: "Hakuba Norikura", labelJa: "白馬乗鞍温泉" },
    { path: "/mountain/hakuba-cortina", label: "Hakuba Cortina",  labelJa: "白馬コルチナ" },
    { path: "/mountain/hakuba-sanosaka", label: "Hakuba Sanosaka", labelJa: "白馬さのさか" },
    { path: "/mountain/kashimayari",    label: "Kashimayari",     labelJa: "鹿島槍" },
    { path: "/mountain/jiigatake",      label: "Jiigatake",       labelJa: "爺ガ岳" },
  ],
  mountains: [
    {
      id: "happo-one",
      name: "Hakuba Happo-One",
      nameJa: "白馬八方尾根スキー場",
      elevationM: 1831,
      lat: 36.6981,
      lng: 137.8597,
      blurb: "Hakuba's biggest and steepest · 1998 Olympic downhill runs and long Northern Alps views",
      blurbJa: "白馬最大級で最も急峻 · 1998年五輪滑降コースと北アルプスの眺望",
      websiteUrl: "https://www.happo-one.jp/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
    {
      id: "hakuba-goryu",
      name: "Hakuba Goryu (Escal Plaza)",
      nameJa: "白馬五竜スキー場",
      elevationM: 1676,
      lat: 36.7076,
      lng: 137.8312,
      blurb: "Gentle Toomi base to steep Alps Daira up top · one ticket shared with neighbouring Hakuba 47",
      blurbJa: "緩やかなとおみベースから急なアルプス平へ · 隣のHakuba47と共通リフト券",
      websiteUrl: "https://www.hakubagoryu.com/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "hakuba-47",
      name: "Hakuba 47 Winter Sports Park",
      nameJa: "Hakuba47 ウインタースポーツパーク",
      elevationM: 1614,
      lat: 36.6988,
      lng: 137.8256,
      blurb: "Renowned terrain park and tree runs · lift-linked and one ticket with Hakuba Goryu",
      blurbJa: "有名なテレインパークとツリーラン · 白馬五竜とリフト接続・共通券",
      websiteUrl: "https://www.hakuba47.co.jp/winter/",
      terrain_park: true,
      backcountry_access: true,
    },
    {
      id: "hakuba-iwatake",
      name: "Hakuba Iwatake Snow Field",
      nameJa: "白馬岩岳スノーフィールド",
      elevationM: 1289,
      lat: 36.6927,
      lng: 137.8398,
      blurb: "Rounded family mountain · home of the Hakuba Mountain Harbor deck, open in the green season too",
      blurbJa: "なだらかなファミリーマウンテン · 白馬マウンテンハーバーの拠点、グリーンシーズンも営業",
      websiteUrl: "https://iwatake-mountain-resort.com/",
      beginner_friendly: true,
      kids_lessons: true,
      summerOpen: true,
    },
    {
      id: "tsugaike-kogen",
      name: "Tsugaike Kogen",
      nameJa: "栂池高原スキー場",
      elevationM: 1704,
      lat: 36.7490,
      lng: 137.8662,
      blurb: "Vast gentle beginner slope at the base · gated Tsugaike backcountry up high",
      blurbJa: "麓に広がる緩やかな初心者ゲレンデ · 上部はツガイケ・バックカントリー",
      websiteUrl: "https://www.tsugaike.gr.jp/",
      beginner_friendly: true,
      kids_lessons: true,
      backcountry_access: true,
      summerOpen: true,
    },
    {
      id: "hakuba-norikura",
      name: "Hakuba Norikura Onsen",
      nameJa: "白馬乗鞍温泉スキー場",
      elevationM: 1598,
      lat: 36.7580,
      lng: 137.8580,
      blurb: "Quiet Otari mountain · tree skiing off the Alps 11 lift, linked by ticket to Cortina next door",
      blurbJa: "静かな小谷のスキー場 · アルプス11号リフトのツリーラン、隣のコルチナと共通券",
      websiteUrl: "https://hakuba-norikura.com/",
      beginner_friendly: true,
      backcountry_access: true,
    },
    {
      id: "hakuba-cortina",
      name: "Hakuba Cortina",
      nameJa: "白馬コルチナスキー場",
      elevationM: 1402,
      lat: 36.7756,
      lng: 137.8875,
      blurb: "Hakuba's powder magnet · deep snow and tree runs under the landmark red hotel",
      blurbJa: "白馬屈指のパウダー · 赤い外観のホテル下に広がる深雪とツリーラン",
      websiteUrl: "https://www.hakubavalley.com/en/weather_en/detail_cortina_en/",
      beginner_friendly: true,
      backcountry_access: true,
    },
    {
      id: "hakuba-sanosaka",
      name: "Hakuba Sanosaka",
      nameJa: "白馬さのさかスキー場",
      elevationM: 1010,
      lat: 36.6200,
      lng: 137.8500,
      blurb: "Southern gateway by Lake Aoki · gentle family slopes with a lake-view run",
      blurbJa: "青木湖畔の南の玄関口 · 湖を望むコースのある緩やかなファミリーゲレンデ",
      websiteUrl: "https://sanosaka.jp/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "kashimayari",
      name: "Kashimayari (Sun Alpina)",
      nameJa: "鹿島槍スキー場",
      elevationM: 1550,
      lat: 36.5930,
      lng: 137.8270,
      blurb: "Sun Alpina family resort in Omachi · broad beginner terrain beneath Mt Kashimayari",
      blurbJa: "大町のサンアルピナ・ファミリーリゾート · 鹿島槍ヶ岳の麓の広い初心者向け地形",
      websiteUrl: "https://www.kashimayari.net/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "jiigatake",
      name: "Jiigatake",
      nameJa: "爺ガ岳スキー場",
      elevationM: 1205,
      lat: 36.5686,
      lng: 137.8339,
      blurb: "Gentle south-end learner hill in Omachi · wide easy slopes for first-timers and families",
      blurbJa: "大町、谷最南端の緩やかな練習ゲレンデ · 初めての人や家族向けの広く易しい斜面",
      websiteUrl: "https://jiigatake.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "hakuba",
      name: "Hakuba",
      nameJa: "白馬村",
      lat: 36.6982,
      lng: 137.8619,
      // Hakuba village core · Happo bus terminal, the largest hotel and
      // ryokan strip in the valley, and the base most international guests
      // stay in. Radius covers the village and the immediately adjacent
      // resort feet (Happo / Goryu / 47 / Iwatake) without bleeding north
      // to Otari or south to the Omachi resorts.
      radiusM: 4000,
      blurb: "Main Hakuba village · Happo, Goryu, 47, Iwatake and Sanosaka on the doorstep",
      blurbJa: "白馬村の中心 · 八方・五竜・47・岩岳・さのさかへの拠点",
      nearbyMountainIds: ["happo-one", "hakuba-goryu", "hakuba-47", "hakuba-iwatake", "hakuba-sanosaka"],
    },
    {
      id: "otari",
      name: "Otari",
      nameJa: "小谷村",
      lat: 36.7550,
      lng: 137.8640,
      // Otari village · the northern, snowiest corner of the valley. Base
      // for Tsugaike Kogen, Hakuba Norikura Onsen and Hakuba Cortina.
      // Centroid sits on the Tsugaike/Norikura cluster; radius reaches
      // Cortina at the far north end.
      radiusM: 5000,
      blurb: "Northern Otari base · Tsugaike, Cortina and Norikura, the valley's deepest-snow corner",
      blurbJa: "北部・小谷村の拠点 · 栂池・コルチナ・乗鞍、谷で最も雪が深いエリア",
      nearbyMountainIds: ["tsugaike-kogen", "hakuba-norikura", "hakuba-cortina"],
    },
    {
      id: "omachi",
      name: "Omachi",
      nameJa: "大町市",
      lat: 36.5030,
      lng: 137.8514,
      // Omachi City · southern gateway near Lake Aoki and Lake Nakatsuna.
      // Base for the quieter Sun Alpina Kashimayari and Jiigatake family
      // resorts. Wider radius reaches north to the lakeside resort cluster.
      radiusM: 7000,
      blurb: "Southern lakes gateway · Kashimayari and Jiigatake at the quiet end of the valley",
      blurbJa: "南部・湖エリアの玄関口 · 谷の静かな南端にある鹿島槍と爺ガ岳",
      nearbyMountainIds: ["kashimayari", "jiigatake"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Hakuba Valley (10-resort alliance)", labelJa: "HAKUBA VALLEY", url: "https://www.hakubavalley.com/" },
    { category: "Tourism", categoryJa: "観光", label: "Go Nagano · Hakuba & Northern Alps", labelJa: "Go Nagano 白馬・北アルプス", url: "https://www.go-nagano.net/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Hakuba Happo-One", labelJa: "白馬八方尾根スキー場", url: "https://www.happo-one.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Hakuba Goryu", labelJa: "白馬五竜スキー場", url: "https://www.hakubagoryu.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Hakuba 47 Winter Sports Park", labelJa: "Hakuba47 ウインタースポーツパーク", url: "https://www.hakuba47.co.jp/winter/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Hakuba Iwatake Snow Field", labelJa: "白馬岩岳スノーフィールド", url: "https://iwatake-mountain-resort.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Tsugaike Kogen", labelJa: "栂池高原スキー場", url: "https://www.tsugaike.gr.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Hakuba Norikura Onsen", labelJa: "白馬乗鞍温泉スキー場", url: "https://hakuba-norikura.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Hakuba Cortina", labelJa: "白馬コルチナスキー場", url: "https://www.hakubavalley.com/en/weather_en/detail_cortina_en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Hakuba Sanosaka", labelJa: "白馬さのさかスキー場", url: "https://sanosaka.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Kashimayari (Sun Alpina)", labelJa: "鹿島槍スキー場", url: "https://www.kashimayari.net/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Jiigatake", labelJa: "爺ガ岳スキー場", url: "https://jiigatake.com/" },
    { category: "Transport", categoryJa: "交通", label: "JR East · Hokuriku Shinkansen (to Nagano)", labelJa: "JR東日本 · 北陸新幹線 (長野)", url: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html" },
    { category: "Transport", categoryJa: "交通", label: "JR Oito Line (Matsumoto · Hakuba · Minami-Otari)", labelJa: "JR大糸線 (松本・白馬・南小谷)", url: "https://www.jreast.co.jp/e/index.html" },
    { category: "Transport", categoryJa: "交通", label: "Alpico Kotsu · Nagano-Hakuba & highway buses", labelJa: "アルピコ交通 · 長野-白馬・高速バス", url: "https://www.alpico.co.jp/traffic/" },
    // Backcountry safety · Hakuba is Japan's busiest sidecountry / gated
    // backcountry zone (Happo, Tsugaike DBD, Cortina, Norikura). JAN
    // covers the Northern Alps · surface it prominently.
    { category: "Backcountry safety", categoryJa: "バックカントリー安全情報", label: "Japan Avalanche Network (JAN) · Northern Alps bulletin", labelJa: "日本雪崩ネットワーク · 北アルプスエリア", url: "https://nadare.jp/" },
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
