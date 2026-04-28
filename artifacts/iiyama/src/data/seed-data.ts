export const ALERTS = {
  alerts: [
    {
      id: "a1",
      alertLevel: "powder_day",
      resort: "Hakuba Valley",
      message: "Heavy snowfall across Hakuba Valley — 30cm+ expected overnight",
      messageJa: "白馬バレー全域で大雪 — 夜間30cm以上の降雪予想",
      issuedAt: new Date().toISOString(),
      expectedSnow: 35,
    },
    {
      id: "a2",
      alertLevel: "watch",
      resort: "Nozawa Onsen",
      message: "Strong winds above 2000m — upper lifts may be affected",
      messageJa: "2000m以上で強風 — 上部リフトに影響の可能性",
      issuedAt: new Date().toISOString(),
      expectedSnow: null,
    },
  ],
  stormTracker: [
    {
      id: "s1",
      status: "active",
      region: "Northern Nagano Alps",
      description: "Japan Sea effect snow band pushing heavy snowfall across Hakuba, Nozawa, and Madarao regions. Peak intensity expected through tomorrow morning.",
      descriptionJa: "日本海からの雪雲が白馬・野沢・斑尾エリアに大雪をもたらしています。明日朝までピーク強度の見込み。",
      startDate: new Date().toISOString(),
      totalSnow: 45,
      peakSnow24h: 30,
    },
    {
      id: "s2",
      status: "incoming",
      region: "Shiga Kogen Highland",
      description: "Secondary low pressure system approaching from the northwest. Expected to bring 15-25cm of fresh snow to Shiga Kogen and surrounding areas.",
      descriptionJa: "北西からの二次低気圧が接近中。志賀高原周辺に15〜25cmの新雪の見込み。",
      startDate: new Date(Date.now() + 86400000).toISOString(),
      totalSnow: 25,
      peakSnow24h: 18,
    },
    {
      id: "s3",
      status: "passed",
      region: "Central Nagano Plateau",
      description: "Cold front passed through bringing moderate snowfall to central resorts. Clearing conditions expected.",
      descriptionJa: "寒冷前線通過により中部リゾートに中程度の降雪。晴天の見込み。",
      startDate: new Date(Date.now() - 172800000).toISOString(),
      totalSnow: 12,
      peakSnow24h: 8,
    },
  ],
};

export const WEATHER_OUTLOOK = {
  mountains: [
    {
      region: "Hakuba Valley Summit",
      regionJa: "白馬バレー山頂",
      elevation: 1800,
      temp: -8,
      wind: 25,
      weatherCode: 73,
      snow24h: 22,
      forecast: generateForecast(true),
    },
    {
      region: "Shiga Kogen Summit",
      regionJa: "志賀高原山頂",
      elevation: 2300,
      temp: -12,
      wind: 18,
      weatherCode: 71,
      snow24h: 15,
      forecast: generateForecast(true),
    },
    {
      region: "Nozawa Onsen Summit",
      regionJa: "野沢温泉山頂",
      elevation: 1650,
      temp: -6,
      wind: 20,
      weatherCode: 73,
      snow24h: 28,
      forecast: generateForecast(true),
    },
    {
      region: "Northern Nagano Summit",
      regionJa: "北部高原山頂",
      elevation: 1855,
      temp: -9,
      wind: 22,
      weatherCode: 75,
      snow24h: 25,
      forecast: generateForecast(true),
    },
  ],
  towns: [
    {
      location: "Hakuba Village",
      locationJa: "白馬村",
      elevation: 703,
      temp: -2,
      wind: 8,
      weatherCode: 71,
      forecast: generateForecast(false),
    },
    {
      location: "Yamanouchi Town",
      locationJa: "山ノ内町",
      elevation: 600,
      temp: -1,
      wind: 5,
      weatherCode: 3,
      forecast: generateForecast(false),
    },
    {
      location: "Nozawa Village",
      locationJa: "野沢温泉村",
      elevation: 580,
      temp: 0,
      wind: 6,
      weatherCode: 71,
      forecast: generateForecast(false),
    },
    {
      location: "Nagano City",
      locationJa: "長野市",
      elevation: 362,
      temp: 2,
      wind: 4,
      weatherCode: 2,
      forecast: generateForecast(false),
    },
  ],
  updatedAt: new Date().toISOString(),
};

