import type { TransportProviderList } from "@/types/transport";

/**
 * Yuzawa (Niigata, Japan) transport providers.
 *
 * Nearly everyone arrives on the JR Joetsu Shinkansen from Tokyo to
 * Echigo-Yuzawa (~70-80 minutes) · in winter some Tanigawa services
 * continue one stop to GALA Yuzawa Station, straight into the gondola
 * base. From the station, the town's free shuttle loops the nearby
 * resorts and Minamiechigo Kanko Bus route buses run south along
 * Route 17 to Mitsumata (Kagura) and Naeba. Phone numbers and deep
 * schedule links are left `null` where not directly verifiable · we
 * never guess. Bilingual `name_local` and `route_summary_local` are
 * provided for the JP language toggle.
 */
export const YUZAWA_TRANSPORT: TransportProviderList = [
  {
    id: "jp-jr-joetsu-shinkansen",
    name: "JR Joetsu Shinkansen",
    name_local: "JR東日本 上越新幹線",
    type: "train",
    leg: "to_town",
    operator: "JR East (JR東日本)",
    phone: null,
    website: "https://www.jreast.co.jp/en/multi/",
    route_summary:
      "Joetsu Shinkansen from Tokyo or Ueno to Echigo-Yuzawa Station in around 70-80 minutes. In winter, some Tanigawa services continue one stop to GALA Yuzawa Station, arriving directly inside GALA's gondola base building. The JR Joetsu local line also stops at Ishiuchi Station for Ishiuchi Maruyama.",
    route_summary_local:
      "上越新幹線で東京・上野から越後湯沢駅まで約70〜80分。冬季は一部のたにがわ号がガーラ湯沢駅まで乗り入れ、GALAのゴンドラ乗り場に直結。在来線の上越線は石打丸山最寄りの石打駅にも停車。",
    regions: ["yuzawa"],
  },
  {
    id: "jp-yuzawa-free-shuttle",
    name: "Yuzawa free town shuttle",
    name_local: "湯沢町無料シャトルバス",
    type: "shuttle",
    leg: "to_mountain",
    operator: "Yuzawa Town tourism (湯沢町観光まちづくり機構)",
    phone: null,
    website: "https://www.e-yuzawa.gr.jp/",
    route_summary:
      "Free winter shuttle loops from the east exit of Echigo-Yuzawa Station to the nearby resort bases, including Iwappara and the Yuzawa Kogen ropeway side of town. Routes and frequency vary by season · check the Yuzawa tourism site for current timetables.",
    route_summary_local:
      "越後湯沢駅東口から岩原や湯沢高原ロープウェイ方面など周辺スキー場を巡回する冬季無料シャトル。ルート・便数は季節で変動 · 最新時刻表は湯沢町観光まちづくり機構のサイトで確認。",
    regions: ["yuzawa"],
    mountains_served: ["iwappara", "yuzawa-kogen", "gala-yuzawa"],
  },
  {
    id: "jp-minamiechigo-kanko-bus",
    name: "Minamiechigo Kanko Bus",
    name_local: "南越後観光バス",
    type: "bus",
    leg: "to_mountain",
    operator: "Minamiechigo Kanko Bus (南越後観光バス)",
    phone: null,
    website: "https://www.minamiechigo.co.jp/",
    route_summary:
      "Route buses from the east exit of Echigo-Yuzawa Station south along Route 17 to the Mitsumata base of Kagura and on to Naeba (around 50 minutes). Buy tickets on board · check the operator's site for current timetables.",
    route_summary_local:
      "越後湯沢駅東口から国道17号を南下し、かぐら「みつまたステーション」を経由して苗場まで約50分の路線バス。運賃は車内精算 · 最新時刻表は公式サイトで確認。",
    regions: ["yuzawa"],
    mountains_served: ["kagura", "naeba"],
  },
];
