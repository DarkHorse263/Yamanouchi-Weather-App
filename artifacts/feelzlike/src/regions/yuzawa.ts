import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Yuzawa · seventh JP region, the classic Niigata "snow country" area
 * around 70 minutes from Tokyo by Joetsu Shinkansen. Six resorts across
 * three base towns:
 *
 *   Echigo-Yuzawa (main hub)  → GALA Yuzawa, Yuzawa Kogen (west massif),
 *                               Iwappara (east, on Mt Iiji)
 *   Ishiuchi (north end)      → Ishiuchi Maruyama (same west massif)
 *   Mitsumata (south on R17)  → Kagura, Naeba (linked by the Dragondola)
 *
 * GALA, Yuzawa Kogen and Ishiuchi Maruyama are physically linked at the
 * top of the shared massif and sell a joint Yuzawa Snow Link ticket ·
 * noted factually in their blurbs. Kagura and Naeba are Prince resorts
 * joined by the 5.5 km Dragondola with a combined Mt Naeba ticket.
 * Iwappara is independent.
 *
 * Coordinates are base-area points; elevationM is the top-lift height
 * for each resort.
 */
export const yuzawaRegion: RegionConfig = {
  id: "yuzawa",
  name: "Yuzawa",
  subtitle: "Niigata · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  summaryMountains: [
    "GALA · Yuzawa Kogen",
    "Ishiuchi Maruyama · Iwappara",
    "Kagura · Naeba",
  ],
  resorts: [
    { path: "/mountain/gala-yuzawa",       label: "GALA Yuzawa",       labelJa: "GALA湯沢" },
    { path: "/mountain/yuzawa-kogen",      label: "Yuzawa Kogen",      labelJa: "湯沢高原" },
    { path: "/mountain/ishiuchi-maruyama", label: "Ishiuchi Maruyama", labelJa: "石打丸山" },
    { path: "/mountain/iwappara",          label: "Iwappara",          labelJa: "岩原" },
    { path: "/mountain/kagura",            label: "Kagura",            labelJa: "かぐら" },
    { path: "/mountain/naeba",             label: "Naeba",             labelJa: "苗場" },
  ],
  mountains: [
    {
      id: "gala-yuzawa",
      name: "GALA Yuzawa",
      nameJa: "GALA湯沢スキー場",
      elevationM: 1181,
      lat: 36.9509,
      lng: 138.7995,
      blurb: "Shinkansen straight into the gondola base · linked at the top to Yuzawa Kogen and Ishiuchi Maruyama on the Snow Link ticket",
      blurbJa: "新幹線がゴンドラ乗り場に直結 · 山頂で湯沢高原・石打丸山とつながるスノーリンク共通券対象",
      websiteUrl: "https://gala.co.jp/winter/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "yuzawa-kogen",
      name: "Yuzawa Kogen",
      nameJa: "湯沢高原スキー場",
      elevationM: 1000,
      lat: 36.9388,
      lng: 138.7974,
      blurb: "Ropeway straight off the onsen street · gentle high bowl above town, linked at the top to GALA on the Snow Link ticket",
      blurbJa: "温泉街からロープウェイで直行 · 町の上の穏やかな高原ゲレンデ、山頂でGALAとつながるスノーリンク共通券対象",
      websiteUrl: "https://www.yuzawakogen.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "ishiuchi-maruyama",
      name: "Ishiuchi Maruyama",
      nameJa: "石打丸山スキー場",
      elevationM: 920,
      lat: 36.9761,
      lng: 138.7947,
      blurb: "Historic broad hill above Ishiuchi village · big parks and long runs to the valley floor, linked at the top to GALA on the Snow Link ticket",
      blurbJa: "石打の集落の上に広がる歴史あるゲレンデ · 大規模パークと麓までのロングラン、山頂でGALAとつながるスノーリンク共通券対象",
      websiteUrl: "https://ishiuchi.or.jp/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "iwappara",
      name: "Iwappara",
      nameJa: "岩原スキー場",
      elevationM: 985,
      lat: 36.9389,
      lng: 138.8444,
      blurb: "Wide open slopes on Mt Iiji east of the valley · a long-standing learner and family favourite, independent of the linked resorts",
      blurbJa: "谷の東・飯士山に広がるワイドな斜面 · 初心者とファミリーに愛される老舗、リンクリゾートからは独立",
      websiteUrl: "https://iwa-ppara.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "kagura",
      name: "Kagura",
      nameJa: "かぐらスキー場",
      elevationM: 1845,
      lat: 36.8948,
      lng: 138.7756,
      blurb: "Highest terrain and longest season in the area · three linked zones rising from the Mitsumata base, joined to Naeba by the Dragondola",
      blurbJa: "エリア最高標高とロングシーズン · みつまたベースから三つのエリアがつながり、ドラゴンドラで苗場とも連結",
      websiteUrl: "https://www.princehotels.co.jp/ski/kagura/",
      backcountry_access: true,
    },
    {
      id: "naeba",
      name: "Naeba",
      nameJa: "苗場スキー場",
      elevationM: 1789,
      lat: 36.7917,
      lng: 138.7846,
      blurb: "Big classic resort beneath Mt Takenoko · wide fall-line runs above the Prince hotel base, joined to Kagura by the Dragondola",
      blurbJa: "筍山の下に広がるビッグゲレンデ · プリンスホテル直結のベースからワイドな斜面、ドラゴンドラでかぐらと連結",
      websiteUrl: "https://www.princehotels.co.jp/ski/naeba/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "echigo-yuzawa",
      name: "Echigo-Yuzawa",
      nameJa: "越後湯沢",
      lat: 36.9354,
      lng: 138.8090,
      // Echigo-Yuzawa town core (~360 m) around the shinkansen station
      // and the onsen street. The Yuzawa Kogen ropeway leaves from the
      // edge of town and GALA's gondola base is one shinkansen stop /
      // short shuttle north. Iwappara sits across the valley to the east.
      radiusM: 2500,
      blurb: "The snow country hub · shinkansen station, onsen street, and the Yuzawa Kogen ropeway right in town",
      blurbJa: "雪国の玄関口 · 新幹線駅と温泉街、町なかから湯沢高原ロープウェイ",
      nearbyMountainIds: ["gala-yuzawa", "yuzawa-kogen", "iwappara"],
    },
    {
      id: "ishiuchi",
      name: "Ishiuchi",
      nameJa: "石打",
      lat: 36.9894,
      lng: 138.8043,
      // Ishiuchi village (~260 m) at the north foot of the shared massif,
      // with Ishiuchi Station on the JR Joetsu Line. Quieter ryokan and
      // lodge village at the base of Ishiuchi Maruyama's lifts.
      radiusM: 4000,
      blurb: "Quiet lodge and ryokan village at the north foot of the massif · Ishiuchi Maruyama's lifts on the doorstep",
      blurbJa: "山塊の北麓に広がる静かな宿の集落 · 石打丸山のリフトが目の前",
      nearbyMountainIds: ["ishiuchi-maruyama"],
    },
    {
      id: "mitsumata",
      name: "Mitsumata",
      nameJa: "三俣",
      lat: 36.8948,
      lng: 138.7756,
      // Mitsumata hamlet (~620 m) on Route 17 south of Yuzawa, the old
      // Mikuni-kaido post town at the foot of Kagura's Mitsumata ropeway.
      // Naeba is a short drive further along Route 17.
      radiusM: 4000,
      blurb: "Old post-road hamlet on Route 17 · Kagura's Mitsumata ropeway base, with Naeba a short drive on",
      blurbJa: "国道17号沿いの旧三国街道の集落 · かぐら「みつまた」ロープウェイの起点、苗場へも車ですぐ",
      nearbyMountainIds: ["kagura", "naeba"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Yuzawa Tourism · official destination guide", labelJa: "湯沢町観光まちづくり機構", url: "https://www.e-yuzawa.gr.jp/" },
    { category: "Tourism", categoryJa: "観光", label: "Yuzawa Town · English visitor guide", labelJa: "湯沢町 英語ガイド", url: "https://yuzawa-town.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Yuzawa Snow Link · GALA, Yuzawa Kogen and Ishiuchi Maruyama joint ticket", labelJa: "YUZAWA SNOW LINK（湯沢スノーリンク）", url: "https://yuzawasnowlink.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "GALA Yuzawa", labelJa: "GALA湯沢スキー場", url: "https://gala.co.jp/winter/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Yuzawa Kogen", labelJa: "湯沢高原スキー場", url: "https://www.yuzawakogen.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Ishiuchi Maruyama", labelJa: "石打丸山スキー場", url: "https://ishiuchi.or.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Iwappara", labelJa: "岩原スキー場", url: "https://iwa-ppara.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Kagura", labelJa: "かぐらスキー場", url: "https://www.princehotels.co.jp/ski/kagura/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Naeba", labelJa: "苗場スキー場", url: "https://www.princehotels.co.jp/ski/naeba/" },
    { category: "Transport", categoryJa: "交通", label: "JR East · Joetsu Shinkansen to Echigo-Yuzawa and GALA Yuzawa", labelJa: "JR東日本 · 上越新幹線（越後湯沢・ガーラ湯沢）", url: "https://www.jreast.co.jp/en/multi/" },
    { category: "Transport", categoryJa: "交通", label: "Minamiechigo Kanko Bus · route buses to Mitsumata and Naeba", labelJa: "南越後観光バス · 三俣・苗場方面路線バス", url: "https://www.minamiechigo.co.jp/" },
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
