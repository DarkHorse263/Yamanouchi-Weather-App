
export type RegionKey =
  | "snowy-mountains"
  | "victorias-high-country"
  | "tasmania"
  | "yamanouchi"
  | "nozawa-onsen"
  | "iiyama"
  | "hakuba-valley"
  | "myoko"
  | "niseko"
  | "furano"
  | "sapporo"
  | "tomamu-sahoro"
  | "asahikawa"
  | "rusutsu-kiroro"
  | "yuzawa"
  | "zao-onsen"
  | "hakkoda-aomori-spring"
  | "appi-shizukuishi"
  | "bandai"
  | "daisen"
  | "minakami"
  | "kusatsu-manza"
  | "hachimantai"
  | "queenstown"
  | "wanaka"
  | "mt-hutt"
  | "ruapehu"
  | "whistler"
  | "powder-highway"
  | "okanagan"
  | "vancouver"
  | "banff-lake-louise"
  | "canmore"
  | "jasper"
  | "quebec-laurentians"
  | "quebec-charlevoix"
  | "summit-county"
  | "vail-valley"
  | "aspen-snowmass"
  | "steamboat"
  | "winter-park"
  | "crested-butte"
  | "telluride"
  | "durango"
  | "boulder-front-range"
  | "cottonwood-canyons"
  | "park-city"
  | "ogden-valley"
  | "provo"
  | "cache-valley"
  | "north-lake-tahoe"
  | "south-lake-tahoe"
  | "mammoth-lakes"
  | "big-bear"
  | "bear-valley"
  | "mt-shasta"
  | "killington-pico"
  | "stowe-smugglers-notch"
  | "mad-river-valley"
  | "southern-vermont"
  | "okemo"
  | "jay-peak-nek"
  | "jackson-hole"
  | "grand-targhee"
  | "big-sky"
  | "bozeman-bridger-bowl"
  | "whitefish"
  | "red-lodge"
  | "taos"
  | "angel-fire"
  | "santa-fe"
  | "albuquerque-sandia"
  | "harbor-springs"
  | "keweenaw-peninsula"
  | "poconos"
  | "laurel-highlands"
  | "berkshires"
  | "central-massachusetts"
  | "lutsen-north-shore"
  | "wausau"
  | "wisconsin-dells"
  | "snowshoe"
  | "canaan-valley"
  | "high-country"
  | "maggie-valley"
  | "blue-ridge"
  | "shenandoah-valley"
  | "lake-tahoe-nevada"
  | "flagstaff"
  | "white-mountains-az"
  | "black-hills"
  | "girdwood"
  | "juneau"
  | "litchfield-hills"
  | "vernon"
  | "mt-hood"
  | "bend"
  | "crystal-mountain"
  | "snoqualmie-pass"
  | "stevens-pass"
  | "mt-baker"
  | "sun-valley"
  | "sandpoint"
  | "boise"
  | "donnelly-mccall"
  | "white-mountains"
  | "franconia-notch"
  | "waterville-valley"
  | "lakes-region"
  | "carrabassett-valley"
  | "newry-bethel"
  | "rangeley"
  | "lake-placid"
  | "north-creek"
  | "hunter"
  | "windham"
  | "highmount"
  | "quebec-eastern-townships";

export interface PinSpec { id: string; name: string; lat: number; lng: number; accent: string }

