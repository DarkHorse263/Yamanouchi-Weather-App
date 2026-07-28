import type { TransportProviderList } from "@/types/transport";

/**
 * Appi & Shizukuishi (Iwate, Japan) transport providers.
 *
 * Both resorts hang off Morioka: Appi is reached by the Iwate
 * Kenpoku direct bus from Morioka Station or the JR Hanawa line to
 * Appi-Kogen Station, Shizukuishi by the JR Tazawako line (the Akita
 * Shinkansen stops at Shizukuishi) plus the resort's station shuttle.
 * Phone numbers and deep schedule links are left `null` where not
 * directly verifiable · we never guess. Bilingual `name_local` and
 * `route_summary_local` are provided for the JP language toggle.
 */
export const APPI_SHIZUKUISHI_TRANSPORT: TransportProviderList = [
  {
    id: "jp-kenpoku-appi-bus",
    name: "Iwate Kenpoku Bus · Morioka to Appi",
    name_local: "岩手県北バス 盛岡〜安比高原線",
    type: "bus",
    leg: "to_town",
    operator: "Iwate Kenpoku Bus (岩手県北バス)",
    phone: null,
    website: "https://www.iwate-kenpokubus.co.jp/",
    route_summary:
      "Direct bus from Morioka Station to the Appi resort village in about 50 minutes · the simplest way up without a car. Winter timetables vary by season · check the operator's site for current departures.",
    route_summary_local:
      "盛岡駅から安比高原リゾートまで直行バスで約50分 · 車がない場合の最短ルート。冬期ダイヤは季節により変わるため最新時刻表は公式サイトで確認。",
    regions: ["appi-shizukuishi"],
    mountains_served: ["appi"],
  },
  {
    id: "jp-jr-hanawa-line",
    name: "JR East · Hanawa line to Appi-Kogen",
    name_local: "JR東日本 花輪線（安比高原）",
    type: "train",
    leg: "to_town",
    operator: "JR East (JR東日本)",
    phone: null,
    website: "https://www.jreast.co.jp/en/multi/",
    route_summary:
      "Local trains run from Morioka to Appi-Kogen Station in about 50 minutes, with a short resort shuttle or taxi up to the village · services are infrequent, so check times before relying on the train. The Tohoku Shinkansen reaches Morioka from Tokyo in about 2 hours 15 minutes.",
    route_summary_local:
      "盛岡から花輪線の普通列車で安比高原駅まで約50分、駅からはリゾートシャトルまたはタクシーで村へ · 本数が少ないため事前に時刻確認を。東北新幹線は東京〜盛岡を約2時間15分で結ぶ。",
    regions: ["appi-shizukuishi"],
    mountains_served: ["appi"],
  },
  {
    id: "jp-jr-tazawako-line",
    name: "JR East · Tazawako line to Shizukuishi",
    name_local: "JR東日本 田沢湖線（雫石）",
    type: "train",
    leg: "to_town",
    operator: "JR East (JR東日本)",
    phone: null,
    website: "https://www.jreast.co.jp/en/multi/",
    route_summary:
      "The Akita Shinkansen and Tazawako line local trains link Morioka with Shizukuishi Station in about 20 minutes · from there it is about 15 minutes by taxi or the resort's shuttle up to the Prince ski area. Check shuttle availability with the resort in advance.",
    route_summary_local:
      "秋田新幹線と田沢湖線の普通列車が盛岡と雫石駅を約20分で結ぶ · 駅から雫石スキー場まではタクシーまたはリゾート送迎で約15分。送迎の運行状況は事前にリゾートへ確認を。",
    regions: ["appi-shizukuishi"],
    mountains_served: ["shizukuishi-resort"],
  },
];
