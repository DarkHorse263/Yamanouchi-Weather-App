import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Bandai · the ski hills around Mt Bandai in Fukushima's Aizu region,
 * about 2.5-3 hours from Tokyo via the Tohoku Shinkansen and the
 * Ban-etsu West line:
 *
 *   Inawashiro   → lakeside town on the JR Ban-etsu West line · the
 *                  rail gateway, with resort shuttles up both hills
 *   Urabandai    → highland lake district (Kitashiobara) behind Mt
 *                  Bandai · the closest beds to Grandeco and the
 *                  Nekoma north side
 *
 * Hoshino Resorts NEKOMA Mountain (the former Alts Bandai south side
 * and former Nekoma north side, linked by lift since 2023-24 into one
 * of Japan's largest single resorts, on the Ikon Pass from 25/26) and
 * Grandeco Snow Resort (a high-base gondola hill at 1,010-1,590 m in
 * Urabandai with a famously long season) are the two anchors.
 *
 * Coordinates are base-area points; elevationM is the top of the
 * lift-served terrain for each resort.
 */
export const bandaiRegion: RegionConfig = {
  id: "bandai",
  name: "Bandai",
  subtitle: "Fukushima · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: ["Nekoma Mountain", "Grandeco"],
  resorts: [
    { path: "/mountain/nekoma-mountain", label: "Nekoma Mountain", labelJa: "星野リゾート ネコマ マウンテン" },
    { path: "/mountain/grandeco",        label: "Grandeco",        labelJa: "グランデコスノーリゾート" },
  ],
  mountains: [
    {
      id: "nekoma-mountain",
      name: "Nekoma Mountain",
      nameJa: "星野リゾート ネコマ マウンテン",
      elevationM: 1337,
      lat: 37.578,
      lng: 140.030,
      blurb: "The former Alts Bandai (south) and Nekoma (north) linked by lift into one of Japan's largest resorts · 33 courses from the sunny Lake Inawashiro side over to the powder-holding north bowl, on the Ikon Pass",
      blurbJa: "旧アルツ磐梯（南）と旧猫魔スキー場（北）が連絡リフトでつながった日本最大級のスキー場 · 猪苗代湖側の南エリアからパウダーが残る北エリアまで全33コース、Ikon Pass対象",
      websiteUrl: "https://www.nekoma.co.jp/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "grandeco",
      name: "Grandeco",
      nameJa: "グランデコスノーリゾート",
      elevationM: 1590,
      lat: 37.702,
      lng: 140.135,
      blurb: "High-base gondola hill in Urabandai at 1,010-1,590 m · dry Aizu powder, wide groomers with Mt Bandai views and one of Tohoku's longest seasons",
      blurbJa: "裏磐梯の標高1,010〜1,590mに広がる高原ゲレンデ · 乾いたパウダーと磐梯山を望むワイドバーン、東北屈指のロングシーズン",
      websiteUrl: "https://grandecoresort.co.jp/snow/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "inawashiro",
      name: "Inawashiro",
      nameJa: "猪苗代",
      lat: 37.5566,
      lng: 140.1044,
      // Inawashiro town centre (~520 m) · around JR Inawashiro Station
      // on the Ban-etsu West line, on the plain between Lake Inawashiro
      // and Mt Bandai. Winter shuttles run from the station up to both
      // Nekoma Mountain and Grandeco.
      radiusM: 3000,
      blurb: "Lakeside rail gateway on the Ban-etsu West line · winter shuttles up to Nekoma Mountain and Grandeco",
      blurbJa: "磐越西線の湖畔の玄関口 · 冬はネコマ マウンテン・グランデコ両方へシャトルバスが運行",
      nearbyMountainIds: ["nekoma-mountain", "grandeco"],
    },
    {
      id: "urabandai",
      name: "Urabandai",
      nameJa: "裏磐梯",
      lat: 37.660,
      lng: 140.065,
      // Urabandai highland (~850 m) · the Kitashiobara lake district
      // behind Mt Bandai (Goshiki-numa ponds, Lake Hibara), with
      // pensions and resort hotels. The closest beds to Grandeco and
      // the Nekoma north side.
      radiusM: 4000,
      blurb: "Highland lake district behind Mt Bandai · pensions and resort hotels, closest beds to Grandeco and the Nekoma north side",
      blurbJa: "磐梯山の裏側に広がる高原の湖沼地帯 · ペンションとリゾートホテルがあり、グランデコとネコマ北エリアに最も近い宿",
      nearbyMountainIds: ["grandeco", "nekoma-mountain"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Inawashiro tourism association", labelJa: "猪苗代観光協会", url: "https://www.bandaisan.or.jp/" },
    { category: "Tourism", categoryJa: "観光", label: "Urabandai tourism association", labelJa: "裏磐梯観光協会", url: "https://www.urabandai-inf.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Nekoma Mountain", labelJa: "星野リゾート ネコマ マウンテン", url: "https://www.nekoma.co.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Grandeco Snow Resort", labelJa: "グランデコスノーリゾート", url: "https://grandecoresort.co.jp/snow/" },
    { category: "Transport", categoryJa: "交通", label: "JR East · trains", labelJa: "JR東日本 · 鉄道", url: "https://www.jreast.co.jp/multi/en/" },
    { category: "Transport", categoryJa: "交通", label: "Aizu Bus", labelJa: "会津バス", url: "https://www.aizubus.com/" },
    // Backcountry safety · the Nekoma north bowl and the West Bandai
    // ridgelines above Grandeco see regular sidecountry use.
    { category: "Backcountry safety", categoryJa: "バックカントリー安全情報", label: "Japan Avalanche Network (JAN) · avalanche bulletins", labelJa: "日本雪崩ネットワーク · 雪崩情報", url: "https://nadare.jp/" },
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
