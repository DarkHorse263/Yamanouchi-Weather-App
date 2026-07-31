import type { TransportProviderList } from "@/types/transport";

/**
 * Hachimantai (Iwate, Japan) transport providers.
 *
 * The gateway is Morioka (Tohoku Shinkansen), then either the JR
 * Hanawa line to Obuke Station or Iwate Kenpoku Bus services up to
 * the Hachimantai Onsenkyo hotel area where both ski hills sit. A
 * free shuttle links the Panorama and Shimokura bases. Phone numbers
 * and deep schedule links are left `null` where not directly
 * verifiable · we never guess. Bilingual `name_local` and
 * `route_summary_local` are provided for the JP language toggle.
 */
export const HACHIMANTAI_TRANSPORT: TransportProviderList = [
  {
    id: "jp-tohoku-shinkansen-morioka-hachimantai",
    name: "Tohoku Shinkansen · Morioka",
    name_local: "東北新幹線 盛岡駅",
    type: "train",
    leg: "to_town",
    operator: "JR East (JR東日本)",
    phone: null,
    website: "https://www.jreast.co.jp/multi/en/",
    route_summary:
      "Tohoku Shinkansen from Tokyo to Morioka in about 2 hours 15 minutes, several times an hour. Morioka is the gateway for the Hachimantai highland · continue by the JR Hanawa line or bus.",
    route_summary_local:
      "東京から盛岡まで東北新幹線で約2時間15分、1時間に数本。盛岡が八幡平高原への玄関口 · そこからJR花輪線またはバスで。",
    regions: ["hachimantai"],
  },
  {
    id: "jp-jr-hanawa-line-obuke",
    name: "JR Hanawa Line · Obuke Station",
    name_local: "JR花輪線 大更駅",
    type: "train",
    leg: "to_town",
    operator: "JR East (JR東日本)",
    phone: null,
    website: "https://www.jreast.co.jp/multi/en/",
    route_summary:
      "Local Hanawa Line trains from Morioka to Obuke Station in about 35 minutes, roughly every 1-2 hours. Obuke is Hachimantai city's rail stop · taxis and buses continue up to the Onsenkyo hotel area and the ski hills.",
    route_summary_local:
      "盛岡から大更駅までJR花輪線の普通列車で約35分、おおむね1〜2時間に1本。大更は八幡平市の鉄道駅 · 温泉郷・スキー場へはタクシーやバスで。",
    regions: ["hachimantai"],
  },
  {
    id: "jp-iwate-kenpoku-hachimantai-bus",
    name: "Iwate Kenpoku Bus · Hachimantai Onsenkyo",
    name_local: "岩手県北バス 八幡平温泉郷方面",
    type: "bus",
    leg: "to_mountain",
    operator: "Iwate Kenpoku Bus (岩手県北バス)",
    phone: null,
    website: "https://www.iwate-kenpokubus.co.jp/",
    route_summary:
      "Buses from Morioka Station toward the Hachimantai Onsenkyo hotel area (about 90 minutes), serving the Hachimantai Mountain Hotel at the Panorama base on winter schedules. Services are limited · check the operator's site for the current timetable.",
    route_summary_local:
      "盛岡駅から八幡平温泉郷方面へ約90分、冬ダイヤではパノラマゲレンデ前の八幡平マウンテンホテルにも停車。本数は限られる · 最新時刻表は公式サイトで確認。",
    regions: ["hachimantai"],
    mountains_served: ["hachimantai-panorama"],
  },
  {
    id: "jp-hachimantai-resort-shuttle",
    name: "Hachimantai Resort shuttle · Panorama ↔ Shimokura",
    name_local: "八幡平リゾート パノラマ・下倉間シャトル",
    type: "bus",
    leg: "to_mountain",
    operator: "Hachimantai Resort (八幡平リゾート)",
    phone: null,
    website: "https://www.hachimantai.co.jp/winter/",
    route_summary:
      "Free winter shuttle between the Panorama and Shimokura bases (about 2 km, 10 minutes), running through the ski season so one ticket covers both hills. Check the resort site for the shuttle timetable.",
    route_summary_local:
      "パノラマと下倉のベース間（約2km・10分）を結ぶ冬季無料シャトル、共通リフト券で両ゲレンデを行き来できる。シャトルの時刻はリゾート公式サイトで確認。",
    regions: ["hachimantai"],
    mountains_served: ["hachimantai-panorama", "hachimantai-shimokura"],
  },
];