function generateForecast(isMountain: boolean) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  return days.map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dayLabel = i === 0 ? "Today" : i === 1 ? "Tomorrow" : days[d.getDay()];
    const snowfall = isMountain
      ? [18, 12, 5, 0, 8, 22, 15][i]
      : [3, 1, 0, 0, 2, 5, 3][i];
    const rain = isMountain ? 0 : [0, 0, 2, 0, 0, 0, 0][i];
    const codes = isMountain
      ? [73, 71, 3, 0, 71, 75, 73]
      : [71, 3, 61, 0, 71, 73, 71];
    return {
      date: d.toISOString().slice(0, 10),
      dayLabel,
      tempMin: isMountain ? -15 + i : -3 + i,
      tempMax: isMountain ? -8 + i : 2 + i,
      snowfall,
      rain,
      precipitation: snowfall + rain,
      weatherCode: codes[i],
    };
  });
}

export const CAMS_DATA = [
  {
    id: "road",
    title: "Road Cameras",
    titleJa: "道路カメラ",
    subtitle: "Nagano Prefecture live road conditions network",
    subtitleJa: "長野県道路ライブカメラネットワーク",
    url: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
    embedUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
    icon: "Camera" as const,
    color: "from-amber-600 to-orange-600",
    note: "Opens Nagano Prefecture's live road camera network covering major routes to ski resorts.",
    noteJa: "長野県のスキー場へのルートをカバーする道路カメラネットワーク。",
    externalOnly: true,
  },
  {
    id: "hakuba",
    title: "Hakuba Valley Cams",
    titleJa: "白馬バレーライブカメラ",
    subtitle: "Live cameras across Hakuba Valley ski areas",
    subtitleJa: "白馬バレー各スキー場のライブカメラ",
    url: "https://www.happo-one.jp/gelande/livecam/",
    embedUrl: "https://www.happo-one.jp/gelande/livecam/",
    icon: "Camera" as const,
    color: "from-blue-600 to-indigo-700",
    note: null,
    noteJa: null,
    externalOnly: true,
  },
  {
    id: "shiga-live",
    title: "Shiga Kogen Ski Cams",
    titleJa: "志賀高原ライブカメラ",
    subtitle: "Official live cameras across Shiga Kogen ski areas",
    subtitleJa: "志賀高原各スキー場の公式ライブカメラ",
    url: "https://www.shigakogen.gr.jp/live/index.html",
    embedUrl: "https://www.shigakogen.gr.jp/live/index.html",
    icon: "Camera" as const,
    color: "from-slate-600 to-slate-800",
    note: null,
    noteJa: null,
    externalOnly: true,
  },
  {
    id: "nozawa-cam",
    title: "Nozawa Onsen Live",
    titleJa: "野沢温泉ライブ",
    subtitle: "Live cameras from Nozawa Onsen ski resort",
    subtitleJa: "野沢温泉スキー場ライブカメラ",
    url: "https://nozawaski.com/en/live-camera/",
    embedUrl: "https://nozawaski.com/en/live-camera/",
    icon: "Camera" as const,
    color: "from-emerald-600 to-teal-700",
    note: null,
    noteJa: null,
    externalOnly: true,
  },
  {
    id: "youtube",
    title: "Ryuoo Live Stream",
    titleJa: "竜王ライブ配信",
    subtitle: "YouTube live stream — Ryuoo ski area conditions",
    subtitleJa: "YouTube ライブ配信 — 竜王スキーパーク状況",
    url: "https://www.youtube.com/watch?v=z71WU9uXdEM",
    embedUrl: "https://www.youtube.com/embed/z71WU9uXdEM?rel=0&modestbranding=1",
    icon: "Video" as const,
    color: "from-red-600 to-rose-700",
    note: null,
    noteJa: null,
    externalOnly: false,
  },
];

