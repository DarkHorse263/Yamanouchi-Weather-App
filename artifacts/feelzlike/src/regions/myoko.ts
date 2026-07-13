import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Myoko · fifth JP region and the first in Niigata. Six resorts around
 * Mt Myoko (2,454 m), one of Japan's deepest-snow areas, each a distinct
 * ski area with its own base, website and character:
 *
 *   Akakura Onsen village (main hub) → Akakura Onsen, Akakura Kanko,
 *                                       Seki Onsen (up the road north)
 *   Ikenotaira Onsen                 → Ikenotaira Alpen Blick
 *   Suginosawa (south)               → Myoko Suginohara
 *   Arai · Myoko City (north)        → Lotte Arai
 *
 * All six are listed as sibling mountains · they share no common lift
 * pass and are physically separate ski areas, so siblings keep the IA
 * honest (same precedent as Hakuba Valley / Iiyama). Suginohara and
 * Lotte Arai are on the Ikon Pass (2025-26) · noted in their blurbs.
 *
 * Coordinates are base-area points (OpenStreetMap winter_sports nodes);
 * elevationM is the top-lift summit for each resort.
 */
export const myokoRegion: RegionConfig = {
  id: "myoko",
  name: "Myoko",
  subtitle: "Niigata · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: [
    "Akakura Onsen · Akakura Kanko",
    "Suginohara · Ikenotaira",
    "Lotte Arai · Seki Onsen",
  ],
  resorts: [
    { path: "/mountain/akakura-onsen",    label: "Akakura Onsen",        labelJa: "赤倉温泉" },
    { path: "/mountain/akakura-kanko",    label: "Akakura Kanko",        labelJa: "赤倉観光リゾート" },
    { path: "/mountain/ikenotaira",       label: "Ikenotaira Alpen Blick", labelJa: "池の平温泉アルペンブリック" },
    { path: "/mountain/myoko-suginohara", label: "Myoko Suginohara",     labelJa: "妙高杉ノ原" },
    { path: "/mountain/seki-onsen",       label: "Seki Onsen",           labelJa: "関温泉" },
    { path: "/mountain/lotte-arai",       label: "Lotte Arai",           labelJa: "ロッテアライリゾート" },
  ],
  mountains: [
    {
      id: "akakura-onsen",
      name: "Akakura Onsen",
      nameJa: "赤倉温泉スキー場",
      elevationM: 1200,
      lat: 36.8964,
      lng: 138.1674,
      blurb: "Myoko's liveliest slopes above the historic onsen village · 100% natural snow and the area's only nightly night skiing",
      blurbJa: "歴史ある温泉街の上に広がる妙高で最も賑わうゲレンデ · 天然雪100%、エリア唯一の毎晩ナイター営業",
      websiteUrl: "https://akakura-ski.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "akakura-kanko",
      name: "Akakura Kanko (Akakan)",
      nameJa: "赤倉観光リゾートスキー場",
      elevationM: 1500,
      lat: 36.8903,
      lng: 138.1604,
      blurb: "Japan's first international mountain resort (1937) · long groomers off the Sky Cable beneath the landmark Akakura Kanko Hotel",
      blurbJa: "1937年開業、日本初の国際山岳リゾート · 赤倉観光ホテルの下、スカイケーブル沿いのロングコース",
      websiteUrl: "https://akr-ski.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "ikenotaira",
      name: "Ikenotaira Alpen Blick",
      nameJa: "池の平温泉アルペンブリックスキー場",
      elevationM: 1413,
      lat: 36.8733,
      lng: 138.1584,
      blurb: "Broad, open slopes on Mt Myoko's flank · relaxed cruising above the Ikenotaira onsen village and Imori Pond",
      blurbJa: "妙高山麓に広がるワイドで開放的な斜面 · 池の平温泉街といもり池の上でのんびりクルージング",
      websiteUrl: "https://alpenblick-resort.com/ski",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "myoko-suginohara",
      name: "Myoko Suginohara",
      nameJa: "妙高杉ノ原スキー場",
      elevationM: 1855,
      lat: 36.8633,
      lng: 138.1357,
      blurb: "Japan's longest run · 8.5 km top to bottom off the area's highest lifts, on the Ikon Pass",
      blurbJa: "日本最長8.5kmのロングラン · エリア最高地点のリフトから麓まで、Ikonパス対象",
      websiteUrl: "https://www.princehotels.co.jp/ski/myoko/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "seki-onsen",
      name: "Seki Onsen",
      nameJa: "関温泉スキー場",
      elevationM: 1200,
      lat: 36.9050,
      lng: 138.1569,
      blurb: "Two lifts and some of Japan's heaviest snowfall · small, steep and ungroomed on Mt Myoko's north-east side",
      blurbJa: "リフト2本と日本屈指の豪雪 · 妙高山北東斜面の小さく急な非圧雪ゲレンデ",
      // sekionsen.com now 301s to an unrelated parked domain (hijacked) ·
      // the live official site is sekionsen.jp (HTTP only, no TLS).
      websiteUrl: "http://sekionsen.jp/",
      backcountry_access: true,
    },
    {
      id: "lotte-arai",
      name: "Lotte Arai Resort",
      nameJa: "ロッテアライリゾート",
      elevationM: 1280,
      lat: 36.9909,
      lng: 138.1816,
      blurb: "Big-vertical freeride resort on Mt Okenashi · gated powder zones over 951 m of drop, on the Ikon Pass",
      blurbJa: "大毛無山のビッグバーティカル・フリーライドリゾート · 標高差951mのゲート制パウダーゾーン、Ikonパス対象",
      websiteUrl: "https://www.lottehotel.com/arai-resort/en/",
      kids_lessons: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "akakura",
      name: "Akakura Onsen",
      nameJa: "赤倉温泉",
      lat: 36.8876,
      lng: 138.1802,
      // Akakura Onsen village core (~750 m) · Myoko's main hub with the
      // largest strip of ryokan, bars and restaurants. Radius covers the
      // village and the two Akakura resort bases immediately above it;
      // Seki Onsen sits ~3 km north up its own road but Akakura is the
      // base most guests stay in.
      radiusM: 3000,
      blurb: "Myoko's main hub village · Akakura Onsen and Akakura Kanko on the doorstep, Seki Onsen up the road",
      blurbJa: "妙高の中心となる温泉街 · 赤倉温泉・赤倉観光リゾートが目の前、関温泉へも近い",
      nearbyMountainIds: ["akakura-onsen", "akakura-kanko", "seki-onsen"],
    },
    {
      id: "ikenotaira-onsen",
      name: "Ikenotaira Onsen",
      nameJa: "池の平温泉",
      lat: 36.8750,
      lng: 138.1660,
      // Ikenotaira onsen village by Imori Pond · quieter base between
      // Akakura and Suginosawa, ~4 km from Myoko-Kogen station.
      radiusM: 2000,
      blurb: "Quiet onsen village by Imori Pond · Alpen Blick's slopes rise straight behind town",
      blurbJa: "いもり池のほとりの静かな温泉街 · アルペンブリックのゲレンデが町のすぐ裏に",
      nearbyMountainIds: ["ikenotaira"],
    },
    {
      id: "suginosawa",
      name: "Suginosawa",
      nameJa: "杉野沢",
      lat: 36.8495,
      lng: 138.1601,
      // Suginosawa village (~730 m) · the small farming-and-lodges hamlet
      // at the foot of Suginohara, south end of the Myoko Kogen plateau.
      radiusM: 2500,
      blurb: "Small village at the foot of Suginohara · lodges and pensions at the quiet south end",
      blurbJa: "杉ノ原の麓の小さな集落 · 静かな南端に宿とペンションが点在",
      nearbyMountainIds: ["myoko-suginohara"],
    },
    {
      id: "arai",
      name: "Arai",
      nameJa: "新井",
      lat: 37.0006,
      lng: 138.2259,
      // Arai district of Myoko City on the valley floor (~90 m) · the
      // lowland service town nearest Lotte Arai, with Arai Station on the
      // Myoko Haneuma Line and the Arai Smart IC off the Joshin-etsu
      // Expressway. Wider radius reaches west toward the resort road.
      radiusM: 6000,
      blurb: "Valley-floor service town · gateway to Lotte Arai's gondola on Mt Okenashi",
      blurbJa: "平野部のサービスタウン · 大毛無山ロッテアライリゾートへの玄関口",
      nearbyMountainIds: ["lotte-arai"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Myoko Tourism Bureau", labelJa: "妙高観光局", url: "https://www.myoko.tv/" },
    { category: "Tourism", categoryJa: "観光", label: "Enjoy Niigata · prefecture travel guide", labelJa: "にいがた観光ナビ", url: "https://enjoyniigata.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Akakura Onsen", labelJa: "赤倉温泉スキー場", url: "https://akakura-ski.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Akakura Kanko Resort", labelJa: "赤倉観光リゾートスキー場", url: "https://akr-ski.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Ikenotaira Alpen Blick", labelJa: "池の平温泉アルペンブリックスキー場", url: "https://alpenblick-resort.com/ski" },
    { category: "Resorts", categoryJa: "スキー場", label: "Myoko Suginohara", labelJa: "妙高杉ノ原スキー場", url: "https://www.princehotels.co.jp/ski/myoko/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Seki Onsen", labelJa: "関温泉スキー場", url: "http://sekionsen.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Lotte Arai Resort", labelJa: "ロッテアライリゾート", url: "https://www.lottehotel.com/arai-resort/en/" },
    { category: "Transport", categoryJa: "交通", label: "JR East · Hokuriku Shinkansen (to Nagano / Joetsumyoko)", labelJa: "JR東日本 · 北陸新幹線 (長野・上越妙高)", url: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html" },
    { category: "Transport", categoryJa: "交通", label: "Shinano Railway · Kita-Shinano Line (Nagano · Myoko-Kogen)", labelJa: "しなの鉄道 · 北しなの線 (長野・妙高高原)", url: "https://www.shinanorailway.co.jp/" },
    { category: "Transport", categoryJa: "交通", label: "Echigo Tokimeki Railway · Myoko Haneuma Line", labelJa: "えちごトキめき鉄道 · 妙高はねうまライン", url: "https://www.echigo-tokimeki.co.jp/" },
    // Backcountry safety · Myoko is a major sidecountry / gated-zone area
    // (Lotte Arai's freeride zones, Seki's ungroomed terrain, Mitahara).
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
