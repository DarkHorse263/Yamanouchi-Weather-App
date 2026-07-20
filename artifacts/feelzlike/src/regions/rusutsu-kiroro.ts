import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Rusutsu & Kiroro · ninth JP region and the third in Hokkaido, pairing
 * the two big independent powder resorts on either side of the
 * Niseko range:
 *
 *   Rusutsu village → small farming village on Route 230 · the resort
 *                     hotels and lifts are right across the road
 *   Kiroro          → hotel village at the Kiroro base in Akaigawa,
 *                     about 40 min above Otaru
 *
 * Rusutsu Resort (Kamori Kanko-run · West Mt, East Mt and Mt Isola)
 * is on the Epic Pass. Kiroro Snow World sits in one of Hokkaido's
 * heaviest snowfall pockets and sells its own tickets · it is not on
 * the Epic or Ikon passes for 2025-26. The two bases are about 90 min
 * apart by road · the region exists so visitors staying at either can
 * compare both, with the distance stated rather than implied away.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain for each resort.
 */
export const rusutsuKiroroRegion: RegionConfig = {
  id: "rusutsu-kiroro",
  name: "Rusutsu & Kiroro",
  subtitle: "Hokkaido · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Rusutsu Resort", "Kiroro"],
  resorts: [
    { path: "/mountain/rusutsu-resort", label: "Rusutsu Resort", labelJa: "ルスツリゾート" },
    { path: "/mountain/kiroro-resort",  label: "Kiroro",         labelJa: "キロロリゾート" },
  ],
  mountains: [
    {
      id: "rusutsu-resort",
      name: "Rusutsu Resort",
      nameJa: "ルスツリゾート",
      elevationM: 994,
      lat: 42.7497,
      lng: 140.9033,
      blurb: "Hokkaido's big all-in-one resort across West Mt, East Mt and Mt Isola · 37 courses and about 42 km of runs, on the Epic Pass",
      blurbJa: "ウエスト・イースト・イゾラの3山に広がる北海道屈指の大型リゾート · 全37コース・総滑走距離約42km、Epicパス対象",
      websiteUrl: "https://rusutsu.com/en/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "kiroro-resort",
      name: "Kiroro",
      nameJa: "キロロリゾート",
      elevationM: 1180,
      lat: 43.0758,
      lng: 140.9822,
      blurb: "Deep-snow resort in the hills between Otaru and Sapporo · about 660 m of vertical in one of Hokkaido's heaviest snowfall pockets, on its own lift tickets rather than a multi-resort pass",
      blurbJa: "小樽と札幌の間の山あいにあるディープスノーリゾート · 標高差約660m、北海道有数の豪雪地帯。共通パス非対応で自社リフト券制",
      websiteUrl: "https://www.kiroro.co.jp/en/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "rusutsu",
      name: "Rusutsu",
      nameJa: "留寿都",
      lat: 42.7333,
      lng: 140.8833,
      // Rusutsu village core (~400 m) · small farming village on Route
      // 230 with the resort hotels and the West Mt lifts directly
      // across the road. Kiroro is about 90 min north by road.
      radiusM: 2500,
      blurb: "Small farming village on Route 230 · the resort hotels and lifts are right across the road",
      blurbJa: "国道230号沿いの小さな農村 · リゾートホテルとリフトは道路を挟んですぐ",
      nearbyMountainIds: ["rusutsu-resort", "kiroro-resort"],
    },
    {
      id: "kiroro",
      name: "Kiroro",
      nameJa: "キロロ",
      lat: 43.0758,
      lng: 140.9822,
      // Kiroro base village (~520 m) in Akaigawa · the Mountain Center
      // and ski-in hotels are the lodging here, with Otaru about 40 min
      // downhill. Rusutsu is about 90 min south by road.
      radiusM: 1500,
      blurb: "Hotel village at the Kiroro base in Akaigawa · ski-in lodging at the Mountain Center, with Otaru about 40 min downhill",
      blurbJa: "赤井川村のキロロベースにあるホテル村 · マウンテンセンターにスキーイン宿泊、小樽へ車で約40分",
      nearbyMountainIds: ["kiroro-resort", "rusutsu-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Rusutsu Village · official site", labelJa: "留寿都村公式サイト", url: "https://www.vill.rusutsu.lg.jp/" },
    { category: "Tourism", categoryJa: "観光", label: "Otaru Tourism Association", labelJa: "小樽観光協会", url: "https://otaru.gr.jp/" },
    { category: "Tourism", categoryJa: "観光", label: "HOKKAIDO LOVE! · Hokkaido official tourism", labelJa: "北海道公式観光サイト HOKKAIDO LOVE!", url: "https://www.visit-hokkaido.jp/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Rusutsu Resort", labelJa: "ルスツリゾート", url: "https://rusutsu.com/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Kiroro Resort", labelJa: "キロロリゾート", url: "https://www.kiroro.co.jp/en/" },
    { category: "Transport", categoryJa: "交通", label: "BIGRUNS bus · New Chitose Airport shuttle", labelJa: "ビッグランズ号 · 新千歳空港シャトル", url: "https://bigruns.com/?lang=en" },
    { category: "Transport", categoryJa: "交通", label: "Hokkaido Resort Liner · Sapporo and airport coaches", labelJa: "北海道リゾートライナー · 札幌・空港からの直行バス", url: "https://www.access-n.jp/" },
    { category: "Transport", categoryJa: "交通", label: "JR Hokkaido · trains to Otaru", labelJa: "JR北海道 · 小樽方面の列車", url: "https://www.jrhokkaido.co.jp/global/" },
    // Backcountry safety · Kiroro's gates and the Shiribeshi hills see
    // heavy sidecountry use; JAN's bulletins cover the area in season.
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
