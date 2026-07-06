import type { TransportProviderList } from "@/types/transport";

/**
 * Hakuba Valley (Nagano, Japan) transport providers.
 *
 * The valley has no shinkansen station of its own · the standard access
 * is Hokuriku Shinkansen to Nagano Station, then an Alpico express bus
 * (~1h) into Hakuba. The JR Oito Line is the local rail spine down the
 * valley floor. In winter the Hakuba Valley shuttle links the northern
 * resorts. Phone numbers and deep schedule links are left `null` where
 * not directly verifiable · we never guess. Bilingual `name_local` and
 * `route_summary_local` are provided for the JP language toggle.
 */
export const HAKUBA_VALLEY_TRANSPORT: TransportProviderList = [
  {
    id: "jp-hokuriku-shinkansen-hakuba",
    name: "Hokuriku Shinkansen",
    name_local: "北陸新幹線",
    type: "train",
    leg: "to_town",
    operator: "JR East / JR West",
    phone: null,
    website: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html",
    route_summary:
      "Tokyo Station to Nagano Station in around 1h20 on the Hokuriku Shinkansen · the fastest first leg to Hakuba Valley. From Nagano Station transfer to the Alpico express bus (~1h) into Hakuba village.",
    route_summary_local:
      "東京駅から長野駅まで北陸新幹線で約1時間20分 · 白馬バレーへの最速の第一区間。長野駅からアルピコの特急バス（約1時間）で白馬村へ乗り換え。",
    schedule_url: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html",
    regions: ["hakuba-valley"],
  },
  {
    id: "jp-oito-line-hakuba",
    name: "JR Oito Line",
    name_local: "JR大糸線",
    type: "train",
    leg: "to_town",
    operator: "JR East (東日本旅客鉄道)",
    phone: null,
    website: "https://www.jreast.co.jp/e/index.html",
    route_summary:
      "Local line up the valley floor linking Matsumoto · Shinano-Omachi · Kamishiro · Hakuba · Minami-Otari. Kamishiro Station is the stop for Goryu and Hakuba 47, Hakuba Station for the village and Happo, and Shinano-Omachi for the southern Sun Alpina / Jiigatake resorts. Scenic but slower than the bus.",
    route_summary_local:
      "松本・信濃大町・神城・白馬・南小谷を結ぶ谷沿いのローカル線。神城駅は五竜・Hakuba47、白馬駅は村と八方、信濃大町駅は南部のサンアルピナ・爺ガ岳方面への最寄り。景観は良いがバスより遅い。",
    regions: ["hakuba-valley"],
  },
  {
    id: "jp-alpico-nagano-hakuba-express",
    name: "Alpico Nagano-Hakuba Express Bus",
    name_local: "アルピコ交通 長野-白馬 特急バス",
    type: "bus",
    leg: "to_town",
    operator: "Alpico Kotsu (アルピコ交通)",
    phone: null,
    website: "https://www.alpico.co.jp/traffic/",
    route_summary:
      "Express bus connecting Nagano Station and Hakuba (around 1 hour), timed around shinkansen arrivals · the standard onward leg after the Hokuriku Shinkansen into Nagano.",
    route_summary_local:
      "長野駅と白馬を結ぶ特急バス（約1時間）。新幹線の到着に合わせて運行 · 北陸新幹線で長野に着いた後の定番の乗り継ぎ。",
    regions: ["hakuba-valley"],
  },
  {
    id: "jp-alpico-hakuba-highway-bus",
    name: "Alpico Hakuba Highway Bus",
    name_local: "アルピコ交通 白馬高速バス",
    type: "bus",
    leg: "to_town",
    operator: "Alpico Kotsu / Keio Bus (アルピコ交通・京王バス)",
    phone: null,
    website: "https://www.alpico.co.jp/traffic/",
    route_summary:
      "Direct highway coaches from Shinjuku (Tokyo) to Hakuba, running seasonally in winter · a one-seat ride that skips the shinkansen transfer, though slower.",
    route_summary_local:
      "新宿（東京）から白馬への直行高速バス · 冬季を中心に運行。新幹線の乗り継ぎ不要の直通便だが所要時間は長め。",
    regions: ["hakuba-valley"],
  },
  {
    id: "jp-hakuba-valley-shuttle",
    name: "Hakuba Valley Shuttle",
    name_local: "白馬バレーシャトル",
    type: "shuttle",
    leg: "to_mountain",
    operator: "Hakuba Valley / area resort partners",
    phone: null,
    website: "https://www.hakubavalley.com/",
    route_summary:
      "Winter shuttle-bus network linking the northern Hakuba Valley resorts · Happo, Goryu, Hakuba 47, Iwatake, Tsugaike, Norikura and Cortina · on one valley pass. Frequency and routes vary by season · check the Hakuba Valley site for current timetables.",
    route_summary_local:
      "冬季、北部の白馬バレー各スキー場（八方・五竜・Hakuba47・岩岳・栂池・乗鞍・コルチナ）を共通パスで結ぶシャトルバス網。便数・経路は季節で変動 · 最新時刻表は白馬バレー公式サイトで確認。",
    regions: ["hakuba-valley"],
    mountains_served: [
      "happo-one",
      "hakuba-goryu",
      "hakuba-47",
      "hakuba-iwatake",
      "tsugaike-kogen",
      "hakuba-norikura",
      "hakuba-cortina",
    ],
  },
];
