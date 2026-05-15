import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Nozawa Onsen · second JP region after Yamanouchi.
 *
 * Single famous onsen-and-mountain destination · one base town
 * (the village itself) hosting one resort (Nozawa Onsen Snow
 * Resort). Modelled as a tight Yamanouchi-style cluster so the
 * /nozawa-onsen home reads as a "Nozawa Onsen village" pick →
 * mountain hangs off it. No sub-resort umbrella: the mountain
 * has multiple lift-base names (Hikage, Nagasaka, Yu-no-mine)
 * but it's one ticket and one resort, so we list it as a
 * single mountain entry.
 */
export const nozawaOnsenRegion: RegionConfig = {
  id: "nozawa-onsen",
  name: "Nozawa Onsen",
  subtitle: "Nagano · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Nozawa Onsen"],
  resorts: [
    { path: "/mountain/nozawa-onsen", label: "Nozawa Onsen", labelJa: "野沢温泉" },
  ],
  mountains: [
    {
      id: "nozawa-onsen",
      name: "Nozawa Onsen Snow Resort",
      nameJa: "野沢温泉スキー場",
      elevationM: 1650,
      lat: 36.9290,
      lng: 138.4500,
      blurb: "Mt Kenashi summit · long groomers, tree runs and the Nagasaka Olympic course",
      blurbJa: "毛無山頂 · ロングクルーザー、ツリーラン、長坂五輪コース",
      websiteUrl: "https://www.nozawaski.com/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "nozawa-onsen-village",
      name: "Nozawa Onsen",
      nameJa: "野沢温泉",
      lat: 36.9243,
      lng: 138.4485,
      // Tight radius · the historic onsen village core (13 free
      // soto-yu bathhouses, cobbled lanes, ryokan strip).
      radiusM: 800,
      blurb: "Historic onsen village at the base of the resort · 13 free public bathhouses",
      blurbJa: "スキー場の麓の温泉街 · 外湯13軒",
      nearbyMountainIds: ["nozawa-onsen"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Nozawa Onsen Tourist Association", labelJa: "野沢温泉観光協会", url: "https://nozawakanko.jp/" },
    { category: "Tourism", categoryJa: "観光", label: "Go Nagano · Nozawa Onsen", labelJa: "Go Nagano 野沢温泉", url: "https://www.go-nagano.net/en/destination/nozawa-onsen" },
    { category: "Resorts", categoryJa: "スキー場", label: "Nozawa Onsen Snow Resort", labelJa: "野沢温泉スキー場", url: "https://www.nozawaski.com/" },
    { category: "Onsen", categoryJa: "温泉", label: "Soto-yu (13 free public bathhouses)", labelJa: "外湯めぐり (共同浴場13軒)", url: "https://nozawakanko.jp/onsen/" },
    // Backcountry safety · JAN Northern Nagano bulletin covers the
    // Nozawa side-country. Surface alongside the JMA volcano page
    // because the broader Kusatsu-Shirane / Myoko area carries
    // active warnings each season.
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
