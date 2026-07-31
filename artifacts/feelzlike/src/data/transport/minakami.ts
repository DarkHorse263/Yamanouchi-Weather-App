import type { TransportProviderList } from "@/types/transport";

/**
 * Minakami (Gunma, Japan) transport providers.
 *
 * The valley is a classic Tokyo weekend trip: Joetsu Shinkansen to
 * Jomo-Kogen, or the JR Joetsu local line to Minakami Station.
 * Verified public routes in: the shinkansen + local rail pair and
 * Kan-etsu Kotsu's valley buses that link the stations to the onsen
 * town and up to Tanigawadake Ropeway. Phone numbers and deep
 * schedule links are left `null` where not directly verifiable · we
 * never guess. Bilingual `name_local` and `route_summary_local` are
 * provided for the JP language toggle.
 */
export const MINAKAMI_TRANSPORT: TransportProviderList = [
  {
    id: "jp-joetsu-shinkansen-jomo-kogen",
    name: "Joetsu Shinkansen · Jomo-Kogen",
    name_local: "上越新幹線 上毛高原駅",
    type: "train",
    leg: "to_town",
    operator: "JR East (JR東日本)",
    phone: null,
    website: "https://www.jreast.co.jp/multi/en/",
    route_summary:
      "Joetsu Shinkansen from Tokyo to Jomo-Kogen in about 70 minutes, roughly hourly. From the station, Kan-etsu Kotsu buses run to Minakami Station and the onsen town in about 25 minutes · the fastest rail approach to the valley.",
    route_summary_local:
      "東京から上毛高原駅まで上越新幹線で約70分、おおむね1時間に1本。駅からは関越交通バスで水上駅・温泉街まで約25分 · 谷への最速の鉄道ルート。",
    regions: ["minakami"],
  },
  {
    id: "jp-jr-joetsu-line-minakami",
    name: "JR Joetsu Line · Minakami Station",
    name_local: "JR上越線 水上駅",
    type: "train",
    leg: "to_town",
    operator: "JR East (JR東日本)",
    phone: null,
    website: "https://www.jreast.co.jp/multi/en/",
    route_summary:
      "Local Joetsu Line trains reach Minakami Station in the middle of the onsen town, with connections from Takasaki. Services are infrequent (roughly every 1-2 hours) · check times before travelling.",
    route_summary_local:
      "JR上越線の普通列車が温泉街の中心・水上駅に到着、高崎から乗り継ぎ。本数は少なめ（おおむね1〜2時間に1本） · 事前に時刻の確認を。",
    regions: ["minakami"],
  },
  {
    id: "jp-kanetsu-kotsu-tanigawadake-bus",
    name: "Kan-etsu Kotsu · Tanigawadake Ropeway bus",
    name_local: "関越交通 谷川岳ロープウェイ線",
    type: "bus",
    leg: "to_mountain",
    operator: "Kan-etsu Kotsu (関越交通)",
    phone: null,
    website: "https://kan-etsu.net/",
    route_summary:
      "Local buses from Minakami Station up the valley to the Tanigawadake Ropeway base in about 20 minutes, several times a day (some services start from Jomo-Kogen). The only public route to the Tenjindaira / Mt.T lifts · check the operator's site for the current timetable.",
    route_summary_local:
      "水上駅から谷川岳ロープウェイまで路線バスで約20分、1日数本（上毛高原駅始発の便もあり）。天神平（Mt.T）へ行ける唯一の公共交通 · 最新時刻表は公式サイトで確認。",
    regions: ["minakami"],
    mountains_served: ["tenjindaira"],
  },
  {
    id: "jp-minakami-kogen-hotel-shuttle",
    name: "Minakami Kogen Hotel 200 shuttle",
    name_local: "水上高原ホテル200 送迎バス",
    type: "bus",
    leg: "to_mountain",
    operator: "Minakami Kogen Hotel 200 (水上高原ホテル200)",
    phone: null,
    website: "https://minakamikogen200.jp/",
    route_summary:
      "Reservation shuttle between Jomo-Kogen / Minakami Station and the ski-in Hotel 200 at the resort base, running in winter for hotel and ski guests. Book ahead · check the resort site for the current schedule and conditions.",
    route_summary_local:
      "上毛高原駅・水上駅とゲレンデ直結のホテル200を結ぶ予約制送迎バス、冬季は宿泊・スキー利用者向けに運行。要事前予約 · 最新の運行状況は公式サイトで確認。",
    regions: ["minakami"],
    mountains_served: ["minakami-kogen"],
  },
  {
    id: "jp-norn-minakami-shuttle",
    name: "Norn Minakami free shuttle",
    name_local: "ノルンみなかみ 無料シャトルバス",
    type: "bus",
    leg: "to_mountain",
    operator: "Norn Minakami (ノルンみなかみスキー場)",
    phone: null,
    website: "https://www.norn.co.jp/",
    route_summary:
      "Free winter shuttle between Jomo-Kogen Station and the Norn Minakami base in about 20 minutes, running during the ski season. The easy car-free way to the day-trip hill · check the resort site for the shuttle timetable.",
    route_summary_local:
      "上毛高原駅とノルンみなかみを結ぶ約20分の冬季無料シャトルバス、スキーシーズン中運行。車なしで日帰りゲレンデへ行く定番手段 · シャトルの時刻はスキー場公式サイトで確認。",
    regions: ["minakami"],
    mountains_served: ["norn-minakami"],
  },
];
