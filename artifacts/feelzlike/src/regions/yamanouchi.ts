import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

export const yamanouchiRegion: RegionConfig = {
  id: "yamanouchi",
  name: "Yamanouchi",
  subtitle: "Nagano · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  // Quick-pick nav strip - surfaces the most-asked-about mountains.
  // Today's Call ranks all 22 individually.
  resorts: [
    { path: "/mountain/shiga-yakebitaiyama",   label: "Yakebitaiyama",        labelJa: "焼額山" },
    { path: "/mountain/shiga-okushiga-kogen",  label: "Okushiga Kogen",       labelJa: "奥志賀高原" },
    { path: "/mountain/shiga-yokoteyama",      label: "Yokoteyama / Shibutoge", labelJa: "横手山・渋峠" },
    { path: "/mountain/shiga-ichinose-family", label: "Ichinose Family",      labelJa: "一の瀬ファミリー" },
    { path: "/mountain/ryuoo",                 label: "Ryuoo",                labelJa: "竜王" },
    { path: "/mountain/xjam-takaifuji",        label: "X-Jam Takaifuji",      labelJa: "X-JAM高井富士" },
    { path: "/mountain/yomase-onsen",          label: "Yomase Onsen",         labelJa: "夜間瀬温泉" },
  ],
  // 22 individually-ranked mountains: 18 Shiga Kogen sub-areas (one ticket,
  // but each has materially different snow / wind / aspect) + 4 Kita-Shiga
  // resorts. parentId="shiga-kogen" on the 18 keeps drive-data rollup working
  // (see useTodaysWinner.ts) even though no umbrella mountain entry exists.
  mountains: [
    // ─── Shiga Kogen central area (Sun Valley / Maruike / Hasuike / Giant) ───
    { id: "shiga-sun-valley",          name: "Sun Valley",                nameJa: "サンバレー",            elevationM: 1500, lat: 36.7910, lng: 138.5030, blurb: "Entry-level base · the first lifts off the Shiga loop road",      blurbJa: "志賀の入口 · 一番手前のリフト群",                websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen", beginner_friendly: true, kids_lessons: true },
    { id: "shiga-maruike",             name: "Maruike",                   nameJa: "丸池",                  elevationM: 1620, lat: 36.7920, lng: 138.5050, blurb: "Wide intermediate carving · classic Shiga family terrain",        blurbJa: "幅広の中級バーン · 志賀の王道ファミリー",          websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen", beginner_friendly: true, kids_lessons: true },
    { id: "shiga-hasuike",             name: "Hasuike",                   nameJa: "蓮池",                  elevationM: 1550, lat: 36.7935, lng: 138.5065, blurb: "Hasuike pond base · gateway to the eastern lift network",         blurbJa: "蓮池のほとり · 東部リフト網の起点",               websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen", beginner_friendly: true, kids_lessons: true },
    { id: "shiga-giant",               name: "Giant",                     nameJa: "ジャイアント",          elevationM: 1700, lat: 36.7980, lng: 138.5085, blurb: "Steep Giant slalom course · short pitchy laps off the central road", blurbJa: "急斜面のジャイアント大回転コース · 中央メインからの短いラップ", websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen" },

    // ─── Hoppo / Tateyama cluster ─────────────────────────────────
    { id: "shiga-hoppo-bunadaira",     name: "Hoppo Bunadaira",           nameJa: "発哺ブナ平",            elevationM: 1830, lat: 36.8000, lng: 138.5060, blurb: "Mid-mountain wide-open cruisers · sunny aspect",                  blurbJa: "中腹のワイドクルーザー · 日当たりの良いアスペクト",  websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen", beginner_friendly: true, kids_lessons: true },
    { id: "shiga-higashidateyama",     name: "Higashidateyama",           nameJa: "東館山",                elevationM: 1994, lat: 36.7965, lng: 138.5090, blurb: "Central summit · gondola-served high alpine bowls",               blurbJa: "中央の山頂 · ゴンドラで上がる高所バーン",            websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen", terrain_park: true },
    { id: "shiga-nishidateyama",       name: "Nishidateyama",             nameJa: "西館山",                elevationM: 1900, lat: 36.7948, lng: 138.5075, blurb: "North-facing carving slopes · holds snow latest in the central area", blurbJa: "北向きカービング斜面 · 中央エリアで雪持ちが最良", websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen" },

    // ─── Terakoya / Takamagahara / Tannenomori ────────────────────
    { id: "shiga-terakoya",            name: "Terakoya",                  nameJa: "寺子屋",                elevationM: 2125, lat: 36.8060, lng: 138.5120, blurb: "Highest central lift · steep mogul faces and powder pockets",     blurbJa: "中央エリア最高所 · 急なコブ斜面とパウダー",         websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen", expert_only: true },
    { id: "shiga-takamagahara",        name: "Takamagahara",              nameJa: "高天ヶ原",              elevationM: 2000, lat: 36.8005, lng: 138.5100, blurb: "Wide intermediate plateau · feeds into Terakoya & Ichinose",      blurbJa: "広い中級プラトー · 寺子屋と一の瀬への接続点",       websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen", beginner_friendly: true, kids_lessons: true },
    { id: "shiga-tannenomori-okojo",   name: "Tannenomori Okojo",         nameJa: "タンネの森オコジョ",    elevationM: 1800, lat: 36.7980, lng: 138.5210, blurb: "Tree-lined family zone between Takamagahara and Yakebitai",       blurbJa: "高天ヶ原と焼額の間のツリー系ファミリーゾーン",       websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen", beginner_friendly: true, kids_lessons: true },

    // ─── Ichinose cluster ─────────────────────────────────────────
    { id: "shiga-ichinose-family",     name: "Ichinose Family",           nameJa: "一の瀬ファミリー",      elevationM: 1850, lat: 36.7972, lng: 138.5138, blurb: "Central Shiga base · easiest gateway to the lift system",          blurbJa: "志賀中心の拠点 · リフト網最大の起点",                websiteUrl: "https://shigakogen.gr.jp/ichinose-family/", parentId: "shiga-kogen", beginner_friendly: true, kids_lessons: true },
    { id: "shiga-ichinose-diamond",    name: "Ichinose Diamond",          nameJa: "一の瀬ダイヤモンド",    elevationM: 1900, lat: 36.7985, lng: 138.5150, blurb: "Steep race-spec pitches · home of the FIS-grade Diamond course",  blurbJa: "急傾斜のレース仕様 · FIS規格ダイヤモンドコース",    websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen", expert_only: true },
    { id: "shiga-ichinose-yamanokami", name: "Ichinose Yama-no-kami",     nameJa: "一の瀬山の神",          elevationM: 1850, lat: 36.7960, lng: 138.5130, blurb: "Quiet Ichinose annex · short laps for warm-ups and lessons",      blurbJa: "静かな一の瀬の隣接エリア · ウォームアップとレッスン", websiteUrl: "https://www.shigakogen-ski.or.jp/", parentId: "shiga-kogen", beginner_friendly: true, kids_lessons: true },

    // ─── East Shiga (Yakebitaiyama / Okushiga) ───────────────────
    { id: "shiga-yakebitaiyama",       name: "Yakebitaiyama",             nameJa: "焼額山",                elevationM: 2009, lat: 36.8195, lng: 138.5310, blurb: "Highest Prince-run sub-resort · 1998 Olympic GS course",          blurbJa: "プリンス系最高峰 · 長野五輪GSコース",                websiteUrl: "https://prince.jp/ski/shiga/", parentId: "shiga-kogen", kids_lessons: true, terrain_park: true },
    { id: "shiga-okushiga-kogen",      name: "Okushiga Kogen",            nameJa: "奥志賀高原",            elevationM: 1960, lat: 36.8380, lng: 138.5480, blurb: "Quietest, longest groomers · powder pocket of Shiga",             blurbJa: "志賀最奥 · 静かなロングクルーザーとパウダー",        websiteUrl: "https://www.okushiga.jp/", parentId: "shiga-kogen", backcountry_access: true },

    // ─── Kumanoyu / Yokoteyama / Shibutoge - highest lift-served in Japan ───
    { id: "shiga-kumanoyu",            name: "Kumanoyu",                  nameJa: "熊の湯",                elevationM: 2000, lat: 36.8107, lng: 138.5248, blurb: "North-facing high alpine · long-season natural snow",             blurbJa: "北向き高所 · 自然雪のロングシーズン",               websiteUrl: "https://www.kumanoyu.com/", parentId: "shiga-kogen" },
    { id: "shiga-yokoteyama",          name: "Yokoteyama",                nameJa: "横手山",                elevationM: 2305, lat: 36.7159, lng: 138.5450, blurb: "Japan's highest lift-served summit · alpine views to the JP Alps", blurbJa: "日本最高所の索道山頂 · 日本アルプスを望む",         websiteUrl: "https://yokoteyama-shibutoge.com/", parentId: "shiga-kogen", expert_only: true, backcountry_access: true },
    { id: "shiga-shibutoge",           name: "Shibutoge",                 nameJa: "渋峠",                  elevationM: 2172, lat: 36.7044, lng: 138.5364, blurb: "Highest skiable pass on Honshu · sea-of-clouds backdrop",          blurbJa: "本州最高所の峠 · 雲海の眺望",                       websiteUrl: "https://yokoteyama-shibutoge.com/", parentId: "shiga-kogen", expert_only: true, backcountry_access: true },

    // ─── Kita-Shiga Kogen Area (4 resorts on the western slopes,
    //     separate from the Shiga Kogen pass system) ────────────────
    { id: "ryuoo",                     name: "Ryuoo",                     nameJa: "竜王",                  elevationM: 1930, lat: 36.7536, lng: 138.4197, blurb: "Sea-of-clouds gondola summit · SORA terrace",                    blurbJa: "雲海ゴンドラの山頂 · SORAテラス",                  websiteUrl: "https://www.ryuoo.com/", parentId: "kita-shiga", kids_lessons: true, terrain_park: true },
    { id: "xjam-takaifuji",            name: "X-Jam Takaifuji",           nameJa: "X-JAM高井富士",          elevationM: 1330, lat: 36.7506, lng: 138.4767, blurb: "Park-focused resort · biggest jib & jump features in north Nagano", blurbJa: "パーク特化 · 北信最大のジブ・ジャンプアイテム",     websiteUrl: "https://www.kitashiga.co.jp/", parentId: "kita-shiga", beginner_friendly: true, kids_lessons: true, terrain_park: true },
    { id: "yomase-onsen",              name: "Yomase Onsen",              nameJa: "夜間瀬温泉スキー場",    elevationM: 1240, lat: 36.7714, lng: 138.4253, blurb: "Locals' mountain on the river · night skiing & onsen finish",      blurbJa: "夜間瀬川沿いの地元のスキー場 · ナイター + 温泉",    websiteUrl: "https://www.yomase.jp/", parentId: "kita-shiga", beginner_friendly: true },
    { id: "kita-shiga-komaruyama",     name: "Kita-shiga Komaruyama",     nameJa: "北志賀小丸山",          elevationM: 1100, lat: 36.7820, lng: 138.4310, blurb: "Smallest Kita-Shiga resort · gentle beginner laps under the lifts", blurbJa: "北志賀最小のスキー場 · 緩斜面の初心者向け",         websiteUrl: "https://www.kitashiga.co.jp/", parentId: "kita-shiga", beginner_friendly: true, kids_lessons: true },
  ],
  baseTowns: [
    {
      id: "yudanaka",
      name: "Yudanaka",
      nameJa: "湯田中",
      lat: 36.7460,
      lng: 138.4280,
      // Tight radius: Yudanaka station + immediate ryokan strip only, so it
      // doesn't swallow Shibu Onsen 600m up the road.
      radiusM: 700,
      blurb: "Onsen station town · gateway to Shiga Kogen",
      blurbJa: "温泉駅前 · 志賀高原への玄関口",
    },
    {
      id: "shibu-onsen",
      name: "Shibu Onsen",
      nameJa: "渋温泉",
      lat: 36.7517,
      lng: 138.4286,
      // Just the historic cobbled village - 9 bath-houses + ryokan core.
      radiusM: 400,
      blurb: "Historic ryokan village · cobbled lanes & nine bathhouses",
      blurbJa: "歴史ある旅館街 · 石畳と九湯めぐり",
    },
    {
      id: "yomase",
      name: "Yomase",
      nameJa: "夜間瀬",
      lat: 36.7710,
      lng: 138.4080,
      radiusM: 1500,
      blurb: "Quieter base on the river · close to Kita-Shiga lifts",
      blurbJa: "夜間瀬川沿いの静かな拠点 · 北志賀のリフトに近い",
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", categoryJa: "観光", label: "Go Nagano – Yamanouchi", labelJa: "Go Nagano 山ノ内", url: "https://www.go-nagano.net/en/destination/yamanouchi" },
    { category: "Tourism", categoryJa: "観光", label: "Snow Monkey Resorts – Visitor Guide", labelJa: "スノーモンキーリゾーツ", url: "https://www.snowmonkeyresorts.com/" },
    { category: "Tourism", categoryJa: "観光", label: "Yamanouchi Town Tourism Association", labelJa: "山ノ内町観光連盟", url: "https://www.info-yamanouchi.net/" },
    { category: "Attractions", categoryJa: "観光地", label: "Jigokudani Yaen-koen (Snow Monkey Park)", labelJa: "地獄谷野猿公苑", url: "https://jigokudani-yaenkoen.co.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Shiga Kogen Ski Resorts", labelJa: "志賀高原スキー場", url: "https://www.shigakogen-ski.or.jp/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Ryuoo Ski Park", labelJa: "竜王スキーパーク", url: "https://www.ryuoo.com/" },
    { category: "Resorts", categoryJa: "スキー場", label: "Kita-Shiga Kogen", labelJa: "北志賀高原", url: "https://www.kitashiga.co.jp/" },
    { category: "Onsen", categoryJa: "温泉", label: "Shibu Onsen Ryokan Association", labelJa: "渋温泉旅館組合", url: "https://www.shibuonsen.net/" },
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
