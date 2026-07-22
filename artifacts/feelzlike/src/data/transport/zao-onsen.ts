import type { TransportProviderList } from "@/types/transport";

/**
 * Zao Onsen (Yamagata, Japan) transport providers.
 *
 * The standard route in is the Yamagata Shinkansen to Yamagata
 * Station, then the Yamako bus up to the village · about 40 minutes,
 * roughly hourly, no reservation needed. Phone numbers and deep
 * schedule links are left `null` where not directly verifiable · we
 * never guess. Bilingual `name_local` and `route_summary_local` are
 * provided for the JP language toggle.
 */
export const ZAO_ONSEN_TRANSPORT: TransportProviderList = [
  {
    id: "jp-yamako-zao",
    name: "Yamako bus · Yamagata Station to Zao Onsen",
    name_local: "山交バス（山形駅前〜蔵王温泉）",
    type: "bus",
    leg: "to_town",
    operator: "Yamako Bus (山交バス)",
    phone: null,
    website: "https://www.yamakobus.jp/",
    route_summary:
      "Route bus from Yamagata Station (stop 1) up to the Zao Onsen bus terminal in about 40 minutes · roughly hourly, around ¥1,200 one way, no reservation needed. Buy a ticket at the station information counter or pay on board · check the operator's site for current timetables.",
    route_summary_local:
      "山形駅前1番のりばから蔵王温泉バスターミナルまで約40分の路線バス · おおむね1時間に1本、片道約1,200円、予約不要。乗車券は駅前案内所または車内で · 最新時刻表は公式サイトで確認。",
    regions: ["zao-onsen"],
    mountains_served: ["zao-onsen-resort"],
  },
  {
    id: "jp-jr-yamagata-shinkansen",
    name: "JR East · Yamagata Shinkansen",
    name_local: "JR東日本 山形新幹線",
    type: "train",
    leg: "to_town",
    operator: "JR East (JR東日本)",
    phone: null,
    website: "https://www.jreast.co.jp/en/multi/",
    route_summary:
      "Tsubasa services link Tokyo with Yamagata Station in about 2 hours 45 minutes · from the station it is the Yamako bus or a taxi up to Zao Onsen. There is no rail access to the village itself.",
    route_summary_local:
      "つばさ号が東京〜山形駅を約2時間45分で結ぶ · 山形駅からは山交バスまたはタクシーで蔵王温泉へ。温泉街への鉄道アクセスはなし。",
    regions: ["zao-onsen"],
    mountains_served: ["zao-onsen-resort"],
  },
];
