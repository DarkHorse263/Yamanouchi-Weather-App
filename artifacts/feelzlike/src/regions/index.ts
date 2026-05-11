import type { RegionConfig } from "@workspace/feelzlike-shell";
import { snowyMountainsRegion } from "./snowy-mountains";
import { yamanouchiRegion } from "./yamanouchi";
import { victoriasHighCountryRegion } from "./victorias-high-country";

// Active region registry. Snowy Mountains + Victoria's High Country (AU)
// and Yamanouchi (JP). Iiyama was retired from the registry on the way to
// v1.0 - re-add it by importing its config and pushing into this array.
export const REGIONS: RegionConfig[] = [
  snowyMountainsRegion,
  victoriasHighCountryRegion,
  yamanouchiRegion,
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
  "yamanouchi": "JP",
};
export const COUNTRY_META: Record<CountryCode, { name: string; flag: string }> = {
  AU: { name: "Australia", flag: "🇦🇺" },
  JP: { name: "Japan", flag: "🇯🇵" },
};
export function regionsForCountry(code: CountryCode): RegionConfig[] {
  return REGIONS.filter((r) => REGION_COUNTRY[r.id] === code);
}
