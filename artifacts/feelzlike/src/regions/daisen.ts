import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Daisen · western Japan's ski corner, on the sea-facing slopes of Mt
 * Daisen in Tottori:
 *
 *   Daisenji  → temple village at the base of the lifts (~800 m) ·
 *               inns, onsen baths and the Daisenji temple itself
 *   Yonago    → coastal city hub (JR lines + Yonago Kitaro airport),
 *               about 40 minutes from the slopes
 *
 * Daisen White Resort is the single anchor · western Japan's biggest
 * ski hill (four linked areas, 655-1,121 m) with Japan-Sea views from
 * the runs. Honest scale note: this is a regional day hill, not an
 * Alps-sized destination resort, and snow near sea level can be
 * fickle · the resort changed operators after the 2025-26 season, so
 * check the official site for current opening plans.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain.
 */
export const daisenRegion: RegionConfig = {
  id: "daisen",
  name: "Daisen",
  subtitle: "Tottori · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Daisen White Resort"],
  resorts: [
    { path: "/mountain/daisen-white-resort", label: "Daisen White Resort", labelJa: "だいせんホワイトリゾート" },
  ],
  mountains: [
    {
      id: "daisen-white-resort",
      name: "Daisen White Resort",
      nameJa: "だいせんホワイトリゾート",
      elevationM: 1121,
      lat: 35.400,
      lng: 133.528,
      blurb: "Western Japan's biggest ski hill on Mt Daisen · four linked areas (Kokusai, Uenohara, Nakanohara, Goenzan) from 655 to 1,121 m with Japan-Sea views · a regional day hill rather than a destination resort, and under new operators from 2026-27, so check the official site for opening plans",
      blurbJa: "大山の山腹に広がる西日本最大級のスキー場 · 国際・上の原・中の原・豪円山の4エリア（標高655〜1,121m）から日本海を一望 · 大規模リゾートではなく地域の日帰りゲレンデで、2026-27シーズンから運営体制が変わるため営業予定は公式サイトで確認を",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "daisenji",
      name: "Daisenji",
      nameJa: "大山寺",
      lat: 35.396,
      lng: 133.540,
      // Daisenji temple village (~800 m) · the historic monzen-machi
      // below Daisenji temple, right at the base of the lifts, with
      // inns, pensions and onsen baths.
      radiusM: 1500,
      blurb: "Temple village at the base of the lifts · inns, onsen baths and the 1,300-year-old Daisenji temple",
      blurbJa: "リフト乗り場のすぐ下にある門前町 · 宿と温泉、開山1300年の大山寺",
      nearbyMountainIds: ["daisen-white-resort"],
    },
    {
      id: "yonago",
      name: "Yonago",
      nameJa: "米子",
      lat: 35.4281,
      lng: 133.3311,
      // Yonago city centre (~9 m) · the San-in coast's transport hub
      // around JR Yonago Station, with Yonago Kitaro airport nearby.
      // About 40 minutes by road to the Daisen slopes.
      radiusM: 4000,
      blurb: "Coastal city hub on the San-in coast · rail and airport gateway, about 40 minutes from the Daisen slopes",
      blurbJa: "山陰の交通拠点となる海沿いの街 · 鉄道と空港の玄関口で、大山のゲレンデまで車で約40分",
      nearbyMountainIds: ["daisen-white-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Daisen town tourism", labelJa: "大山町観光局", url: "https://tourismdaisen.com/" },
    { category: "Tourism", categoryJa: "観光", label: "Tottori official tourism", labelJa: "鳥取県公式観光サイト", url: "https://www.tottori-tour.jp/en/" },
    { category: "Transport", categoryJa: "交通", label: "JR West · trains", labelJa: "JR西日本 · 鉄道", url: "https://www.westjr.co.jp/global/en/" },
    { category: "Transport", categoryJa: "交通", label: "Nihon Kotsu · buses", labelJa: "日本交通 · バス", url: "https://www.nihonkotsu.co.jp/" },
  ],
  weatherSource: {
    label: "Open-Meteo + JMA",
    labelJa: "Open-Meteo・気象庁",
  },
  roadsSource: {
    label: "Japan Road Traffic Information Center (JARTIC)",
    labelJa: "日本道路交通情報センター (JARTIC)",
    url: "https://www.jartic.or.jp/",
    dataAvailable: false,
  },
};
