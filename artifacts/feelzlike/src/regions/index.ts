import type { RegionConfig } from "@workspace/feelzlike-shell";
import { snowyMountainsRegion } from "./snowy-mountains";
import { yamanouchiRegion } from "./yamanouchi";
import { victoriasHighCountryRegion } from "./victorias-high-country";

// Iiyama is temporarily removed from the active region set while we focus on
// shipping Snowy Mountains and Yamanouchi to v1.0. Source files for the
// region (`./iiyama.ts`, `./iiyama/`) are kept on disk so the region can be
// re-enabled with a single import + array entry restoration here, plus the
// matching imports in `layouts/RegionLayout.tsx` and `layouts/TownLayout.tsx`.
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
