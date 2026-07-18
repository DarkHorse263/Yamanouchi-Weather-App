import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Furano · eighth JP region and the second in Hokkaido, anchored on
 * Furano Ski Resort in the island's central "powder belt":
 *
 *   Furano town     → hub town on the JR Furano Line · winter coaches
 *                     from Sapporo, New Chitose and Asahikawa Airport
 *   Kitanomine      → ski village at the Kitanomine gondola base,
 *                     walking distance to the lifts
 *
 * Furano Ski Resort (Prince-run, two linked zones · Kitanomine and
 * Furano) is the anchor and joins the Ikon Pass from 2025-26. Kamui
 * Ski Links (an hour north, toward Asahikawa) and Hoshino Resorts
 * Tomamu (about 50 min south-east) are honest day-trip siblings ·
 * their distance from town is stated in the blurbs rather than
 * implied away. Sahoro and Asahidake are intentionally excluded ·
 * they are their own trips, not Furano-based days.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain for each resort.
 */
export const furanoRegion: RegionConfig = {
  id: "furano",
  name: "Furano",
  subtitle: "Hokkaido · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Furano Ski Resort", "Kamui Ski Links", "Tomamu"],
  resorts: [
    { path: "/mountain/furano-ski-resort", label: "Furano Ski Resort", labelJa: "富良野スキー場" },
    { path: "/mountain/kamui-ski-links",   label: "Kamui Ski Links",   labelJa: "カムイスキーリンクス" },
    { path: "/mountain/tomamu",            label: "Tomamu",            labelJa: "星野リゾート トマム" },
  ],
  mountains: [
    {
      id: "furano-ski-resort",
      name: "Furano Ski Resort",
      nameJa: "富良野スキー場",
      elevationM: 1074,
      lat: 43.335,
      lng: 142.361,
      blurb: "Prince-run flagship of central Hokkaido · two linked zones (Kitanomine and Furano) with about 950 m of vertical, on the Ikon Pass from 2025-26",
      blurbJa: "プリンス運営の中央北海道を代表するスキー場 · 北の峰・富良野の2ゾーンで標高差約950m、2025-26シーズンからIkonパス対象",
      websiteUrl: "https://www.princehotels.com/en/ski/furano/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "kamui-ski-links",
      name: "Kamui Ski Links",
      nameJa: "カムイスキーリンクス",
      elevationM: 751,
      lat: 43.709,
      lng: 142.192,
      blurb: "Asahikawa's local powder hill about an hour north of Furano · relaxed tree-skiing culture and quiet gondola laps at day-ticket prices",
      blurbJa: "富良野から北へ約1時間、旭川のローカルパウダー山 · ツリーランに寛容で、ゴンドラも空いている",
      websiteUrl: "https://www.kamui-skilinks.com/",
      beginner_friendly: true,
    },
    {
      id: "tomamu",
      name: "Hoshino Resorts Tomamu",
      nameJa: "星野リゾート トマム",
      elevationM: 1239,
      lat: 43.058,
      lng: 142.621,
      blurb: "Hotel-tower resort about 50 min south-east of Furano · groomed cruisers off Mt Tomamu, a big kids' programme and the winter Ice Village",
      blurbJa: "富良野から南東へ約50分のホテルリゾート · トマム山の圧雪クルージング、キッズプログラム、冬のアイスヴィレッジ",
      websiteUrl: "https://www.snowtomamu.jp/winter/en/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "furano",
      name: "Furano",
      nameJa: "富良野",
      lat: 43.3420,
      lng: 142.3833,
      // Furano town core (~175 m) · JR Furano Station, the wine-and-
      // lavender farm town at the geographic centre of Hokkaido. Hub
      // for trains from Asahikawa and winter coaches from Sapporo and
      // both airports · ~10 min up to the ski resort.
      radiusM: 2500,
      blurb: "Central Hokkaido's hub town · trains, winter coaches and a 10 minute run up to the ski resort",
      blurbJa: "北海道のへそにある拠点の町 · 鉄道と冬季バス、スキー場へ車で約10分",
      nearbyMountainIds: ["furano-ski-resort", "kamui-ski-links", "tomamu"],
    },
    {
      id: "kitanomine",
      name: "Kitanomine",
      nameJa: "北の峰",
      lat: 43.3400,
      lng: 142.3655,
      // Kitanomine village (~210 m) · the lodge-and-izakaya strip
      // below the Kitanomine gondola where most international guests
      // stay. Tight radius so it doesn't bleed into Furano town 2 km
      // down the hill.
      radiusM: 1200,
      blurb: "Ski village below the Kitanomine gondola · lodges and izakaya walking distance to the lifts",
      blurbJa: "北の峰ゴンドラ下のスキー村 · 宿と居酒屋がリフトまで徒歩圏",
      nearbyMountainIds: ["furano-ski-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Furano Tourism Association", labelJa: "ふらの観光協会", url: "https://www.furanotourism.com/en/" },
    { category: "Tourism", categoryJa: "観光", label: "HOKKAIDO LOVE! · Hokkaido official tourism", labelJa: "北海道公式観光サイト HOKKAIDO LOVE!", url: "https://www.visit-hokkaido.jp/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Furano Ski Resort (Prince Snow Resorts)", labelJa: "富良野スキー場（プリンススノーリゾート）", url: "https://www.princehotels.com/en/ski/furano/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Kamui Ski Links", labelJa: "カムイスキーリンクス", url: "https://www.kamui-skilinks.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Hoshino Resorts Tomamu", labelJa: "星野リゾート トマム", url: "https://www.snowtomamu.jp/winter/en/" },
    { category: "Transport", categoryJa: "交通", label: "JR Hokkaido · Furano Line trains", labelJa: "JR北海道 · 富良野線", url: "https://www.jrhokkaido.co.jp/global/" },
    { category: "Transport", categoryJa: "交通", label: "Hokkaido Resort Liner · New Chitose Airport coaches", labelJa: "北海道リゾートライナー · 新千歳空港からの直行バス", url: "https://www.access-n.jp/" },
    { category: "Transport", categoryJa: "交通", label: "Hokkaido Chuo Bus · Sapporo-Furano highway bus", labelJa: "北海道中央バス · 高速ふらの号", url: "https://www.chuo-bus.co.jp/highway/" },
    { category: "Transport", categoryJa: "交通", label: "Furano Bus · Lavender rapid bus (Asahikawa Airport)", labelJa: "ふらのバス · 快速ラベンダー号", url: "https://www.furanobus.jp/" },
    // Backcountry safety · the Furano and Tokachi ranges see heavy
    // sidecountry and backcountry use; JAN's central Hokkaido bulletin
    // covers the area in season.
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
