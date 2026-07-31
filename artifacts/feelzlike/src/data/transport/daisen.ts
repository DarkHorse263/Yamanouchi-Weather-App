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
    website: "https://www.nihonkotsu.co.jp/",
    route_summary:
      "Route bus from JR Yonago Station to the Daisenji stop at the base of the Daisen White Resort lifts in about 50 minutes, several departures a day with extra winter services in season. The resort changed operators after the 2025-26 season · confirm the current winter timetable before travelling.",
    route_summary_local:
      "JR米子駅からだいせんホワイトリゾートのリフト乗り場下・大山寺バス停まで約50分の路線バス、1日数便でシーズン中は増便あり。スキー場は2025-26シーズン後に運営が変わったため、冬季ダイヤは事前に確認を。",
    regions: ["daisen"],
    mountains_served: ["daisen-white-resort"],
  },
];