export const ACCOMMODATION = [
  { id: "s1", name: "Hotel Hakuba", nameJa: "ホテル白馬", type: "hotel", region: "Hakuba Valley", regionJa: "白馬バレー", address: "Hakuba Village", addressJa: "白馬村", description: "Ski-in ski-out hotel at the base of Happo-One with panoramic mountain views.", descriptionJa: "八方尾根ベースのスキーインスキーアウトホテル。パノラマの山岳景観。", lat: 36.698, lng: 137.831, phone: "0261-72-2020", websiteUrl: "https://www.hakuba.com", priceRange: "¥¥¥", onsenAvailable: true, skiInSkiOut: true, featured: true },
  { id: "s2", name: "Ryokan Sakura", nameJa: "旅館さくら", type: "ryokan", region: "Nozawa Onsen", regionJa: "野沢温泉", address: "Nozawa Village", addressJa: "野沢温泉村", description: "Traditional ryokan with natural hot springs and kaiseki dining.", descriptionJa: "天然温泉と懐石料理の伝統的な旅館。", lat: 36.927, lng: 138.636, phone: "0269-85-3456", websiteUrl: null, priceRange: "¥¥", onsenAvailable: true, skiInSkiOut: false, featured: true },
  { id: "s3", name: "Madarao Mountain Lodge", nameJa: "斑尾マウンテンロッジ", type: "guesthouse", region: "Madarao & Tangram", regionJa: "斑尾・タングラム", address: "Madarao Kogen", addressJa: "斑尾高原", description: "Budget-friendly mountain lodge with communal atmosphere and gear storage.", descriptionJa: "コミュニティの雰囲気とギア収納のあるバジェットロッジ。", lat: 36.853, lng: 138.642, phone: null, websiteUrl: null, priceRange: "¥", onsenAvailable: false, skiInSkiOut: false, featured: false },
  { id: "s4", name: "Shiga Grand Hotel", nameJa: "志賀グランドホテル", type: "hotel", region: "Shiga Kogen", regionJa: "志賀高原", address: "Shiga Kogen", addressJa: "志賀高原", description: "Grand hotel at the heart of Shiga Kogen with direct slope access.", descriptionJa: "志賀高原中心部のグランドホテル。ゲレンデ直結。", lat: 36.790, lng: 138.510, phone: "0269-34-2111", websiteUrl: "https://www.shigakogen.co.jp", priceRange: "¥¥¥", onsenAvailable: true, skiInSkiOut: true, featured: true },
  { id: "s5", name: "Madarao Lodge", nameJa: "斑尾ロッジ", type: "guesthouse", region: "Madarao & Tangram", regionJa: "斑尾・タングラム", address: "Madarao Kogen", addressJa: "斑尾高原", description: "Cozy lodge popular with international skiers. Tree skiing paradise.", descriptionJa: "国際的なスキーヤーに人気のコージーロッジ。ツリーランの楽園。", lat: 36.853, lng: 138.642, phone: null, websiteUrl: null, priceRange: "¥¥", onsenAvailable: false, skiInSkiOut: true, featured: false },
  { id: "s6", name: "Ryokan Togakushi", nameJa: "旅館戸隠", type: "ryokan", region: "Togakushi & Iizuna", regionJa: "戸隠・飯綱", address: "Togakushi", addressJa: "戸隠", description: "Mountain ryokan near Togakushi Shrine with handmade soba dining.", descriptionJa: "戸隠神社近くの山の旅館。手打ちそば料理。", lat: 36.755, lng: 138.073, phone: "026-254-2230", websiteUrl: null, priceRange: "¥¥", onsenAvailable: true, skiInSkiOut: false, featured: false },
  { id: "s7", name: "Nozawa Onsen Lodge Nagano", nameJa: "野沢温泉ロッジ長野", type: "hotel", region: "Nozawa Onsen", regionJa: "野沢温泉", address: "Nozawa Village", addressJa: "野沢温泉村", description: "Modern hotel with ski-in access and onsen bath overlooking the valley.", descriptionJa: "スキーイン対応の近代的ホテル。バレービューの温泉。", lat: 36.930, lng: 138.640, phone: "0269-85-4500", websiteUrl: null, priceRange: "¥¥¥", onsenAvailable: true, skiInSkiOut: true, featured: false },
  { id: "s8", name: "Karuizawa Prince Hotel", nameJa: "軽井沢プリンスホテル", type: "hotel", region: "Karuizawa & East", regionJa: "軽井沢・東部", address: "Karuizawa", addressJa: "軽井沢", description: "Luxury hotel adjacent to Karuizawa Prince ski resort with shopping outlet.", descriptionJa: "軽井沢プリンスリゾート隣接のラグジュアリーホテル。アウトレット付き。", lat: 36.332, lng: 138.613, phone: "0267-42-1111", websiteUrl: "https://www.princehotels.co.jp", priceRange: "¥¥¥¥", onsenAvailable: true, skiInSkiOut: true, featured: true },
];

