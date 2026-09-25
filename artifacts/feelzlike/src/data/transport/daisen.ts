import type { TransportProviderList } from "@/types/transport";

/**
 * DAISEN (JP · Tottori) - getting to Yonago and up to the Daisen
 * White Resort slopes at Daisenji. Yonago is the San-in coast's rail
 * and air hub; the Daisen loop/route bus climbs from Yonago Station
 * to the Daisenji temple village at the base of the lifts.
 */
export const DAISEN_TRANSPORT: TransportProviderList = [
  {
    id: "jp-jr-yonago-station",
    name: "JR San-in Main Line · Yonago Station",
    name_local: "JR山陰本線 米子駅",
    type: "train",
    leg: "to_town",
    operator: "JR West (JR西日本)",
    phone: null,
    website: "https://www.westjr.co.jp/global/en/",
    route_summary:
      "Limited-express Yakumo trains from Okayama (San-yo Shinkansen interchange) to Yonago in about 2 hours, roughly hourly, plus San-in main line services along the coast. From Yonago the Daisen route bus climbs to the Daisenji slopes · Yonago Kitaro airport is 25 minutes away with Tokyo flights.",
    route_summary_local:
      "岡山（山陽新幹線乗換）から特急やくもで米子まで約2時間、おおむね1時間に1本、山陰本線の在来線も運行。米子駅からは大山方面の路線バスで大山寺ゲレンデへ · 米子鬼太郎空港へは約25分で東京便あり。",
    regions: ["daisen"],
  },
  {
    id: "jp-daisen-route-bus",
    name: "Daisen route bus · Yonago to Daisenji",
    name_local: "大山線路線バス 米子駅〜大山寺",
    type: "bus",
    leg: "to_mountain",
    operator: "Nihon Kotsu (日本交通)",
    phone: null,
    website: "https://nihonkotsu.jp/bus_local/yonago/index.html",
    route_summary:
      "Nihon Kotsu's Yonago-area Daisen route serves JR Yonago Station and the Daisenji stop near Daisen White Resort. Check the operator's current timetable and seasonal changes before travelling; the resort changed operators after the 2025-26 season.",
    route_summary_local:
      "日本交通の米子地区・大山線はJR米子駅とだいせんホワイトリゾート近くの大山寺バス停を結びます。スキー場は2025-26シーズン後に運営が変わったため、運行ダイヤや季節運行は日本交通の公式サイトで事前に確認を。",
    regions: ["daisen"],
    mountains_served: ["daisen-white-resort"],
  },
];
