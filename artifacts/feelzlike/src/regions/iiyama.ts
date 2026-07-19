import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Iiyama · third JP region. Iiyama City is the Hokuriku Shinkansen
 * gateway for north-eastern Nagano (35 min from Tokyo via JR East),
 * and four resort clusters hang off it within a 30 km arc:
 *
 *   Madarao Kogen   → Madarao Mountain Resort + Tangram Ski Circus
 *                     (lift-linked, shared 2-mountain pass · Tangram
 *                      base is technically over the Niigata border)
 *   Togari Onsen    → Togari Onsen Madarao Ski Resort
 *   Kijimadaira     → Romance no Kamisama (Kijimadaira Resort)
 *                     + Kijima Snow Park (Makinoiri Kogen)
 *   Iiyama City     → Shinkansen hub · rail-in base, bus-out to resorts
 *
 * Nozawa Onsen is intentionally NOT in this region: it has its own
 * brand and gets a standalone /nozawa-onsen page so international
 * guests can find it directly.
 *
 * Madarao + Tangram are left as two sibling mountains rather than a
 * parent-group umbrella · they share a lift pass but each has its
 * own base, website, and identity, and Tangram is on a different
 * prefecture's side of the ridge. Listing them as siblings keeps the
 * IA honest without forcing a synthetic parent group.
 */
