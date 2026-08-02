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
import { okanaganRegion } from "./okanagan";
import { vancouverRegion } from "./vancouver";

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
// seven-resort BC interior loop), Okanagan (Big White + SilverStar + Apex),
// Vancouver & the Island (the three North Shore city hills + Mount
// Washington on Vancouver Island), Banff & Lake Louise (SkiBig3), Canmore
// (Nakiska), Jasper (Marmot Basin). CA (Quebec): Laurentians
// (Tremblant), Charlevoix (Mont-Sainte-Anne + Le Massif), Eastern
// Townships (Ski Bromont + Mont Sutton).
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
  okanaganRegion,
  vancouverRegion,
  banffLakeLouiseRegion,
  canmoreRegion,
  jasperRegion,
  quebecLaurentiansRegion,
  quebecCharlevoixRegion,
  quebecEasternTownshipsRegion,
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
export type CountryCode = "AU" | "JP" | "NZ" | "CA";
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
  "okanagan": "CA",
  "vancouver": "CA",
  "banff-lake-louise": "CA",
  "canmore": "CA",
  "jasper": "CA",
  "quebec-laurentians": "CA",
  "quebec-charlevoix": "CA",
  "quebec-eastern-townships": "CA",
};
export const COUNTRY_META: Record<CountryCode, { name: string; flag: string }> = {
  AU: { name: "Australia", flag: "🇦🇺" },
  JP: { name: "Japan", flag: "🇯🇵" },
  NZ: { name: "New Zealand", flag: "🇳🇿" },
  CA: { name: "Canada", flag: "🇨🇦" },
};
export function regionsForCountry(code: CountryCode): RegionConfig[] {
  return REGIONS.filter((r) => REGION_COUNTRY[r.id] === code);
}
