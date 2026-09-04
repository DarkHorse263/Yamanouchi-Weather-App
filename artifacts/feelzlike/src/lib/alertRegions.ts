import { REGIONS, REGION_COUNTRY, type CountryCode } from "@/regions";
import { regionAlertsAvailable } from "@/regions/catalogue";
import { projectAlertRegions, type AlertRegion } from "./alertRegionProjection";

export type { AlertRegion } from "./alertRegionProjection";

/**
 * The alerts picker is a projection of the same assembled region catalogue
 * used by the country index. It intentionally contains no hand-maintained
 * region registry: a published region appears here when its alert capability
 * is available, and disappears when that capability is not available.
 */
const projection = projectAlertRegions(REGIONS, REGION_COUNTRY, regionAlertsAvailable);

export const ALERT_REGIONS: readonly AlertRegion[] = projection.alertRegions;

/**
 * Full country catalogue totals for picker headers. These deliberately count
 * every published region from `/countries`, including directory-only regions
 * that are not eligible powder-alert destinations.
 */
export const COUNTRY_REGION_TOTALS: Readonly<Record<CountryCode, number>> = projection.countryRegionTotals;

export function alertRegionsForCountry(countryCode: CountryCode): readonly AlertRegion[] {
  return ALERT_REGIONS.filter((region) => region.countryCode === countryCode);
}