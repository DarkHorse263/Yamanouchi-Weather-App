import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

export const yamanouchiRegion: RegionConfig = {
  id: "yamanouchi",
  name: "Yamanouchi",
  subtitle: "Nagano · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  resorts: [
    { path: "/mountain/shiga-kogen",   label: "Shiga Kogen",      labelJa: "志賀高原" },
    { path: "/mountain/ryuoo",         label: "Ryuoo",            labelJa: "竜王" },
    { path: "/mountain/kita-shiga",    label: "Kita-Shiga Kogen", labelJa: "北志賀高原" },
  ],
  mountains: [
    { id: "shiga-kogen",   name: "Shiga Kogen",      nameJa: "志賀高原",    elevationM: 2307, blurb: "Japan's largest interconnected ski area · 18 sub-resorts incl. Yakebitaiyama", blurbJa: "日本最大の連結スキー場 · 焼額山を含む18エリア", websiteUrl: "https://www.shigakogen-ski.com/en/" },
    { id: "ryuoo",         name: "Ryuoo",            nameJa: "竜王",         elevationM: 1930, blurb: "Sea-of-clouds gondola summit",                          blurbJa: "雲海ゴンドラの山頂",                                websiteUrl: "https://www.ryuoo.com/" },
    { id: "kita-shiga",    name: "Kita-Shiga Kogen", nameJa: "北志賀高原",  elevationM: 1930, blurb: "North-facing powder · close to Yomase",                blurbJa: "北向き斜面のパウダー · 夜間瀬に近い",            websiteUrl: "https://kitashigakogen.gr.jp/" },
  ],
  baseTowns: [
    {
      id: "yudanaka",
      name: "Yudanaka",
      nameJa: "湯田中",
      lat: 36.7460,
      lng: 138.4280,
      radiusM: 1200,
      blurb: "Onsen station town · gateway to Shiga Kogen",
      blurbJa: "温泉駅前 · 志賀高原への玄関口",
    },
    {
      id: "shibu-onsen",
      name: "Shibu Onsen",
      nameJa: "渋温泉",
      lat: 36.7517,
      lng: 138.4286,
      radiusM: 600,
      blurb: "Historic ryokan village · cobbled lanes & nine bathhouses",
      blurbJa: "歴史ある旅館街 · 石畳と九湯めぐり",
    },
    {
      id: "yomase",
      name: "Yomase",
      nameJa: "夜間瀬",
      lat: 36.7710,
      lng: 138.4080,
      radiusM: 3500,
      blurb: "Quieter base on the river · close to Kita-Shiga lifts",
      blurbJa: "夜間瀬川沿いの静かな拠点 · 北志賀のリフトに近い",
    },
  ],
  footer: "v0.3 · feelzlike",
  roadsSource: {
    label: "Japan Road Traffic Information Center (JARTIC)",
    labelJa: "日本道路交通情報センター (JARTIC)",
    url: "https://www.jartic.or.jp/",
    dataAvailable: false,
  },
};
