import type { TransportProviderList } from "@/types/transport";

/**
 * Rusutsu & Kiroro (Hokkaido, Japan) transport providers.
 *
 * Neither resort has train access, so winter coaches are the standard
 * way in. Rusutsu runs its own BIGRUNS shuttle from New Chitose
 * Airport; the Hokkaido Resort Liner covers both resorts from Sapporo
 * and the airport in winter; for Kiroro, JR trains reach Otaru-Chikko
 * with a taxi for the last stretch up the valley. Phone numbers and
 * deep schedule links are left `null` where not directly verifiable ·
 * we never guess. Bilingual `name_local` and `route_summary_local`
 * are provided for the JP language toggle.
 */
export const RUSUTSU_KIRORO_TRANSPORT: TransportProviderList = [
  {
    id: "jp-bigruns-rusutsu",
    name: "BIGRUNS bus",
    name_local: "ビッグランズ号",
    type: "bus",
    leg: "to_town",
    operator: "Rusutsu Resort (BIGRUNS)",
    phone: null,
    website: "https://bigruns.com/?lang=en",
    route_summary:
      "Rusutsu Resort's own shuttle between New Chitose Airport and the resort hotels in a bit over 2 hours. Advance reservations required · winter services run roughly late November to late March, check the operator's site for current timetables and fares.",
    route_summary_local:
      "新千歳空港とルスツリゾートのホテルを約2時間強で結ぶリゾート直営シャトル。要事前予約 · 冬季はおおむね11月下旬〜3月下旬運行、最新の時刻表・運賃は公式サイトで確認。",
    regions: ["rusutsu-kiroro"],
    mountains_served: ["rusutsu-resort"],
  },
  {
    id: "jp-hokkaido-resort-liner-rusutsu-kiroro",
    name: "Hokkaido Resort Liner",
    name_local: "北海道リゾートライナー",
    type: "bus",
    leg: "to_town",
    operator: "Hokkaido Access Network (北海道アクセスネットワーク)",
    phone: null,
    website: "https://www.access-n.jp/",
    route_summary:
      "Winter coaches from Sapporo and New Chitose Airport to both Rusutsu and Kiroro. The Sapporo to Kiroro ski bus takes around 90 minutes to 2.5 hours depending on the boarding stop, running roughly mid December to early April. Reservations required · routes and stops vary by season, check the operator's site for current timetables.",
    route_summary_local:
      "札幌・新千歳空港からルスツ・キロロ両リゾートへの冬季直行バス。札幌〜キロロのスキーバスは乗車地により約90分〜2時間半、運行はおおむね12月中旬〜4月上旬。要予約 · 路線や停車地は季節で変動、最新時刻表は公式サイトで確認。",
    regions: ["rusutsu-kiroro"],
    mountains_served: ["rusutsu-resort", "kiroro-resort"],
  },
  {
    id: "jp-jr-hakodate-line-otaru",
    name: "JR Hokkaido · trains to Otaru",
    name_local: "JR北海道 函館本線（小樽方面）",
    type: "train",
    leg: "to_town",
    operator: "JR Hokkaido (JR北海道)",
    phone: null,
    website: "https://www.jrhokkaido.co.jp/global/",
    route_summary:
      "Rapid Airport and local trains link New Chitose Airport and Sapporo with Otaru-Chikko and Otaru stations · from Otaru-Chikko it is about 30 minutes by taxi or rental car up the valley to Kiroro. There is no rail access to Rusutsu.",
    route_summary_local:
      "快速エアポート・普通列車が新千歳空港・札幌と小樽築港・小樽を結ぶ · 小樽築港駅からキロロまではタクシーまたはレンタカーで約30分。ルスツへの鉄道アクセスはなし。",
    regions: ["rusutsu-kiroro"],
    mountains_served: ["kiroro-resort"],
  },
];
