/**
 * Multi-day trip planner · mountain catalog + saved-mountains persistence.
 *
 * v1 scope (May 2026): AU mountains only (snowy-mountains, victorias-high-
 * country, tasmania). Japan is intentionally excluded for now · the cross-
 * hemisphere "stack them side by side" use case is weak (you don't drive
 * between AU and JP) and it keeps the picker focused. Add JP later by
 * dropping the country filter in `tripPlannerCatalog()`.
 *
 * Persistence mirrors `favouriteRegion.ts`: localStorage, single-device,
 * try/catch-wrapped because Safari private mode + some embeds throw on access.
 * No login required · matches the rest of the app's anonymous-first model.
 */
import { REGIONS, REGION_COUNTRY } from "@/regions";
import type { MountainLink } from "@workspace/feelzlike-shell";

// Re-export the pure day scorer so existing imports from this module keep
// working. The scorer itself lives in tripDayScore.ts (no region/asset
// imports) so it stays unit-testable under tsx --test.
export { scoreTripDay } from "@/lib/tripDayScore";
export type { TripDayScore, TripDayTone } from "@/lib/tripDayScore";

const KEY = "feelzlike:trip-mountains";

/** Hard cap on saved mountains · keeps the stacked view + fan-out of weather
 *  requests sane. Six is enough to compare every AU resort a day-tripper
 *  would realistically choose between. */
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
 * All AU mountains that carry coordinates, flattened across regions and
 * grouped by region in the app's curated display order. Mountains without
 * lat/lng are dropped · the planner needs coordinates to fetch a forecast.
 */
export function tripPlannerCatalog(): CatalogMountain[] {
  const out: CatalogMountain[] = [];
  for (const region of REGIONS) {
    if (REGION_COUNTRY[region.id] !== "AU") continue;
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

/** Look up a single catalog mountain by its composite key. */
export function findCatalogMountain(key: string): CatalogMountain | undefined {
  return tripPlannerCatalog().find(
    (m) => mountainKey(m.regionId, m.id) === key,
  );
}

/** Read saved mountain keys, dropping any that no longer exist in the catalog. */
export function readSavedMountains(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = new Set(
      tripPlannerCatalog().map((m) => mountainKey(m.regionId, m.id)),
    );
    return parsed
      .filter((k): k is string => typeof k === "string" && valid.has(k))
      .slice(0, MAX_TRIP_MOUNTAINS);
  } catch {
    return [];
  }
}

function writeSavedMountains(keys: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(keys.slice(0, MAX_TRIP_MOUNTAINS)));
  } catch {
    /* swallow · non-fatal */
  }
}

/** Add a mountain to the saved set (no-op if full or already saved). */
export function addSavedMountain(key: string): string[] {
  const current = readSavedMountains();
  if (current.includes(key) || current.length >= MAX_TRIP_MOUNTAINS) {
    return current;
  }
  const next = [...current, key];
  writeSavedMountains(next);
  return next;
}

/** Remove a mountain from the saved set. */
export function removeSavedMountain(key: string): string[] {
  const next = readSavedMountains().filter((k) => k !== key);
  writeSavedMountains(next);
  return next;
}
