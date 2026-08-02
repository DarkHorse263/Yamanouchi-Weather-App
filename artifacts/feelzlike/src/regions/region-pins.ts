
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
  | "quebec-eastern-townships";

export interface PinSpec { id: string; name: string; lat: number; lng: number; accent: string }

export const REGION_DEFAULTS: Record<RegionKey, { center: { lat: number; lng: number }; pins: PinSpec[] }> = {
  "snowy-mountains": {
    center: { lat: -36.42, lng: 148.42 },
    pins: [
      { id: "perisher", name: "Perisher", lat: -36.3717, lng: 148.4086, accent: "#f97316" },
      { id: "thredbo", name: "Thredbo", lat: -36.5054, lng: 148.3089, accent: "#f97316" },
      { id: "charlottes-pass", name: "Charlotte's Pass", lat: -36.4314, lng: 148.3297, accent: "#f97316" },
      { id: "selwyn", name: "Selwyn", lat: -35.8383, lng: 148.5267, accent: "#f97316" },
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
      { id: "ryuoo", name: "Ryuoo", lat: 36.7458, lng: 138.4283, accent: "#f97316" },
      { id: "kita-shiga", name: "Kita Shiga Kogen", lat: 36.7600, lng: 138.4750, accent: "#f97316" },
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
      { id: "madarao", name: "Madarao", lat: 36.9056, lng: 138.2858, accent: "#f97316" },
      { id: "tangram", name: "Tangram", lat: 36.8917, lng: 138.2806, accent: "#f97316" },
      { id: "togari-onsen", name: "Togari Onsen", lat: 36.8722, lng: 138.4014, accent: "#f97316" },
      { id: "kijimadaira", name: "Kijimadaira", lat: 36.8639, lng: 138.4006, accent: "#f97316" },
      { id: "kijima-snow-park", name: "Kijima Snow Park", lat: 36.8556, lng: 138.4108, accent: "#f97316" },
      { id: "iiyama", name: "Iiyama City", lat: 36.852, lng: 138.366, accent: "#0ea5e9" },
    ],
  },
  "hakuba-valley": {
    center: { lat: 36.68, lng: 137.85 },
    pins: [
      { id: "happo-one", name: "Happo-One", lat: 36.6981, lng: 137.8597, accent: "#f97316" },
      { id: "hakuba-goryu", name: "Goryu", lat: 36.7076, lng: 137.8312, accent: "#f97316" },
      { id: "hakuba-47", name: "Hakuba 47", lat: 36.6988, lng: 137.8256, accent: "#f97316" },
      { id: "hakuba-iwatake", name: "Iwatake", lat: 36.6927, lng: 137.8398, accent: "#f97316" },
      { id: "tsugaike-kogen", name: "Tsugaike Kogen", lat: 36.7490, lng: 137.8662, accent: "#f97316" },
      { id: "hakuba-norikura", name: "Norikura", lat: 36.7580, lng: 137.8580, accent: "#f97316" },
      { id: "hakuba-cortina", name: "Cortina", lat: 36.7756, lng: 137.8875, accent: "#f97316" },
      { id: "hakuba-sanosaka", name: "Sanosaka", lat: 36.6200, lng: 137.8500, accent: "#f97316" },
      { id: "kashimayari", name: "Kashimayari", lat: 36.5930, lng: 137.8270, accent: "#f97316" },
      { id: "jiigatake", name: "Jiigatake", lat: 36.5686, lng: 137.8339, accent: "#f97316" },
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
      { id: "arai", name: "Arai", lat: 37.0006, lng: 138.2259, accent: "#0ea5e9" },
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
      { id: "niseko-town", name: "Niseko Town", lat: 42.8046, lng: 140.6595, accent: "#0ea5e9" },
    ],
  },
  "furano": {
    center: { lat: 43.34, lng: 142.38 },
    pins: [
      { id: "furano-ski-resort", name: "Furano Ski Resort", lat: 43.335, lng: 142.361, accent: "#f97316" },
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
      { id: "sapporo-kokusai", name: "Sapporo Kokusai", lat: 42.987, lng: 141.135, accent: "#f97316" },
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
      { id: "tomamu-village", name: "Tomamu", lat: 43.0636, lng: 142.6357, accent: "#0ea5e9" },
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
      { id: "shizukuishi-resort", name: "Shizukuishi", lat: 39.6940, lng: 140.9060, accent: "#f97316" },
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
      { id: "minakami-kogen", name: "Minakami Kogen", lat: 36.878, lng: 139.040, accent: "#f97316" },
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
      { id: "hachimantai-panorama", name: "Hachimantai Panorama", lat: 39.946, lng: 141.000, accent: "#f97316" },
      { id: "hachimantai-shimokura", name: "Hachimantai Shimokura", lat: 39.951, lng: 140.972, accent: "#f97316" },
      { id: "hachimantai", name: "Hachimantai", lat: 39.900, lng: 141.130, accent: "#0ea5e9" },
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
      { id: "tremblant", name: "Tremblant", lat: 46.2200, lng: -74.5530, accent: "#f97316" },
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
};
