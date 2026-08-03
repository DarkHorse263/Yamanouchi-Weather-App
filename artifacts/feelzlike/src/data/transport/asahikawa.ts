import type { TransportProviderList } from "@/types/transport";

/**
 * Asahikawa (Hokkaido, Japan) transport providers.
 *
 * Asahikawa is a real city with real transit. Verified public routes
 * in: the JR Kamui/Lilac limited express from Sapporo, the airport
 * bus from Asahikawa Airport into the city, the Asahikawa Denkikidō
 * "Ide-yu" bus No.66 from the city to Asahidake Onsen, and the winter
 * shuttle to Kamui Ski Links. Phone numbers and deep schedule links
 * are left `null` where not directly verifiable · we never guess.
 * Bilingual `name_local` and `route_summary_local` are provided for
 * the JP language toggle.
 */
export const ASAHIKAWA_TRANSPORT: TransportProviderList = [
  {
    id: "jp-jr-kamui-lilac-asahikawa",
    name: "JR Kamui / Lilac limited express",
    name_local: "JR特急カムイ・ライラック",
    type: "train",
    leg: "to_town",
    operator: "JR Hokkaido (JR北海道)",
    phone: null,
    website: "https://www.jrhokkaido.co.jp/global/",
    route_summary:
      "Kamui and Lilac limited express trains from Sapporo to Asahikawa Station in about 85 minutes, roughly every 30-60 minutes through the day. IC cards accepted · the main artery into the city.",
    route_summary_local:
      "札幌から旭川駅まで特急カムイ・ライラックで約85分、日中はおおむね30〜60分間隔。ICカード利用可 · 市内への大動脈。",
    regions: ["asahikawa"],
  },
  {
    id: "jp-asahikawa-airport-bus",
    name: "Asahikawa Airport bus",
    name_local: "旭川空港連絡バス",
    type: "bus",
    leg: "to_town",
    operator: "Asahikawa Denkikidō (旭川電気軌道)",
    phone: null,
    website: "https://www.asahikawa-denkikidou.jp/",
    route_summary:
      "Airport buses from Asahikawa Airport to Asahikawa Station in about 35 minutes, timed to arriving flights. The simplest link from the region's own airport into the city · check the operator's site for the current timetable.",
    route_summary_local:
      "旭川空港から旭川駅まで連絡バスで約35分、航空便に接続して運行。地元空港から市内への最も簡単なルート · 最新時刻表は公式サイトで確認。",
    regions: ["asahikawa"],
  },
  {
    id: "jp-ideyu-asahidake-bus",
    name: "Ide-yu bus No.66 · Asahidake Onsen",
    name_local: "旭川電気軌道 66番 いで湯号（旭岳温泉行き）",
    type: "bus",
    leg: "to_mountain",
    operator: "Asahikawa Denkikidō (旭川電気軌道)",
    phone: null,
    website: "https://www.asahikawa-denkikidou.jp/",
    route_summary:
      "Route 66 'Ide-yu' bus from Asahikawa Station to Asahidake Onsen and the ropeway base in about 90 minutes via Higashikawa, a few departures a day. The only public transport to the mountain · check the operator's site for the current timetable before planning a ropeway day.",
    route_summary_local:
      "旭川駅から東川経由で旭岳温泉・ロープウェイ山麓駅まで66番「いで湯号」で約90分、1日数本。山への唯一の公共交通 · ロープウェイ利用日は事前に公式サイトで時刻を確認。",
    regions: ["asahikawa"],
    mountains_served: ["asahidake"],
  },
  {
    id: "jp-kamui-winter-shuttle",
    name: "Kamui Ski Links winter shuttle",
    name_local: "カムイスキーリンクス 冬季シャトルバス",
    type: "bus",
    leg: "to_mountain",
    operator: "Kamui Ski Links (カムイスキーリンクス)",
    phone: null,
    website: "https://www.kamui-skilinks.com/",
    route_summary:
      "Winter shuttle between central Asahikawa and Kamui Ski Links in about 40 minutes, running on ski-season schedules. Seats can be limited on powder mornings · check the resort site for the current timetable and pick-up points.",
    route_summary_local:
      "旭川市街とカムイスキーリンクスを結ぶ約40分の冬季シャトル、スキーシーズン中運行。パウダーの朝は満席になることも · 時刻と乗り場はスキー場公式サイトで確認。",
    regions: ["asahikawa"],
    mountains_served: ["kamui"],
  },
];
