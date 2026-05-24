import type { RegionConfig } from "@workspace/feelzlike-shell";
import { snowyMountainsRegion } from "./snowy-mountains";
import { yamanouchiRegion } from "./yamanouchi";
import { victoriasHighCountryRegion } from "./victorias-high-country";
import { nozawaOnsenRegion } from "./nozawa-onsen";
import { iiyamaRegion } from "./iiyama";
import { tasmaniaRegion } from "./tasmania";

// Active region registry · AU: Snowy Mountains + Victoria's High Country
// + Tasmania (Ben Lomond). JP: Yamanouchi (Shiga Kogen + Kita-Shiga),
// Nozawa Onsen (standalone), Iiyama (Madarao/Tangram + Togari +
// Kijimadaira cluster).
export const REGIONS: RegionConfig[] = [
  snowyMountainsRegion,
  victoriasHighCountryRegion,
  tasmaniaRegion,
  yamanouchiRegion,
  nozawaOnsenRegion,
  iiyamaRegion,
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
export type CountryCode = "AU" | "JP";
export const REGION_COUNTRY: Record<string, CountryCode> = {
  "snowy-mountains": "AU",
  "victorias-high-country": "AU",
  "tasmania": "AU",
  "yamanouchi": "JP",
  "nozawa-onsen": "JP",
  "iiyama": "JP",
};
export const COUNTRY_META: Record<CountryCode, { name: string; flag: string }> = {
  AU: { name: "Australia", flag: "🇦🇺" },
  JP: { name: "Japan", flag: "🇯🇵" },
};
export function regionsForCountry(code: CountryCode): RegionConfig[] {
  return REGIONS.filter((r) => REGION_COUNTRY[r.id] === code);
}
