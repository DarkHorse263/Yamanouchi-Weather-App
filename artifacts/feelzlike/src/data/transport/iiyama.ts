import type { TransportProviderList } from "@/types/transport";

/**
 * Iiyama (Nagano, Japan) transport providers.
 *
 * Iiyama Station is the gateway shinkansen stop for the wider
 * Madarao / Tangram / Togari / Kijimadaira cluster. Phone numbers and
 * websites left as `null` where not directly verifiable · we never
 * guess. Bilingual `name_local` and `route_summary_local` are
 * provided for kanji rendering in the JP language toggle.
 */
export const IIYAMA_TRANSPORT: TransportProviderList = [
  {
    id: "jp-hokuriku-shinkansen-iiyama",
    name: "Hokuriku Shinkansen",
    name_local: "北陸新幹線",
    type: "train",
    operator: "JR East / JR West",
    phone: null,
    website: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html",
    route_summary:
      "Tokyo Station → Iiyama Station in around 1h45 on the Hokuriku Shinkansen · the fastest way to reach the Madarao, Tangram, Togari and Kijimadaira cluster. From Iiyama Station, transfer to a resort shuttle or local bus.",
    route_summary_local:
      "東京駅から飯山駅まで北陸新幹線で約1時間45分。斑尾・タングラム・戸狩・木島平エリアへの最速ルート。飯山駅からはリゾートシャトルまたは路線バスに乗り換え。",
    schedule_url: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html",
    regions: ["iiyama"],
  },
  {
    id: "jp-iiyama-line-local",
    name: "JR Iiyama Line",
    name_local: "JR飯山線",
    type: "train",
    operator: "JR East (東日本旅客鉄道)",
    phone: null,
    website: "https://www.jreast.co.jp/e/index.html",
    route_summary:
      "Local line linking Toyono · Iiyama · Togari Nozawa-onsen · Tōkamachi. Stops at Iiyama Station (shinkansen interchange) and Togari Nozawa-onsen Station (gateway to Togari and the wider Iiyama valley). Slower than the shinkansen but the scenic route through the Chikuma River valley.",
    route_summary_local:
      "豊野・飯山・戸狩野沢温泉・十日町を結ぶローカル線。飯山駅（新幹線接続）と戸狩野沢温泉駅（戸狩・飯山谷の入口）に停車。新幹線より遅いが千曲川沿いの景観ルート。",
    regions: ["iiyama"],
  },
  {
    id: "jp-madarao-kogen-shuttle",
    name: "Madarao Kogen Shuttle",
    name_local: "斑尾高原シャトル",
    type: "shuttle",
    operator: "Madarao Kogen Hotel / resort partners",
    phone: null,
    website: "https://www.madarao.jp/en/access/",
    route_summary:
      "Winter shuttle bus from Iiyama Shinkansen Station to Madarao Kogen (~30 min) and Tangram Ski Circus. Timed around shinkansen arrivals · advance booking recommended on peak weekends.",
    route_summary_local:
      "冬季、飯山新幹線駅から斑尾高原まで（約30分）・タングラム・スキー・サーカスへのシャトルバス。新幹線到着に合わせて運行・繁忙期は事前予約推奨。",
    regions: ["iiyama"],
    mountains_served: ["madarao", "tangram"],
  },
  {
    id: "jp-kijimadaira-shuttle",
    name: "Kijimadaira Resort Shuttle",
    name_local: "木島平リゾートシャトル",
    type: "shuttle",
    operator: "Kijimadaira Ski Resort",
    phone: null,
    website: "https://kijimadaira.jp/",
    route_summary:
      "Seasonal shuttle service from Iiyama Shinkansen Station to Kijimadaira Ski Resort (~25 min). Operates on selected winter days · advance booking required.",
    route_summary_local:
      "冬季、飯山新幹線駅から木島平スキー場まで（約25分）の季節運行シャトル。指定日のみ運行・事前予約必須。",
    regions: ["iiyama"],
    mountains_served: ["kijimadaira", "kijima-snow-park"],
  },
  {
    id: "jp-iiyama-city-local-bus",
    name: "Iiyama City Local Bus",
    name_local: "飯山市内路線バス",
    type: "bus",
    operator: "Iiyama City / local route operators",
    phone: null,
    website: "https://www.city.iiyama.nagano.jp/",
    route_summary:
      "Iiyama City local route buses connect Iiyama Station with outlying hamlets and the Togari and Kijimadaira valleys. Coverage and frequency vary by route and season · check the city website for current timetables before relying on it for last-mile transfer.",
    route_summary_local:
      "飯山市内の路線バスは飯山駅と周辺集落・戸狩・木島平方面を結びます。経路・運行頻度は季節により変動するため、利用前に市の公式サイトで最新時刻表を確認してください。",
    regions: ["iiyama"],
    mountains_served: ["togari-onsen", "kijimadaira", "kijima-snow-park"],
  },
  {
    id: "jp-nagano-snow-shuttle-iiyama",
    name: "Nagano Snow Shuttle",
    name_local: "長野スノーシャトル",
    type: "shuttle",
    operator: "Snow Monkey Resorts / Nagano-area bus partners",
    phone: null,
    website: "https://www.snowmonkeyresorts.com/transportation/",
    route_summary:
      "Pre-booked shared shuttle service connecting Iiyama Station and the Madarao / Togari / Kijimadaira cluster with other Nagano resorts including Nozawa Onsen, Shiga Kogen and Yamanouchi.",
    route_summary_local:
      "飯山駅と斑尾・戸狩・木島平エリア、そして野沢温泉・志賀高原・山ノ内など長野県内リゾートを結ぶ事前予約制シェアシャトル。",
    regions: ["iiyama"],
  },
];
