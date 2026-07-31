import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Kusatsu & Manza · two onsen-ski towns on the flanks of the Kusatsu-
 * Shirane volcano in north-west Gunma, about 40 min apart by road
 * (the direct Shiga-Kusatsu route closes in winter):
 *
 *   Kusatsu Onsen   → one of Japan's most famous hot-spring towns at
 *                     ~1,180m, the Yubatake steaming in the middle
 *   Manza Onsen     → sulphur-spring village at 1,800m, among the
 *                     highest year-round onsen resorts in Japan
 *
 * Kusatsu Onsen Ski Resort (formerly Kusatsu Kokusai · scaled back
 * above 1,600m after the January 2018 Moto-Shirane eruption, with a
 * new pulse gondola from 2023-24) and Manza Onsen Ski Resort (a
 * high, cold Prince resort between 1,646m and 1,994m with reliably
 * dry snow) are the two hills · both rise straight off their towns.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain for each resort.
 */
export const kusatsuManzaRegion: RegionConfig = {
  id: "kusatsu-manza",
  name: "Kusatsu & Manza",
  subtitle: "Gunma · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Kusatsu Onsen", "Manza Onsen"],
  resorts: [
    { path: "/mountain/kusatsu-onsen-resort", label: "Kusatsu Onsen", labelJa: "草津温泉スキー場" },
    { path: "/mountain/manza-onsen-resort",   label: "Manza Onsen",   labelJa: "万座温泉スキー場" },
  ],
  mountains: [
    {
      id: "kusatsu-onsen-resort",
      name: "Kusatsu Onsen Ski Resort",
      nameJa: "草津温泉スキー場",
      elevationM: 1600,
      lat: 36.628,
      lng: 138.588,
      blurb: "Historic town hill from 1,245m to 1,600m · pulse gondola off the base, the ski-run 'Route 292' and the Yubatake baths 10 min down the road",
      blurbJa: "標高1,245〜1,600mの歴史あるゲレンデ · ベースからのパルスゴンドラ、冬季閉鎖道路を滑る「Route 292」、湯畑まで車10分",
      websiteUrl: "https://www.kusatsu-kokusai.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "manza-onsen-resort",
      name: "Manza Onsen Ski Resort",
      nameJa: "万座温泉スキー場",
      elevationM: 1994,
      lat: 36.644,
      lng: 138.507,
      blurb: "High, cold Prince resort from 1,646m to 1,994m above the sulphur springs · reliably dry snow and empty weekday groomers",
      blurbJa: "硫黄泉の上、標高1,646〜1,994mの高地に広がるプリンス系スキー場 · 乾いた雪が安定し、平日は空いた圧雪バーンが続く",
      websiteUrl: "https://www.princehotels.com/en/ski/manza_onsen/index.html",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "kusatsu-onsen",
      name: "Kusatsu Onsen",
      nameJa: "草津温泉",
      lat: 36.621,
      lng: 138.596,
      // Kusatsu town core (~1,180m) around the Yubatake hot-spring field.
      // The ski base is a few kilometres up the hill; shuttle buses link
      // the two in season.
      radiusM: 2500,
      blurb: "One of Japan's most famous onsen towns · the Yubatake steaming in the middle, the ski hill 10 min up the road",
      blurbJa: "日本屈指の名湯の町 · 中心に湯けむり上がる湯畑、スキー場へは車で10分",
      nearbyMountainIds: ["kusatsu-onsen-resort"],
    },
    {
      id: "manza-onsen",
      name: "Manza Onsen",
      nameJa: "万座温泉",
      lat: 36.642,
      lng: 138.505,
      // Manza Onsen village (~1,800m) · a cluster of sulphur-spring
      // hotels with the ski lifts rising straight off it. Tight radius
      // so it stays its own place on the volcano.
      radiusM: 1500,
      blurb: "Sulphur-spring village at 1,800m · among Japan's highest onsen, with the lifts right off the hotels",
      blurbJa: "標高1,800mの硫黄泉の村 · 日本有数の高所温泉で、ホテルの前からリフトが延びる",
      nearbyMountainIds: ["manza-onsen-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Kusatsu Onsen official tourism", labelJa: "草津温泉観光協会", url: "https://www.kusatsu-onsen.ne.jp/" },
    { category: "Tourism", categoryJa: "観光", label: "Visit Gunma · official tourism", labelJa: "群馬県公式観光サイト", url: "https://www.visit-gunma.jp/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Kusatsu Onsen Ski Resort", labelJa: "草津温泉スキー場", url: "https://www.kusatsu-kokusai.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Manza Onsen Ski Resort", labelJa: "万座温泉スキー場", url: "https://www.princehotels.com/en/ski/manza_onsen/index.html" },
    { category: "Transport", categoryJa: "交通", label: "JR East · trains", labelJa: "JR東日本 · 鉄道", url: "https://www.jreast.co.jp/multi/en/" },
    { category: "Transport", categoryJa: "交通", label: "JR Bus Kanto · Kusatsu Onsen line", labelJa: "JRバス関東 · 草津温泉線", url: "https://www.jrbuskanto.co.jp/" },
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
