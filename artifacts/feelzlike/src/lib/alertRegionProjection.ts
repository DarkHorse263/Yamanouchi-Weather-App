export type AlertCountryCode = "AU" | "JP" | "NZ" | "CA" | "US";

export interface CanonicalAlertRegion {
  id: string;
  name: string;
  subtitle: string;
}

export interface AlertRegion {
  id: string;
  nameEn: string;
  nameJa: string;
  country: string;
  countryCode: AlertCountryCode;
}

export interface AlertRegionProjection {
  alertRegions: readonly AlertRegion[];
  countryRegionTotals: Readonly<Record<AlertCountryCode, number>>;
}

const COUNTRY_CODES: readonly AlertCountryCode[] = ["AU", "JP", "NZ", "CA", "US"];

/**
 * Pure projection used by alert selectors. Keeping it independent of the UI
 * catalogue makes its country-total and alert-eligibility rules testable
 * without loading asset-bearing region modules.
 */
export function projectAlertRegions(
  regions: readonly CanonicalAlertRegion[],
  countryForRegion: Readonly<Record<string, AlertCountryCode>>,
  isAlertEligible: (regionId: string) => boolean,
): AlertRegionProjection {
  const seen = new Set<string>();
  const totals = Object.fromEntries(COUNTRY_CODES.map((countryCode) => [countryCode, 0])) as Record<AlertCountryCode, number>;
  const alertRegions: AlertRegion[] = [];

  for (const region of regions) {
    if (seen.has(region.id)) throw new Error(`Duplicate canonical alert region id: ${region.id}`);
    seen.add(region.id);

    const countryCode = countryForRegion[region.id];
    if (!countryCode) continue;
    totals[countryCode]++;
    if (!isAlertEligible(region.id)) continue;

    const stateOrProvince = region.subtitle.split("·")[0]?.trim();
    alertRegions.push({
      id: region.id,
      nameEn: region.name,
      nameJa: region.name,
      country: stateOrProvince ? `${countryCode} · ${stateOrProvince}` : countryCode,
      countryCode,
    });
  }

  return { alertRegions, countryRegionTotals: totals };
}