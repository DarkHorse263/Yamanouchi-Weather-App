import type { RegionConfig } from "@workspace/feelzlike-shell";
import { snowyMountainsRegion } from "./snowy-mountains";
import { yamanouchiRegion } from "./yamanouchi";
import { victoriasHighCountryRegion } from "./victorias-high-country";
import { nozawaOnsenRegion } from "./nozawa-onsen";
import { iiyamaRegion } from "./iiyama";
import { hakubaValleyRegion } from "./hakuba-valley";
import { myokoRegion } from "./myoko";
import { nisekoRegion } from "./niseko";
import { furanoRegion } from "./furano";
import { sapporoRegion } from "./sapporo";
import { tomamuSahoroRegion } from "./tomamu-sahoro";
import { asahikawaRegion } from "./asahikawa";
import { rusutsuKiroroRegion } from "./rusutsu-kiroro";
import { yuzawaRegion } from "./yuzawa";
import { zaoOnsenRegion } from "./zao-onsen";
import { bandaiRegion } from "./bandai";
import { daisenRegion } from "./daisen";
import { hakkodaAomoriSpringRegion } from "./hakkoda-aomori-spring";
import { appiShizukuishiRegion } from "./appi-shizukuishi";
import { minakamiRegion } from "./minakami";
import { kusatsuManzaRegion } from "./kusatsu-manza";
import { hachimantaiRegion } from "./hachimantai";
import { tasmaniaRegion } from "./tasmania";
import { queenstownRegion } from "./queenstown";
import { wanakaRegion } from "./wanaka";
import { mtHuttRegion } from "./mt-hutt";
import { ruapehuRegion } from "./ruapehu";
import { whistlerRegion } from "./whistler";
import { powderHighwayRegion } from "./powder-highway";
import { banffLakeLouiseRegion } from "./banff-lake-louise";
import { canmoreRegion } from "./canmore";
import { jasperRegion } from "./jasper";
import { quebecLaurentiansRegion } from "./quebec-laurentians";
import { quebecCharlevoixRegion } from "./quebec-charlevoix";
import { quebecEasternTownshipsRegion } from "./quebec-eastern-townships";
import { summitCountyRegion } from "./summit-county";
import { vailValleyRegion } from "./vail-valley";
import { aspenSnowmassRegion } from "./aspen-snowmass";
import { steamboatRegion } from "./steamboat";
import { winterParkRegion } from "./winter-park";
import { crestedButteRegion } from "./crested-butte";
import { tellurideRegion } from "./telluride";
import { durangoRegion } from "./durango";
import { boulderFrontRangeRegion } from "./boulder-front-range";
import { cottonwoodCanyonsRegion } from "./cottonwood-canyons";
import { parkCityRegion } from "./park-city";
import { ogdenValleyRegion } from "./ogden-valley";
import { provoRegion } from "./provo";
import { cacheValleyRegion } from "./cache-valley";
import { northLakeTahoeRegion } from "./north-lake-tahoe";
import { southLakeTahoeRegion } from "./south-lake-tahoe";
import { mammothLakesRegion } from "./mammoth-lakes";
import { bigBearRegion } from "./big-bear";
import { bearValleyRegion } from "./bear-valley";
import { mtShastaRegion } from "./mt-shasta";
import { killingtonPicoRegion } from "./killington-pico";
import { stoweSmugglersNotchRegion } from "./stowe-smugglers-notch";
import { madRiverValleyRegion } from "./mad-river-valley";
import { southernVermontRegion } from "./southern-vermont";
import { okemoRegion } from "./okemo";
import { jayPeakNekRegion } from "./jay-peak-nek";
import { jacksonHoleRegion } from "./jackson-hole";
import { grandTargheeRegion } from "./grand-targhee";
import { bigSkyRegion } from "./big-sky";
import { bozemanBridgerBowlRegion } from "./bozeman-bridger-bowl";
import { whitefishRegion } from "./whitefish";
import { redLodgeRegion } from "./red-lodge";
import { taosRegion } from "./taos";
import { angelFireRegion } from "./angel-fire";
import { santaFeRegion } from "./santa-fe";
import { albuquerqueSandiaRegion } from "./albuquerque-sandia";
import { mtHoodRegion } from "./mt-hood";
import { bendRegion } from "./bend";
import { crystalMountainRegion } from "./crystal-mountain";
import { snoqualmiePassRegion } from "./snoqualmie-pass";
import { stevensPassRegion } from "./stevens-pass";
import { mtBakerRegion } from "./mt-baker";
import { sunValleyRegion } from "./sun-valley";
import { sandpointRegion } from "./sandpoint";
import { boiseRegion } from "./boise";
import { donnellyMccallRegion } from "./donnelly-mccall";

