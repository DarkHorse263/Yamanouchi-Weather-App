import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Zao Onsen · tenth JP region and the first in Tohoku, the classic
 * Yamagata hot-spring ski village famous for its juhyo snow monsters:
 *
 *   Zao Onsen village → 1,900-year-old sulfur hot-spring village at
 *                       about 880 m, with the ropeways and lifts
 *                       rising straight off the village streets
 *
 * Zao Onsen Ski Resort spans a broad mountainside from the village up
 * to Jizo Sancho at 1,661 m, and joined the Ikon Pass for 2025-26
 * (7 days full Ikon · 5 days Ikon Base). Access is the Yamagata
 * Shinkansen to Yamagata Station, then the Yamako bus up to the
 * village in about 40 minutes.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain.
 */
export const zaoOnsenRegion: RegionConfig = {
  id: "zao-onsen",
  name: "Zao Onsen",
  subtitle: "Yamagata · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Zao Onsen Ski Resort"],
  resorts: [
    { path: "/mountain/zao-onsen-resort", label: "Zao Onsen Ski Resort", labelJa: "蔵王温泉スキー場" },
  ],
  mountains: [
    {
      id: "zao-onsen-resort",
      name: "Zao Onsen Ski Resort",
      nameJa: "蔵王温泉スキー場",
      elevationM: 1661,
      // Zao Sanroku ropeway base station at the top of the village.
      lat: 38.1616,
      lng: 140.3952,
      blurb: "Yamagata's big classic across a broad juhyo-covered mountainside · about 880 m of vertical to Jizo Sancho at 1,661 m, famous for its snow monsters, on the Ikon Pass",
      blurbJa: "樹氷で名高い山形の大規模クラシックゲレンデ · 地蔵山頂駅1,661mまで標高差約880m、Ikonパス対象",
      websiteUrl: "https://www.zao-ski.or.jp/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "zao-onsen",
      name: "Zao Onsen",
      nameJa: "蔵王温泉",
      // Village core around the bus terminal (~880 m) · the Zao Sanroku
      // ropeway station is a short walk up from the onsen streets.
      lat: 38.1674,
      lng: 140.3937,
      radiusM: 1500,
      blurb: "Hot-spring village at about 880 m with 1,900 years of history · sulfur baths steps from the lifts, ropeways rising straight off the village streets",
      blurbJa: "開湯1900年・標高約880mの温泉街 · 硫黄泉の湯けむりのすぐ先にリフト、温泉街からロープウェイが直結",
      nearbyMountainIds: ["zao-onsen-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Zao Onsen Tourist Association", labelJa: "蔵王温泉観光協会", url: "http://www.zao-spa.or.jp/" },
    { category: "Tourism", categoryJa: "観光", label: "Visit Yamagata · Yamagata official tourism", labelJa: "山形県公式観光サイト", url: "https://yamagatakanko.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Zao Onsen Ski Resort", labelJa: "蔵王温泉スキー場", url: "https://www.zao-ski.or.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Zao Ropeway", labelJa: "蔵王ロープウェイ", url: "https://zaoropeway.co.jp/" },
    { category: "Transport", categoryJa: "交通", label: "Yamako bus · Yamagata Station to Zao Onsen", labelJa: "山交バス · 山形駅前〜蔵王温泉", url: "https://www.yamakobus.jp/" },
    { category: "Transport", categoryJa: "交通", label: "JR East · Yamagata Shinkansen", labelJa: "JR東日本 · 山形新幹線", url: "https://www.jreast.co.jp/en/multi/" },
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
