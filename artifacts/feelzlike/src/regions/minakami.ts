import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Minakami · Gunma's shinkansen-close ski valley at the head of the
 * Tone river, a classic Tokyo weekend trip via Jomo-Kogen station:
 *
 *   Minakami        → the onsen town on the JR Joetsu line · beds,
 *                     baths and buses up to every hill in the valley
 *
 * Tanigawadake Tenjindaira (a ropeway-served snow bowl at 1,319m on
 * Tanigawa-dake, rebranded "Mt.T by Hoshino Resorts" from 2024 and
 * famous for its sidecountry), Minakami Kogen (a family resort around
 * the Hotel 200 at 850m) and Norn Minakami (the closest hill to the
 * Kanetsu expressway, big on night skiing and day trips) are the three
 * anchors we model · the valley has several smaller hills besides.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain for each resort.
 */
export const minakamiRegion: RegionConfig = {
  id: "minakami",
  name: "Minakami",
  subtitle: "Gunma · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Tanigawadake Tenjindaira", "Minakami Kogen", "Norn Minakami"],
  resorts: [
    { path: "/mountain/tenjindaira",     label: "Tanigawadake Tenjindaira", labelJa: "谷川岳天神平スキー場" },
    { path: "/mountain/minakami-kogen",  label: "Minakami Kogen",           labelJa: "水上高原スキーリゾート" },
    { path: "/mountain/norn-minakami",   label: "Norn Minakami",            labelJa: "ノルンみなかみスキー場" },
  ],
  mountains: [
    {
      id: "tenjindaira",
      name: "Tanigawadake Tenjindaira",
      nameJa: "谷川岳天神平スキー場",
      elevationM: 1500,
      lat: 36.833,
      lng: 138.947,
      blurb: "Ropeway-served snow bowl at 1,319m on Tanigawa-dake, now Mt.T by Hoshino Resorts · huge snowfalls, a long spring season and Japan-famous sidecountry",
      blurbJa: "谷川岳の標高1,319mに広がるロープウェイ直結の雪のボウル、現在は「Mt.T by 星野リゾート」 · 豪雪と長い春スキー、全国区のサイドカントリーで有名",
      websiteUrl: "https://tanigawadake-joch.com/en/mt-t/",
      beginner_friendly: false,
      kids_lessons: false,
    },
    {
      id: "minakami-kogen",
      name: "Minakami Kogen",
      nameJa: "水上高原スキーリゾート",
      elevationM: 1248,
      lat: 36.878,
      lng: 139.040,
      blurb: "Family resort around the ski-in Hotel 200 at 850m · gentle wide courses, snow activities and kids' areas at the quiet top of the valley",
      blurbJa: "標高850mのスキーイン「ホテル200」を囲むファミリーリゾート · 幅広の緩斜面と雪遊び、キッズエリアが揃う谷の奥の静かなゲレンデ",
      websiteUrl: "https://minakamikogen200.jp/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "norn-minakami",
      name: "Norn Minakami",
      nameJa: "ノルンみなかみスキー場",
      elevationM: 1220,
      lat: 36.743,
      lng: 138.942,
      blurb: "Day-trip hill 5 min off the Kanetsu expressway · compact tree-lined courses from 820m to 1,220m and some of Kanto's best night skiing",
      blurbJa: "関越道水上ICから5分の日帰りゲレンデ · 標高820〜1,220mの林間コースと関東屈指のナイター",
      websiteUrl: "https://www.norn.co.jp/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "minakami",
      name: "Minakami",
      nameJa: "みなかみ",
      lat: 36.780,
      lng: 138.968,
      // Minakami Onsen town core (~490m) around JR Minakami Station and
      // the onsen street along the Tone river. Buses run up-valley to
      // Tenjindaira and Minakami Kogen and down to Norn's shuttle stop.
      radiusM: 3000,
      blurb: "Onsen town on the Tone river · beds, baths and buses to every hill in the valley",
      blurbJa: "利根川沿いの温泉町 · 宿と湯と、谷のどのゲレンデへも出るバスの起点",
      nearbyMountainIds: ["tenjindaira", "minakami-kogen", "norn-minakami"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Minakami official tourism", labelJa: "みなかみ町観光協会", url: "https://www.enjoy-minakami.com/" },
    { category: "Tourism", categoryJa: "観光", label: "Visit Gunma · official tourism", labelJa: "群馬県公式観光サイト", url: "https://www.visit-gunma.jp/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Mt.T by Hoshino Resorts (Tenjindaira)", labelJa: "Mt.T by 星野リゾート（天神平）", url: "https://tanigawadake-joch.com/en/mt-t/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Minakami Kogen", labelJa: "水上高原スキーリゾート", url: "https://minakamikogen200.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Norn Minakami", labelJa: "ノルンみなかみスキー場", url: "https://www.norn.co.jp/" },
    { category: "Transport", categoryJa: "交通", label: "JR East · trains", labelJa: "JR東日本 · 鉄道", url: "https://www.jreast.co.jp/multi/en/" },
    { category: "Transport", categoryJa: "交通", label: "Kan-etsu Kotsu · local buses", labelJa: "関越交通 · 路線バス", url: "https://kan-etsu.net/" },
    // Backcountry safety · Tanigawa-dake is one of Japan's most serious
    // sidecountry mountains; JAN covers the area in season.
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
