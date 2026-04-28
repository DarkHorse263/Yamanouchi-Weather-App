export interface Resort {
  id: string;
  name: string;
  nameJa: string;
  region: string;
  regionJa: string;
  lat: number;
  lng: number;
  elevation: number;
  snow24h: number;
  baseDepth: number;
  temp: number;
  wind: number;
  snowTomorrow: number;
  websiteUrl: string | null;
}

export const REGIONS = [
  { name: "Hakuba Valley", nameJa: "白馬バレー", resorts: 10 },
  { name: "Shiga Kogen", nameJa: "志賀高原", resorts: 17 },
  { name: "Nozawa Onsen", nameJa: "野沢温泉", resorts: 3 },
  { name: "North Border", nameJa: "北部県境", resorts: 5 },
  { name: "Madarao & Tangram", nameJa: "斑尾・タングラム", resorts: 3 },
  { name: "Togakushi & Iizuna", nameJa: "戸隠・飯綱", resorts: 4 },
  { name: "Sugadaira", nameJa: "菅平高原", resorts: 4 },
  { name: "Karuizawa & East", nameJa: "軽井沢・東部", resorts: 5 },
  { name: "Kiso & South", nameJa: "木曽・南部", resorts: 6 },
  { name: "Northern Nagano", nameJa: "北信エリア", resorts: 9 },
  { name: "Central Nagano", nameJa: "中信エリア", resorts: 7 },
  { name: "Yamanouchi", nameJa: "山ノ内", resorts: 7 },
];

function seed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0x7fffffff;
  return h;
}

function rng(id: string, min: number, max: number): number {
  return min + (seed(id) % (max - min + 1));
}

