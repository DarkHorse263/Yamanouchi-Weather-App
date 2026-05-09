import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

export const iiyamaRegion: RegionConfig = {
  id: "iiyama",
  name: "Iiyama",
  subtitle: "Nagano · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  resorts: [
    { path: "/mountain/madarao",      label: "Madarao Kogen",      labelJa: "斑尾高原" },
    { path: "/mountain/tangram",      label: "Tangram Ski Circus", labelJa: "タングラムスキーサーカス" },
    { path: "/mountain/togari",       label: "Togari Onsen",       labelJa: "戸狩温泉" },
    { path: "/mountain/nozawa-onsen", label: "Nozawa Onsen",       labelJa: "野沢温泉" },
  ],
  mountains: [
    { id: "madarao",      name: "Madarao Kogen",       nameJa: "斑尾高原",            elevationM: 1382, lat: 36.8525, lng: 138.3389, blurb: "Tree-run paradise · linked with Tangram",   blurbJa: "ツリーランの聖地 · タングラムと連結",     websiteUrl: "https://www.madarao.jp/winter/en/" },
    { id: "tangram",      name: "Tangram Ski Circus",  nameJa: "タングラムスキーサーカス", elevationM: 1320, lat: 36.8639, lng: 138.3528, blurb: "Family-friendly · interconnected with Madarao", blurbJa: "ファミリー向け · 斑尾と接続",            websiteUrl: "https://www.hotel-tangram.com/ski/" },
    { id: "togari",       name: "Togari Onsen",        nameJa: "戸狩温泉",            elevationM: 1050, lat: 36.9089, lng: 138.4222, blurb: "Quieter local mountain · long groomers",     blurbJa: "地元密着の静かな山 · ロングコース",       websiteUrl: "https://www.togari.jp/" },
    { id: "nozawa-onsen", name: "Nozawa Onsen",        nameJa: "野沢温泉",            elevationM: 1650, lat: 36.9239, lng: 138.4486, blurb: "Iconic ski-in onsen village",                blurbJa: "象徴的なスキーイン温泉郷",                websiteUrl: "https://www.nozawaski.com/en/" },
  ],
  baseTowns: [
    {
      id: "iiyama-city",
      name: "Iiyama City",
      nameJa: "飯山市",
      lat: 36.8517,
      lng: 138.3667,
      radiusM: 5000,
      blurb: "Shinkansen station town · base for Madarao, Tangram, Togari & Nozawa",
      blurbJa: "新幹線駅の町 · 斑尾・タングラム・戸狩・野沢への拠点",
      nearbyMountainIds: ["madarao", "tangram", "togari", "nozawa-onsen"],
    },
    {
      id: "nozawa-onsen",
      name: "Nozawa Onsen Village",
      nameJa: "野沢温泉村",
      lat: 36.9244,
      lng: 138.4439,
      radiusM: 2500,
      blurb: "Ski-in onsen village · 13 free public baths",
      blurbJa: "スキーイン温泉郷 · 無料外湯十三軒",
      nearbyMountainIds: ["nozawa-onsen"],
    },
  ],
  footer: "v0.3 · feelzlike",
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
