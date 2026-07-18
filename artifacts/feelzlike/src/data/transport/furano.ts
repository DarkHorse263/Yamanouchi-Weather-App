import type { TransportProviderList } from "@/types/transport";

/**
 * Furano (Hokkaido, Japan) transport providers.
 *
 * Furano has three verified public routes in: JR Furano Line locals
 * from Asahikawa, the Hokkaido Resort Liner winter coach from New
 * Chitose Airport, and Hokkaido Chuo Bus's highway bus from Sapporo.
 * Furano Bus's rapid Lavender service links Asahikawa Station and
 * Asahikawa Airport with Kitanomine and Furano Station year-round.
 * Phone numbers and deep schedule links are left `null` where not
 * directly verifiable · we never guess. Bilingual `name_local` and
 * `route_summary_local` are provided for the JP language toggle.
 */
export const FURANO_TRANSPORT: TransportProviderList = [
  {
    id: "jp-jr-furano-line",
    name: "JR Furano Line",
    name_local: "JR北海道 富良野線",
    type: "train",
    leg: "to_town",
    operator: "JR Hokkaido (JR北海道)",
    phone: null,
    website: "https://www.jrhokkaido.co.jp/global/",
    route_summary:
      "Local trains from Asahikawa via Biei to Furano Station in about 70 minutes, roughly hourly. From Sapporo, take a Kamui or Lilac limited express to Asahikawa and change · IC cards are not accepted on the Furano Line, buy a paper ticket.",
    route_summary_local:
      "旭川から美瑛経由で富良野駅まで普通列車で約70分、おおむね1時間に1本。札幌からは特急カムイ・ライラックで旭川へ出て乗り換え · 富良野線はICカード非対応のため切符を購入。",
    regions: ["furano"],
  },
  {
    id: "jp-hokkaido-resort-liner-furano",
    name: "Hokkaido Resort Liner",
    name_local: "北海道リゾートライナー",
    type: "bus",
    leg: "to_town",
    operator: "Hokkaido Access Network (北海道アクセスネットワーク)",
    phone: null,
    website: "https://www.access-n.jp/",
    route_summary:
      "Winter coach from New Chitose Airport direct to the Furano ski resort hotels in around 3 hours, running roughly December to March. Reservations required · seats and stops vary by season, check the operator's site for current timetables.",
    route_summary_local:
      "新千歳空港から富良野スキー場エリアのホテルへ直行する冬季バス（約3時間）。運行はおおむね12月〜3月、要予約 · 便数や停車地は季節で変動、最新時刻表は公式サイトで確認。",
    regions: ["furano"],
  },
  {
    id: "jp-chuo-bus-furano-go",
    name: "Hokkaido Chuo Bus · Furano-go",
    name_local: "北海道中央バス 高速ふらの号",
    type: "bus",
    leg: "to_town",
    operator: "Hokkaido Chuo Bus (北海道中央バス)",
    phone: null,
    website: "https://www.chuo-bus.co.jp/highway/",
    route_summary:
      "Highway bus between Sapporo (Chuo Bus terminal / Sapporo Station) and Furano Station in about 2.5 hours via Ashibetsu, running year-round roughly every 1-2 hours. No reservation needed on most services · check the operator's site for the current timetable.",
    route_summary_local:
      "札幌（中央バスターミナル・札幌駅）と富良野駅前を芦別経由で結ぶ高速バス（約2時間30分）。通年運行でおおむね1〜2時間に1本。多くの便は予約不要 · 最新時刻表は公式サイトで確認。",
    regions: ["furano"],
  },
  {
    id: "jp-furano-bus-lavender",
    name: "Furano Bus · Lavender rapid",
    name_local: "ふらのバス 快速ラベンダー号",
    type: "bus",
    leg: "to_town",
    operator: "Furano Bus (ふらのバス)",
    phone: null,
    website: "https://www.furanobus.jp/",
    route_summary:
      "Rapid bus linking Asahikawa Station and Asahikawa Airport with Furano · stops at Kitanomine for the ski resort before Furano Station, about 1 hour from the airport. Runs year-round · check the operator's site for the current timetable.",
    route_summary_local:
      "旭川駅・旭川空港と富良野を結ぶ快速バス · 富良野駅前の手前でスキー場最寄りの北の峰に停車、空港から約1時間。通年運行 · 最新時刻表は公式サイトで確認。",
    regions: ["furano"],
    mountains_served: ["furano-ski-resort"],
  },
];
