import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Sapporo · a Hokkaido region built around the ski hills that ring
 * Japan's fifth-largest city, all reachable as day trips from downtown:
 *
 *   Sapporo         → the capital itself · stay downtown and ski Teine,
 *                     Kokusai or Bankei as day hills, back for dinner
 *   Jozankei        → hot-spring town in the Toyohira valley, the
 *                     closest beds to Sapporo Kokusai
 *
 * Sapporo Teine (40 min from downtown, two zones with sea-of-Japan
 * views and the 1972 Olympic slalom slopes), Sapporo Kokusai (a
 * deep-snow local favourite above Jozankei onsen) and Sapporo Bankei
 * (an in-city night-skiing hill 20 min from Odori) are the three
 * anchors · none is a destination resort on its own, but together
 * they make Sapporo a rare big-city ski base.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain for each resort.
 */
export const sapporoRegion: RegionConfig = {
  id: "sapporo",
  name: "Sapporo",
  subtitle: "Hokkaido · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Sapporo Teine", "Sapporo Kokusai", "Sapporo Bankei"],
  resorts: [
    { path: "/mountain/sapporo-teine",    label: "Sapporo Teine",    labelJa: "サッポロテイネ" },
    { path: "/mountain/sapporo-kokusai",  label: "Sapporo Kokusai",  labelJa: "札幌国際スキー場" },
    { path: "/mountain/sapporo-bankei",   label: "Sapporo Bankei",   labelJa: "さっぽろばんけいスキー場" },
  ],
  mountains: [
    {
      id: "sapporo-teine",
      name: "Sapporo Teine",
      nameJa: "サッポロテイネ",
      elevationM: 1023,
      lat: 43.083,
      lng: 141.185,
      blurb: "City powder hill 40 min from downtown Sapporo · two zones (Olympia and Highland) with sea-of-Japan views from Mt Teine and the 1972 Olympic slalom slopes",
      blurbJa: "札幌中心部から40分の街のパウダー山 · オリンピア・ハイランドの2ゾーンで手稲山から日本海を望み、1972年五輪の回転コースも",
      websiteUrl: "https://sapporo-teine.com/snow/lang/en/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "sapporo-kokusai",
      name: "Sapporo Kokusai",
      nameJa: "札幌国際スキー場",
      elevationM: 1100,
      lat: 43.0730,
      lng: 141.0702,
      blurb: "Deep-snow local favourite above Jozankei onsen · wide gondola-served cruisers and some of the heaviest snowfall totals near the city",
      blurbJa: "定山渓温泉の上に広がる豪雪のローカル人気ゲレンデ · ゴンドラで結ぶ広いクルージングコースと、市街近郊でも屈指の降雪量",
      websiteUrl: "https://www.sapporo-kokusai.jp/en/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "sapporo-bankei",
      name: "Sapporo Bankei",
      nameJa: "さっぽろばんけいスキー場",
      elevationM: 482,
      lat: 43.033,
      lng: 141.264,
      blurb: "In-city night-skiing hill 20 min from Odori · floodlit runs and lessons, handy for a quick evening ski",
      blurbJa: "大通から20分の市内ナイタースキー場 · 照明付きコースとレッスンがあり、仕事帰りのひと滑りに便利",
      websiteUrl: "https://www.bankei.co.jp/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "sapporo",
      name: "Sapporo",
      nameJa: "札幌",
      lat: 43.0621,
      lng: 141.3544,
      // Sapporo city centre (~26 m) · JR Sapporo Station and Odori, the
      // heart of Hokkaido's capital. Stay downtown and ski Teine,
      // Kokusai or Bankei as day hills · a wide radius so it covers the
      // whole city core.
      radiusM: 6000,
      blurb: "Hokkaido's capital · stay downtown, ski Teine, Kokusai or Bankei as day hills",
      blurbJa: "北海道の道都 · 中心部に泊まり、テイネ・国際・ばんけいを日帰りで滑る",
      nearbyMountainIds: ["sapporo-teine", "sapporo-kokusai", "sapporo-bankei"],
    },
    {
      id: "jozankei",
      name: "Jozankei",
      nameJa: "定山渓",
      lat: 42.971,
      lng: 141.180,
      // Jozankei onsen town (~257 m) · the hot-spring resort in the
      // Toyohira valley, the closest beds to Sapporo Kokusai. Tight
      // radius so it stays its own town, not part of the city core.
      radiusM: 2000,
      blurb: "Hot-spring town in the Toyohira valley · closest beds to Sapporo Kokusai",
      blurbJa: "豊平川の渓谷にある温泉街 · 札幌国際スキー場に最も近い宿",
      nearbyMountainIds: ["sapporo-kokusai"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Sapporo official tourism", labelJa: "札幌市公式観光サイト", url: "https://www.sapporo.travel/en/" },
    { category: "Tourism", categoryJa: "観光", label: "HOKKAIDO LOVE! · Hokkaido official tourism", labelJa: "北海道公式観光サイト HOKKAIDO LOVE!", url: "https://www.visit-hokkaido.jp/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Sapporo Teine", labelJa: "サッポロテイネ", url: "https://sapporo-teine.com/snow/lang/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Sapporo Kokusai", labelJa: "札幌国際スキー場", url: "https://www.sapporo-kokusai.jp/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Sapporo Bankei", labelJa: "さっぽろばんけいスキー場", url: "https://www.bankei.co.jp/" },
    { category: "Transport", categoryJa: "交通", label: "JR Hokkaido · trains", labelJa: "JR北海道 · 鉄道", url: "https://www.jrhokkaido.co.jp/global/" },
    { category: "Transport", categoryJa: "交通", label: "Hokkaido Chuo Bus", labelJa: "北海道中央バス", url: "https://www.chuo-bus.co.jp/" },
    // Backcountry safety · the hills behind Sapporo see plenty of
    // sidecountry use; JAN's central Hokkaido bulletin covers the area
    // in season.
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
