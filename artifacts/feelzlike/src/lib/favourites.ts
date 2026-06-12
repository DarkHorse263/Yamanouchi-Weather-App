/**
 * Favourite locations · up to 3 saved towns for one-tap access from the
 * landing page.
 *
 * Mirrors the persistence approach in favouriteRegion.ts: localStorage wrapped
 * in try/catch (Safari private mode + some embed contexts throw on access),
 * and region ids validated against the live registry so a stale entry from a
 * renamed/removed region can't render a broken link.
 *
 * A favourite is a town hub the user pinned. The shape is denormalised (town
 * + region names stored) so Welcome can render the list without first loading
 * the region configs.
 */
import { useCallback, useEffect, useState } from "react";
import { isKnownRegionId } from "./favouriteRegion";

const KEY = "feelzlike:favourites";
// Dispatched on every write so same-tab listeners (the star on a town page,
// the list on the landing page) stay in sync without a reload.
const CHANGED_EVENT = "feelzlike:favourites-changed";

export const MAX_FAVOURITES = 3;

export interface FavouriteLocation {
  regionId: string;
  townId: string;
  townName: string;
  townNameJa?: string;
}

function sameLocation(a: FavouriteLocation, regionId: string, townId: string): boolean {
  return a.regionId === regionId && a.townId === townId;
}

/**
 * Validate + normalise a parsed payload: drop malformed/unknown-region entries,
 * de-dupe, and cap at MAX_FAVOURITES so a hand-edited or legacy store can never
 * blow past the limit downstream.
 */
function sanitize(raw: unknown): FavouriteLocation[] {
  if (!Array.isArray(raw)) return [];
  const out: FavouriteLocation[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const f = item as Partial<FavouriteLocation>;
    if (
      typeof f?.regionId !== "string" ||
      typeof f?.townId !== "string" ||
      typeof f?.townName !== "string" ||
      !isKnownRegionId(f.regionId)
    ) {
      continue;
    }
    const dedupeKey = `${f.regionId}/${f.townId}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push({
      regionId: f.regionId,
      townId: f.townId,
      townName: f.townName,
      townNameJa: typeof f.townNameJa === "string" ? f.townNameJa : undefined,
    });
    if (out.length >= MAX_FAVOURITES) break;
  }
  return out;
}

export function readFavourites(): FavouriteLocation[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return sanitize(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeFavourites(list: FavouriteLocation[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_FAVOURITES)));
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* swallow · non-fatal */
  }
}

export function isFavourite(regionId: string, townId: string): boolean {
  return readFavourites().some((f) => sameLocation(f, regionId, townId));
}

export type AddResult = "added" | "exists" | "full";

export function addFavourite(loc: FavouriteLocation): AddResult {
  const list = readFavourites();
  if (list.some((f) => sameLocation(f, loc.regionId, loc.townId))) return "exists";
  if (list.length >= MAX_FAVOURITES) return "full";
  writeFavourites([...list, loc]);
  return "added";
}

export function removeFavourite(regionId: string, townId: string): void {
  const list = readFavourites();
  const next = list.filter((f) => !sameLocation(f, regionId, townId));
  if (next.length !== list.length) writeFavourites(next);
}

export interface ToggleResult {
  /** True if the location is now saved, false if it was removed or blocked. */
  favourited: boolean;
  /** True when the add was refused because the user is already at capacity. */
  full: boolean;
}

export function toggleFavourite(loc: FavouriteLocation): ToggleResult {
  if (isFavourite(loc.regionId, loc.townId)) {
    removeFavourite(loc.regionId, loc.townId);
    return { favourited: false, full: false };
  }
  const result = addFavourite(loc);
  if (result === "full") return { favourited: false, full: true };
  return { favourited: true, full: false };
}

/**
 * Reactive favourites for components. Subscribes to same-tab changes (the
 * custom event dispatched on every write) and cross-tab changes (the native
 * storage event), so a star toggled in one place updates the list elsewhere.
 */
export function useFavourites() {
  const [favourites, setFavourites] = useState<FavouriteLocation[]>([]);

  useEffect(() => {
    const sync = () => setFavourites(readFavourites());
    sync();
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((loc: FavouriteLocation) => toggleFavourite(loc), []);
  const remove = useCallback(
    (regionId: string, townId: string) => removeFavourite(regionId, townId),
    [],
  );
  const has = useCallback(
    (regionId: string, townId: string) =>
      favourites.some((f) => sameLocation(f, regionId, townId)),
    [favourites],
  );

  return {
    favourites,
    isFavourite: has,
    toggle,
    remove,
    isFull: favourites.length >= MAX_FAVOURITES,
  };
}
