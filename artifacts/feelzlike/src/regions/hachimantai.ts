import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Hachimantai · the quiet Tohoku highland on the north side of Mt
 * Iwate, next valley over from Appi Kogen:
 *
 *   Hachimantai     → the spread-out city on the JR Hanawa line ·
 *                     Obuke station is the rail gateway, with the
 *                     Hachimantai Onsenkyo hotel area up the hill
 *
 * The two Hachimantai Resort hills share one ticket and a free
 * shuttle: Panorama (a gentle family hill behind the Hachimantai
 * Mountain Hotel) and Shimokura (the powder hill on the east slope of
 * Mt Shimokura at 1,177m, sheltered from wind and known for very dry
 * "ultralight" snow). The famous spring-only Hachimantai ropeway
 * terrain and cat-skiing sit higher on the plateau.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain for each resort.
 */
export const hachimantaiRegion: RegionConfig = {
  id: "hachimantai",
  name: "Hachimantai",
  subtitle: "Iwate · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Hachimantai Panorama", "Hachimantai Shimokura"],
  resorts: [
    { path: "/mountain/hachimantai-panorama",  label: "Hachimantai Panorama",  labelJa: "八幡平リゾート パノラマスキー場" },
    { path: "/mountain/hachimantai-shimokura", label: "Hachimantai Shimokura", labelJa: "八幡平リゾート 下倉スキー場" },
  ],
  mountains: [
    {
      id: "hachimantai-panorama",
      name: "Hachimantai Panorama",
      nameJa: "八幡平リゾート パノラマスキー場",
      elevationM: 1000,
      lat: 39.8840,
      lng: 140.9775,
      blurb: "Gentle family hill behind the Hachimantai Mountain Hotel · wide north-facing courses with Mt Iwate views, one ticket with Shimokura",
      blurbJa: "八幡平マウンテンホテル裏手に広がるファミリーゲレンデ · 岩手山を望む幅広の北向きコース、下倉と共通リフト券",
      websiteUrl: "https://www.hachimantai.co.jp/winter/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "hachimantai-shimokura",
      name: "Hachimantai Shimokura",
      nameJa: "八幡平リゾート 下倉スキー場",
      elevationM: 1180,
      lat: 39.8954,
      lng: 140.9408,
      blurb: "Powder hill on the east slope of Mt Shimokura (1,177m) · wind-sheltered tree lines and very dry 'ultralight' snow, 2 km from Panorama by free shuttle",
      blurbJa: "下倉山（1,177m）東斜面のパウダーゲレンデ · 風に守られたツリーラインと極上の「ウルトラライトパウダー」、パノラマへは無料シャトルで2km",
      websiteUrl: "https://www.hachimantai.co.jp/winter/",
      beginner_friendly: false,
      kids_lessons: false,
    },
  ],
  baseTowns: [
    {
      id: "hachimantai",
      name: "Hachimantai",
      nameJa: "八幡平",
      lat: 39.900,
      lng: 141.130,
      // Hachimantai city core around Obuke station on the JR Hanawa line
      // (~230m) · the rail gateway, with the Onsenkyo hotel area and both
      // ski hills 20-25 min up the hill. Wide radius for the spread-out
      // farming city.
      radiusM: 5000,
      blurb: "Spread-out city below the plateau · Obuke station is the rail gateway, the ski hills 25 min up the hill",
      blurbJa: "高原の麓に広がる市街 · 大更駅が鉄道の玄関口で、スキー場へは車で約25分",
      nearbyMountainIds: ["hachimantai-panorama", "hachimantai-shimokura"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Hachimantai city tourism", labelJa: "八幡平市観光協会", url: "https://www.hachimantai.or.jp/" },
    { category: "Tourism", categoryJa: "観光", label: "Visit Iwate · official tourism", labelJa: "岩手県公式観光サイト", url: "https://visitiwate.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Hachimantai Resort · Panorama & Shimokura", labelJa: "八幡平リゾート パノラマ・下倉", url: "https://www.hachimantai.co.jp/winter/" },
    { category: "Transport", categoryJa: "交通", label: "JR East · trains", labelJa: "JR東日本 · 鉄道", url: "https://www.jreast.co.jp/multi/en/" },
    { category: "Transport", categoryJa: "交通", label: "Iwate Kenpoku Bus", labelJa: "岩手県北バス", url: "https://www.iwate-kenpokubus.co.jp/" },
    // Backcountry safety · the Hachimantai plateau sees serious spring
    // touring and cat-skiing; JAN covers Tohoku in season.
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
