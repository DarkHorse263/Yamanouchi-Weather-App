import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Hakkoda & Aomori Spring · eleventh JP region and the second in
 * Tohoku, pairing Aomori prefecture's two very different snow
 * mountains either side of the city:
 *
 *   Aomori       → prefecture capital on Mutsu Bay · the shinkansen
 *                  gateway at Shin-Aomori, and the hub for both hills
 *   Sukayu Onsen → historic sulfur bath house at about 900 m in the
 *                  Hakkoda mountains, the winter road terminus
 *   Ajigasawa    → fishing town on the Sea of Japan coast below
 *                  Aomori Spring
 *
 * Hakkoda is ropeway-served big-mountain terrain on Mt Tamoyachi ·
 * more backcountry than resort, on its own tickets. Aomori Spring is
 * a quiet gondola-served powder resort on Mt Iwaki's northwest
 * slopes, also on its own lift tickets for 2025-26 (it is not on the
 * Ikon, Epic or Mountain Collective passes). The two bases are about
 * 90 min apart by road · the region exists so visitors staying around
 * Aomori can compare both, with the distance stated rather than
 * implied away.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain for each.
 */
export const hakkodaAomoriSpringRegion: RegionConfig = {
  id: "hakkoda-aomori-spring",
  name: "Hakkoda & Aomori Spring",
  subtitle: "Aomori · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Hakkoda", "Aomori Spring"],
  resorts: [
    { path: "/mountain/hakkoda",       label: "Hakkoda",       labelJa: "八甲田" },
    { path: "/mountain/aomori-spring", label: "Aomori Spring", labelJa: "青森スプリング" },
  ],
  mountains: [
    {
      id: "hakkoda",
      name: "Hakkoda",
      nameJa: "八甲田",
      elevationM: 1324,
      // Hakkoda Ropeway Sanroku (base) station at about 670 m.
      lat: 40.6784,
      lng: 140.8453,
      blurb: "Ropeway-served big-mountain riding on Mt Tamoyachi · long ungroomed descents through juhyo snow monsters, more backcountry than resort · a guide is recommended beyond the marked courses",
      blurbJa: "田茂萢岳のロープウェー山岳エリア · 樹氷帯を滑るロングコース、ゲレンデというより山そのもの · コース外はガイド推奨",
      websiteUrl: "https://www.hakkoda-ropeway.jp/",
      beginner_friendly: false,
      kids_lessons: false,
    },
    {
      id: "aomori-spring",
      name: "Aomori Spring",
      nameJa: "青森スプリング",
      elevationM: 921,
      // Rockwood Hotel & Spa base area on Mt Iwaki's northwest slopes.
      lat: 40.6952,
      lng: 140.2833,
      blurb: "Quiet powder resort on Mt Iwaki's northwest slopes above Ajigasawa · a gondola and about 545 m of vertical, on its own lift tickets rather than a multi-resort pass",
      blurbJa: "岩木山北西斜面、鰺ヶ沢の上に広がる静かなパウダーリゾート · ゴンドラ1基・標高差約545m。共通パス非対応で自社リフト券制",
      websiteUrl: "https://aomorispring.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "aomori",
      name: "Aomori",
      nameJa: "青森",
      // City core around Aomori Station on Mutsu Bay (near sea level) ·
      // Hakkoda is about an hour up the winter bus, Aomori Spring about
      // 90 min west by road.
      lat: 40.8289,
      lng: 140.7336,
      radiusM: 3000,
      blurb: "Prefecture capital on Mutsu Bay · the shinkansen gateway at Shin-Aomori, with the winter Hakkoda-go bus climbing to the ropeway in about an hour",
      blurbJa: "陸奥湾に面した県庁所在地 · 新青森駅が新幹線の玄関口、冬は八甲田号バスで約1時間でロープウェー駅へ",
      nearbyMountainIds: ["hakkoda", "aomori-spring"],
    },
    {
      id: "sukayu-onsen",
      name: "Sukayu Onsen",
      nameJa: "酸ヶ湯温泉",
      // Sukayu Onsen ryokan (~900 m) · the winter road terminus, about
      // 10 min above the ropeway base in one of Japan's snowiest
      // inhabited places.
      lat: 40.6506,
      lng: 140.8505,
      radiusM: 800,
      blurb: "Historic sulfur bath house at about 900 m in the Hakkoda mountains · the winter bus terminus, ten minutes above the ropeway in one of Japan's snowiest inhabited places",
      blurbJa: "八甲田山中・標高約900mの歴史ある湯治宿 · 冬季バスの終点、ロープウェー駅まで約10分。日本有数の豪雪地",
      nearbyMountainIds: ["hakkoda", "aomori-spring"],
    },
    {
      id: "ajigasawa",
      name: "Ajigasawa",
      nameJa: "鰺ヶ沢",
      // Town core around Ajigasawa Station on the Gono line (coastal) ·
      // Aomori Spring is about 20 min up the hill toward Mt Iwaki.
      lat: 40.7755,
      lng: 140.2209,
      radiusM: 2000,
      blurb: "Fishing town on the Sea of Japan coast · the Gono line stops here, with Aomori Spring about 20 minutes up the hill toward Mt Iwaki",
      blurbJa: "日本海に面した漁師町 · 五能線の駅があり、岩木山方面へ車で約20分で青森スプリング",
      nearbyMountainIds: ["aomori-spring", "hakkoda"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Amazing AOMORI · Aomori official tourism", labelJa: "青森県公式観光サイト Amazing AOMORI", url: "https://aomori-tourism.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Hakkoda Ropeway", labelJa: "八甲田ロープウェー", url: "https://www.hakkoda-ropeway.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Aomori Spring Resort", labelJa: "青森スプリング・スキーリゾート", url: "https://aomorispring.com/" },
    { category: "Transport", categoryJa: "交通", label: "JR Bus Tohoku · winter Hakkoda-go bus", labelJa: "JRバス東北 · 冬の八甲田号", url: "https://www.jrbustohoku.co.jp/" },
    { category: "Transport", categoryJa: "交通", label: "JR East · Tohoku Shinkansen to Shin-Aomori", labelJa: "JR東日本 · 東北新幹線（新青森）", url: "https://www.jreast.co.jp/en/multi/" },
    // Backcountry safety · Hakkoda is serious avalanche terrain, but the
    // Japan Avalanche Network publishes no Hakkoda bulletin (its regional
    // bulletins cover other areas), so the link is framed as general
    // avalanche safety education · never claim local bulletin coverage.
    { category: "Backcountry safety", categoryJa: "バックカントリー安全情報", label: "Japan Avalanche Network (JAN) · avalanche safety resources", labelJa: "日本雪崩ネットワーク · 雪崩安全情報", url: "https://nadare.jp/" },
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
