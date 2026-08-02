import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Tomamu & Sahoro · a Hokkaido region pairing the two destination
 * resorts along the JR Sekisho Line in the Yufutsu / Tokachi hills:
 *
 *   Tomamu          → the resort village itself · hotel towers, the
 *                     Ice Village and JR Tomamu Station at the base
 *   Shimukappu      → the small village that administers Tomamu,
 *                     20 min west along Route 237
 *
 * Hoshino Resorts Tomamu (hotel-tower resort off Mt Tomamu, a stop on
 * the limited express from Sapporo) and Sahoro Resort (the Club
 * Med-adjacent hill on Mt Sahoro above Shintoku, ~40 min further up
 * the line) are honest siblings · each is its own trip, and both are
 * reached from the same rail corridor. Tomamu also appears as a
 * day-trip mountain inside the Furano region · this region is the
 * stay-at-the-resort view of the same hill.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain for each resort.
 */
export const tomamuSahoroRegion: RegionConfig = {
  id: "tomamu-sahoro",
  name: "Tomamu & Sahoro",
  subtitle: "Hokkaido · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Hoshino Resorts Tomamu", "Sahoro Resort"],
  resorts: [
    { path: "/mountain/tomamu-resort", label: "Hoshino Resorts Tomamu", labelJa: "星野リゾート トマム" },
    { path: "/mountain/sahoro",        label: "Sahoro Resort",          labelJa: "サホロリゾートスキー場" },
  ],
  mountains: [
    {
      id: "tomamu-resort",
      name: "Hoshino Resorts Tomamu",
      nameJa: "星野リゾート トマム",
      elevationM: 1239,
      lat: 43.058,
      lng: 142.621,
      blurb: "Hotel-tower resort off Mt Tomamu on the JR Sekisho Line · groomed cruisers, a big kids' programme, the winter Ice Village and ski-in stays at the towers",
      blurbJa: "JR石勝線沿い、トマム山のホテルリゾート · 圧雪クルージング、充実のキッズプログラム、冬のアイスヴィレッジ、タワー直結のスキーイン滞在",
      websiteUrl: "https://www.snowtomamu.jp/winter/en/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "sahoro",
      name: "Sahoro Resort",
      nameJa: "サホロリゾートスキー場",
      elevationM: 1030,
      lat: 43.187,
      lng: 142.804,
      blurb: "Quiet Tokachi resort on Mt Sahoro above Shintoku · long fall-line cruisers off a single gondola, home to Club Med Sahoro's all-inclusive village",
      blurbJa: "新得町の佐幌岳に広がる静かな十勝のスキー場 · ゴンドラ1本で回す素直なロングコース、クラブメッド北海道サホロが隣接",
      websiteUrl: "https://sahoro.co.jp/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "tomamu-village",
      name: "Tomamu",
      nameJa: "トマム",
      lat: 43.0572,
      lng: 142.6126,
      // Tomamu resort village (~620 m) · JR Tomamu Station and the
      // hotel towers at the resort base. Tight radius so it stays the
      // resort village, not the wider Shimukappu valley.
      radiusM: 2000,
      blurb: "Resort village at the base of Mt Tomamu · hotel towers, the Ice Village and JR Tomamu Station",
      blurbJa: "トマム山の麓のリゾート村 · ホテルタワー、アイスヴィレッジ、JRトマム駅",
      nearbyMountainIds: ["tomamu-resort"],
    },
    {
      id: "shimukappu",
      name: "Shimukappu",
      nameJa: "占冠",
      lat: 43.0,
      lng: 142.4167,
      // Shimukappu village centre (~400 m) · the small village that
      // administers Tomamu, 20 min west on Route 237 with JR Shimukappu
      // Station on the same line.
      radiusM: 2500,
      blurb: "Small village 20 min west of Tomamu · quiet local beds and JR Shimukappu Station on the same line",
      blurbJa: "トマムから西へ20分の小さな村 · 静かな宿とJR占冠駅",
      nearbyMountainIds: ["tomamu-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Shimukappu Village official site", labelJa: "占冠村公式サイト", url: "https://www.vill.shimukappu.lg.jp/" },
    { category: "Tourism", categoryJa: "観光", label: "HOKKAIDO LOVE! · Hokkaido official tourism", labelJa: "北海道公式観光サイト HOKKAIDO LOVE!", url: "https://www.visit-hokkaido.jp/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Hoshino Resorts Tomamu", labelJa: "星野リゾート トマム", url: "https://www.snowtomamu.jp/winter/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Sahoro Resort", labelJa: "サホロリゾートスキー場", url: "https://sahoro.co.jp/" },
    { category: "Transport", categoryJa: "交通", label: "JR Hokkaido · trains", labelJa: "JR北海道 · 鉄道", url: "https://www.jrhokkaido.co.jp/global/" },
    { category: "Transport", categoryJa: "交通", label: "Hokkaido Resort Liner · New Chitose Airport coaches", labelJa: "北海道リゾートライナー · 新千歳空港からの直行バス", url: "https://www.access-n.jp/" },
    // Backcountry safety · the Tokachi ranges see sidecountry use; JAN's
    // central Hokkaido bulletin covers the area in season.
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
