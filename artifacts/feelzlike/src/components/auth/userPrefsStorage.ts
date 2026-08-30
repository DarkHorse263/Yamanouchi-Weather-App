import type { UnitsPref } from "@/lib/unitsFormat";

/** localStorage key for the anonymous-visitor units preference. */
export const LOCAL_UNITS_KEY = "feelzlike:units";

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
    if (stored === "imperial") return "imperial";
    if (stored === "metric") return "metric";
    return localeDefaultUnits();
  } catch {
    return "metric"; // private mode / SSR — fail-soft to metric
  }
}