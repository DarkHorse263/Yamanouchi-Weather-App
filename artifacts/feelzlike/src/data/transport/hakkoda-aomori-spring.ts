import type { TransportProviderList } from "@/types/transport";

/**
 * Hakkoda & Aomori Spring (Aomori, Japan) transport providers.
 *
 * Hakkoda has no rail access · the JR Bus Tohoku Hakkoda-go from
 * Aomori Station is the only public transport up the mountain, with
 * Sukayu Onsen the winter terminus. Aomori Spring has no public
 * shuttle from Ajigasawa Station · the Rockwood hotel runs a
 * pre-booked shuttle from Shin-Aomori, otherwise it is the Gono line
 * plus a taxi. Phone numbers and deep schedule links are left `null`
 * where not directly verifiable · we never guess. Bilingual
 * `name_local` and `route_summary_local` are provided for the JP
 * language toggle.
 */
export const HAKKODA_AOMORI_SPRING_TRANSPORT: TransportProviderList = [
  {
    id: "jp-jrbus-hakkoda-go",
    name: "JR Bus Tohoku · Hakkoda-go",
    name_local: "JRバス東北 八甲田号",
    type: "bus",
    leg: "to_mountain",
    operator: "JR Bus Tohoku (JRバス東北)",
    phone: null,
    website: "https://www.jrbustohoku.co.jp/",
    route_summary:
      "Winter route bus from Aomori Station (east exit) via Shin-Aomori to the Hakkoda Ropeway in about 60 to 85 minutes, terminating at Sukayu Onsen · around ¥1,100 to ¥1,400 one way. The only public transport up the mountain · check the operator's site for current timetables.",
    route_summary_local:
      "青森駅東口から新青森駅経由で八甲田ロープウェー駅前まで約60〜85分、冬季は酸ヶ湯温泉が終点 · 片道約1,100〜1,400円。山へ上がる唯一の公共交通 · 最新時刻表は公式サイトで確認。",
    regions: ["hakkoda-aomori-spring"],
    mountains_served: ["hakkoda"],
  },
  {
    id: "jp-aomori-spring-shuttle",
    name: "Aomori Spring · Rockwood hotel shuttle",
    name_local: "青森スプリング · ロックウッドホテル送迎シャトル",
    type: "shuttle",
    leg: "to_town",
    operator: "Aomori Spring Resort (Rockwood Hotel & Spa)",
    phone: null,
    website: "https://aomorispring.com/access",
    route_summary:
      "Hotel-guest shuttle between Shin-Aomori Station and the resort in about 90 minutes · a few departures per day, reservations required at least 2 days ahead. There is no public shuttle from Ajigasawa Station · the resort suggests a taxi for that stretch.",
    route_summary_local:
      "新青森駅とリゾートを約90分で結ぶ宿泊者向け送迎シャトル · 1日数便、2日前までの要予約。鰺ヶ沢駅からの一般シャトルはなし · 駅からはタクシー利用が案内されている。",
    regions: ["hakkoda-aomori-spring"],
    mountains_served: ["aomori-spring"],
  },
  {
    id: "jp-jr-gono-line",
    name: "JR East · Gono line to Ajigasawa",
    name_local: "JR東日本 五能線（鰺ヶ沢）",
    type: "train",
    leg: "to_town",
    operator: "JR East (JR東日本)",
    phone: null,
    website: "https://www.jreast.co.jp/en/multi/",
    route_summary:
      "Local trains link Shin-Aomori and Hirosaki with Ajigasawa Station on the coast · from there it is about 20 minutes by taxi up to Aomori Spring. The Tohoku Shinkansen reaches Shin-Aomori from Tokyo in about 3 hours.",
    route_summary_local:
      "普通列車が新青森・弘前と海沿いの鰺ヶ沢駅を結ぶ · 駅から青森スプリングまではタクシーで約20分。東北新幹線は東京〜新青森を約3時間で結ぶ。",
    regions: ["hakkoda-aomori-spring"],
    mountains_served: ["aomori-spring"],
  },
];