export const DINING = [
  { id: "d1", name: "Sobadokoro Hakuba", nameJa: "そば処白馬", type: "restaurant", region: "Hakuba Valley", regionJa: "白馬バレー", cuisine: "Soba & Japanese", cuisineJa: "そば・和食", address: "Hakuba Village", addressJa: "白馬村", description: "Hand-pulled Shinshu soba made from locally grown buckwheat.", descriptionJa: "地元産そば粉を使った手打ち信州そば。", lat: 36.698, lng: 137.831, openingHours: "11:00-15:00, 17:00-21:00", websiteUrl: null, priceRange: "¥¥" },
  { id: "d2", name: "Nozawa Brewing", nameJa: "野沢ブルーイング", type: "bar", region: "Nozawa Onsen", regionJa: "野沢温泉", cuisine: "Craft Beer & Pub", cuisineJa: "クラフトビール・パブ", address: "Nozawa Village", addressJa: "野沢温泉村", description: "Local craft brewery with seasonal IPAs and stouts. Apres-ski favorite.", descriptionJa: "地元クラフトビール醸造所。季節のIPAとスタウト。アプレスキーの人気店。", lat: 36.927, lng: 138.636, openingHours: "15:00-23:00", websiteUrl: null, priceRange: "¥¥" },
  { id: "d3", name: "Mountain Cafe Shiga", nameJa: "マウンテンカフェ志賀", type: "cafe", region: "Shiga Kogen", regionJa: "志賀高原", cuisine: "Coffee & Light Meals", cuisineJa: "コーヒー・軽食", address: "Shiga Kogen", addressJa: "志賀高原", description: "Slope-side cafe with fresh pastries and drip coffee.", descriptionJa: "ゲレンデサイドのカフェ。焼きたてペストリーとドリップコーヒー。", lat: 36.790, lng: 138.510, openingHours: "08:00-16:00", websiteUrl: null, priceRange: "¥" },
  { id: "d4", name: "Izakaya Yukiguni", nameJa: "居酒屋雪国", type: "restaurant", region: "Iiyama", regionJa: "飯山", cuisine: "Izakaya", cuisineJa: "居酒屋", address: "Iiyama", addressJa: "飯山市", description: "Cozy izakaya serving hot pot, yakitori, and local sake from Nagano.", descriptionJa: "鍋、焼き鳥、長野の地酒を提供する居心地の良い居酒屋。", lat: 36.850, lng: 138.600, openingHours: "17:00-23:00", websiteUrl: null, priceRange: "¥¥" },
  { id: "d5", name: "Hakuba Pizza", nameJa: "白馬ピザ", type: "restaurant", region: "Hakuba Valley", regionJa: "白馬バレー", cuisine: "Pizza & Italian", cuisineJa: "ピザ・イタリアン", address: "Echoland, Hakuba", addressJa: "エコーランド、白馬", description: "Wood-fired pizza with locally sourced ingredients. Family-friendly.", descriptionJa: "地元食材を使った薪窯焼きピザ。ファミリーフレンドリー。", lat: 36.695, lng: 137.835, openingHours: "11:30-14:00, 17:30-22:00", websiteUrl: null, priceRange: "¥¥" },
  { id: "d6", name: "Togakushi Soba House", nameJa: "戸隠そば本舗", type: "restaurant", region: "Togakushi & Iizuna", regionJa: "戸隠・飯綱", cuisine: "Togakushi Soba", cuisineJa: "戸隠そば", address: "Togakushi", addressJa: "戸隠", description: "Famous Togakushi soba served in traditional bocchan style with five plates.", descriptionJa: "五枚盛りのぼっち盛りスタイルで提供する戸隠そばの名店。", lat: 36.755, lng: 138.073, openingHours: "11:00-15:00", websiteUrl: null, priceRange: "¥¥" },
  { id: "d7", name: "Sake Bar Nagano", nameJa: "酒バー長野", type: "bar", region: "Shiga Kogen", regionJa: "志賀高原", cuisine: "Japanese Sake", cuisineJa: "日本酒", address: "Shiga Kogen", addressJa: "志賀高原", description: "Curated selection of Nagano Prefecture sake paired with small plates.", descriptionJa: "長野県産日本酒の厳選セレクションと小皿料理。", lat: 36.788, lng: 138.508, openingHours: "18:00-24:00", websiteUrl: null, priceRange: "¥¥¥" },
  { id: "d8", name: "Madarao Deli", nameJa: "斑尾デリ", type: "cafe", region: "Madarao & Tangram", regionJa: "斑尾・タングラム", cuisine: "Sandwiches & Coffee", cuisineJa: "サンドイッチ・コーヒー", address: "Madarao Kogen", addressJa: "斑尾高原", description: "Quick grab-and-go deli near the gondola base. Great morning coffee.", descriptionJa: "ゴンドラベース近くのテイクアウトデリ。朝のコーヒーが最高。", lat: 36.853, lng: 138.642, openingHours: "07:30-16:00", websiteUrl: null, priceRange: "¥" },
];

