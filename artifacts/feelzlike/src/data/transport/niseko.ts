import type { TransportProviderList } from "@/types/transport";

/**
 * Niseko (Hokkaido, Japan) transport providers.
 *
 * Most guests arrive via New Chitose Airport: either a direct winter
 * coach (Hokkaido Resort Liner and similar operators) or JR trains via
 * Otaru on the Hakodate Line to Kutchan and Niseko stations. Within the
 * area the Niseko United Shuttle links the united resort bases. Phone
 * numbers and deep schedule links are left `null` where not directly
 * verifiable · we never guess. Bilingual `name_local` and
 * `route_summary_local` are provided for the JP language toggle.
 */
export const NISEKO_TRANSPORT: TransportProviderList = [
  {
    id: "jp-jr-hokkaido-hakodate-line",
    name: "JR Hokkaido Hakodate Line",
    name_local: "JR北海道 函館本線",
    type: "train",
    leg: "to_town",
    operator: "JR Hokkaido (JR北海道)",
    phone: null,
    website: "https://www.jrhokkaido.co.jp/global/",
    route_summary:
      "From Sapporo or New Chitose Airport take the Rapid Airport line to Otaru, then the local Hakodate Line over the hills to Kutchan Station and on to Niseko Station. Kutchan is the stop for Hirafu and Hanazono (short bus or taxi up) · Niseko Station serves Niseko Town, Village, Annupuri and Moiwa.",
    route_summary_local:
      "札幌・新千歳空港から快速エアポートで小樽へ、小樽から函館本線の普通列車で倶知安駅・ニセコ駅へ。倶知安駅はヒラフ・HANAZONO方面の最寄り（バスまたはタクシーで数分） · ニセコ駅はニセコ町・ビレッジ・アンヌプリ・モイワ方面。",
    regions: ["niseko"],
  },
  {
    id: "jp-hokkaido-resort-liner",
    name: "Hokkaido Resort Liner",
    name_local: "北海道リゾートライナー",
    type: "bus",
    leg: "to_town",
    operator: "Hokkaido Access Network (北海道アクセスネットワーク)",
    phone: null,
    website: "https://www.access-n.jp/",
    route_summary:
      "Winter coach service from New Chitose Airport and Sapporo direct to the Niseko resorts and Hirafu accommodation in around 3 hours. Reservations required · seats and stops vary by season, check the operator's site for current timetables.",
    route_summary_local:
      "新千歳空港・札幌からニセコ各リゾート・ヒラフの宿泊施設へ直行する冬季バス（約3時間）。要予約 · 便数や停車地は季節で変動、最新時刻表は公式サイトで確認。",
    regions: ["niseko"],
  },
  {
    id: "jp-niseko-united-shuttle",
    name: "Niseko United Shuttle",
    name_local: "ニセコユナイテッドシャトル",
    type: "shuttle",
    leg: "to_mountain",
    operator: "Niseko United",
    phone: null,
    website: "https://www.niseko.ne.jp/",
    route_summary:
      "Winter shuttle linking the Hirafu, Niseko Village and Annupuri bases · free with an All Mountain pass. Hanazono runs its own free resort shuttle from Hirafu. Routes and frequency vary by season · check the Niseko United site for current timetables.",
    route_summary_local:
      "ヒラフ・ニセコビレッジ・アンヌプリの各ベースを結ぶ冬季シャトル · 全山共通パスで無料。HANAZONOへはヒラフから無料のリゾートシャトルが運行。ルート・便数は季節で変動 · 最新情報はNiseko United公式サイトで確認。",
    regions: ["niseko"],
    mountains_served: ["grand-hirafu", "niseko-village", "annupuri", "hanazono"],
  },
];
