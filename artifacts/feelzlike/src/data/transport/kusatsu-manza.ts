import type { TransportProviderList } from "@/types/transport";

/**
 * Kusatsu & Manza (Gunma, Japan) transport providers.
 *
 * Verified public routes in: JR limited express + JR Bus Kanto into
 * Kusatsu Onsen's bus terminal, the town shuttle up to the ski base,
 * and the rail + local bus approach to Manza via Manza-Kazawaguchi
 * Station. The direct Shiga-Kusatsu route over the pass closes in
 * winter, so Manza is reached from the Karuizawa/Kazawa side. Phone
 * numbers and deep schedule links are left `null` where not directly
 * verifiable · we never guess. Bilingual `name_local` and
 * `route_summary_local` are provided for the JP language toggle.
 */
export const KUSATSU_MANZA_TRANSPORT: TransportProviderList = [
  {
    id: "jp-jr-kusatsu-shima-express",
    name: "JR Limited Express Kusatsu-Shima",
    name_local: "JR特急 草津・四万",
    type: "train",
    leg: "to_town",
    operator: "JR East (JR東日本)",
    phone: null,
    website: "https://www.jreast.co.jp/multi/en/",
    route_summary:
      "Limited express from Ueno (Tokyo) to Naganohara-Kusatsuguchi Station in about 2.5 hours, a few services a day. From the station, JR Bus Kanto connects to the Kusatsu Onsen bus terminal in about 25 minutes.",
    route_summary_local:
      "上野から長野原草津口駅まで特急「草津・四万」で約2時間半、1日数本。駅からはJRバス関東で草津温泉バスターミナルまで約25分。",
    regions: ["kusatsu-manza"],
  },
  {
    id: "jp-jrbus-kanto-kusatsu",
    name: "JR Bus Kanto · Kusatsu Onsen line",
    name_local: "JRバス関東 草津温泉線",
    type: "bus",
    leg: "to_town",
    operator: "JR Bus Kanto (JRバス関東)",
    phone: null,
    website: "https://www.jrbuskanto.co.jp/",
    route_summary:
      "Frequent local buses from Naganohara-Kusatsuguchi Station to the Kusatsu Onsen bus terminal in about 25 minutes, timed to trains. Highway buses also run direct from Tokyo (Shinjuku) to Kusatsu in about 4 hours · check the operator's site for the current timetable.",
    route_summary_local:
      "長野原草津口駅から草津温泉バスターミナルまで約25分、列車接続で頻発。新宿からの直行高速バス（約4時間）もあり · 最新時刻表は公式サイトで確認。",
    regions: ["kusatsu-manza"],
  },
  {
    id: "jp-kusatsu-ski-shuttle",
    name: "Kusatsu town shuttle to the ski base",
    name_local: "草津温泉 スキー場シャトルバス",
    type: "bus",
    leg: "to_mountain",
    operator: "Kusatsu Onsen Ski Resort (草津温泉スキー場)",
    phone: null,
    website: "https://www.kusatsu-kokusai.com/",
    route_summary:
      "Winter shuttle between the Kusatsu Onsen bus terminal / town hotels and the ski base a few kilometres up the hill, running through the ski season. The easy car-free link from the Yubatake to the lifts · check the resort site for the shuttle timetable.",
    route_summary_local:
      "草津温泉バスターミナル・町内とスキー場ベースを結ぶ冬季シャトルバス、スキーシーズン中運行。湯畑からリフトへの手軽な足 · シャトルの時刻はスキー場公式サイトで確認。",
    regions: ["kusatsu-manza"],
    mountains_served: ["kusatsu-onsen-resort"],
  },
  {
    id: "jp-manza-kazawaguchi-bus",
    name: "Manza Onsen bus · from Manza-Kazawaguchi",
    name_local: "万座温泉行きバス（万座・鹿沢口駅から）",
    type: "bus",
    leg: "to_mountain",
    operator: "Seibu Kanko Bus (西武観光バス)",
    phone: null,
    website: "https://www.princehotels.com/en/ski/manza_onsen/index.html",
    route_summary:
      "Local buses climb from Manza-Kazawaguchi Station (Agatsuma line) to the Manza Onsen hotels in about 45 minutes, a few services a day. In winter Manza is reached from this southern side only · the direct pass road from Kusatsu closes. Check the resort site for current access details.",
    route_summary_local:
      "万座・鹿沢口駅（吾妻線）から万座温泉まで路線バスで約45分、1日数本。冬季は草津からの直通道路が閉鎖されるため南側からのアクセスのみ · 最新のアクセス情報は公式サイトで確認。",
    regions: ["kusatsu-manza"],
    mountains_served: ["manza-onsen-resort"],
  },
];