export const iiyamaRegion: RegionConfig = {
  id: "iiyama",
  name: "Iiyama",
  subtitle: "Nagano · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Madarao + Tangram", "Togari Onsen", "Kijimadaira · Romance no Kamisama"],
  resorts: [
    { path: "/mountain/madarao",       label: "Madarao",          labelJa: "斑尾" },
    { path: "/mountain/tangram",       label: "Tangram",          labelJa: "タングラム" },
    { path: "/mountain/togari-onsen",  label: "Togari Onsen",     labelJa: "戸狩温泉" },
    { path: "/mountain/kijimadaira",   label: "Kijimadaira · Romance no Kamisama", labelJa: "木島平 · ロマンスの神様" },
    { path: "/mountain/kijima-snow-park", label: "Kijima Snow Park", labelJa: "キジマスノーパーク" },
  ],
  mountains: [
    {
      id: "madarao",
      name: "Madarao Mountain Resort",
      nameJa: "斑尾高原スキー場",
      elevationM: 1382,
      lat: 36.9056,
      lng: 138.2858,
      blurb: "Tree-run-famous Madarao · shared 2-mountain pass with Tangram across the ridge",
      blurbJa: "ツリーランで有名な斑尾 · 隣のタングラムと2マウンテン共通券",
      websiteUrl: "https://www.madarao.jp/",
      beginner_friendly: true,
      kids_lessons: true,
      backcountry_access: true,
    },
    {
      id: "tangram",
      name: "Tangram Ski Circus",
      nameJa: "タングラムスキーサーカス",
      elevationM: 1148,
      lat: 36.8917,
      lng: 138.2806,
      blurb: "Niigata-side base of the Madarao massif · family-oriented, lift-linked to Madarao",
      blurbJa: "斑尾の新潟側ベース · ファミリー向け、斑尾とリフト接続",
      websiteUrl: "https://www.tangram.jp/ski/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "togari-onsen",
      name: "Togari Onsen Madarao",
      nameJa: "戸狩温泉スキー場",
      elevationM: 1050,
      lat: 36.8722,
      lng: 138.4014,
      blurb: "Quiet onsen-side mountain · long beginner-intermediate runs above the village",
      blurbJa: "静かな温泉裏のスキー場 · 集落上に広がる初中級ロングコース",
      websiteUrl: "https://www.togari.jp/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "kijimadaira",
      name: "Kijimadaira · Romance no Kamisama",
      nameJa: "木島平スキー場",
      elevationM: 1351,
      lat: 36.8639,
      lng: 138.4006,
      blurb: "'Romance no Kamisama' resort · wide groomers and family terrain on Mt Kayano",
      blurbJa: "「恋人の聖地」 · 茅野山の幅広い圧雪バーンとファミリー向け地形",
      websiteUrl: "https://kijimadaira.jp/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "kijima-snow-park",
      name: "Kijima Snow Park (Makinoiri Kogen)",
      nameJa: "キジマスノーパーク (牧之入高原)",
      elevationM: 700,
      lat: 36.8556,
      lng: 138.4108,
      blurb: "Snow play & toboggan park · sledding, snow tubing, kids' first-time terrain",
      blurbJa: "スノープレイ・ソリ専用パーク · そり、スノーチュービング、雪遊び入門",
      websiteUrl: "https://kijimadaira.org/",
      snow_play_only: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "iiyama",
      name: "Iiyama",
      nameJa: "飯山",
      lat: 36.8514,
      lng: 138.3676,
      // Iiyama City core · Hokuriku Shinkansen station + surrounding
      // ryokan/hotel strip. Genuinely a rail-in base · most guests
      // Shinkansen into Iiyama then bus 15-30 min out to the resort
      // village. Tight radius (Shinkansen station precinct) so it
      // doesn't bleed into Togari/Kijimadaira.
      radiusM: 1500,
      blurb: "Hokuriku Shinkansen gateway · 35 min from Tokyo · bus links to every resort",
      blurbJa: "北陸新幹線の玄関口 · 東京から35分 · 各スキー場へバス接続",
      nearbyMountainIds: ["madarao", "tangram", "togari-onsen", "kijimadaira", "kijima-snow-park"],
    },
    {
      id: "madarao-kogen",
      name: "Madarao Kogen",
      nameJa: "斑尾高原",
      lat: 36.8975,
      lng: 138.2825,
      // Plateau ski-village at the base of Madarao · lodge strip,
      // ski-in/ski-out pensions, and the Madarao Activities main
      // building. Radius covers the village core, not the wider
      // forest.
      radiusM: 1200,
      blurb: "Plateau ski village · ski-in lodges at the base of Madarao",
      blurbJa: "高原のスキー村 · 斑尾ベースのスキーイン宿",
      nearbyMountainIds: ["madarao", "tangram"],
    },
    {
      id: "togari-onsen-village",
      name: "Togari Onsen",
      nameJa: "戸狩温泉",
      lat: 36.8514,
      lng: 138.3825,
      // Small onsen hamlet at the foot of Togari · ryokan + minshuku,
      // 10 min drive to Iiyama Shinkansen.
      radiusM: 900,
      blurb: "Quiet onsen hamlet at the base of Togari · minshuku & ryokan",
      blurbJa: "戸狩スキー場麓の静かな温泉集落 · 民宿・旅館",
      nearbyMountainIds: ["togari-onsen"],
    },
    {
      id: "kijimadaira-village",
      name: "Kijimadaira",
      nameJa: "木島平",
      lat: 36.8714,
      lng: 138.4292,
      // Kijimadaira village core · between the Romance no Kamisama
      // resort and the Kijima Snow Park. Easy snow-play access for
      // families staying in the valley.
      radiusM: 1200,
      blurb: "Valley village between the resort and snow park · family-oriented base",
      blurbJa: "スキー場とスノーパークの間の里 · ファミリー向けの拠点",
      nearbyMountainIds: ["kijimadaira", "kijima-snow-park"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Shin'etsu Shizenkyo (Iiyama region tourism)", labelJa: "信越自然郷", url: "https://shinetsu-shizenkyo.com/" },
    { category: "Tourism", categoryJa: "観光", label: "Iiyama City Tourist Bureau", labelJa: "飯山市観光局", url: "https://www.iiyama-ouendan.net/" },
    { category: "Tourism", categoryJa: "観光", label: "Go Nagano · North Nagano", labelJa: "Go Nagano 北信", url: "https://db.go-nagano.net/en/topics_detail12/id=19931" },
    { category: "Resorts", categoryJa: "スキー場", label: "Madarao Mountain Resort", labelJa: "斑尾高原スキー場", url: "https://www.madarao.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Tangram Ski Circus", labelJa: "タングラムスキーサーカス", url: "https://www.tangram.jp/ski/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Togari Onsen Madarao", labelJa: "戸狩温泉スキー場", url: "https://www.togari.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Kijimadaira · Romance no Kamisama", labelJa: "スノーリゾート ロマンスの神様", url: "https://kijimadaira.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Kijima Snow Park", labelJa: "キジマスノーパーク", url: "https://kijimadaira.org/" },
    { category: "Transport", categoryJa: "交通", label: "JR East · Hokuriku Shinkansen (Iiyama)", labelJa: "JR東日本 · 北陸新幹線 (飯山)", url: "https://www.jreast.co.jp/" },
    // Backcountry safety · the Madarao / Togari area sees regular
    // sidecountry use through the trees. JAN Northern Nagano covers
    // it; surface alongside the JMA volcano page for the wider region.
    { category: "Backcountry safety", categoryJa: "バックカントリー安全情報", label: "Japan Avalanche Network (JAN) · Northern Nagano bulletin", labelJa: "日本雪崩ネットワーク · 北信越エリア", url: "https://nadare.jp/" },
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
