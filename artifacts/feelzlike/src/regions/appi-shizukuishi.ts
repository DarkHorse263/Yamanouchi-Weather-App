import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Appi & Shizukuishi · twelfth JP region and the third in Tohoku,
 * pairing Iwate prefecture's two big resorts either side of Morioka:
 *
 *   Appi Kogen  → purpose-built resort village in the Appi Highlands
 *                 of Hachimantai City, about 50 km north of Morioka
 *   Shizukuishi → farming town on the Tazawako line west of Morioka,
 *                 below the Shizukuishi Prince resort on Takakura
 *   Morioka     → prefecture capital and the shinkansen hub both
 *                 resorts are reached from
 *
 * Appi is one of Tohoku's largest resorts · long groomed runs off a
 * single gondola spine, dry inland powder, and new to the Ikon Pass
 * for 2025-26. Shizukuishi is the Prince-operated hill that hosted
 * the 1993 Alpine World Championships · a gondola and ropeway with
 * one of Japan's few full downhill courses. The two bases are about
 * an hour apart by road, each ~40-50 min from Morioka in opposite
 * directions · the region exists so visitors staying around Morioka
 * can compare both.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain for each.
 */
export const appiShizukuishiRegion: RegionConfig = {
  id: "appi-shizukuishi",
  name: "Appi & Shizukuishi",
  subtitle: "Iwate · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Appi Kogen", "Shizukuishi"],
  resorts: [
    { path: "/mountain/appi",               label: "Appi Kogen",  labelJa: "安比高原" },
    { path: "/mountain/shizukuishi-resort", label: "Shizukuishi", labelJa: "雫石スキー場" },
  ],
  mountains: [
    {
      id: "appi",
      name: "Appi Kogen",
      nameJa: "安比高原",
      elevationM: 1305,
      // Resort base village in the Appi Highlands (~620 m) · the
      // gondola climbs to Mt Maemori at about 1,305 m.
      lat: 40.0028,
      lng: 140.9452,
      blurb: "One of Tohoku's largest resorts · long corduroy runs off a 2.8 km gondola to Mt Maemori, dry inland powder and tree runs, on the Ikon Pass from 2025-26",
      blurbJa: "東北最大級のスキーリゾート · 全長2.8kmのゴンドラで前森山へ、ロングコースと軽い内陸パウダー。2025-26からイコンパス対応",
      websiteUrl: "https://www.appi.co.jp/en/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "shizukuishi-resort",
      name: "Shizukuishi",
      nameJa: "雫石スキー場",
      elevationM: 1128,
      // Shizukuishi Prince Hotel base area on Takakura's east slopes
      // (~430 m) · gondola and ropeway to about 1,128 m.
      lat: 39.7844,
      lng: 140.9203,
      blurb: "Prince-operated hill on Takakura that hosted the 1993 Alpine World Championships · about 700 m of vertical, a gondola and ropeway, and one of Japan's few full downhill courses",
      blurbJa: "1993年アルペン世界選手権の舞台となったプリンス系スキー場 · 標高差約700m、ゴンドラとロープウェーで高倉山へ。日本屈指のダウンヒルコース",
      websiteUrl: "https://www.princehotels.com/en/ski/shizukuishi/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "appi-kogen",
      name: "Appi Kogen",
      nameJa: "安比高原",
      // Purpose-built resort village at the lifts (~620 m) · hotels,
      // pensions and the JR Hanawa line's Appi-Kogen station below.
      lat: 40.0028,
      lng: 140.9452,
      radiusM: 2500,
      blurb: "Purpose-built resort village at the base of the gondola · hotels and pensions at about 620 m, with the JR Hanawa line and a direct Morioka bus stopping below",
      blurbJa: "ゴンドラ乗り場に広がるリゾート村 · 標高約620mにホテルとペンションが並び、JR花輪線と盛岡直行バスが乗り入れる",
      nearbyMountainIds: ["appi", "shizukuishi-resort"],
    },
    {
      id: "shizukuishi",
      name: "Shizukuishi",
      nameJa: "雫石",
      // Town core around Shizukuishi Station on the Tazawako line
      // (~190 m) · the Prince resort is about 15 min up the hill.
      lat: 39.6941,
      lng: 140.9844,
      radiusM: 2500,
      blurb: "Farming town under Mt Iwate on the Tazawako line · the Akita Shinkansen stops here, with the Prince resort about 15 minutes up the hill",
      blurbJa: "岩手山を望む田沢湖線沿いの町 · 秋田新幹線が停車し、雫石プリンスのスキー場まで車で約15分",
      nearbyMountainIds: ["shizukuishi-resort", "appi"],
    },
    {
      id: "morioka",
      name: "Morioka",
      nameJa: "盛岡",
      // City core around Morioka Station (~140 m) · Appi is about
      // 50 min north, Shizukuishi about 20 min west by train.
      lat: 39.7019,
      lng: 141.1365,
      radiusM: 3500,
      blurb: "Prefecture capital and shinkansen hub · Appi is about 50 minutes north by bus or the Hanawa line, Shizukuishi about 20 minutes west on the Tazawako line",
      blurbJa: "県庁所在地で新幹線のハブ · 安比高原へはバスか花輪線で約50分、雫石へは田沢湖線で約20分",
      nearbyMountainIds: ["appi", "shizukuishi-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "VISIT IWATE · Iwate official tourism", labelJa: "岩手県公式観光サイト VISIT IWATE", url: "https://visitiwate.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "APPI Resort", labelJa: "安比高原スキー場", url: "https://www.appi.co.jp/en/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Shizukuishi · Prince Snow Resorts", labelJa: "雫石スキー場（プリンススノーリゾート）", url: "https://www.princehotels.com/en/ski/shizukuishi/" },
    { category: "Transport", categoryJa: "交通", label: "JR East · Tohoku Shinkansen to Morioka", labelJa: "JR東日本 · 東北新幹線（盛岡）", url: "https://www.jreast.co.jp/en/multi/" },
    { category: "Transport", categoryJa: "交通", label: "Iwate Kenpoku Bus · Morioka to Appi", labelJa: "岩手県北バス · 盛岡〜安比高原", url: "https://www.iwate-kenpokubus.co.jp/" },
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
