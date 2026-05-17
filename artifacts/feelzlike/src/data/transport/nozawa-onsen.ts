import type { TransportProviderList } from "@/types/transport";

/**
 * Nozawa Onsen (Nagano, Japan) transport providers.
 *
 * Phone numbers and websites left as `null` where not directly
 * verifiable · we never guess. Bilingual `name_local` and
 * `route_summary_local` are provided for kanji rendering in the JP
 * language toggle.
 */
export const NOZAWA_ONSEN_TRANSPORT: TransportProviderList = [
  {
    id: "jp-hokuriku-shinkansen-nozawa",
    name: "Hokuriku Shinkansen",
    name_local: "北陸新幹線",
    type: "train",
    operator: "JR East / JR West",
    phone: null,
    website: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html",
    route_summary:
      "Tokyo Station → Iiyama Station in around 1h45 on the Hokuriku Shinkansen. From Iiyama Station, transfer to the Nozawa Onsen Liner bus for the final ~25 min to the village.",
    route_summary_local:
      "東京駅から飯山駅まで北陸新幹線で約1時間45分。飯山駅から野沢温泉ライナーバスで約25分。",
    schedule_url: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html",
    regions: ["nozawa-onsen"],
  },
  {
    id: "jp-nozawa-onsen-liner",
    name: "Nozawa Onsen Liner",
    name_local: "野沢温泉ライナー",
    type: "bus",
    operator: "Nagano Bus / Nozawa Onsen Kōtsū (野沢温泉交通)",
    phone: null,
    website: "https://www.nozawaski.com/en/access/",
    route_summary:
      "Direct express bus connecting Iiyama Shinkansen Station to Nozawa Onsen village (~25 minutes, no transfer). Timed to meet shinkansen arrivals during the ski season.",
    route_summary_local:
      "飯山新幹線駅から野沢温泉村まで直通バスで約25分・乗り換えなし。冬季は新幹線到着に合わせて運行。",
    schedule_url: "https://www.nozawaski.com/en/access/",
    regions: ["nozawa-onsen"],
  },
  {
    id: "jp-iiyama-line-togari",
    name: "JR Iiyama Line · Togari Nozawa-onsen Station",
    name_local: "JR飯山線・戸狩野沢温泉駅",
    type: "train",
    operator: "JR East (東日本旅客鉄道)",
    phone: null,
    website: "https://www.jreast.co.jp/e/index.html",
    route_summary:
      "Local Iiyama Line trains stop at Togari Nozawa-onsen Station, around 7 km from Nozawa village. Taxi or local bus required for the last leg. Useful as a scenic backup when shinkansen + liner timings don't align.",
    route_summary_local:
      "JR飯山線の戸狩野沢温泉駅は野沢温泉村から約7km。最後はタクシーまたは地元バスで移動。新幹線・ライナーの時間が合わない場合の予備ルートとして便利。",
    regions: ["nozawa-onsen"],
  },
  {
    id: "jp-nozawa-village-shuttle",
    name: "Nozawa Village Shuttle · free",
    name_local: "野沢温泉村内シャトルバス・無料",
    type: "shuttle",
    operator: "Nozawa Onsen Tourist Association (野沢温泉観光協会)",
    phone: null,
    website: "https://nozawakanko.jp/",
    route_summary:
      "Free winter shuttle bus looping through Nozawa Onsen village · connects the main lodging clusters, the village centre and the Hikage gondola base. Saves the walk in ski boots between accommodation and the slopes. Runs through the ski season only.",
    route_summary_local:
      "冬季のみ運行する野沢温泉村内の無料シャトルバス。主要宿泊エリア・温泉街中心部・日影ゴンドラ乗り場を循環。スキーブーツでの移動が楽。スキーシーズン中のみ運行。",
    regions: ["nozawa-onsen"],
    seasonality: "winter_only",
  },
  {
    id: "jp-nagano-snow-shuttle-nozawa",
    name: "Nagano Snow Shuttle",
    name_local: "長野スノーシャトル",
    type: "shuttle",
    operator: "Snow Monkey Resorts / Nagano-area bus partners",
    phone: null,
    website: "https://www.snowmonkeyresorts.com/transportation/",
    route_summary:
      "Pre-booked shared shuttle service connecting Nagano Station, Iiyama Station and Nozawa Onsen with other Nagano resorts (Shiga Kogen, Yamanouchi, Madarao). Useful when shinkansen + liner timings don't line up.",
    route_summary_local:
      "長野駅・飯山駅・野沢温泉と志賀高原・山ノ内・斑尾など長野エリアのリゾートを結ぶ事前予約制シェアシャトル。",
    regions: ["nozawa-onsen"],
  },
];
