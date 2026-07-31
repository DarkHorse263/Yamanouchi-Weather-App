import type { TransportProviderList } from "@/types/transport";

/**
 * BANDAI (JP · Fukushima) - getting to Inawashiro/Urabandai and up to
 * Nekoma Mountain and Grandeco. The rail spine is the JR Ban-etsu
 * West line from Koriyama (Tohoku Shinkansen interchange); winter
 * shuttles climb from Inawashiro Station to both resorts, and Aizu
 * Bus route buses serve the Urabandai lake district year-round.
 */
export const BANDAI_TRANSPORT: TransportProviderList = [
  {
    id: "jp-jr-banetsu-west-inawashiro",
    name: "JR Ban-etsu West Line · Inawashiro Station",
    name_local: "JR磐越西線 猪苗代駅",
    type: "train",
    leg: "to_town",
    operator: "JR East (JR東日本)",
    phone: null,
    website: "https://www.jreast.co.jp/multi/en/",
    route_summary:
      "Local and rapid trains from Koriyama (Tohoku Shinkansen interchange) to Inawashiro Station in about 35-40 minutes, roughly hourly. From Inawashiro the winter resort shuttles climb to Nekoma Mountain and Grandeco · check each resort's site for the seasonal timetable.",
    route_summary_local:
      "郡山（東北新幹線乗換）から猪苗代駅まで普通・快速で約35〜40分、おおむね1時間に1本。猪苗代駅からは冬季シャトルバスでネコマ マウンテン・グランデコへ · 運行時刻は各スキー場公式サイトで確認。",
    regions: ["bandai"],
  },
  {
    id: "jp-nekoma-winter-shuttle",
    name: "Nekoma Mountain · winter shuttle",
    name_local: "ネコマ マウンテン 冬季シャトルバス",
    type: "bus",
    leg: "to_mountain",
    operator: "Hoshino Resorts NEKOMA Mountain (星野リゾート ネコマ マウンテン)",
    phone: null,
    website: "https://www.nekoma.co.jp/access/",
    route_summary:
      "Free winter shuttle from JR Inawashiro Station to the Nekoma Mountain south base in about 20 minutes, timed to trains during the season. The north side has its own separate car access via Urabandai · check the resort site for the current timetable and reservation rules.",
    route_summary_local:
      "JR猪苗代駅からネコマ マウンテン南エリアベースまで約20分の無料冬季シャトル、シーズン中は列車に接続して運行。北エリアへは裏磐梯経由の別アクセス · 最新の時刻表・予約要否は公式サイトで確認。",
    regions: ["bandai"],
    mountains_served: ["nekoma-mountain"],
  },
  {
    id: "jp-grandeco-winter-shuttle",
    name: "Grandeco · winter shuttle",
    name_local: "グランデコ 冬季シャトルバス",
    type: "bus",
    leg: "to_mountain",
    operator: "Grandeco Snow Resort (グランデコスノーリゾート)",
    phone: null,
    website: "https://grandecoresort.co.jp/snow/",
    route_summary:
      "Reservation-based free shuttle from JR Inawashiro Station via the Urabandai visitor centre to the Grandeco base in about 40 minutes, running through the snow season. Book ahead on the resort site · seats are limited on peak days.",
    route_summary_local:
      "JR猪苗代駅から裏磐梯ビジターセンター経由でグランデコベースまで約40分の事前予約制無料シャトル、スノーシーズン中運行。公式サイトから要予約 · 繁忙日は席数限定。",
    regions: ["bandai"],
    mountains_served: ["grandeco"],
  },
  {
    id: "jp-aizu-bus-urabandai",
    name: "Aizu Bus · Urabandai line",
    name_local: "会津バス 裏磐梯線",
    type: "bus",
    leg: "to_town",
    operator: "Aizu Bus (会津バス)",
    phone: null,
    website: "https://www.aizubus.com/",
    route_summary:
      "Route bus from Inawashiro Station up to the Urabandai lake district (Goshiki-numa, Lake Hibara) in about 30 minutes, a handful of departures a day year-round. Handy for staying at the Urabandai pensions closest to Grandeco · check the operator's site for the current timetable.",
    route_summary_local:
      "猪苗代駅から裏磐梯の湖沼地帯（五色沼・桧原湖）まで約30分の路線バス、通年で1日数便。グランデコに最も近い裏磐梯のペンション滞在に便利 · 最新時刻表は公式サイトで確認。",
    regions: ["bandai"],
  },
];
