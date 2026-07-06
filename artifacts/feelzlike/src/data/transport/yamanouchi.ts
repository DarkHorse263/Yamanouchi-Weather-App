import type { TransportProviderList } from "@/types/transport";

/**
 * Yamanouchi (Nagano, Japan) transport providers.
 *
 * Phone numbers and websites left as `null` where not directly verifiable
 * - we never guess. Bilingual `name_local` and `route_summary_local` are
 * provided for kanji rendering in the JP language.
 */
export const YAMANOUCHI_TRANSPORT: TransportProviderList = [
  {
    id: "jp-nagaden-yudanaka-line",
    name: "Nagano Dentetsu (Nagaden) - Yudanaka Line",
    name_local: "長野電鉄 湯田中線",
    type: "train",
    leg: "to_town",
    operator: "Nagano Dentetsu Co., Ltd. (長野電鉄株式会社)",
    phone: null,
    website: "https://www.nagaden-net.co.jp",
    route_summary:
      "Nagano Station → Yudanaka Station via the Nagaden Yudanaka line. The Limited Express \"Yukemuri\" / \"Snow Monkey\" makes the trip in around 45-50 minutes; local services run more often.",
    route_summary_local:
      "長野駅から湯田中駅まで長野電鉄湯田中線で約45〜50分（特急ゆけむり／スノーモンキー）。普通電車はより頻繁に運行。",
    schedule_url: "https://www.nagaden-net.co.jp/timetable/",
    regions: ["yamanouchi"],
  },
  {
    id: "jp-shiga-kogen-express-bus",
    name: "Shiga Kogen Express Bus",
    name_local: "志賀高原急行バス",
    type: "bus",
    leg: "to_town",
    operator: "Nagaden Bus (長電バス)",
    phone: null,
    website:
      "https://www.shigakogen.gr.jp/english/topics/shiga-kogen-bus-service-information.html",
    route_summary:
      "Direct express bus from Nagano Station East Exit (Stop 23) to Yamanoeki / Shiga Kogen, ~70 minutes, no transfer needed. Adult ¥3,200-3,800 one-way.",
    route_summary_local:
      "長野駅東口23番乗り場から志賀高原（山ノ駅）まで急行バスで約70分・乗り換えなし。大人片道¥3,200〜3,800。",
    schedule_url:
      "https://www.shigakogen.gr.jp/english/topics/shiga-kogen-bus-service-information.html#express",
    regions: ["yamanouchi"],
  },
  {
    id: "jp-shiga-kogen-line-local-bus",
    name: "Shiga Kogen Line (Local Bus)",
    name_local: "志賀高原線（ローカルバス）",
    type: "bus",
    leg: "to_mountain",
    operator: "Nagaden Bus (長電バス)",
    phone: null,
    website:
      "https://www.snowmonkeyresorts.com/access/nagaden-local-bus-timetable/",
    route_summary:
      "Yudanaka Station ↔ Snow Monkey Park ↔ Yamanoeki (Shiga Kogen) local bus connecting the onsen towns with the highland resorts. Adult one-way ¥390 (child ¥200) Yudanaka-Park.",
    route_summary_local:
      "湯田中駅〜野猿公苑〜山ノ駅（志賀高原）を結ぶローカルバス。湯田中〜公苑間は大人片道¥390（子供¥200）。",
    schedule_url:
      "https://www.snowmonkeyresorts.com/access/nagaden-local-bus-timetable/#Shiga-Kogen-Line-Timetable",
    regions: ["yamanouchi"],
  },
  {
    id: "jp-snow-monkey-express",
    name: "Snow Monkey Express Bus",
    name_local: "スノーモンキー・エクスプレス",
    type: "bus",
    leg: "to_town",
    operator: "Snow Monkey Resorts / Nagaden Bus",
    phone: null,
    website:
      "https://www.snowmonkeyresorts.com/access/snow-monkey-express-bus/",
    route_summary:
      "Direct seasonal bus from Nagano Station to the Snow Monkey Park / Yudanaka area, marketed for international visitors visiting the snow monkeys.",
    route_summary_local:
      "長野駅から地獄谷野猿公苑・湯田中エリアへの季節運行直通バス。スノーモンキー観光向け。",
    regions: ["yamanouchi"],
  },
  {
    id: "jp-nagano-snow-shuttle",
    name: "Nagano Snow Shuttle",
    name_local: "長野スノーシャトル",
    type: "shuttle",
    leg: "to_town",
    operator: "Snow Monkey Resorts (operated by Nagano-area bus partners)",
    phone: null,
    website: "https://www.snowmonkeyresorts.com/transportation/",
    route_summary:
      "Pre-booked shared shuttle service serving Nagano-area resorts including Shiga Kogen, Nozawa Onsen and Yamanouchi. Useful when timing the express bus is awkward.",
    route_summary_local:
      "志賀高原・野沢温泉・山ノ内など長野エリアのリゾートを結ぶ事前予約制シェアシャトル。",
    regions: ["yamanouchi"],
  },
  {
    id: "jp-snow-story-night-bus",
    name: 'Night Bus "Snow Story"',
    name_local: "ナイトバス「スノーストーリー」",
    type: "bus",
    leg: "to_town",
    operator: "Nagaden Bus / partner operators",
    phone: null,
    website:
      "https://www.shigakogen.gr.jp/english/topics/shiga-kogen-bus-service-information.html",
    route_summary:
      "Overnight coach from Tokyo Station direct to Shiga Kogen on selected winter weekends; advance booking required.",
    route_summary_local:
      "東京駅から志賀高原まで、冬季の指定週末に運行する夜行バス。事前予約必須。",
    regions: ["yamanouchi"],
  },
  {
    id: "jp-hokuriku-shinkansen",
    name: "Hokuriku Shinkansen",
    name_local: "北陸新幹線",
    type: "train",
    leg: "to_town",
    operator: "JR East / JR West",
    phone: null,
    website: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html",
    route_summary:
      "Tokyo Station → Nagano Station in ~90 minutes on the Hokuriku Shinkansen. From Nagano, transfer to the express bus or Nagaden train to reach Yudanaka and Shiga Kogen.",
    route_summary_local:
      "東京駅から長野駅まで北陸新幹線で約90分。長野駅で急行バスまたは長電に乗り換えて湯田中・志賀高原へ。",
    schedule_url: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html",
    regions: ["yamanouchi"],
  },
];