export const ATTRACTIONS = [
  { id: "x1", name: "Jigokudani Monkey Park", nameJa: "地獄谷野猿公苑", category: "nature", region: "Yamanouchi", regionJa: "山ノ内", address: "Yamanouchi, Shimotakai", addressJa: "下高井郡山ノ内町", description: "World-famous wild snow monkeys bathing in natural hot springs.", descriptionJa: "天然温泉に入る野生のスノーモンキーで世界的に有名。", openingHours: "9:00 - 16:00", admissionFee: "Adults ¥800", imageUrl: null },
  { id: "x2", name: "Zenkoji Temple", nameJa: "善光寺", category: "culture", region: "Nagano City", regionJa: "長野市", address: "Nagano City", addressJa: "長野市", description: "One of Japan's most important temples, founded in the 7th century. A national treasure.", descriptionJa: "7世紀に創建された日本有数の重要寺院。国宝。", openingHours: "5:30 - 16:30", admissionFee: "Free (inner chamber ¥600)", imageUrl: null },
  { id: "x3", name: "Nozawa Onsen External Baths", nameJa: "野沢温泉外湯", category: "onsen", region: "Nozawa Onsen", regionJa: "野沢温泉", address: "Nozawa Village", addressJa: "野沢温泉村", description: "13 free public hot spring baths (sotoyu) scattered through the charming village.", descriptionJa: "趣のある村に点在する13か所の無料公衆浴場（外湯）。", openingHours: "5:00 - 23:00", admissionFee: "Free (donation box)", imageUrl: null },
  { id: "x4", name: "Hakuba Happo Pond", nameJa: "白馬八方池", category: "nature", region: "Hakuba Valley", regionJa: "白馬バレー", address: "Hakuba Village", addressJa: "白馬村", description: "Alpine pond at 2,060m reflecting the Northern Alps. Accessible by gondola & chairlift in winter.", descriptionJa: "標高2,060mの高山池に北アルプスが映る。冬はゴンドラ&チェアリフトでアクセス。", openingHours: "Daylight hours", admissionFee: "Lift ticket required", imageUrl: null },
  { id: "x5", name: "Togakushi Shrine", nameJa: "戸隠神社", category: "culture", region: "Togakushi & Iizuna", regionJa: "戸隠・飯綱", address: "Togakushi", addressJa: "戸隠", description: "Ancient Shinto shrine complex set in a grove of 800-year-old cedar trees.", descriptionJa: "樹齢800年の杉並木に佇む古い神社群。", openingHours: "Dawn - Dusk", admissionFee: "Free", imageUrl: null },
  { id: "x6", name: "Yudanaka Onsen", nameJa: "湯田中温泉", category: "onsen", region: "Yamanouchi", regionJa: "山ノ内", address: "Yamanouchi Town", addressJa: "山ノ内町", description: "Historic hot spring district with public baths and ryokan. Gateway to Snow Monkey Park.", descriptionJa: "公衆浴場と旅館のある歴史的温泉街。スノーモンキーパークの玄関口。", openingHours: "Varies by bath", admissionFee: "¥300-500", imageUrl: null },
  { id: "x7", name: "Matsumoto Castle", nameJa: "松本城", category: "culture", region: "Central Nagano", regionJa: "中信エリア", address: "Matsumoto City", addressJa: "松本市", description: "Japan's oldest five-tiered castle and national treasure. Beautiful in snow.", descriptionJa: "日本最古の五重天守閣。国宝。雪景色が美しい。", openingHours: "8:30 - 17:00", admissionFee: "Adults ¥700", imageUrl: null },
  { id: "x8", name: "Shibu Onsen Nine Baths", nameJa: "渋温泉九湯", category: "onsen", region: "Yamanouchi", regionJa: "山ノ内", address: "Shibu Onsen, Yamanouchi", addressJa: "山ノ内町渋温泉", description: "Nine external baths pilgrimage trail through atmospheric stone-paved streets.", descriptionJa: "風情ある石畳の通りを巡る九つの外湯巡り。", openingHours: "6:00 - 22:00", admissionFee: "Guests only (accommodation key)", imageUrl: null },
  { id: "x9", name: "Snow Shoe Trek Madarao", nameJa: "スノーシュートレック斑尾", category: "activity", region: "Madarao & Tangram", regionJa: "斑尾・タングラム", address: "Madarao Kogen", addressJa: "斑尾高原", description: "Guided snowshoe tours through pristine beech forests. Suitable for all levels.", descriptionJa: "原生ブナ林を巡るガイド付きスノーシューツアー。全レベル対応。", openingHours: "9:00 - 15:00 (by reservation)", admissionFee: "¥4,500 incl. gear", imageUrl: null },
  { id: "x10", name: "Nagano Olympic Museum", nameJa: "長野オリンピックミュージアム", category: "culture", region: "Nagano City", regionJa: "長野市", address: "Nagano City", addressJa: "長野市", description: "Museum celebrating the 1998 Winter Olympics held in Nagano Prefecture.", descriptionJa: "長野県で開催された1998年冬季オリンピックを祝う博物館。", openingHours: "9:00 - 17:00", admissionFee: "Adults ¥500", imageUrl: null },
];