export const REGION_DEFAULTS: Record<RegionKey, { center: { lat: number; lng: number }; pins: PinSpec[] }> = {
  "snowy-mountains": {
    center: { lat: -36.42, lng: 148.42 },
    pins: [
      { id: "perisher", name: "Perisher", lat: -36.3717, lng: 148.4086, accent: "#f97316" },
      { id: "thredbo", name: "Thredbo", lat: -36.5054, lng: 148.3089, accent: "#f97316" },
      { id: "charlottes-pass", name: "Charlotte's Pass", lat: -36.4314, lng: 148.3297, accent: "#f97316" },
      { id: "selwyn", name: "Selwyn", lat: -35.8990, lng: 148.4860, accent: "#f97316" },
      { id: "jindabyne", name: "Jindabyne", lat: -36.4106, lng: 148.6206, accent: "#0ea5e9" },
    ],
  },
  "victorias-high-country": {
    center: { lat: -36.86, lng: 147.27 },
    pins: [
      { id: "mt-buller", name: "Mt Buller", lat: -37.1456, lng: 146.4391, accent: "#f97316" },
      { id: "mt-stirling", name: "Mt Stirling", lat: -37.1167, lng: 146.4500, accent: "#f97316" },
      { id: "falls-creek", name: "Falls Creek", lat: -36.8628, lng: 147.2778, accent: "#f97316" },
      { id: "mt-hotham", name: "Mt Hotham", lat: -36.9779, lng: 147.1361, accent: "#f97316" },
      { id: "lake-mountain", name: "Lake Mountain", lat: -37.5181, lng: 145.8983, accent: "#f97316" },
      { id: "mt-donna-buang", name: "Mt Donna Buang", lat: -37.6961, lng: 145.6989, accent: "#f97316" },
      { id: "mount-beauty", name: "Mount Beauty", lat: -36.7327, lng: 147.1696, accent: "#0ea5e9" },
      { id: "bright", name: "Bright", lat: -36.7300, lng: 146.9617, accent: "#0ea5e9" },
      { id: "mansfield", name: "Mansfield", lat: -37.0539, lng: 146.0894, accent: "#0ea5e9" },
    ],
  },
  tasmania: {
    center: { lat: -41.54, lng: 147.67 },
    pins: [
      { id: "ben-lomond", name: "Ben Lomond", lat: -41.5378, lng: 147.6736, accent: "#f97316" },
      { id: "ben-lomond-base", name: "Ben Lomond Base", lat: -41.5392, lng: 147.6486, accent: "#0ea5e9" },
      { id: "launceston", name: "Launceston", lat: -41.4332, lng: 147.1442, accent: "#0ea5e9" },
      { id: "hobart", name: "Hobart", lat: -42.8821, lng: 147.3272, accent: "#0ea5e9" },
    ],
  },
  yamanouchi: {
    center: { lat: 36.74, lng: 138.42 },
    pins: [
      { id: "shiga-kogen", name: "Shiga Kogen", lat: 36.7167, lng: 138.5083, accent: "#f97316" },
      { id: "ryuoo", name: "Ryuoo", lat: 36.7790, lng: 138.4500, accent: "#f97316" },
      { id: "kita-shiga", name: "Kita Shiga Kogen", lat: 36.7950, lng: 138.4150, accent: "#f97316" },
      { id: "yudanaka", name: "Yudanaka", lat: 36.7406, lng: 138.4222, accent: "#0ea5e9" },
      { id: "shibu-onsen", name: "Shibu Onsen", lat: 36.7367, lng: 138.4214, accent: "#0ea5e9" },
    ],
  },
  "nozawa-onsen": {
    center: { lat: 36.928, lng: 138.449 },
    pins: [
      { id: "nozawa-onsen", name: "Nozawa Onsen", lat: 36.9278, lng: 138.4486, accent: "#f97316" },
      { id: "nozawa-onsen-village", name: "Nozawa village", lat: 36.9219, lng: 138.4361, accent: "#0ea5e9" },
    ],
  },
  iiyama: {
    center: { lat: 36.873, lng: 138.366 },
    pins: [
      { id: "madarao", name: "Madarao", lat: 36.8483, lng: 138.2799, accent: "#f97316" },
      { id: "tangram", name: "Tangram", lat: 36.8504, lng: 138.2642, accent: "#f97316" },
      { id: "togari-onsen", name: "Togari Onsen", lat: 36.9400, lng: 138.3748, accent: "#f97316" },
      { id: "kijimadaira", name: "Kijimadaira", lat: 36.8186, lng: 138.4047, accent: "#f97316" },
      { id: "kijima-snow-park", name: "Kijima Snow Park", lat: 36.8135, lng: 138.3966, accent: "#f97316" },
      { id: "iiyama", name: "Iiyama City", lat: 36.852, lng: 138.366, accent: "#0ea5e9" },
    ],
  },
  "hakuba-valley": {
    center: { lat: 36.68, lng: 137.85 },
    pins: [
      { id: "happo-one", name: "Happo-One", lat: 36.6968, lng: 137.8380, accent: "#f97316" },
      { id: "hakuba-goryu", name: "Goryu", lat: 36.6645, lng: 137.8325, accent: "#f97316" },
      { id: "hakuba-47", name: "Hakuba 47", lat: 36.6780, lng: 137.8390, accent: "#f97316" },
      { id: "hakuba-iwatake", name: "Iwatake", lat: 36.7220, lng: 137.8400, accent: "#f97316" },
      { id: "tsugaike-kogen", name: "Tsugaike Kogen", lat: 36.7490, lng: 137.8662, accent: "#f97316" },
      { id: "hakuba-norikura", name: "Norikura", lat: 36.7580, lng: 137.8580, accent: "#f97316" },
      { id: "hakuba-cortina", name: "Cortina", lat: 36.7756, lng: 137.8875, accent: "#f97316" },
      { id: "hakuba-sanosaka", name: "Sanosaka", lat: 36.6200, lng: 137.8500, accent: "#f97316" },
      { id: "kashimayari", name: "Kashimayari", lat: 36.5930, lng: 137.8270, accent: "#f97316" },
      { id: "jiigatake", name: "Jiigatake", lat: 36.5604, lng: 137.8013, accent: "#f97316" },
      { id: "hakuba", name: "Hakuba", lat: 36.6982, lng: 137.8619, accent: "#0ea5e9" },
      { id: "otari", name: "Otari", lat: 36.7550, lng: 137.8640, accent: "#0ea5e9" },
      { id: "omachi", name: "Omachi", lat: 36.5030, lng: 137.8514, accent: "#0ea5e9" },
    ],
  },
  "myoko": {
    center: { lat: 36.90, lng: 138.17 },
    pins: [
      { id: "akakura-onsen", name: "Akakura Onsen", lat: 36.8964, lng: 138.1674, accent: "#f97316" },
      { id: "akakura-kanko", name: "Akakura Kanko", lat: 36.8903, lng: 138.1604, accent: "#f97316" },
      { id: "ikenotaira", name: "Ikenotaira", lat: 36.8733, lng: 138.1584, accent: "#f97316" },
      { id: "myoko-suginohara", name: "Suginohara", lat: 36.8633, lng: 138.1357, accent: "#f97316" },
      { id: "seki-onsen", name: "Seki Onsen", lat: 36.9050, lng: 138.1569, accent: "#f97316" },
      { id: "lotte-arai", name: "Lotte Arai", lat: 36.9909, lng: 138.1816, accent: "#f97316" },
      { id: "akakura", name: "Akakura", lat: 36.8876, lng: 138.1802, accent: "#0ea5e9" },
      { id: "ikenotaira-onsen", name: "Ikenotaira Onsen", lat: 36.8750, lng: 138.1660, accent: "#0ea5e9" },
      { id: "suginosawa", name: "Suginosawa", lat: 36.8495, lng: 138.1601, accent: "#0ea5e9" },
      { id: "arai", name: "Arai", lat: 37.0268, lng: 138.2555, accent: "#0ea5e9" },
    ],
  },
  "niseko": {
    center: { lat: 42.86, lng: 140.69 },
    pins: [
      { id: "grand-hirafu", name: "Grand Hirafu", lat: 42.8590, lng: 140.6900, accent: "#f97316" },
      { id: "hanazono", name: "Hanazono", lat: 42.8869, lng: 140.7028, accent: "#f97316" },
      { id: "niseko-village", name: "Niseko Village", lat: 42.8365, lng: 140.6851, accent: "#f97316" },
      { id: "annupuri", name: "Annupuri", lat: 42.8390, lng: 140.6570, accent: "#f97316" },
      { id: "moiwa", name: "Moiwa", lat: 42.8318, lng: 140.6479, accent: "#f97316" },
      { id: "hirafu", name: "Hirafu", lat: 42.8577, lng: 140.6982, accent: "#0ea5e9" },
      { id: "kutchan", name: "Kutchan", lat: 42.9010, lng: 140.7545, accent: "#0ea5e9" },
      { id: "niseko-town", name: "Niseko Town", lat: 42.8051, lng: 140.6880, accent: "#0ea5e9" },
    ],
  },
  "furano": {
    center: { lat: 43.34, lng: 142.38 },
    pins: [
      { id: "furano-ski-resort", name: "Furano Ski Resort", lat: 43.3326, lng: 142.3281, accent: "#f97316" },
      { id: "kamui-ski-links", name: "Kamui Ski Links", lat: 43.709, lng: 142.192, accent: "#f97316" },
      { id: "tomamu", name: "Tomamu", lat: 43.058, lng: 142.621, accent: "#f97316" },
      { id: "furano", name: "Furano", lat: 43.3420, lng: 142.3833, accent: "#0ea5e9" },
      { id: "kitanomine", name: "Kitanomine", lat: 43.3400, lng: 142.3655, accent: "#0ea5e9" },
    ],
  },
  "sapporo": {
    center: { lat: 43.03, lng: 141.25 },
    pins: [
      { id: "sapporo-teine", name: "Sapporo Teine", lat: 43.083, lng: 141.185, accent: "#f97316" },
      { id: "sapporo-kokusai", name: "Sapporo Kokusai", lat: 43.0730, lng: 141.0702, accent: "#f97316" },
      { id: "sapporo-bankei", name: "Sapporo Bankei", lat: 43.033, lng: 141.264, accent: "#f97316" },
      { id: "sapporo", name: "Sapporo", lat: 43.0621, lng: 141.3544, accent: "#0ea5e9" },
      { id: "jozankei", name: "Jozankei", lat: 42.971, lng: 141.180, accent: "#0ea5e9" },
    ],
  },
  "tomamu-sahoro": {
    center: { lat: 43.12, lng: 142.71 },
    pins: [
      // resort pin nudged slightly north (display only) so it doesn't
      // stack under furano's day-trip "tomamu" pin on the JP-wide map
      { id: "tomamu-resort", name: "Hoshino Resorts Tomamu", lat: 43.062, lng: 142.625, accent: "#f97316" },
      { id: "sahoro", name: "Sahoro Resort", lat: 43.187, lng: 142.804, accent: "#f97316" },
      { id: "tomamu-village", name: "Tomamu", lat: 43.0572, lng: 142.6126, accent: "#0ea5e9" },
      { id: "shimukappu", name: "Shimukappu", lat: 43.0, lng: 142.4167, accent: "#0ea5e9" },
    ],
  },
  "asahikawa": {
    center: { lat: 43.71, lng: 142.50 },
    pins: [
      // Kamui pin nudged slightly north (display only) so it doesn't
      // stack under furano's day-trip "kamui-ski-links" pin on the
      // JP-wide map
      { id: "kamui", name: "Kamui Ski Links", lat: 43.713, lng: 142.196, accent: "#f97316" },
      { id: "asahidake", name: "Asahidake", lat: 43.654, lng: 142.797, accent: "#f97316" },
      { id: "asahikawa", name: "Asahikawa", lat: 43.7706, lng: 142.3649, accent: "#0ea5e9" },
      { id: "higashikawa", name: "Higashikawa", lat: 43.699, lng: 142.510, accent: "#0ea5e9" },
    ],
  },
  "rusutsu-kiroro": {
    center: { lat: 42.91, lng: 140.94 },
    pins: [
      { id: "rusutsu-resort", name: "Rusutsu Resort", lat: 42.7497, lng: 140.9033, accent: "#f97316" },
      { id: "kiroro-resort", name: "Kiroro", lat: 43.0758, lng: 140.9822, accent: "#f97316" },
      { id: "rusutsu", name: "Rusutsu", lat: 42.7333, lng: 140.8833, accent: "#0ea5e9" },
      { id: "kiroro", name: "Kiroro base", lat: 43.0758, lng: 140.9822, accent: "#0ea5e9" },
    ],
  },
  "yuzawa": {
    center: { lat: 36.89, lng: 138.79 },
    pins: [
      { id: "gala-yuzawa", name: "GALA Yuzawa", lat: 36.9509, lng: 138.7995, accent: "#f97316" },
      { id: "yuzawa-kogen", name: "Yuzawa Kogen", lat: 36.9388, lng: 138.7974, accent: "#f97316" },
      { id: "ishiuchi-maruyama", name: "Ishiuchi Maruyama", lat: 36.9761, lng: 138.7947, accent: "#f97316" },
      { id: "iwappara", name: "Iwappara", lat: 36.9389, lng: 138.8444, accent: "#f97316" },
      { id: "kagura", name: "Kagura", lat: 36.8948, lng: 138.7756, accent: "#f97316" },
      { id: "naeba", name: "Naeba", lat: 36.7917, lng: 138.7846, accent: "#f97316" },
      { id: "echigo-yuzawa", name: "Echigo-Yuzawa", lat: 36.9354, lng: 138.8090, accent: "#0ea5e9" },
      { id: "ishiuchi", name: "Ishiuchi", lat: 36.9894, lng: 138.8043, accent: "#0ea5e9" },
      // canonical Mitsumata coords match the Kagura ropeway base · nudged
      // slightly here (display only) so the town pin doesn't stack under
      // the Kagura mountain pin
      { id: "mitsumata", name: "Mitsumata", lat: 36.8975, lng: 138.7790, accent: "#0ea5e9" },
    ],
  },
  "zao-onsen": {
    center: { lat: 38.164, lng: 140.40 },
    pins: [
      // resort pin uses the mid-mountain ski-area point (display only)
      // so it doesn't stack under the village pin at the ropeway base
      { id: "zao-onsen-resort", name: "Zao Onsen Ski Resort", lat: 38.1613, lng: 140.4077, accent: "#f97316" },
      { id: "zao-onsen", name: "Zao Onsen", lat: 38.1674, lng: 140.3937, accent: "#0ea5e9" },
    ],
  },
  "hakkoda-aomori-spring": {
    center: { lat: 40.69, lng: 140.56 },
    pins: [
      { id: "hakkoda", name: "Hakkoda", lat: 40.6784, lng: 140.8453, accent: "#f97316" },
      { id: "aomori-spring", name: "Aomori Spring", lat: 40.6952, lng: 140.2833, accent: "#f97316" },
      { id: "aomori", name: "Aomori", lat: 40.8289, lng: 140.7336, accent: "#0ea5e9" },
      { id: "sukayu-onsen", name: "Sukayu Onsen", lat: 40.6506, lng: 140.8505, accent: "#0ea5e9" },
      { id: "ajigasawa", name: "Ajigasawa", lat: 40.7755, lng: 140.2209, accent: "#0ea5e9" },
    ],
  },
  "appi-shizukuishi": {
    center: { lat: 39.85, lng: 140.98 },
    pins: [
      { id: "appi", name: "Appi Kogen", lat: 40.0028, lng: 140.9452, accent: "#f97316" },
      { id: "shizukuishi-resort", name: "Shizukuishi", lat: 39.7844, lng: 140.9203, accent: "#f97316" },
      { id: "shizukuishi", name: "Shizukuishi Town", lat: 39.6941, lng: 140.9844, accent: "#0ea5e9" },
      { id: "morioka", name: "Morioka", lat: 39.7019, lng: 141.1365, accent: "#0ea5e9" },
    ],
  },
  "bandai": {
    center: { lat: 37.64, lng: 140.08 },
    pins: [
      { id: "nekoma-mountain", name: "Nekoma Mountain", lat: 37.578, lng: 140.030, accent: "#f97316" },
      { id: "grandeco", name: "Grandeco", lat: 37.702, lng: 140.135, accent: "#f97316" },
      { id: "inawashiro", name: "Inawashiro", lat: 37.5566, lng: 140.1044, accent: "#0ea5e9" },
      { id: "urabandai", name: "Urabandai", lat: 37.660, lng: 140.065, accent: "#0ea5e9" },
    ],
  },
  "daisen": {
    center: { lat: 35.41, lng: 133.48 },
    pins: [
      { id: "daisen-white-resort", name: "Daisen White Resort", lat: 35.400, lng: 133.528, accent: "#f97316" },
      { id: "daisenji", name: "Daisenji", lat: 35.396, lng: 133.540, accent: "#0ea5e9" },
      { id: "yonago", name: "Yonago", lat: 35.4281, lng: 133.3311, accent: "#0ea5e9" },
    ],
  },
  "minakami": {
    center: { lat: 36.80, lng: 138.97 },
    pins: [
      { id: "tenjindaira", name: "Tanigawadake Tenjindaira", lat: 36.833, lng: 138.947, accent: "#f97316" },
      { id: "minakami-kogen", name: "Minakami Kogen", lat: 36.8572, lng: 139.0807, accent: "#f97316" },
      { id: "norn-minakami", name: "Norn Minakami", lat: 36.743, lng: 138.942, accent: "#f97316" },
      { id: "minakami", name: "Minakami", lat: 36.780, lng: 138.968, accent: "#0ea5e9" },
    ],
  },
  "kusatsu-manza": {
    center: { lat: 36.63, lng: 138.55 },
    pins: [
      { id: "kusatsu-onsen-resort", name: "Kusatsu Onsen Ski Resort", lat: 36.628, lng: 138.588, accent: "#f97316" },
      { id: "manza-onsen-resort", name: "Manza Onsen Ski Resort", lat: 36.644, lng: 138.507, accent: "#f97316" },
      { id: "kusatsu-onsen", name: "Kusatsu Onsen", lat: 36.621, lng: 138.596, accent: "#0ea5e9" },
      // village pin nudged slightly south of the resort point (display
      // only) so it doesn't stack under the mountain pin
      { id: "manza-onsen", name: "Manza Onsen", lat: 36.640, lng: 138.503, accent: "#0ea5e9" },
    ],
  },
  "hachimantai": {
    center: { lat: 39.93, lng: 141.05 },
    pins: [
      { id: "hachimantai-panorama", name: "Hachimantai Panorama", lat: 39.8840, lng: 140.9775, accent: "#f97316" },
      { id: "hachimantai-shimokura", name: "Hachimantai Shimokura", lat: 39.8954, lng: 140.9408, accent: "#f97316" },
      { id: "hachimantai", name: "Hachimantai", lat: 39.9136, lng: 141.1006, accent: "#0ea5e9" },
    ],
  },
  queenstown: {
    center: { lat: -44.99, lng: 168.74 },
    pins: [
      { id: "coronet-peak", name: "Coronet Peak", lat: -44.9206, lng: 168.7361, accent: "#f97316" },
      { id: "the-remarkables", name: "The Remarkables", lat: -45.0556, lng: 168.8194, accent: "#f97316" },
      { id: "queenstown", name: "Queenstown", lat: -45.0312, lng: 168.6626, accent: "#0ea5e9" },
    ],
  },
  wanaka: {
    center: { lat: -44.73, lng: 168.99 },
    pins: [
      { id: "cardrona", name: "Cardrona", lat: -44.8741, lng: 168.9492, accent: "#f97316" },
      { id: "treble-cone", name: "Treble Cone", lat: -44.6311, lng: 168.8978, accent: "#f97316" },
      { id: "wanaka", name: "Wanaka", lat: -44.7032, lng: 169.1321, accent: "#0ea5e9" },
    ],
  },
  "mt-hutt": {
    center: { lat: -43.55, lng: 171.59 },
    pins: [
      { id: "mt-hutt", name: "Mt Hutt", lat: -43.4707, lng: 171.5306, accent: "#f97316" },
      { id: "methven", name: "Methven", lat: -43.6333, lng: 171.6500, accent: "#0ea5e9" },
    ],
  },
  ruapehu: {
    center: { lat: -39.32, lng: 175.50 },
    pins: [
      { id: "whakapapa", name: "Whakapapa", lat: -39.2547, lng: 175.5619, accent: "#f97316" },
      { id: "turoa", name: "Turoa", lat: -39.3072, lng: 175.5286, accent: "#f97316" },
      { id: "ohakune", name: "Ohakune", lat: -39.4181, lng: 175.3956, accent: "#0ea5e9" },
    ],
  },
  whistler: {
    center: { lat: 50.09, lng: -122.92 },
    pins: [
      { id: "whistler-mountain", name: "Whistler Mountain", lat: 50.0594, lng: -122.9575, accent: "#f97316" },
      { id: "blackcomb-mountain", name: "Blackcomb Mountain", lat: 50.0900, lng: -122.8620, accent: "#f97316" },
      { id: "whistler", name: "Whistler", lat: 50.1163, lng: -122.9574, accent: "#0ea5e9" },
    ],
  },
  // The Powder Highway is a ~600 km loop, so the centre sits in the middle
  // of the Selkirks rather than on any one resort and the zoom is wide.
  "powder-highway": {
    center: { lat: 50.60, lng: -117.30 },
    pins: [
      { id: "revelstoke-mountain-resort", name: "Revelstoke Mountain Resort", lat: 50.9581, lng: -118.1633, accent: "#f97316" },
      { id: "kicking-horse", name: "Kicking Horse", lat: 51.2977, lng: -117.0464, accent: "#f97316" },
      { id: "fernie-alpine", name: "Fernie Alpine Resort", lat: 49.4628, lng: -115.0872, accent: "#f97316" },
      { id: "whitewater", name: "Whitewater", lat: 49.3830, lng: -117.1470, accent: "#f97316" },
      { id: "kimberley-alpine", name: "Kimberley Alpine Resort", lat: 49.6811, lng: -116.0053, accent: "#f97316" },
      { id: "panorama", name: "Panorama", lat: 50.4600, lng: -116.2400, accent: "#f97316" },
      { id: "revelstoke", name: "Revelstoke", lat: 50.9981, lng: -118.1957, accent: "#0ea5e9" },
      { id: "golden", name: "Golden", lat: 51.2960, lng: -116.9631, accent: "#0ea5e9" },
      { id: "fernie", name: "Fernie", lat: 49.5040, lng: -115.0631, accent: "#0ea5e9" },
      { id: "nelson", name: "Nelson", lat: 49.4928, lng: -117.2948, accent: "#0ea5e9" },
      { id: "kimberley", name: "Kimberley", lat: 49.6697, lng: -115.9781, accent: "#0ea5e9" },
      { id: "invermere", name: "Invermere", lat: 50.5064, lng: -116.0311, accent: "#0ea5e9" },
    ],
  },
  // The BC Interior resorts sit above gateway towns spread from Penticton
  // up to Sun Peaks (~200 km), so the centre sits mid-valley north of
  // Kelowna to frame the whole run.
  okanagan: {
    center: { lat: 50.10, lng: -119.60 },
    pins: [
      { id: "big-white", name: "Big White Ski Resort", lat: 49.7220, lng: -118.9330, accent: "#f97316" },
      { id: "silverstar", name: "SilverStar Mountain Resort", lat: 50.3611, lng: -119.0619, accent: "#f97316" },
      { id: "apex-resort", name: "Apex Mountain Resort", lat: 49.3925, lng: -119.9036, accent: "#f97316" },
      { id: "sun-peaks-resort", name: "Sun Peaks Resort", lat: 50.8833, lng: -119.8833, accent: "#f97316" },
      { id: "kelowna", name: "Kelowna", lat: 49.8880, lng: -119.4960, accent: "#0ea5e9" },
      { id: "vernon", name: "Vernon", lat: 50.2670, lng: -119.2720, accent: "#0ea5e9" },
      { id: "penticton", name: "Penticton", lat: 49.4991, lng: -119.5937, accent: "#0ea5e9" },
      { id: "kamloops", name: "Kamloops", lat: 50.6745, lng: -120.3273, accent: "#0ea5e9" },
      { id: "sun-peaks", name: "Sun Peaks", lat: 50.8836, lng: -119.8869, accent: "#0ea5e9" },
    ],
  },
  // Three North Shore hills clustered above Vancouver plus Mount Washington
  // out on Vancouver Island · the centre sits over Georgia Strait so both
  // the mainland cluster and the Island resort frame in one view.
  vancouver: {
    center: { lat: 49.55, lng: -123.60 },
    pins: [
      { id: "cypress-mountain", name: "Cypress Mountain", lat: 49.3958, lng: -123.2039, accent: "#f97316" },
      { id: "grouse-mountain", name: "Grouse Mountain", lat: 49.3803, lng: -123.0827, accent: "#f97316" },
      { id: "mount-seymour", name: "Mt Seymour", lat: 49.3689, lng: -122.9503, accent: "#f97316" },
      { id: "mount-washington", name: "Mount Washington Alpine Resort", lat: 49.7442, lng: -125.2947, accent: "#f97316" },
      // city pin nudged slightly south (display only) so downtown Vancouver
      // doesn't stack under the Grouse Mountain pin directly above it
      { id: "vancouver-city", name: "Vancouver", lat: 49.2500, lng: -123.1207, accent: "#0ea5e9" },
      { id: "courtenay", name: "Courtenay", lat: 49.6877, lng: -124.9946, accent: "#0ea5e9" },
    ],
  },
  "banff-lake-louise": {
    center: { lat: 51.25, lng: -115.85 },
    pins: [
      { id: "banff-sunshine", name: "Banff Sunshine Village", lat: 51.0781, lng: -115.7772, accent: "#f97316" },
      { id: "mt-norquay", name: "Mt. Norquay", lat: 51.1990, lng: -115.5980, accent: "#f97316" },
      { id: "lake-louise-resort", name: "Lake Louise Ski Resort", lat: 51.4419, lng: -116.1622, accent: "#f97316" },
      { id: "banff", name: "Banff", lat: 51.1784, lng: -115.5708, accent: "#0ea5e9" },
      { id: "lake-louise", name: "Lake Louise", lat: 51.4254, lng: -116.1773, accent: "#0ea5e9" },
    ],
  },
  canmore: {
    center: { lat: 51.02, lng: -115.25 },
    pins: [
      { id: "nakiska", name: "Nakiska", lat: 50.9422, lng: -115.1519, accent: "#f97316" },
      { id: "canmore", name: "Canmore", lat: 51.0884, lng: -115.3479, accent: "#0ea5e9" },
    ],
  },
  jasper: {
    center: { lat: 52.84, lng: -118.08 },
    pins: [
      { id: "marmot-basin", name: "Marmot Basin", lat: 52.8000, lng: -118.0833, accent: "#f97316" },
      { id: "jasper", name: "Jasper", lat: 52.8737, lng: -118.0814, accent: "#0ea5e9" },
    ],
  },
  "quebec-laurentians": {
    center: { lat: 46.22, lng: -74.57 },
    pins: [
      { id: "tremblant", name: "Tremblant", lat: 46.2100, lng: -74.5850, accent: "#f97316" },
      { id: "mont-tremblant", name: "Mont-Tremblant", lat: 46.2127, lng: -74.5844, accent: "#0ea5e9" },
    ],
  },
  "quebec-charlevoix": {
    center: { lat: 47.18, lng: -70.78 },
    pins: [
      { id: "mont-sainte-anne", name: "Mont-Sainte-Anne", lat: 47.0876, lng: -70.9324, accent: "#f97316" },
      { id: "le-massif", name: "Le Massif de Charlevoix", lat: 47.2757, lng: -70.6257, accent: "#f97316" },
      { id: "beaupre", name: "Beaupré", lat: 47.0443, lng: -70.8953, accent: "#0ea5e9" },
      { id: "petite-riviere-saint-francois", name: "Petite-Rivière-Saint-François", lat: 47.3100, lng: -70.5660, accent: "#0ea5e9" },
    ],
  },
  "quebec-eastern-townships": {
    center: { lat: 45.20, lng: -72.60 },
    pins: [
      { id: "bromont-resort", name: "Ski Bromont", lat: 45.2892, lng: -72.6378, accent: "#f97316" },
      { id: "mont-sutton", name: "Mont Sutton", lat: 45.0850, lng: -72.5500, accent: "#f97316" },
      { id: "bromont", name: "Bromont", lat: 45.3168, lng: -72.6491, accent: "#0ea5e9" },
      { id: "sutton", name: "Sutton", lat: 45.1001, lng: -72.6158, accent: "#0ea5e9" },
    ],
  },
  "summit-county": {
    center: { lat: 39.62, lng: -105.95 },
    pins: [
      { id: "breckenridge-resort", name: "Breckenridge", lat: 39.4817, lng: -106.0384, accent: "#f97316" },
      { id: "keystone-resort", name: "Keystone", lat: 39.6084, lng: -105.9439, accent: "#f97316" },
      { id: "copper-mountain-resort", name: "Copper Mountain", lat: 39.5022, lng: -106.1512, accent: "#f97316" },
      { id: "arapahoe-basin", name: "Arapahoe Basin", lat: 39.6425, lng: -105.8719, accent: "#f97316" },
      { id: "loveland", name: "Loveland", lat: 39.6803, lng: -105.8974, accent: "#f97316" },
      { id: "breckenridge", name: "Breckenridge", lat: 39.4817, lng: -106.0384, accent: "#0ea5e9" },
      { id: "keystone", name: "Keystone / Dillon", lat: 39.5769, lng: -105.9469, accent: "#0ea5e9" },
      { id: "copper-mountain", name: "Copper Mountain", lat: 39.5022, lng: -106.1512, accent: "#0ea5e9" },
      { id: "georgetown", name: "Georgetown", lat: 39.7047, lng: -105.6997, accent: "#0ea5e9" },
    ],
  },
  "vail-valley": {
    center: { lat: 39.62, lng: -106.45 },
    pins: [
      { id: "vail-mountain", name: "Vail Mountain", lat: 39.6061, lng: -106.3550, accent: "#f97316" },
      { id: "beaver-creek", name: "Beaver Creek", lat: 39.6042, lng: -106.5165, accent: "#f97316" },
      { id: "vail", name: "Vail", lat: 39.6403, lng: -106.3742, accent: "#0ea5e9" },
      { id: "avon", name: "Avon", lat: 39.6317, lng: -106.5219, accent: "#0ea5e9" },
    ],
  },
  "aspen-snowmass": {
    center: { lat: 39.20, lng: -106.88 },
    pins: [
      { id: "snowmass", name: "Snowmass", lat: 39.2110, lng: -106.9500, accent: "#f97316" },
      { id: "aspen-mountain", name: "Aspen Mountain", lat: 39.1836, lng: -106.8231, accent: "#f97316" },
      { id: "aspen-highlands", name: "Aspen Highlands", lat: 39.1811, lng: -106.8697, accent: "#f97316" },
      { id: "buttermilk", name: "Buttermilk", lat: 39.1997, lng: -106.8683, accent: "#f97316" },
      { id: "aspen", name: "Aspen", lat: 39.1911, lng: -106.8175, accent: "#0ea5e9" },
      { id: "snowmass-village", name: "Snowmass Village", lat: 39.2103, lng: -106.9378, accent: "#0ea5e9" },
    ],
  },
  steamboat: {
    center: { lat: 40.46, lng: -106.80 },
    pins: [
      { id: "steamboat-resort", name: "Steamboat Resort", lat: 40.4572, lng: -106.8045, accent: "#f97316" },
      { id: "steamboat-springs", name: "Steamboat Springs", lat: 40.4850, lng: -106.8317, accent: "#0ea5e9" },
    ],
  },
  "winter-park": {
    center: { lat: 39.89, lng: -105.76 },
    pins: [
      { id: "winter-park-resort", name: "Winter Park Resort", lat: 39.8868, lng: -105.7625, accent: "#f97316" },
      { id: "winter-park", name: "Winter Park", lat: 39.8867, lng: -105.7631, accent: "#0ea5e9" },
    ],
  },
  "crested-butte": {
    center: { lat: 38.90, lng: -106.97 },
    pins: [
      { id: "crested-butte-mountain-resort", name: "Crested Butte Mountain Resort", lat: 38.8992, lng: -106.9650, accent: "#f97316" },
      { id: "crested-butte-town", name: "Crested Butte", lat: 38.8697, lng: -106.9878, accent: "#0ea5e9" },
    ],
  },
  telluride: {
    center: { lat: 37.94, lng: -107.81 },
    pins: [
      { id: "telluride-ski-resort", name: "Telluride Ski Resort", lat: 37.9375, lng: -107.8123, accent: "#f97316" },
      { id: "telluride-town", name: "Telluride", lat: 37.9375, lng: -107.8123, accent: "#0ea5e9" },
    ],
  },
  durango: {
    center: { lat: 37.63, lng: -107.81 },
    pins: [
      { id: "purgatory-resort", name: "Purgatory Resort", lat: 37.6297, lng: -107.8144, accent: "#f97316" },
      { id: "durango-town", name: "Durango", lat: 37.2753, lng: -107.8801, accent: "#0ea5e9" },
    ],
  },
  "boulder-front-range": {
    center: { lat: 39.94, lng: -105.58 },
    pins: [
      { id: "eldora-mountain-resort", name: "Eldora Mountain Resort", lat: 39.9375, lng: -105.5828, accent: "#f97316" },
      { id: "nederland", name: "Nederland", lat: 39.9614, lng: -105.5108, accent: "#0ea5e9" },
    ],
  },
  "cottonwood-canyons": {
    center: { lat: 40.61, lng: -111.64 },
    pins: [
      { id: "alta", name: "Alta", lat: 40.5883, lng: -111.6383, accent: "#f97316" },
      { id: "snowbird", name: "Snowbird", lat: 40.5830, lng: -111.6556, accent: "#f97316" },
      { id: "brighton-resort", name: "Brighton", lat: 40.5977, lng: -111.5836, accent: "#f97316" },
      { id: "solitude-mountain-resort", name: "Solitude", lat: 40.6199, lng: -111.5928, accent: "#f97316" },
      { id: "salt-lake-city", name: "Salt Lake City", lat: 40.7608, lng: -111.8910, accent: "#0ea5e9" },
      { id: "sandy", name: "Sandy", lat: 40.5649, lng: -111.8389, accent: "#0ea5e9" },
    ],
  },
  "park-city": {
    center: { lat: 40.65, lng: -111.50 },
    pins: [
      { id: "park-city-mountain", name: "Park City Mountain", lat: 40.6514, lng: -111.5080, accent: "#f97316" },
      { id: "deer-valley-resort", name: "Deer Valley", lat: 40.6374, lng: -111.4783, accent: "#f97316" },
      { id: "park-city-town", name: "Park City", lat: 40.6461, lng: -111.4980, accent: "#0ea5e9" },
    ],
  },
  "ogden-valley": {
    center: { lat: 41.27, lng: -111.87 },
    pins: [
      { id: "snowbasin", name: "Snowbasin", lat: 41.2160, lng: -111.8567, accent: "#f97316" },
      { id: "powder-mountain", name: "Powder Mountain", lat: 41.3797, lng: -111.7811, accent: "#f97316" },
      { id: "nordic-valley", name: "Nordic Valley", lat: 41.3311, lng: -111.8497, accent: "#f97316" },
      { id: "ogden", name: "Ogden", lat: 41.2230, lng: -111.9738, accent: "#0ea5e9" },
      { id: "eden", name: "Eden", lat: 41.3211, lng: -111.8636, accent: "#0ea5e9" },
    ],
  },
  provo: {
    center: { lat: 40.40, lng: -111.58 },
    pins: [
      { id: "sundance-mountain-resort", name: "Sundance Mountain Resort", lat: 40.3970, lng: -111.5847, accent: "#f97316" },
      { id: "provo-town", name: "Provo", lat: 40.2338, lng: -111.6585, accent: "#0ea5e9" },
      { id: "sundance-town", name: "Sundance", lat: 40.3970, lng: -111.5847, accent: "#0ea5e9" },
    ],
  },
  "cache-valley": {
    center: { lat: 41.74, lng: -111.83 },
    pins: [
      { id: "beaver-mountain", name: "Beaver Mountain", lat: 41.9742, lng: -111.4547, accent: "#f97316" },
      { id: "cherry-peak", name: "Cherry Peak", lat: 41.9897, lng: -111.9250, accent: "#f97316" },
      { id: "logan", name: "Logan", lat: 41.7370, lng: -111.8338, accent: "#0ea5e9" },
    ],
  },
  "north-lake-tahoe": {
    center: { lat: 39.33, lng: -120.18 },
    pins: [
      { id: "palisades-tahoe", name: "Palisades Tahoe", lat: 39.1966, lng: -120.2347, accent: "#f97316" },
      { id: "northstar-california", name: "Northstar California", lat: 39.2640, lng: -120.1250, accent: "#f97316" },
      { id: "sugar-bowl", name: "Sugar Bowl", lat: 39.3044, lng: -120.3358, accent: "#f97316" },
      { id: "truckee", name: "Truckee", lat: 39.3280, lng: -120.1833, accent: "#0ea5e9" },
    ],
  },
  "south-lake-tahoe": {
    center: { lat: 38.94, lng: -119.98 },
    pins: [
      { id: "heavenly", name: "Heavenly", lat: 38.9353, lng: -119.9400, accent: "#f97316" },
      { id: "kirkwood", name: "Kirkwood", lat: 38.6840, lng: -120.0664, accent: "#f97316" },
      { id: "sierra-at-tahoe", name: "Sierra-at-Tahoe", lat: 38.8002, lng: -120.0806, accent: "#f97316" },
      { id: "homewood-mountain-resort", name: "Homewood", lat: 39.0827, lng: -120.1755, accent: "#f97316" },
      { id: "south-lake-tahoe-town", name: "South Lake Tahoe", lat: 38.9399, lng: -119.9772, accent: "#0ea5e9" },
    ],
  },
  "mammoth-lakes": {
    center: { lat: 37.65, lng: -118.97 },
    pins: [
      { id: "mammoth-mountain", name: "Mammoth Mountain", lat: 37.6306, lng: -119.0326, accent: "#f97316" },
      { id: "june-mountain", name: "June Mountain", lat: 37.7683, lng: -119.0906, accent: "#f97316" },
      { id: "mammoth-lakes-town", name: "Mammoth Lakes", lat: 37.6485, lng: -118.9721, accent: "#0ea5e9" },
    ],
  },
  "big-bear": {
    center: { lat: 34.24, lng: -116.91 },
    pins: [
      { id: "bear-mountain", name: "Bear Mountain", lat: 34.2267, lng: -116.8602, accent: "#f97316" },
      { id: "snow-summit", name: "Snow Summit", lat: 34.2286, lng: -116.8911, accent: "#f97316" },
      { id: "big-bear-lake", name: "Big Bear Lake", lat: 34.2439, lng: -116.9114, accent: "#0ea5e9" },
    ],
  },
  "bear-valley": {
    center: { lat: 38.25, lng: -120.36 },
    pins: [
      { id: "bear-valley-mountain-resort", name: "Bear Valley Mountain Resort", lat: 38.4706, lng: -120.0471, accent: "#f97316" },
      { id: "arnold", name: "Arnold", lat: 38.2494, lng: -120.3552, accent: "#0ea5e9" },
    ],
  },
  "mt-shasta": {
    center: { lat: 41.31, lng: -122.31 },
    pins: [
      { id: "mt-shasta-ski-park", name: "Mt. Shasta Ski Park", lat: 41.3208, lng: -122.2036, accent: "#f97316" },
      { id: "mount-shasta", name: "Mount Shasta", lat: 41.3099, lng: -122.3106, accent: "#0ea5e9" },
    ],
  },
  "killington-pico": {
    center: { lat: 43.60, lng: -72.82 },
    pins: [
      { id: "killington-resort", name: "Killington", lat: 43.6045, lng: -72.8201, accent: "#f97316" },
      { id: "pico-mountain", name: "Pico Mountain", lat: 43.6659, lng: -72.8323, accent: "#f97316" },
      { id: "killington", name: "Killington", lat: 43.6042, lng: -72.8092, accent: "#0ea5e9" },
    ],
  },
  "stowe-smugglers-notch": {
    center: { lat: 44.56, lng: -72.75 },
    pins: [
      { id: "stowe-mountain-resort", name: "Stowe Mountain Resort", lat: 44.5303, lng: -72.7883, accent: "#f97316" },
      { id: "smugglers-notch", name: "Smugglers' Notch", lat: 44.5991, lng: -72.7864, accent: "#f97316" },
      { id: "stowe", name: "Stowe", lat: 44.4654, lng: -72.6874, accent: "#0ea5e9" },
      { id: "jeffersonville", name: "Jeffersonville", lat: 44.6511, lng: -72.8298, accent: "#0ea5e9" },
    ],
  },
  "mad-river-valley": {
    center: { lat: 44.17, lng: -72.92 },
    pins: [
      { id: "sugarbush", name: "Sugarbush", lat: 44.1358, lng: -72.9204, accent: "#f97316" },
      { id: "mad-river-glen", name: "Mad River Glen", lat: 44.2001, lng: -72.9192, accent: "#f97316" },
      { id: "warren", name: "Warren", lat: 44.1195, lng: -72.8626, accent: "#0ea5e9" },
      { id: "waitsfield", name: "Waitsfield", lat: 44.1975, lng: -72.8090, accent: "#0ea5e9" },
    ],
  },
  "southern-vermont": {
    center: { lat: 43.15, lng: -72.90 },
    pins: [
      { id: "stratton-mountain-resort", name: "Stratton", lat: 43.1131, lng: -72.9081, accent: "#f97316" },
      { id: "mount-snow", name: "Mount Snow", lat: 42.9601, lng: -72.9201, accent: "#f97316" },
      { id: "bromley-mountain", name: "Bromley Mountain", lat: 43.2226, lng: -72.9376, accent: "#f97316" },
      { id: "magic-mountain", name: "Magic Mountain", lat: 43.1706, lng: -72.7534, accent: "#f97316" },
      { id: "stratton", name: "Stratton", lat: 43.1334, lng: -72.9298, accent: "#0ea5e9" },
      { id: "west-dover", name: "West Dover", lat: 42.9709, lng: -72.8265, accent: "#0ea5e9" },
      { id: "peru-vt", name: "Peru", lat: 43.2333, lng: -72.8990, accent: "#0ea5e9" },
      { id: "manchester-vt", name: "Manchester", lat: 43.1642, lng: -73.0729, accent: "#0ea5e9" },
    ],
  },
  "okemo": {
    center: { lat: 43.40, lng: -72.72 },
    pins: [
      { id: "okemo-mountain-resort", name: "Okemo Mountain Resort", lat: 43.4009, lng: -72.7168, accent: "#f97316" },
      { id: "ludlow", name: "Ludlow", lat: 43.3959, lng: -72.7096, accent: "#0ea5e9" },
    ],
  },
  "jay-peak-nek": {
    center: { lat: 44.76, lng: -72.22 },
    pins: [
      { id: "jay-peak", name: "Jay Peak", lat: 44.9241, lng: -72.5215, accent: "#f97316" },
      { id: "burke-mountain", name: "Burke Mountain", lat: 44.5876, lng: -71.9106, accent: "#f97316" },
      { id: "jay", name: "Jay", lat: 44.9417, lng: -72.5083, accent: "#0ea5e9" },
      { id: "east-burke", name: "East Burke", lat: 44.6112, lng: -71.9227, accent: "#0ea5e9" },
    ],
  },
  "jackson-hole": {
    center: { lat: 43.62, lng: -110.85 },
    pins: [
      { id: "jackson-hole-mtn-resort", name: "Jackson Hole Mountain Resort", lat: 43.5875, lng: -110.8279, accent: "#f97316" },
      { id: "snow-king-mountain", name: "Snow King Mountain", lat: 43.4783, lng: -110.7581, accent: "#f97316" },
      { id: "jackson", name: "Jackson", lat: 43.4799, lng: -110.7624, accent: "#0ea5e9" },
      { id: "teton-village", name: "Teton Village", lat: 43.5881, lng: -110.8273, accent: "#0ea5e9" },
    ],
  },
  "grand-targhee": {
    center: { lat: 43.79, lng: -110.95 },
    pins: [
      { id: "grand-targhee-resort", name: "Grand Targhee Resort", lat: 43.7904, lng: -110.9576, accent: "#f97316" },
      { id: "alta-wy", name: "Alta", lat: 43.7897, lng: -110.9310, accent: "#0ea5e9" },
    ],
  },
  "big-sky": {
    center: { lat: 45.29, lng: -111.39 },
    pins: [
      { id: "big-sky-resort", name: "Big Sky Resort", lat: 45.2871, lng: -111.4010, accent: "#f97316" },
      { id: "big-sky-town", name: "Big Sky", lat: 45.2849, lng: -111.3806, accent: "#0ea5e9" },
    ],
  },
  "bozeman-bridger-bowl": {
    center: { lat: 45.75, lng: -110.97 },
    pins: [
      { id: "bridger-bowl", name: "Bridger Bowl", lat: 45.8266, lng: -110.8988, accent: "#f97316" },
      { id: "bozeman", name: "Bozeman", lat: 45.6770, lng: -111.0429, accent: "#0ea5e9" },
    ],
  },
  "whitefish": {
    center: { lat: 48.45, lng: -114.35 },
    pins: [
      { id: "whitefish-mountain-resort", name: "Whitefish Mountain Resort", lat: 48.4890, lng: -114.3670, accent: "#f97316" },
      { id: "whitefish-town", name: "Whitefish", lat: 48.4111, lng: -114.3376, accent: "#0ea5e9" },
    ],
  },
  "red-lodge": {
    center: { lat: 45.18, lng: -109.33 },
    pins: [
      { id: "red-lodge-mountain", name: "Red Lodge Mountain", lat: 45.1699, lng: -109.4137, accent: "#f97316" },
      { id: "red-lodge-town", name: "Red Lodge", lat: 45.1863, lng: -109.2468, accent: "#0ea5e9" },
    ],
  },
  "taos": {
    center: { lat: 36.595, lng: -105.449 },
    pins: [
      { id: "taos-ski-valley", name: "Taos Ski Valley", lat: 36.5960, lng: -105.4478, accent: "#f97316" },
      { id: "taos-ski-valley-town", name: "Taos Ski Valley", lat: 36.5946, lng: -105.4497, accent: "#0ea5e9" },
    ],
  },
  "angel-fire": {
    center: { lat: 36.385, lng: -105.287 },
    pins: [
      { id: "angel-fire-resort", name: "Angel Fire Resort", lat: 36.3929, lng: -105.2853, accent: "#f97316" },
      { id: "angel-fire", name: "Angel Fire", lat: 36.3762, lng: -105.2894, accent: "#0ea5e9" },
    ],
  },
  "santa-fe": {
    center: { lat: 35.744, lng: -105.869 },
    pins: [
      { id: "ski-santa-fe", name: "Ski Santa Fe", lat: 35.8000, lng: -105.8000, accent: "#f97316" },
      { id: "santa-fe", name: "Santa Fe", lat: 35.6870, lng: -105.9378, accent: "#0ea5e9" },
    ],
  },
  "albuquerque-sandia": {
    center: { lat: 35.145, lng: -106.549 },
    pins: [
      { id: "sandia-peak", name: "Sandia Peak Ski Area", lat: 35.2062, lng: -106.4475, accent: "#f97316" },
      { id: "albuquerque", name: "Albuquerque", lat: 35.0844, lng: -106.6504, accent: "#0ea5e9" },
    ],
  },
  "harbor-springs": { center: { lat: 45.39, lng: -84.95 }, pins: [{ id: "boyne-mountain", name: "Boyne Mountain", lat: 45.1639, lng: -84.9308, accent: "#f97316" }, { id: "boyne-highlands", name: "The Highlands", lat: 45.4717, lng: -84.9233, accent: "#f97316" }, { id: "nubs-nob", name: "Nub's Nob", lat: 45.4623, lng: -84.9420, accent: "#f97316" }, { id: "harbor-springs-town", name: "Harbor Springs", lat: 45.4317, lng: -84.9889, accent: "#0ea5e9" }] },
  "keweenaw-peninsula": { center: { lat: 47.38, lng: -88.24 }, pins: [{ id: "mt-bohemia", name: "Mt. Bohemia", lat: 47.4080, lng: -88.1010, accent: "#f97316" }, { id: "mohawk", name: "Mohawk", lat: 47.3308, lng: -88.3743, accent: "#0ea5e9" }] },
  "poconos": {center:{lat:41.04,lng:-75.30},pins:[{id:"camelback-mountain",name:"Camelback",lat:41.052,lng:-75.352,accent:"#f97316"},{id:"blue-mountain-pa",name:"Blue Mountain PA",lat:40.810,lng:-75.521,accent:"#f97316"},{id:"shawnee-mountain",name:"Shawnee",lat:41.003,lng:-75.116,accent:"#f97316"},{id:"tannersville",name:"Tannersville",lat:41.040,lng:-75.305,accent:"#0ea5e9"},{id:"pocono-manor",name:"Pocono Manor",lat:41.101,lng:-75.347,accent:"#0ea5e9"}]},
  "laurel-highlands": {center:{lat:40.20,lng:-79.05},pins:[{id:"seven-springs-mountain",name:"Seven Springs",lat:40.022,lng:-79.297,accent:"#f97316"},{id:"blue-knob",name:"Blue Knob",lat:40.685,lng:-78.535,accent:"#f97316"},{id:"seven-springs-town",name:"Seven Springs",lat:40.041,lng:-79.467,accent:"#0ea5e9"}]},
  "berkshires":{center:{lat:42.45,lng:-73.15},pins:[{id:"jiminy-peak",name:"Jiminy Peak",lat:42.554,lng:-73.292,accent:"#f97316"},{id:"ski-butternut",name:"Ski Butternut",lat:42.196,lng:-73.319,accent:"#f97316"},{id:"berkshire-east",name:"Berkshire East",lat:42.684,lng:-72.875,accent:"#f97316"},{id:"hancock",name:"Hancock",lat:42.547,lng:-73.323,accent:"#0ea5e9"},{id:"great-barrington",name:"Great Barrington",lat:42.196,lng:-73.363,accent:"#0ea5e9"}]},
  "central-massachusetts":{center:{lat:42.48,lng:-71.88},pins:[{id:"wachusett-mountain",name:"Wachusett Mountain",lat:42.488,lng:-71.887,accent:"#f97316"},{id:"princeton-ma",name:"Princeton",lat:42.473,lng:-71.877,accent:"#0ea5e9"}]},
  "lutsen-north-shore":{center:{lat:47.65,lng:-90.70},pins:[{id:"lutsen-mountains",name:"Lutsen Mountains",lat:47.663,lng:-90.714,accent:"#f97316"},{id:"lutsen",name:"Lutsen",lat:47.643,lng:-90.714,accent:"#0ea5e9"}]},
  "wausau":{center:{lat:44.94,lng:-89.66},pins:[{id:"granite-peak",name:"Granite Peak",lat:44.931,lng:-89.688,accent:"#f97316"},{id:"wausau-town",name:"Wausau",lat:44.959,lng:-89.630,accent:"#0ea5e9"}]},
  "wisconsin-dells":{center:{lat:43.54,lng:-89.43},pins:[{id:"cascade-mountain",name:"Cascade Mountain",lat:43.531,lng:-89.395,accent:"#f97316"},{id:"portage",name:"Portage",lat:43.539,lng:-89.462,accent:"#0ea5e9"}]},
  "snowshoe":{center:{lat:38.41,lng:-79.995},pins:[{id:"snowshoe-mountain",name:"Snowshoe Mountain",lat:38.41,lng:-79.995,accent:"#f97316"},{id:"snowshoe-town",name:"Snowshoe",lat:38.41,lng:-79.995,accent:"#0ea5e9"}]},
  "canaan-valley":{center:{lat:39.041,lng:-79.438},pins:[{id:"canaan-valley-resort",name:"Canaan Valley Resort",lat:39.045,lng:-79.46,accent:"#f97316"},{id:"timberline-mountain",name:"Timberline Mountain",lat:39.041,lng:-79.438,accent:"#f97316"},{id:"canaan-valley-town",name:"Davis / Canaan Valley",lat:39.105,lng:-79.468,accent:"#0ea5e9"}]},
  "high-country":{center:{lat:36.183,lng:-81.874},pins:[{id:"sugar-mountain",name:"Sugar Mountain",lat:36.13,lng:-81.871,accent:"#f97316"},{id:"beech-mountain",name:"Beech Mountain Resort",lat:36.183,lng:-81.874,accent:"#f97316"},{id:"banner-elk-beech-mountain",name:"Banner Elk / Beech Mountain",lat:36.166,lng:-81.872,accent:"#0ea5e9"}]},
  "maggie-valley":{center:{lat:35.562,lng:-83.094},pins:[{id:"cataloochee-ski-area",name:"Cataloochee Ski Area",lat:35.562,lng:-83.094,accent:"#f97316"},{id:"maggie-valley-town",name:"Maggie Valley",lat:35.519,lng:-83.084,accent:"#0ea5e9"}]},
  "blue-ridge":{center:{lat:37.913,lng:-78.945},pins:[{id:"wintergreen-resort",name:"Wintergreen Resort",lat:37.913,lng:-78.945,accent:"#f97316"},{id:"wintergreen-town",name:"Wintergreen",lat:37.913,lng:-78.945,accent:"#0ea5e9"}]},
  "shenandoah-valley":{center:{lat:38.407,lng:-78.738},pins:[{id:"massanutten-resort",name:"Massanutten Resort",lat:38.407,lng:-78.738,accent:"#f97316"},{id:"mcgaheysville",name:"McGaheysville",lat:38.372,lng:-78.73,accent:"#0ea5e9"}]},
  "lake-tahoe-nevada":{center:{lat:39.254,lng:-119.93},pins:[{id:"mt-rose-ski-tahoe",name:"Mt. Rose Ski Tahoe",lat:39.315,lng:-119.886,accent:"#f97316"},{id:"diamond-peak",name:"Diamond Peak",lat:39.254,lng:-119.93,accent:"#f97316"},{id:"incline-village",name:"Incline Village",lat:39.251,lng:-119.952,accent:"#0ea5e9"}]},
  "flagstaff":{center:{lat:35.33,lng:-111.709},pins:[{id:"arizona-snowbowl",name:"Arizona Snowbowl",lat:35.33,lng:-111.709,accent:"#f97316"},{id:"flagstaff-town",name:"Flagstaff",lat:35.198,lng:-111.651,accent:"#0ea5e9"}]},
  "white-mountains-az":{center:{lat:33.973,lng:-109.563},pins:[{id:"sunrise-park-resort",name:"Sunrise Park Resort",lat:33.973,lng:-109.563,accent:"#f97316"},{id:"greer-az",name:"Greer",lat:34.01,lng:-109.458,accent:"#0ea5e9"}]},
  "black-hills":{center:{lat:44.339,lng:-103.85},pins:[{id:"terry-peak",name:"Terry Peak",lat:44.339,lng:-103.85,accent:"#f97316"},{id:"lead-deadwood",name:"Lead / Deadwood",lat:44.352,lng:-103.765,accent:"#0ea5e9"}]},
  "girdwood":{center:{lat:60.97,lng:-149.09},pins:[{id:"alyeska-resort",name:"Alyeska Resort",lat:60.97,lng:-149.09,accent:"#f97316"},{id:"girdwood-town",name:"Girdwood",lat:60.942,lng:-149.166,accent:"#0ea5e9"}]},
  "juneau":{center:{lat:58.276,lng:-134.528},pins:[{id:"eaglecrest-ski-area",name:"Eaglecrest Ski Area",lat:58.276,lng:-134.528,accent:"#f97316"},{id:"juneau-town",name:"Juneau",lat:58.302,lng:-134.42,accent:"#0ea5e9"}]},
  "litchfield-hills":{center:{lat:41.835,lng:-73.286},pins:[{id:"mohawk-mountain",name:"Mohawk Mountain",lat:41.835,lng:-73.286,accent:"#f97316"},{id:"cornwall-ct",name:"Cornwall",lat:41.833,lng:-73.328,accent:"#0ea5e9"}]},
  "vernon":{center:{lat:41.19,lng:-74.503},pins:[{id:"mountain-creek-resort",name:"Mountain Creek Resort",lat:41.19,lng:-74.503,accent:"#f97316"},{id:"vernon-nj",name:"Vernon",lat:41.2,lng:-74.484,accent:"#0ea5e9"}]},
  "mt-hood": {
    center: { lat: 45.320, lng: -121.720 },
    pins: [
      { id: "mt-hood-meadows", name: "Mt. Hood Meadows", lat: 45.32889, lng: -121.66250, accent: "#f97316" },
      { id: "timberline-lodge", name: "Timberline Lodge", lat: 45.33111, lng: -121.71000, accent: "#f97316" },
      { id: "mt-hood-skibowl", name: "Mt. Hood Skibowl", lat: 45.30189, lng: -121.77321, accent: "#f97316" },
      { id: "government-camp", name: "Government Camp", lat: 45.30222, lng: -121.75250, accent: "#0ea5e9" },
    ],
  },
  "bend": {
    center: { lat: 44.019, lng: -121.503 },
    pins: [
      { id: "mt-bachelor", name: "Mt. Bachelor", lat: 43.9794, lng: -121.6885, accent: "#f97316" },
      { id: "bend", name: "Bend", lat: 44.05806, lng: -121.31528, accent: "#0ea5e9" },
    ],
  },
  "crystal-mountain": {
    center: { lat: 47.064, lng: -121.735 },
    pins: [
      { id: "crystal-mountain", name: "Crystal Mountain Resort", lat: 46.9280, lng: -121.4749, accent: "#f97316" },
      { id: "enumclaw", name: "Enumclaw", lat: 47.20111, lng: -121.99694, accent: "#0ea5e9" },
    ],
  },
  "snoqualmie-pass": {
    center: { lat: 47.408, lng: -121.413 },
    pins: [
      { id: "snoqualmie-pass", name: "The Summit at Snoqualmie", lat: 47.42400, lng: -121.41600, accent: "#f97316" },
      { id: "snoqualmie-pass-town", name: "Snoqualmie Pass", lat: 47.39222, lng: -121.40000, accent: "#0ea5e9" },
    ],
  },
  "stevens-pass": {
    center: { lat: 47.727, lng: -121.222 },
    pins: [
      { id: "stevens-pass", name: "Stevens Pass Ski Area", lat: 47.74472, lng: -121.08889, accent: "#f97316" },
      { id: "skykomish", name: "Skykomish", lat: 47.71028, lng: -121.35833, accent: "#0ea5e9" },
    ],
  },
  "mt-baker": {
    center: { lat: 48.875, lng: -121.794 },
    pins: [
      { id: "mt-baker", name: "Mt. Baker Ski Area", lat: 48.861944, lng: -121.653889, accent: "#f97316" },
      { id: "glacier", name: "Glacier", lat: 48.88833, lng: -121.93389, accent: "#0ea5e9" },
    ],
  },
  "sun-valley": {
    center: { lat: 43.669, lng: -114.387 },
    pins: [
      { id: "bald-mountain", name: "Bald Mountain", lat: 43.65500, lng: -114.40917, accent: "#f97316" },
      { id: "dollar-mountain", name: "Dollar Mountain", lat: 43.68306, lng: -114.34694, accent: "#f97316" },
      { id: "ketchum", name: "Ketchum", lat: 43.68074, lng: -114.36366, accent: "#0ea5e9" },
    ],
  },
  "sandpoint": {
    center: { lat: 48.325, lng: -116.592 },
    pins: [
      { id: "schweitzer-mountain-resort", name: "Schweitzer Mountain Resort", lat: 48.36700, lng: -116.62300, accent: "#f97316" },
      { id: "sandpoint", name: "Sandpoint", lat: 48.28222, lng: -116.56139, accent: "#0ea5e9" },
    ],
  },
  "boise": {
    center: { lat: 43.690, lng: -116.153 },
    pins: [
      { id: "bogus-basin", name: "Bogus Basin", lat: 43.76468, lng: -116.10329, accent: "#f97316" },
      { id: "boise", name: "Boise", lat: 43.61583, lng: -116.20167, accent: "#0ea5e9" },
    ],
  },
  "donnelly-mccall": {
    center: { lat: 44.802, lng: -116.117 },
    pins: [
      { id: "tamarack-resort", name: "Tamarack Resort", lat: 44.671, lng: -116.123, accent: "#f97316" },
      { id: "brundage-mountain", name: "Brundage Mountain", lat: 45.00500, lng: -116.15500, accent: "#f97316" },
      { id: "donnelly", name: "Donnelly", lat: 44.73028, lng: -116.07444, accent: "#0ea5e9" },
    ],
  },
  "white-mountains": { center: { lat: 44.14, lng: -71.20 }, pins: [{ id: "cranmore-mountain", name: "Cranmore Mountain", lat: 44.0550, lng: -71.1090, accent: "#f97316" }, { id: "wildcat-mountain", name: "Wildcat Mountain", lat: 44.2590, lng: -71.2370, accent: "#f97316" }, { id: "attitash-mountain-resort", name: "Attitash Mountain Resort", lat: 44.0820, lng: -71.2290, accent: "#f97316" }, { id: "north-conway", name: "North Conway", lat: 44.0537, lng: -71.1289, accent: "#0ea5e9" }] },
  "franconia-notch": { center: { lat: 44.15, lng: -71.59 }, pins: [{ id: "cannon-mountain", name: "Cannon Mountain", lat: 44.1569, lng: -71.6980, accent: "#f97316" }, { id: "bretton-woods", name: "Bretton Woods", lat: 44.2600, lng: -71.4410, accent: "#f97316" }, { id: "loon-mountain", name: "Loon Mountain", lat: 44.0360, lng: -71.6220, accent: "#f97316" }, { id: "franconia", name: "Franconia", lat: 44.2270, lng: -71.7470, accent: "#0ea5e9" }, { id: "bretton-woods-town", name: "Bretton Woods", lat: 44.2580, lng: -71.4410, accent: "#0ea5e9" }] },
  "waterville-valley": { center: { lat: 43.95, lng: -71.51 }, pins: [{ id: "waterville-valley-resort", name: "Waterville Valley Resort", lat: 43.9500, lng: -71.5140, accent: "#f97316" }, { id: "waterville-valley-town", name: "Waterville Valley", lat: 43.9500, lng: -71.4990, accent: "#0ea5e9" }] },
  "lakes-region": { center: { lat: 43.54, lng: -71.39 }, pins: [{ id: "gunstock-mountain-resort", name: "Gunstock Mountain Resort", lat: 43.5270, lng: -71.3690, accent: "#f97316" }, { id: "gilford", name: "Gilford", lat: 43.5480, lng: -71.4060, accent: "#0ea5e9" }] },
  "carrabassett-valley": { center: { lat: 45.03, lng: -70.31 }, pins: [{ id: "sugarloaf", name: "Sugarloaf", lat: 45.031, lng: -70.314, accent: "#f97316" }, { id: "carrabassett-valley-town", name: "Carrabassett Valley", lat: 45.085, lng: -70.265, accent: "#0ea5e9" }] },
  "newry-bethel": { center: { lat: 44.48, lng: -70.83 }, pins: [{ id: "sunday-river", name: "Sunday River", lat: 44.473, lng: -70.856, accent: "#f97316" }, { id: "newry", name: "Newry", lat: 44.499, lng: -70.800, accent: "#0ea5e9" }] },
  "rangeley": { center: { lat: 44.95, lng: -70.56 }, pins: [{ id: "saddleback-mountain", name: "Saddleback Mountain", lat: 44.936, lng: -70.510, accent: "#f97316" }, { id: "rangeley", name: "Rangeley", lat: 44.966, lng: -70.644, accent: "#0ea5e9" }] },
  "lake-placid": { center: { lat: 44.33, lng: -73.91 }, pins: [{ id: "whiteface-mountain", name: "Whiteface Mountain", lat: 44.365, lng: -73.902, accent: "#f97316" }, { id: "lake-placid", name: "Lake Placid", lat: 44.279, lng: -73.979, accent: "#0ea5e9" }, { id: "wilmington", name: "Wilmington", lat: 44.387, lng: -73.817, accent: "#0ea5e9" }] },
  "north-creek": { center: { lat: 43.68, lng: -74.00 }, pins: [{ id: "gore-mountain", name: "Gore Mountain", lat: 43.673, lng: -74.016, accent: "#f97316" }, { id: "north-creek", name: "North Creek", lat: 43.697, lng: -73.985, accent: "#0ea5e9" }] },
  "hunter": { center: { lat: 42.21, lng: -74.22 }, pins: [{ id: "hunter-mountain", name: "Hunter Mountain", lat: 42.204, lng: -74.225, accent: "#f97316" }, { id: "hunter", name: "Hunter", lat: 42.214, lng: -74.213, accent: "#0ea5e9" }] },
  "windham": { center: { lat: 42.30, lng: -74.25 }, pins: [{ id: "windham-mountain", name: "Windham Mountain Club", lat: 42.289, lng: -74.257, accent: "#f97316" }, { id: "windham", name: "Windham", lat: 42.309, lng: -74.251, accent: "#0ea5e9" }] },
  "highmount": { center: { lat: 42.14, lng: -74.51 }, pins: [{ id: "belleayre-mountain", name: "Belleayre Mountain", lat: 42.139, lng: -74.505, accent: "#f97316" }, { id: "highmount", name: "Highmount", lat: 42.147, lng: -74.514, accent: "#0ea5e9" }] },
};
