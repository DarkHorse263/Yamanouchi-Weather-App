import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Asahikawa · a Hokkaido region built around Japan's second-northern
 * city and its two very different hills:
 *
 *   Asahikawa       → Hokkaido's second city · stay downtown, ski
 *                     Kamui as a day hill and ride the Asahidake
 *                     ropeway for big-mountain powder
 *   Higashikawa     → craft-and-cafe town at the foot of the
 *                     Daisetsuzan range, the gateway (and closest
 *                     beds) to Asahidake Onsen
 *
 * Kamui Ski Links (the city's local powder hill, 40 min west) and the
 * Asahidake Ropeway (lift-served sidecountry on Hokkaido's highest
 * peak, above Asahidake Onsen) are the anchors · Kamui also appears
 * as a day-trip mountain inside the Furano region; this region is the
 * Asahikawa-based view of the same hill.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain for each area.
 */
export const asahikawaRegion: RegionConfig = {
  id: "asahikawa",
  name: "Asahikawa",
  subtitle: "Hokkaido · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Kamui Ski Links", "Asahidake"],
  resorts: [
    { path: "/mountain/kamui",     label: "Kamui Ski Links", labelJa: "カムイスキーリンクス" },
    { path: "/mountain/asahidake", label: "Asahidake",       labelJa: "旭岳ロープウェイ" },
  ],
  mountains: [
    {
      id: "kamui",
      name: "Kamui Ski Links",
      nameJa: "カムイスキーリンクス",
      elevationM: 751,
      lat: 43.709,
      lng: 142.192,
      blurb: "Asahikawa's local powder hill 40 min west of the city · relaxed tree-skiing culture and quiet gondola laps at day-ticket prices",
      blurbJa: "旭川市街から西へ約40分のローカルパウダー山 · ツリーランに寛容で、ゴンドラも空いている",
      websiteUrl: "https://www.kamui-skilinks.com/",
      beginner_friendly: true,
    },
    {
      id: "asahidake",
      name: "Asahidake",
      nameJa: "旭岳ロープウェイ",
      elevationM: 1600,
      lat: 43.654,
      lng: 142.797,
      blurb: "Ropeway-served powder on Hokkaido's highest peak in the Daisetsuzan range · ungroomed big-mountain terrain above Asahidake Onsen, for confident skiers with avalanche awareness",
      blurbJa: "大雪山連峰・北海道最高峰のロープウェイパウダー · 旭岳温泉の上に広がる非圧雪の山岳地形、雪崩知識のある上級者向け",
      websiteUrl: "https://asahidake.hokkaido.jp/en/",
    },
  ],
  baseTowns: [
    {
      id: "asahikawa",
      name: "Asahikawa",
      nameJa: "旭川",
      lat: 43.7706,
      lng: 142.3649,
      // Asahikawa city centre (~120 m) · JR Asahikawa Station and the
      // Heiwa-dori shopping street, Hokkaido's second city. Stay
      // downtown and ski Kamui as a day hill · a wide radius so it
      // covers the whole city core.
      radiusM: 6000,
      blurb: "Hokkaido's second city · stay downtown, ski Kamui as a day hill and head up to Asahidake for powder days",
      blurbJa: "北海道第2の都市 · 中心部に泊まり、カムイを日帰りで滑り、パウダーの日は旭岳へ",
      nearbyMountainIds: ["kamui", "asahidake"],
    },
    {
      id: "higashikawa",
      name: "Higashikawa",
      nameJa: "東川",
      lat: 43.699,
      lng: 142.51,
      // Higashikawa town centre (~220 m) · the craft-and-photography
      // town at the foot of the Daisetsuzan range. The road to
      // Asahidake Onsen (and the ropeway) starts here, so it holds the
      // closest ordinary-town beds to the mountain.
      radiusM: 2500,
      blurb: "Craft-and-cafe town at the foot of the Daisetsuzan range · the road to Asahidake Onsen and the ropeway starts here",
      blurbJa: "大雪山の麓のクラフトとカフェの町 · 旭岳温泉とロープウェイへの道はここから",
      nearbyMountainIds: ["asahidake"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Asahikawa official tourism", labelJa: "旭川観光コンベンション協会", url: "https://www.atca.jp/" },
    { category: "Tourism", categoryJa: "観光", label: "Higashikawa town official site", labelJa: "東川町公式サイト", url: "https://higashikawa-town.jp/" },
    { category: "Tourism", categoryJa: "観光", label: "HOKKAIDO LOVE! · Hokkaido official tourism", labelJa: "北海道公式観光サイト HOKKAIDO LOVE!", url: "https://www.visit-hokkaido.jp/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Kamui Ski Links", labelJa: "カムイスキーリンクス", url: "https://www.kamui-skilinks.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Asahidake Ropeway", labelJa: "旭岳ロープウェイ", url: "https://asahidake.hokkaido.jp/en/" },
    { category: "Transport", categoryJa: "交通", label: "JR Hokkaido · trains", labelJa: "JR北海道 · 鉄道", url: "https://www.jrhokkaido.co.jp/global/" },
    { category: "Transport", categoryJa: "交通", label: "Asahikawa Airport", labelJa: "旭川空港", url: "https://www.aapb.co.jp/en/" },
    // Backcountry safety · Asahidake is genuine avalanche terrain; JAN's
    // central Hokkaido bulletin covers the Daisetsuzan range in season.
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
