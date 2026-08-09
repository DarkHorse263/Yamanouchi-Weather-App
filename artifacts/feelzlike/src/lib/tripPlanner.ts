/**
 * Multi-day trip planner · mountain catalog + saved-mountains persistence.
 *
 * Per-country scope (Jul 2026): the planner is scoped to a single country at a
 * time (AU, JP or NZ) · the page carries a country switcher and the catalog +
 * saved set are filtered to the selected country. This replaced the earlier
 * AU-only build, which silently sent JP/NZ users to Australian mountains.
 * Cross-hemisphere comparison is deliberately NOT offered · you don't drive
 * between AU and JP, so mixing them in one list is noise. Each country compares
 * within itself.
 *
 * Persistence mirrors `favouriteRegion.ts`: localStorage, single-device,
 * try/catch-wrapped because Safari private mode + some embeds throw on access.
 * The saved set is namespaced per country (`feelzlike:trip-mountains:<CC>`) so
 * each country's picks stay independent. The pre-country AU list lived under the
 * un-suffixed key and is adopted once on first AU read so existing users don't
 * lose their picks. No login required · matches the app's anonymous-first model.
 */
import { REGIONS, REGION_COUNTRY, type CountryCode } from "@/regions";
import type { MountainLink } from "@workspace/feelzlike-shell";

// Re-export the pure day scorer so existing imports from this module keep
// working. The scorer itself lives in tripDayScore.ts (no region/asset
// imports) so it stays unit-testable under tsx --test.
export { scoreTripDay } from "@/lib/tripDayScore";
export type { TripDayScore, TripDayTone } from "@/lib/tripDayScore";

const KEY_PREFIX = "feelzlike:trip-mountains";
/** Pre-country storage key · held AU-only picks before the per-country split. */
const LEGACY_KEY = "feelzlike:trip-mountains";

function storageKey(country: CountryCode): string {
  return `${KEY_PREFIX}:${country}`;
}

/** Hard cap on saved mountains · keeps the stacked view + fan-out of weather
 *  requests sane. Six is enough to compare every resort a day-tripper would
 *  realistically choose between. */
export const MAX_TRIP_MOUNTAINS = 6;

/** A mountain enriched with its parent region, ready for the planner UI. */
export interface CatalogMountain extends MountainLink {
  regionId: string;
  regionName: string;
  regionShortTag: string;
}

/** Stable composite key for a mountain across regions. */
export function mountainKey(regionId: string, mountainId: string): string {
  return `${regionId}:${mountainId}`;
}

/**
 * Every mountain in `country` that carries coordinates, flattened across that
 * country's regions in the app's curated display order. Mountains without
 * lat/lng are dropped · the planner needs coordinates to fetch a forecast.
 */
export function tripPlannerCatalog(country: CountryCode): CatalogMountain[] {
  const out: CatalogMountain[] = [];
  for (const region of REGIONS) {
    if (REGION_COUNTRY[region.id] !== country) continue;
    for (const m of region.mountains ?? []) {
      if (m.lat === undefined || m.lng === undefined) continue;
      out.push({
        ...m,
        regionId: region.id,
        regionName: region.name,
        regionShortTag: region.shortTag,
      });
    }
  }
  return out;
}

/**
 * Countries that have at least one plannable mountain, in display order.
 * Drives the country switcher · a country with no coord-bearing mountains
 * simply doesn't appear rather than showing an empty picker.
 */
export function plannerCountries(): CountryCode[] {
  // Season-first ordering: AU + NZ (jun-oct season) before Japan (dec-mar).
  const order: CountryCode[] = ["AU", "NZ", "JP", "CA"];
  return order.filter((c) => tripPlannerCatalog(c).length > 0);
}

/** Look up a single catalog mountain by its composite key within a country. */
export function findCatalogMountain(
  key: string,
  country: CountryCode,
): CatalogMountain | undefined {
  return tripPlannerCatalog(country).find(
    (m) => mountainKey(m.regionId, m.id) === key,
  );
}

function readRawKeys(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((k): k is string => typeof k === "string");
  } catch {
    return [];
  }
}

/** True when a key has never been written. On storage error we assume it
 *  exists so we never resurrect a legacy list off a false negative. */
function keyExists(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return true;
  }
}

/** Read saved mountain keys for a country, dropping any not in its catalog. */
export function readSavedMountains(country: CountryCode): string[] {
  let raw = readRawKeys(storageKey(country));
  // One-time adoption of the pre-country AU list (was stored un-namespaced).
  // Gate on the AU key being ABSENT · an empty AU array means the user
  // deliberately cleared their picks, so we must not resurrect the legacy
  // list. Once any add/remove writes the AU key, the legacy list is ignored.
  if (country === "AU" && !keyExists(storageKey("AU"))) {
    const legacy = readRawKeys(LEGACY_KEY);
    if (legacy.length > 0) raw = legacy;
  }
  const valid = new Set(
    tripPlannerCatalog(country).map((m) => mountainKey(m.regionId, m.id)),
  );
  return raw.filter((k) => valid.has(k)).slice(0, MAX_TRIP_MOUNTAINS);
}

function writeSavedMountains(country: CountryCode, keys: string[]): void {
  try {
    localStorage.setItem(
      storageKey(country),
      JSON.stringify(keys.slice(0, MAX_TRIP_MOUNTAINS)),
    );
  } catch {
    /* swallow · non-fatal */
  }
}

/** Add a mountain to the country's saved set (no-op if full or already saved). */
export function addSavedMountain(key: string, country: CountryCode): string[] {
  const current = readSavedMountains(country);
  if (current.includes(key) || current.length >= MAX_TRIP_MOUNTAINS) {
    return current;
  }
  const next = [...current, key];
  writeSavedMountains(country, next);
  return next;
}

/** Remove a mountain from the country's saved set. */
export function removeSavedMountain(key: string, country: CountryCode): string[] {
  const next = readSavedMountains(country).filter((k) => k !== key);
  writeSavedMountains(country, next);
  return next;
}
