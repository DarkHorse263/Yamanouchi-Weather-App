import type { TransportProviderList } from "@/types/transport";

/**
 * Tomamu & Sahoro (Hokkaido, Japan) transport providers.
 *
 * Both resorts sit on the JR Sekisho Line corridor east of New
 * Chitose. Verified public routes in: the JR limited express
 * (Tokachi/Ozora) stopping at Tomamu Station with the free resort
 * shuttle to the towers, the same line on to Shintoku Station for
 * Sahoro, and the Hokkaido Resort Liner winter coach from New Chitose
 * Airport to Tomamu. Phone numbers and deep schedule links are left
 * `null` where not directly verifiable · we never guess. Bilingual
 * `name_local` and `route_summary_local` are provided for the JP
 * language toggle.
 */
export const TOMAMU_SAHORO_TRANSPORT: TransportProviderList = [
  {
    id: "jp-jr-sekisho-tomamu",
    name: "JR limited express · Tomamu Station",
    name_local: "JR特急とかち・おおぞら トマム駅",
    type: "train",
    leg: "to_town",
    operator: "JR Hokkaido (JR北海道)",
    phone: null,
    website: "https://www.jrhokkaido.co.jp/global/",
    route_summary:
      "Tokachi and Ozora limited express trains from Sapporo stop at Tomamu Station in about 100 minutes, several times a day via Minami-Chitose (connection from New Chitose Airport). A free resort shuttle meets trains and runs the few minutes to the hotel towers · check the resort site for the shuttle timetable.",
    route_summary_local:
      "札幌からトマム駅まで特急とかち・おおぞらで約100分、1日数本 · 南千歳で新千歳空港からの接続あり。駅からはホテルタワーまで無料リゾートシャトルが列車に接続 · シャトルの時刻はリゾート公式サイトで確認。",
    regions: ["tomamu-sahoro"],
    mountains_served: ["tomamu-resort"],
  },
  {
    id: "jp-jr-sekisho-shintoku",
    name: "JR limited express · Shintoku Station (Sahoro)",
    name_local: "JR特急とかち・おおぞら 新得駅",
    type: "train",
    leg: "to_mountain",
    operator: "JR Hokkaido (JR北海道)",
    phone: null,
    website: "https://www.jrhokkaido.co.jp/global/",
    route_summary:
      "The same Tokachi and Ozora limited expresses continue from Tomamu to Shintoku Station in about 20 minutes. Sahoro Resort is about 10 minutes from the station by taxi or the resort's winter shuttle · check the resort site for the current shuttle arrangements.",
    route_summary_local:
      "特急とかち・おおぞらはトマムから新得駅まで約20分。サホロリゾートへは駅からタクシーまたは冬季シャトルで約10分 · シャトルの運行はリゾート公式サイトで確認。",
    regions: ["tomamu-sahoro"],
    mountains_served: ["sahoro"],
  },
  {
    id: "jp-resort-liner-tomamu",
    name: "Hokkaido Resort Liner · New Chitose Airport coach",
    name_local: "北海道リゾートライナー 新千歳空港線",
    type: "bus",
    leg: "to_town",
    operator: "Hokkaido Access Network (北海道アクセスネットワーク)",
    phone: null,
    website: "https://www.access-n.jp/",
    route_summary:
      "Winter direct coach from New Chitose Airport to Hoshino Resorts Tomamu in about 100 minutes, running during the ski season. Reservations required · book on the operator's site.",
    route_summary_local:
      "新千歳空港から星野リゾート トマムまで約100分の冬季直行バス、スキーシーズン中運行。要予約 · 公式サイトから申し込み。",
    regions: ["tomamu-sahoro"],
    mountains_served: ["tomamu-resort"],
  },
  {
    id: "jp-jr-shimukappu-station",
    name: "JR Sekisho Line · Shimukappu Station",
    name_local: "JR石勝線 占冠駅",
    type: "train",
    leg: "to_town",
    operator: "JR Hokkaido (JR北海道)",
    phone: null,
    website: "https://www.jrhokkaido.co.jp/global/",
    route_summary:
      "Limited express trains between Sapporo and Tomamu also stop at Shimukappu Station, one stop west of Tomamu. Services are a few per day · check the JR Hokkaido timetable before relying on a specific train.",
    route_summary_local:
      "札幌〜トマム間の特急はトマムの一つ西、占冠駅にも停車。本数は1日数本 · 利用前にJR北海道の時刻表で確認。",
    regions: ["tomamu-sahoro"],
  },
];