export const RESORTS: Resort[] = [
  { id: "happo-one", name: "Happo-One", nameJa: "八方尾根", region: "Hakuba Valley", regionJa: "白馬バレー", lat: 36.698, lng: 137.831, elevation: 1831, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.happo-one.jp/english/" },
  { id: "hakuba-goryu", name: "Hakuba Goryu", nameJa: "白馬五竜", region: "Hakuba Valley", regionJa: "白馬バレー", lat: 36.685, lng: 137.837, elevation: 1676, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.hakubagoryu.com/en/" },
  { id: "hakuba-47", name: "Hakuba 47", nameJa: "白馬47", region: "Hakuba Valley", regionJa: "白馬バレー", lat: 36.680, lng: 137.845, elevation: 1614, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.hakuba47.co.jp/en/" },
  { id: "tsugaike", name: "Tsugaike Kogen", nameJa: "栂池高原", region: "Hakuba Valley", regionJa: "白馬バレー", lat: 36.776, lng: 137.862, elevation: 1704, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.tsugaike.gr.jp/en/" },
  { id: "hakuba-cortina", name: "Hakuba Cortina", nameJa: "白馬コルチナ", region: "Hakuba Valley", regionJa: "白馬バレー", lat: 36.808, lng: 137.880, elevation: 1402, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.hotelogreenplaza.com/en/cortina/" },
  { id: "hakuba-norikura", name: "Hakuba Norikura", nameJa: "白馬乗鞍", region: "Hakuba Valley", regionJa: "白馬バレー", lat: 36.792, lng: 137.870, elevation: 1500, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "kashimayari", name: "Kashimayari", nameJa: "鹿島槍", region: "Hakuba Valley", regionJa: "白馬バレー", lat: 36.634, lng: 137.847, elevation: 1550, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "yanaba", name: "Yanaba", nameJa: "ヤナバ", region: "Hakuba Valley", regionJa: "白馬バレー", lat: 36.626, lng: 137.843, elevation: 1340, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "hakuba-iwatake", name: "Hakuba Iwatake", nameJa: "白馬岩岳", region: "Hakuba Valley", regionJa: "白馬バレー", lat: 36.737, lng: 137.848, elevation: 1289, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://iwatake-mountain-resort.com/en/" },
  { id: "jiigatake", name: "Jiigatake", nameJa: "爺ガ岳", region: "Hakuba Valley", regionJa: "白馬バレー", lat: 36.620, lng: 137.843, elevation: 1130, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },

  { id: "shiga-yokoteyama", name: "Yokoteyama-Shibutoge", nameJa: "横手山・渋峠", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.810, lng: 138.530, elevation: 2307, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.shigakogen.co.jp/english/" },
  { id: "shiga-kumanoyu", name: "Kumanoyu", nameJa: "熊の湯", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.798, lng: 138.522, elevation: 1700, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-higashitateyama", name: "Higashi-Tateyama", nameJa: "東館山", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.795, lng: 138.515, elevation: 2000, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-terakoya", name: "Terakoya", nameJa: "寺小屋", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.800, lng: 138.518, elevation: 2125, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-ichinose-family", name: "Ichinose Family", nameJa: "一の瀬ファミリー", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.792, lng: 138.510, elevation: 1650, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-ichinose-diamond", name: "Ichinose Diamond", nameJa: "一の瀬ダイヤモンド", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.790, lng: 138.508, elevation: 1680, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-ichinose-yamanokami", name: "Ichinose Yamanokami", nameJa: "一の瀬山の神", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.791, lng: 138.512, elevation: 1700, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-takamagahara", name: "Takamagahara", nameJa: "高天ヶ原", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.788, lng: 138.513, elevation: 1680, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-tannenomori", name: "Tannenomori Okojo", nameJa: "タンネの森オコジョ", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.785, lng: 138.509, elevation: 1600, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-nishitateyama", name: "Nishi-Tateyama", nameJa: "西館山", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.786, lng: 138.505, elevation: 1756, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-hasuike", name: "Hasuike", nameJa: "蓮池", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.780, lng: 138.504, elevation: 1500, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-giant", name: "Giant", nameJa: "ジャイアント", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.782, lng: 138.502, elevation: 1580, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-maruike", name: "Maruike", nameJa: "丸池", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.778, lng: 138.500, elevation: 1460, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-sunvalley", name: "Sun Valley", nameJa: "サンバレー", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.776, lng: 138.498, elevation: 1400, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-okushiga", name: "Okushiga Kogen", nameJa: "奥志賀高原", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.815, lng: 138.540, elevation: 1998, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.okushiga.jp/" },
  { id: "shiga-yakebitai", name: "Yakebitaiyama", nameJa: "焼額山", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.808, lng: 138.525, elevation: 2009, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shiga-shinshin", name: "Shiga Kogen Shinshin", nameJa: "志賀高原信州", region: "Shiga Kogen", regionJa: "志賀高原", lat: 36.784, lng: 138.507, elevation: 1600, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },

  { id: "nozawa-onsen", name: "Nozawa Onsen", nameJa: "野沢温泉", region: "Nozawa Onsen", regionJa: "野沢温泉", lat: 36.927, lng: 138.636, elevation: 1650, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://nozawaski.com/en/" },
  { id: "togari-onsen", name: "Togari Onsen", nameJa: "戸狩温泉", region: "Nozawa Onsen", regionJa: "野沢温泉", lat: 36.909, lng: 138.601, elevation: 1100, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "sakae-muse", name: "Sakae Muse", nameJa: "さかえミューゼ", region: "Nozawa Onsen", regionJa: "野沢温泉", lat: 36.953, lng: 138.616, elevation: 900, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },

  { id: "iiyama-kijimadaira", name: "Kijimadaira", nameJa: "木島平", region: "North Border", regionJa: "北部県境", lat: 36.870, lng: 138.600, elevation: 1351, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "sakaemura", name: "Sakae Mura Ski", nameJa: "栄村スキー場", region: "North Border", regionJa: "北部県境", lat: 36.960, lng: 138.580, elevation: 1100, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "tsunan-kogen", name: "Tsunan Kogen", nameJa: "津南高原", region: "North Border", regionJa: "北部県境", lat: 36.920, lng: 138.650, elevation: 900, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "hokushin-gogen", name: "Hokushin Gogen", nameJa: "北信五岳", region: "North Border", regionJa: "北部県境", lat: 36.850, lng: 138.590, elevation: 1200, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shinano-machi", name: "Shinano Town", nameJa: "信濃町スキー場", region: "North Border", regionJa: "北部県境", lat: 36.810, lng: 138.200, elevation: 900, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },

  { id: "madarao", name: "Madarao Mountain", nameJa: "斑尾高原", region: "Madarao & Tangram", regionJa: "斑尾・タングラム", lat: 36.853, lng: 138.642, elevation: 1382, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.madarao.jp/ski/en/" },
  { id: "tangram", name: "Tangram Ski Circus", nameJa: "タングラムスキーサーカス", region: "Madarao & Tangram", regionJa: "斑尾・タングラム", lat: 36.850, lng: 138.648, elevation: 1320, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.tangram.jp/" },
  { id: "kurohime-kogen", name: "Kurohime Kogen", nameJa: "黒姫高原", region: "Madarao & Tangram", regionJa: "斑尾・タングラム", lat: 36.828, lng: 138.624, elevation: 1200, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },

  { id: "togakushi", name: "Togakushi", nameJa: "戸隠", region: "Togakushi & Iizuna", regionJa: "戸隠・飯綱", lat: 36.755, lng: 138.073, elevation: 1748, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.togakushi-ski.jp/" },
  { id: "iizuna-kogen", name: "Iizuna Kogen", nameJa: "飯綱高原", region: "Togakushi & Iizuna", regionJa: "戸隠・飯綱", lat: 36.710, lng: 138.130, elevation: 1240, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "iizuna-resort", name: "Iizuna Resort", nameJa: "飯綱リゾート", region: "Togakushi & Iizuna", regionJa: "戸隠・飯綱", lat: 36.720, lng: 138.126, elevation: 1180, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "sobane-noshirakaba", name: "Soba-no-Shirakaba", nameJa: "そばの白樺", region: "Togakushi & Iizuna", regionJa: "戸隠・飯綱", lat: 36.746, lng: 138.080, elevation: 1100, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },

  { id: "sugadaira-pine", name: "Sugadaira Pine Beak", nameJa: "菅平パインビーク", region: "Sugadaira", regionJa: "菅平高原", lat: 36.530, lng: 138.345, elevation: 1650, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.sugadaira-snowresort.com/" },
  { id: "sugadaira-taiko", name: "Sugadaira Taiko", nameJa: "菅平太鷹", region: "Sugadaira", regionJa: "菅平高原", lat: 36.525, lng: 138.340, elevation: 1600, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "sugadaira-davos", name: "Sugadaira Davos", nameJa: "菅平ダボス", region: "Sugadaira", regionJa: "菅平高原", lat: 36.535, lng: 138.350, elevation: 1570, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "peak-break", name: "Peak's Break", nameJa: "ピークスブレイク", region: "Sugadaira", regionJa: "菅平高原", lat: 36.528, lng: 138.342, elevation: 1500, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },

  { id: "karuizawa-prince", name: "Karuizawa Prince", nameJa: "軽井沢プリンス", region: "Karuizawa & East", regionJa: "軽井沢・東部", lat: 36.332, lng: 138.613, elevation: 1155, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.princehotels.co.jp/ski/karuizawa/" },
  { id: "asama-2000", name: "Asama 2000 Park", nameJa: "アサマ2000パーク", region: "Karuizawa & East", regionJa: "軽井沢・東部", lat: 36.415, lng: 138.541, elevation: 2000, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "komoro-kogen", name: "Komoro Kogen", nameJa: "小諸高原", region: "Karuizawa & East", regionJa: "軽井沢・東部", lat: 36.330, lng: 138.435, elevation: 1100, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "yokokura", name: "Yokokura Kogen", nameJa: "横倉高原", region: "Karuizawa & East", regionJa: "軽井沢・東部", lat: 36.345, lng: 138.500, elevation: 1200, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "tateshina-tokyu", name: "Tateshina Tokyu", nameJa: "蓼科東急", region: "Karuizawa & East", regionJa: "軽井沢・東部", lat: 36.105, lng: 138.280, elevation: 1600, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },

  { id: "kisofukushima", name: "Kiso Fukushima", nameJa: "木曽福島", region: "Kiso & South", regionJa: "木曽・南部", lat: 35.846, lng: 137.672, elevation: 1904, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "ontake-ropeway", name: "Ontake Ropeway", nameJa: "おんたけロープウェイ", region: "Kiso & South", regionJa: "木曽・南部", lat: 35.889, lng: 137.511, elevation: 2150, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "chikumagawa-ski", name: "Chikumagawa Ski", nameJa: "千曲川スキー場", region: "Kiso & South", regionJa: "木曽・南部", lat: 35.870, lng: 137.660, elevation: 1400, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "odarakogen", name: "Odara Kogen", nameJa: "おだら高原", region: "Kiso & South", regionJa: "木曽・南部", lat: 35.795, lng: 137.700, elevation: 1300, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "chao-ontake", name: "Chao Ontake", nameJa: "チャオ御岳", region: "Kiso & South", regionJa: "木曽・南部", lat: 35.919, lng: 137.489, elevation: 2200, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "yabuhara-kogen", name: "Yabuhara Kogen", nameJa: "薮原高原", region: "Kiso & South", regionJa: "木曽・南部", lat: 35.945, lng: 137.717, elevation: 1450, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },

  { id: "ryuoo", name: "Ryuoo Ski Park", nameJa: "竜王スキーパーク", region: "Yamanouchi", regionJa: "山ノ内", lat: 36.779, lng: 138.474, elevation: 1930, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.ryuoo.com/en/" },
  { id: "yomase", name: "Yomase Onsen", nameJa: "夜間瀬温泉", region: "Yamanouchi", regionJa: "山ノ内", lat: 36.789, lng: 138.411, elevation: 1120, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "kanbayashi", name: "Kanbayashi Kokusai", nameJa: "上林国際", region: "Yamanouchi", regionJa: "山ノ内", lat: 36.740, lng: 138.460, elevation: 1120, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "umegaki", name: "Umegaki Ski", nameJa: "梅垣スキー場", region: "Yamanouchi", regionJa: "山ノ内", lat: 36.756, lng: 138.443, elevation: 900, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "takabayama", name: "Takabayama", nameJa: "高社山", region: "Yamanouchi", regionJa: "山ノ内", lat: 36.782, lng: 138.391, elevation: 1352, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "yamabiko-nozaki", name: "Yamabiko No Mori", nameJa: "やまびこの森", region: "Yamanouchi", regionJa: "山ノ内", lat: 36.770, lng: 138.420, elevation: 1050, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "kitashiga-kogen", name: "Kitashiga Kogen", nameJa: "北志賀小丸山", region: "Yamanouchi", regionJa: "山ノ内", lat: 36.778, lng: 138.440, elevation: 1050, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },

  { id: "fujimi-panorama", name: "Fujimi Panorama", nameJa: "富士見パノラマ", region: "Central Nagano", regionJa: "中信エリア", lat: 35.897, lng: 138.247, elevation: 1780, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: "https://www.fujimipanorama.com/snow/" },
  { id: "pilatus-tateshina", name: "Pilatus Tateshina", nameJa: "ピラタス蓼科", region: "Central Nagano", regionJa: "中信エリア", lat: 36.098, lng: 138.275, elevation: 2240, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shirakabako-royal", name: "Shirakabako Royal Hill", nameJa: "白樺湖ロイヤルヒル", region: "Central Nagano", regionJa: "中信エリア", lat: 36.090, lng: 138.238, elevation: 1560, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "kurumayama-kogen", name: "Kurumayama Kogen", nameJa: "車山高原", region: "Central Nagano", regionJa: "中信エリア", lat: 36.105, lng: 138.205, elevation: 1925, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "echoland", name: "Echo Valley", nameJa: "エコーバレー", region: "Central Nagano", regionJa: "中信エリア", lat: 36.130, lng: 138.218, elevation: 1560, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "brankige", name: "Blanche Takayama", nameJa: "ブランシュたかやま", region: "Central Nagano", regionJa: "中信エリア", lat: 36.158, lng: 138.235, elevation: 1807, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "shirakaba-2in1", name: "Shirakaba 2in1", nameJa: "白樺2in1", region: "Central Nagano", regionJa: "中信エリア", lat: 36.085, lng: 138.240, elevation: 1450, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },

  { id: "otari", name: "Otari Ski", nameJa: "小谷スキー場", region: "Northern Nagano", regionJa: "北信エリア", lat: 36.825, lng: 137.930, elevation: 1200, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "nomugi-touge", name: "Nomugi Touge", nameJa: "野麦峠", region: "Northern Nagano", regionJa: "北信エリア", lat: 36.137, lng: 137.648, elevation: 1600, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "kirigamine", name: "Kirigamine", nameJa: "霧ヶ峰", region: "Northern Nagano", regionJa: "北信エリア", lat: 36.115, lng: 138.155, elevation: 1680, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "yamada-bokujo", name: "Yamada Bokujo", nameJa: "山田牧場スキー場", region: "Northern Nagano", regionJa: "北信エリア", lat: 36.734, lng: 138.460, elevation: 1500, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "takamine-kogen", name: "Asama 2000 Park", nameJa: "アサマ2000パーク", region: "Northern Nagano", regionJa: "北信エリア", lat: 36.418, lng: 138.477, elevation: 2000, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "iiyama-kamakura", name: "Iiyama Kamakura", nameJa: "飯山かまくらの里", region: "Northern Nagano", regionJa: "北信エリア", lat: 36.850, lng: 138.380, elevation: 600, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "sano-saka", name: "Sanosaka", nameJa: "さのさか", region: "Northern Nagano", regionJa: "北信エリア", lat: 36.610, lng: 137.858, elevation: 1100, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "suzuran-kogen", name: "Suzuran Kogen", nameJa: "すずらん高原", region: "Northern Nagano", regionJa: "北信エリア", lat: 36.080, lng: 138.200, elevation: 1500, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
  { id: "chino-ski", name: "Chino Ski", nameJa: "茅野スキー場", region: "Northern Nagano", regionJa: "北信エリア", lat: 36.000, lng: 138.160, elevation: 1400, snow24h: 0, baseDepth: 0, temp: 0, wind: 0, snowTomorrow: 0, websiteUrl: null },
];

export function getSeededResorts(): Resort[] {
  return RESORTS.map(r => ({
    ...r,
    snow24h: rng(r.id + "s24", 0, 35),
    baseDepth: rng(r.id + "bd", 80, 320),
    temp: rng(r.id + "t", 0, 12) - 12,
    wind: rng(r.id + "w", 2, 35),
    snowTomorrow: rng(r.id + "st", 0, 20),
  }));
}

export function getDashboardData(resorts: Resort[]) {
  const avgTemp = Math.round(resorts.reduce((s, r) => s + r.temp, 0) / resorts.length * 10) / 10;
  const avgWind = Math.round(resorts.reduce((s, r) => s + r.wind, 0) / resorts.length);
  const topSnow24h = Math.max(...resorts.map(r => r.snow24h));
  const bestBase = Math.max(...resorts.map(r => r.baseDepth));

  const bestResort = [...resorts].sort((a, b) => {
    const scoreA = a.snow24h * 3 + a.baseDepth;
    const scoreB = b.snow24h * 3 + b.baseDepth;
    return scoreB - scoreA;
  })[0];

  const regionMap = new Map<string, Resort[]>();
  resorts.forEach(r => {
    if (!regionMap.has(r.region)) regionMap.set(r.region, []);
    regionMap.get(r.region)!.push(r);
  });

  const regions = Array.from(regionMap.entries()).map(([name, rs]) => ({
    name,
    nameJa: rs[0].regionJa,
    resortCount: rs.length,
    topSnow: Math.max(...rs.map(r => r.snow24h)),
    bestBase: Math.max(...rs.map(r => r.baseDepth)),
    avgTemp: Math.round(rs.reduce((s, r) => s + r.temp, 0) / rs.length * 10) / 10,
  }));

  return {
    totalSkiAreas: resorts.length,
    avgTemp,
    avgWind,
    topSnow24h,
    bestBase,
    bestResort: {
      ...bestResort,
      rank: 1,
    },
    regions,
    nextUpdate: "Every hour",
  };
}