// Active region registry · AU: Snowy Mountains + Victoria's High Country
// + Tasmania (Ben Lomond). JP: Yamanouchi (Shiga Kogen + Kita-Shiga),
// Nozawa Onsen (standalone), Iiyama (Madarao/Tangram + Togari +
// Kijimadaira cluster), Hakuba Valley, Myoko, Niseko (first Hokkaido),
// Furano (second Hokkaido · Furano Ski Resort + Kamui + Tomamu),
// Rusutsu & Kiroro (third Hokkaido · the two big independent powder
// resorts either side of the Niseko range), Zao Onsen (first Tohoku ·
// Yamagata's juhyo classic), Hakkoda & Aomori Spring (second Tohoku ·
// Aomori's big-mountain ropeway + the quiet Mt Iwaki powder resort).
// NZ: Queenstown (Coronet Peak + The Remarkables), Wanaka (Cardrona +
// Treble Cone), Mt Hutt (Methven), Ruapehu (Whakapapa + Turoa, Ohakune).
// CA (BC + Alberta): Whistler (Whistler Blackcomb), Powder Highway (the
// seven-resort BC interior loop), Banff & Lake Louise (SkiBig3), Canmore
// (Nakiska), Jasper (Marmot Basin). CA (Quebec): Laurentians
// (Tremblant), Charlevoix (Mont-Sainte-Anne + Le Massif), Eastern
// Townships (Ski Bromont + Mont Sutton).
// US (Colorado): Summit County (Breckenridge, Keystone, Copper Mountain,
// Arapahoe Basin, Loveland), Vail Valley (Vail Mountain, Beaver Creek),
// Aspen Snowmass (Snowmass, Aspen Mountain, Aspen Highlands, Buttermilk),
// Steamboat (Steamboat Resort), Winter Park (Winter Park Resort),
// Crested Butte (Crested Butte Mountain Resort), Telluride (Telluride Ski
// Resort), Durango (Purgatory Resort), Boulder/Front Range (Eldora
// Mountain Resort). US (Utah): Cottonwood Canyons (Alta, Snowbird,
// Brighton, Solitude), Park City (Park City Mountain, Deer Valley), Ogden
// Valley (Snowbasin, Powder Mountain, Nordic Valley), Provo (Sundance
// Mountain Resort), Cache Valley (Beaver Mountain, Cherry Peak). US
// (California): North Lake Tahoe (Palisades Tahoe, Northstar California,
// Sugar Bowl), South Lake Tahoe (Heavenly, Kirkwood, Sierra-at-Tahoe,
// Homewood Mountain Resort), Mammoth Lakes (Mammoth Mountain, June
// Mountain), Big Bear (Bear Mountain, Snow Summit), Bear Valley (Bear
// Valley Mountain Resort), Mt. Shasta (Mt. Shasta Ski Park). First
// Pacific-timezone (America/Los_Angeles) US regions on this branch. US
// (Vermont): Killington/Pico (Killington, Pico Mountain), Stowe/
// Smugglers' Notch (Stowe Mountain Resort, Smugglers' Notch), Mad River
// Valley (Sugarbush, Mad River Glen), Southern Vermont (Stratton, Mount
// Snow, Bromley Mountain, Magic Mountain), Okemo (Okemo Mountain
// Resort), Jay Peak/Northeast Kingdom (Jay Peak, Burke Mountain). First
// Eastern-timezone (America/New_York) US regions on this branch.
export const REGIONS: RegionConfig[] = [
  snowyMountainsRegion,
  victoriasHighCountryRegion,
  tasmaniaRegion,
  yamanouchiRegion,
  nozawaOnsenRegion,
  iiyamaRegion,
  hakubaValleyRegion,
  myokoRegion,
  nisekoRegion,
  furanoRegion,
  sapporoRegion,
  bandaiRegion,
  daisenRegion,
  tomamuSahoroRegion,
  asahikawaRegion,
  rusutsuKiroroRegion,
  yuzawaRegion,
  zaoOnsenRegion,
  hakkodaAomoriSpringRegion,
  appiShizukuishiRegion,
  minakamiRegion,
  kusatsuManzaRegion,
  hachimantaiRegion,
  queenstownRegion,
  wanakaRegion,
  mtHuttRegion,
  ruapehuRegion,
  whistlerRegion,
  powderHighwayRegion,
  banffLakeLouiseRegion,
  canmoreRegion,
  jasperRegion,
  quebecLaurentiansRegion,
  quebecCharlevoixRegion,
  quebecEasternTownshipsRegion,
  summitCountyRegion,
  vailValleyRegion,
  aspenSnowmassRegion,
  steamboatRegion,
  winterParkRegion,
  crestedButteRegion,
  tellurideRegion,
  durangoRegion,
  boulderFrontRangeRegion,
  cottonwoodCanyonsRegion,
  parkCityRegion,
  ogdenValleyRegion,
  provoRegion,
  cacheValleyRegion,
  northLakeTahoeRegion,
  southLakeTahoeRegion,
  mammothLakesRegion,
  bigBearRegion,
  bearValleyRegion,
  mtShastaRegion,
  killingtonPicoRegion,
  stoweSmugglersNotchRegion,
  madRiverValleyRegion,
  southernVermontRegion,
  okemoRegion,
  jayPeakNekRegion,
  jacksonHoleRegion,
  grandTargheeRegion,
  bigSkyRegion,
  bozemanBridgerBowlRegion,
  whitefishRegion,
  redLodgeRegion,
  taosRegion,
  angelFireRegion,
  santaFeRegion,
  albuquerqueSandiaRegion,
  mtHoodRegion,
  bendRegion,
  crystalMountainRegion,
  snoqualmiePassRegion,
  stevensPassRegion,
  mtBakerRegion,
  sunValleyRegion,
  sandpointRegion,
  boiseRegion,
  donnellyMccallRegion,
];

