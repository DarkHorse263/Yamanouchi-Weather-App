import type { TransportProviderList } from "@/types/transport";

/**
 * Myoko (Niigata, Japan) transport providers.
 *
 * Rail is the spine of Myoko access: Hokuriku Shinkansen to Nagano then
 * the Shinano Railway Kita-Shinano Line up to Myoko-Kogen Station (for
 * Akakura, Ikenotaira and Suginosawa), or shinkansen to Joetsumyoko and
 * the Echigo Tokimeki Railway Myoko Haneuma Line south (for Arai and
 * Lotte Arai). Phone numbers and deep schedule links are left `null`
 * where not directly verifiable · we never guess. Bilingual `name_local`
 * and `route_summary_local` are provided for the JP language toggle.
 */
export const MYOKO_TRANSPORT: TransportProviderList = [
  {
    id: "jp-hokuriku-shinkansen-myoko",
    name: "Hokuriku Shinkansen",
    name_local: "北陸新幹線",
    type: "train",
    leg: "to_town",
    operator: "JR East / JR West",
    phone: null,
    website: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html",
    route_summary:
      "Tokyo Station to Nagano Station in around 1h20, or through to Joetsumyoko Station in around 2h. From Nagano transfer to the Shinano Railway for Myoko-Kogen (Akakura side) · from Joetsumyoko transfer to the Myoko Haneuma Line for Arai and Lotte Arai.",
    route_summary_local:
      "東京駅から長野駅まで約1時間20分、上越妙高駅まで約2時間。長野駅からはしなの鉄道で妙高高原駅（赤倉方面）へ · 上越妙高駅からは妙高はねうまラインで新井・ロッテアライ方面へ乗り換え。",
    schedule_url: "https://www.jreast.co.jp/e/routemaps/hokurikushinkansen.html",
    regions: ["myoko"],
  },
  {
    id: "jp-shinano-railway-kita-shinano",
    name: "Shinano Railway Kita-Shinano Line",
    name_local: "しなの鉄道 北しなの線",
    type: "train",
    leg: "to_town",
    operator: "Shinano Railway (しなの鉄道)",
    phone: null,
    website: "https://www.shinanorailway.co.jp/",
    route_summary:
      "Local line from Nagano Station north to Myoko-Kogen Station in around 45 minutes · the standard onward leg after the shinkansen into Nagano. Myoko-Kogen is the stop for Akakura Onsen, Ikenotaira and Suginohara (short bus or taxi up to the villages).",
    route_summary_local:
      "長野駅から妙高高原駅まで約45分のローカル線 · 新幹線で長野に着いた後の定番の乗り継ぎ。妙高高原駅は赤倉温泉・池の平・杉ノ原の最寄り（各集落へはバスまたはタクシーで数分）。",
    regions: ["myoko"],
  },
  {
    id: "jp-echigo-tokimeki-myoko-haneuma",
    name: "Echigo Tokimeki Railway Myoko Haneuma Line",
    name_local: "えちごトキめき鉄道 妙高はねうまライン",
    type: "train",
    leg: "to_town",
    operator: "Echigo Tokimeki Railway (えちごトキめき鉄道)",
    phone: null,
    website: "https://www.echigo-tokimeki.co.jp/",
    route_summary:
      "Local line linking Myoko-Kogen · Arai · Joetsumyoko along the valley floor. Connects the Akakura side of Myoko with the Arai district and the Joetsumyoko shinkansen stop · Kita-Arai and Arai are the stations nearest Lotte Arai.",
    route_summary_local:
      "妙高高原・新井・上越妙高を結ぶ谷沿いのローカル線。妙高の赤倉側と新井地区・上越妙高駅（新幹線）をつなぐ · ロッテアライへは北新井駅・新井駅が最寄り。",
    regions: ["myoko"],
  },
  {
    id: "jp-lotte-arai-shuttle",
    name: "Lotte Arai Resort Shuttle",
    name_local: "ロッテアライリゾート シャトルバス",
    type: "shuttle",
    leg: "to_mountain",
    operator: "Lotte Arai Resort",
    phone: null,
    website: "https://www.lottehotel.com/arai-resort/en/",
    route_summary:
      "Resort shuttle between Joetsumyoko Station and Lotte Arai. Frequency and booking rules vary by season · check the resort site for current timetables.",
    route_summary_local:
      "上越妙高駅とロッテアライリゾートを結ぶリゾートシャトル。便数・予約条件は季節で変動 · 最新時刻表はリゾート公式サイトで確認。",
    regions: ["myoko"],
    mountains_served: ["lotte-arai"],
  },
];
