import type { TransportProviderList } from "@/types/transport";

/**
 * Sapporo (Hokkaido, Japan) transport providers.
 *
 * Sapporo's ski hills are all day trips from the city. Verified public
 * routes in: the JR Hakodate Line rapid to Teine Station plus the
 * resort shuttle up the hill, Jotetsu's winter bus from Sapporo Station
 * to Sapporo Kokusai and its year-round route to Jozankei onsen, the
 * Bankei shuttle from Maruyama-koen subway, and the JR Rapid Airport
 * train from New Chitose Airport. Phone numbers and deep schedule links
 * are left `null` where not directly verifiable · we never guess.
 * Bilingual `name_local` and `route_summary_local` are provided for the
 * JP language toggle.
 */
export const SAPPORO_TRANSPORT: TransportProviderList = [
  {
    id: "jp-jr-rapid-airport-sapporo",
    name: "JR Rapid Airport",
    name_local: "JR快速エアポート",
    type: "train",
    leg: "to_town",
    operator: "JR Hokkaido (JR北海道)",
    phone: null,
    website: "https://www.jrhokkaido.co.jp/global/",
    route_summary:
      "Rapid Airport trains from New Chitose Airport to Sapporo Station in about 40 minutes, several times an hour. IC cards accepted · reserved u-Seat cars available on most services. The quickest way into the city from the airport.",
    route_summary_local:
      "新千歳空港から札幌駅まで快速エアポートで約40分、1時間に数本。ICカード利用可 · 多くの便に指定席「uシート」あり。空港から市内への最速ルート。",
    regions: ["sapporo"],
  },
  {
    id: "jp-jr-hakodate-line-teine",
    name: "JR Hakodate Line · Teine Station",
    name_local: "JR函館本線 手稲駅",
    type: "train",
    leg: "to_town",
    operator: "JR Hokkaido (JR北海道)",
    phone: null,
    website: "https://www.jrhokkaido.co.jp/global/",
    route_summary:
      "Rapid and local trains from Sapporo Station to Teine Station in about 10-20 minutes, frequent through the day. From Teine Station a resort shuttle / Chuo Bus route 70 climbs to the Sapporo Teine Olympia and Highland zones · check the resort site for the winter shuttle timetable.",
    route_summary_local:
      "札幌駅から手稲駅まで快速・普通で約10〜20分、日中は頻発。手稲駅からはリゾートシャトル／中央バス70系統でサッポロテイネのオリンピア・ハイランド両ゾーンへ · 冬季シャトルの時刻はスキー場公式サイトで確認。",
    regions: ["sapporo"],
    mountains_served: ["sapporo-teine"],
  },
  {
    id: "jp-jotetsu-kokusai-winter-bus",
    name: "Jotetsu · Sapporo Kokusai winter bus",
    name_local: "じょうてつ 札幌国際スキー場行き冬季バス",
    type: "bus",
    leg: "to_mountain",
    operator: "Jotetsu (じょうてつ)",
    phone: null,
    website: "https://www.jotetsu.co.jp/",
    route_summary:
      "Winter direct bus from Sapporo Station to Sapporo Kokusai in about 90 minutes via Jozankei, running roughly December to early May. Reservations recommended on peak days · check the operator's site for the current timetable.",
    route_summary_local:
      "札幌駅から定山渓経由で札幌国際スキー場まで約90分の冬季直行バス。運行はおおむね12月〜5月上旬 · 混雑日は予約推奨、最新時刻表は公式サイトで確認。",
    regions: ["sapporo"],
    mountains_served: ["sapporo-kokusai"],
  },
  {
    id: "jp-jotetsu-jozankei-bus",
    name: "Jotetsu · Jozankei bus",
    name_local: "じょうてつバス 定山渓線",
    type: "bus",
    leg: "to_town",
    operator: "Jotetsu (じょうてつ)",
    phone: null,
    website: "https://www.jotetsu.co.jp/",
    route_summary:
      "Route 12 bus from Sapporo Station to Jozankei onsen in about 70 minutes, running year-round roughly hourly. Handy for staying at the hot springs closest to Sapporo Kokusai · check the operator's site for the current timetable.",
    route_summary_local:
      "札幌駅から定山渓温泉まで12系統バスで約70分、通年でおおむね1時間に1本。札幌国際スキー場に最も近い温泉に泊まるのに便利 · 最新時刻表は公式サイトで確認。",
    regions: ["sapporo"],
  },
  {
    id: "jp-bankei-shuttle",
    name: "Sapporo Bankei shuttle",
    name_local: "さっぽろばんけいスキー場 シャトルバス",
    type: "bus",
    leg: "to_mountain",
    operator: "Sapporo Bankei (さっぽろばんけいスキー場)",
    phone: null,
    website: "https://www.bankei.co.jp/",
    route_summary:
      "Free winter shuttle from Maruyama-koen subway station up to Sapporo Bankei in about 20 minutes, running during the ski season. The quickest way to the in-city night hill without a car · check the resort site for the shuttle timetable.",
    route_summary_local:
      "円山公園駅からさっぽろばんけいスキー場まで約20分の冬季無料シャトルバス、スキーシーズン中運行。車なしで市内のナイター山へ行く最速手段 · シャトルの時刻はスキー場公式サイトで確認。",
    regions: ["sapporo"],
    mountains_served: ["sapporo-bankei"],
  },
];
