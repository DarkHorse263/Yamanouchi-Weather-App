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
import { yuzawaRegion } from "./yuzawa";
import { tasmaniaRegion } from "./tasmania";
import { queenstownRegion } from "./queenstown";
import { wanakaRegion } from "./wanaka";
import { mtHuttRegion } from "./mt-hutt";
import { ruapehuRegion } from "./ruapehu";

// Active region registry · AU: Snowy Mountains + Victoria's High Country
// + Tasmania (Ben Lomond). JP: Yamanouchi (Shiga Kogen + Kita-Shiga),
// Nozawa Onsen (standalone), Iiyama (Madarao/Tangram + Togari +
// Kijimadaira cluster), Hakuba Valley, Myoko, Niseko (first Hokkaido),
// Furano (second Hokkaido · Furano Ski Resort + Kamui + Tomamu).
// NZ: Queenstown (Coronet Peak + The Remarkables), Wanaka (Cardrona +
// Treble Cone), Mt Hutt (Methven), Ruapehu (Whakapapa + Turoa, Ohakune).
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
  yuzawaRegion,
  queenstownRegion,
  wanakaRegion,
  mtHuttRegion,
  ruapehuRegion,
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
export type CountryCode = "AU" | "JP" | "NZ";
export const REGION_COUNTRY: Record<string, CountryCode> = {
  "snowy-mountains": "AU",
  "victorias-high-country": "AU",
  "tasmania": "AU",
  "yamanouchi": "JP",
  "nozawa-onsen": "JP",
  "iiyama": "JP",
  "hakuba-valley": "JP",
  "myoko": "JP",
  "niseko": "JP",
  "furano": "JP",
  "yuzawa": "JP",
  "queenstown": "NZ",
  "wanaka": "NZ",
  "mt-hutt": "NZ",
  "ruapehu": "NZ",
};
export const COUNTRY_META: Record<CountryCode, { name: string; flag: string }> = {
  AU: { name: "Australia", flag: "🇦🇺" },
  JP: { name: "Japan", flag: "🇯🇵" },
  NZ: { name: "New Zealand", flag: "🇳🇿" },
};
export function regionsForCountry(code: CountryCode): RegionConfig[] {
  return REGIONS.filter((r) => REGION_COUNTRY[r.id] === code);
}
