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
    { path: "/mountain/shiga-kogen",         label: "Shiga Kogen",          labelJa: "志賀高原" },
    { path: "/mountain/ryuoo",               label: "Ryuoo",                labelJa: "竜王" },
    { path: "/mountain/kita-shiga",          label: "Kita-Shiga Kogen",     labelJa: "北志賀高原" },
    { path: "/mountain/yomase-onsen",        label: "Yomase Onsen",         labelJa: "夜間瀬温泉" },
  ],
  // Shiga Kogen is one Ikon-Pass / one-ticket connected area, but operationally
  // the lift authority (shigakogen-ski.or.jp) groups it into 4 sub-areas.
  // We list the parent + each sub-area separately so guests can compare them
  // on Today's Call (snow / wind / temp differ meaningfully across them).
  mountains: [
    // Terrain tags (Sprint 4.1) — sourced from official Shiga Kogen trail maps + Yamanouchi tourism positioning.
    // Shiga Kogen (parent): 18 sub-resorts → covers every level. All boxes ticked.
    { id: "shiga-kogen",            name: "Shiga Kogen",            nameJa: "志賀高原",           elevationM: 2307, lat: 36.7167, lng: 138.5000, blurb: "Japan's largest connected ski area · 18 sub-resorts on one ticket", blurbJa: "日本最大の連結スキー場 · 一枚券で18エリア",         websiteUrl: "https://www.shigakogen-ski.or.jp/",                                  beginner_friendly: true, kids_lessons: true, terrain_park: true, backcountry_access: true },
    // Yakebitaiyama: Olympic GS course = expert-leaning, but still a Prince resort with full ski school.
    { id: "yakebitaiyama",          name: "Yakebitaiyama",          nameJa: "焼額山",             elevationM: 2009, lat: 36.7100, lng: 138.5097, blurb: "Highest of the Shiga sub-resorts · 1998 Olympic GS course",            blurbJa: "志賀最高峰 · 長野五輪GSコース",                     websiteUrl: "https://prince.jp/ski/shiga/",            parentId: "shiga-kogen", kids_lessons: true, terrain_park: true },
    // Okushiga: long groomers + powder pocket, no real beginner terrain, has gated side-country.
    { id: "okushiga-kogen",         name: "Okushiga Kogen",         nameJa: "奥志賀高原",         elevationM: 1960, lat: 36.7314, lng: 138.5214, blurb: "Quietest, longest groomers · powder pocket of Shiga",                blurbJa: "志賀最奥 · 静かなロングクルーザーとパウダー",          websiteUrl: "https://www.okushiga.jp/",                parentId: "shiga-kogen", backcountry_access: true },
    // Ichinose: explicitly the "Family" gateway → beginner_friendly + kids_lessons.
    { id: "ichinose",               name: "Ichinose Family",        nameJa: "一の瀬ファミリー",     elevationM: 1830, lat: 36.7228, lng: 138.5050, blurb: "Central Shiga base · easiest gateway to the lift system",            blurbJa: "志賀中心の拠点 · リフトネットワーク最大の起点",        websiteUrl: "https://shigakogen.gr.jp/ichinose-family/", parentId: "shiga-kogen", beginner_friendly: true, kids_lessons: true },
    // Yokoteyama/Shibutoge: highest lift-served in Japan, alpine + exposed → expert-leaning.
    { id: "yokoteyama-shibutoge",   name: "Yokoteyama / Shibutoge", nameJa: "横手山・渋峠",       elevationM: 2307, lat: 36.7044, lng: 138.5364, blurb: "Highest lift-served skiing in Japan · long-season Kumanoyu",          blurbJa: "日本最高所の索道スキー · ロングシーズンの熊の湯",      websiteUrl: "https://yokoteyama-shibutoge.com/",       parentId: "shiga-kogen", expert_only: true, backcountry_access: true },
    // Sun Valley / Giant: explicitly "easy beginner & family terrain".
    { id: "sunvalley-giant",        name: "Sun Valley / Giant",     nameJa: "サンバレー・ジャイアント", elevationM: 1600, lat: 36.7100, lng: 138.4700, blurb: "Gateway base near Hasuike · easy beginner & family terrain",          blurbJa: "蓮池側のゲートウェイ拠点 · 初心者・ファミリー向け",   websiteUrl: "https://www.shigakogen-ski.or.jp/",       parentId: "shiga-kogen", beginner_friendly: true, kids_lessons: true },
    // Ryuoo: gondola-served all-mountain with terrain park + ski school.
    { id: "ryuoo",                  name: "Ryuoo",                  nameJa: "竜王",              elevationM: 1930, lat: 36.7536, lng: 138.4197, blurb: "Sea-of-clouds gondola summit · SORA terrace",                        blurbJa: "雲海ゴンドラの山頂 · SORAテラス",                  websiteUrl: "https://www.ryuoo.com/",                                              kids_lessons: true, terrain_park: true },
    // Kita-Shiga: explicitly family terrain + X-Jam Takaifuji park.
    { id: "kita-shiga",             name: "Kita-Shiga Kogen",       nameJa: "北志賀高原",         elevationM: 1700, lat: 36.7506, lng: 138.4767, blurb: "X-Jam Takaifuji + family terrain · short hop from Yudanaka",          blurbJa: "X-JAM高井富士 + ファミリー向け · 湯田中から至近",    websiteUrl: "https://kitashigakogen.gr.jp/",                                       beginner_friendly: true, kids_lessons: true, terrain_park: true },
    // Yomase Onsen: locals' mountain, night skiing → beginner_friendly.
    { id: "yomase-onsen",           name: "Yomase Onsen",           nameJa: "夜間瀬温泉スキー場", elevationM: 1240, lat: 36.7714, lng: 138.4253, blurb: "Locals' mountain on the river · night skiing & onsen finish",          blurbJa: "夜間瀬川沿いの地元のスキー場 · ナイター + 温泉",     websiteUrl: "https://www.yomase.jp/",                                              beginner_friendly: true },
  ],
  baseTowns: [
    {
      id: "yudanaka",
      name: "Yudanaka",
      nameJa: "湯田中",
      lat: 36.7460,
      lng: 138.4280,
      // Tight radius: Yudanaka station + immediate ryokan strip only, so it
      // doesn't swallow Shibu Onsen 600m up the road.
      radiusM: 700,
      blurb: "Onsen station town · gateway to Shiga Kogen",
      blurbJa: "温泉駅前 · 志賀高原への玄関口",
    },
    {
      id: "shibu-onsen",
      name: "Shibu Onsen",
      nameJa: "渋温泉",
      lat: 36.7517,
      lng: 138.4286,
      // Just the historic cobbled village — 9 bath-houses + ryokan core.
      radiusM: 400,
      blurb: "Historic ryokan village · cobbled lanes & nine bathhouses",
      blurbJa: "歴史ある旅館街 · 石畳と九湯めぐり",
    },
    {
      id: "yomase",
      name: "Yomase",
      nameJa: "夜間瀬",
      lat: 36.7710,
      lng: 138.4080,
      radiusM: 1500,
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
