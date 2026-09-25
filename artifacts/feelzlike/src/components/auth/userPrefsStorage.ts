import type { UnitsPref } from "@/lib/unitsFormat";

/** localStorage key for the anonymous-visitor units preference. */
export const LOCAL_UNITS_KEY = "feelzlike:units";

/** An actual visitor selection, as opposed to the first-visit default. */
export function readStoredLocalUnits(): UnitsPref | null {
  try {
    const stored = localStorage.getItem(LOCAL_UNITS_KEY);
    return stored === "imperial" || stored === "metric" ? stored : null;
  } catch {
    return null;
  }
}

export function defaultUnitsForCountry(country: string | undefined): UnitsPref {
  return country === "US" ? "imperial" : "metric";
}

/** Account-backed choice wins only when proven intentional, not when the
 * database's old implicit metric default happens to be present. */
export function effectiveUnits(
  account: { units: UnitsPref; unitsExplicit?: boolean } | null,
  local: UnitsPref | null,
  country: string | undefined,
  localeDefault: UnitsPref,
): UnitsPref {
  if (account && (account.unitsExplicit || account.units === "imperial")) return account.units;
  return local ?? (country ? defaultUnitsForCountry(country) : localeDefault);
}

/** Do not turn an unrelated home-region save into a deliberate units choice. */
export function profileUpdateInput(homeRegionId: string, units: UnitsPref, unitsTouched: boolean) {
  return { homeRegionId: homeRegionId || null, ...(unitsTouched ? { units } : {}) };
}

/**
 * First-visit default: US-locale browsers get imperial, everyone else metric.
 * Only consulted when nothing is stored — an explicit choice always wins.
 */
export function localeDefaultUnits(): UnitsPref {
  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    return langs.some((l) => /[-_]US$/i.test(l ?? "")) ? "imperial" : "metric";
  } catch {
    return "metric";
  }
}

export function readLocalUnits(): UnitsPref {
  try {
    const stored = localStorage.getItem(LOCAL_UNITS_KEY);
    if (stored === "imperial" || stored === "metric") return stored;
    return localeDefaultUnits();
  } catch {
    return "metric"; // private mode / SSR — fail-soft to metric
  }
}