export const REGION_BY_ID: Record<string, RegionConfig> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
);

export function getRegion(id: string): RegionConfig | undefined {
  return REGION_BY_ID[id];
}

// Country code each region belongs to. Drives the country-index pages
// (`/au`, `/jp`) and lets the landing decide which regions belong under
// which flag without re-deriving from `subtitle` strings. Keep in sync
// when a new region is added.
export type CountryCode = "AU" | "JP" | "NZ" | "CA" | "US";
export const REGION_COUNTRY: Record<string, CountryCode> = {
  "snowy-mountains": "AU",
  "victorias-high-country": "AU",
  "tasmania": "AU",
  "yamanouchi": "JP",
  "nozawa-onsen": "JP",
  "iiyama": "JP",
  "bandai": "JP",
  "daisen": "JP",
  "hakuba-valley": "JP",
  "myoko": "JP",
  "niseko": "JP",
  "furano": "JP",
  "sapporo": "JP",
  "tomamu-sahoro": "JP",
  "asahikawa": "JP",
  "rusutsu-kiroro": "JP",
  "yuzawa": "JP",
  "zao-onsen": "JP",
  "hakkoda-aomori-spring": "JP",
  "appi-shizukuishi": "JP",
  "minakami": "JP",
  "kusatsu-manza": "JP",
  "hachimantai": "JP",
  "queenstown": "NZ",
  "wanaka": "NZ",
  "mt-hutt": "NZ",
  "ruapehu": "NZ",
  "whistler": "CA",
  "powder-highway": "CA",
  "banff-lake-louise": "CA",
  "canmore": "CA",
  "jasper": "CA",
  "quebec-laurentians": "CA",
  "quebec-charlevoix": "CA",
  "quebec-eastern-townships": "CA",
  "summit-county": "US",
  "vail-valley": "US",
  "aspen-snowmass": "US",
  "steamboat": "US",
  "winter-park": "US",
  "crested-butte": "US",
  "telluride": "US",
  "durango": "US",
  "boulder-front-range": "US",
  "cottonwood-canyons": "US",
  "park-city": "US",
  "ogden-valley": "US",
  "provo": "US",
  "cache-valley": "US",
  "north-lake-tahoe": "US",
  "south-lake-tahoe": "US",
  "mammoth-lakes": "US",
  "big-bear": "US",
  "bear-valley": "US",
  "mt-shasta": "US",
  "killington-pico": "US",
  "stowe-smugglers-notch": "US",
  "mad-river-valley": "US",
  "southern-vermont": "US",
  "okemo": "US",
  "jay-peak-nek": "US",
  "jackson-hole": "US",
  "grand-targhee": "US",
  "big-sky": "US",
  "bozeman-bridger-bowl": "US",
  "whitefish": "US",
  "red-lodge": "US",
  "taos": "US",
  "angel-fire": "US",
  "santa-fe": "US",
  "albuquerque-sandia": "US",
  "mt-hood": "US",
  "bend": "US",
  "crystal-mountain": "US",
  "snoqualmie-pass": "US",
  "stevens-pass": "US",
  "mt-baker": "US",
  "sun-valley": "US",
  "sandpoint": "US",
  "boise": "US",
  "donnelly-mccall": "US",
};
export const COUNTRY_META: Record<CountryCode, { name: string; flag: string }> = {
  AU: { name: "Australia", flag: "🇦🇺" },
  JP: { name: "Japan", flag: "🇯🇵" },
  NZ: { name: "New Zealand", flag: "🇳🇿" },
  CA: { name: "Canada", flag: "🇨🇦" },
  US: { name: "United States", flag: "🇺🇸" },
};
export function regionsForCountry(code: CountryCode): RegionConfig[] {
  return REGIONS.filter((r) => REGION_COUNTRY[r.id] === code);
}
