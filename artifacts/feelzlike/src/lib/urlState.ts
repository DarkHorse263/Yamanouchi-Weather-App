import { useCallback, useMemo } from "react";
import { useSearch } from "wouter";

import type { RegionSlug, TownSlug } from "@/types/stayEat";

/**
 * Convert a `RegionConfig.id` (kebab-case URL slug, e.g. "snowy-mountains")
 * to the corresponding `RegionSlug` used by the curated dataset
 * (snake_case, e.g. "snowy_mountains"). The two are deliberately separate
 * conventions — kebab in URLs/RegionConfig, snake on disk and in the Zod
 * schemas — so the conversion is centralised here.
 */
export function regionIdToSlug(id: string): RegionSlug {
  return id.replace(/-/g, "_") as RegionSlug;
}

/**
 * Convert a `BaseTown.id` (kebab-case, e.g. "shibu-onsen") to the
 * corresponding `TownSlug` used by the curated dataset (snake_case,
 * e.g. "shibu_onsen"). The two are deliberately separate conventions
 * (kebab in URLs/RegionConfig, snake on disk).
 */
export function townIdToSlug(id: string): TownSlug {
  return id.replace(/-/g, "_") as TownSlug;
}

/**
 * Convert a `MountainLink.id` (kebab-case, e.g. "shiga-kogen") to the
 * snake_case key used inside `Stay.drive_min_to_each_mountain`. The dataset
 * keys are parent-resort granular only — sub-resorts (e.g. "okushiga-kogen")
 * roll up to their parent ("shiga-kogen" → "shiga_kogen"). Pass the
 * resolved parent id (or the mountain itself when it has no parent).
 */
export function mountainIdToDriveKey(id: string): string {
  return id.replace(/-/g, "_");
}

/**
 * Update a single URL search param without touching the rest. `value === null`
 * (or empty string) deletes the param. Uses `history.replaceState` (not push)
 * so successive filter / view changes don't pollute the back-button stack —
 * matches the pattern already used by `StayFilterBar`.
 *
 * Dispatching `popstate` keeps wouter's `useSearch()` subscribers in sync,
 * since wouter listens for popstate to detect URL changes.
 */
export function setUrlParam(key: string, value: string | null): void {
  setUrlParams({ [key]: value });
}

/**
 * Atomic batch update — apply many param changes in a single
 * `replaceState` + `popstate` cycle. Use this when you need to mutate
 * multiple keys at once (e.g. "Clear all filters" round-tripping 14 keys),
 * to avoid 14 separate render cycles and back-stack churn. Pass `null` /
 * empty string to delete a key.
 */
export function setUrlParams(updates: Record<string, string | null>): void {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "") {
      p.delete(key);
    } else {
      p.set(key, value);
    }
  }
  const next = p.toString();
  const url = next
    ? `${window.location.pathname}?${next}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event("popstate"));
}

/**
 * Read a single URL search param (reactive via wouter's `useSearch`) and
 * return a setter that updates that param without touching others. Use this
 * for orthogonal page state like `?view=map` and `?stay={stayId}` that need
 * to coexist with the filter params owned by `StayFilterBar`.
 */
export function useUrlParam(
  key: string,
): [string | null, (value: string | null) => void] {
  const search = useSearch();
  const value = useMemo(
    () => new URLSearchParams(search).get(key),
    [search, key],
  );
  const setter = useCallback(
    (v: string | null) => setUrlParam(key, v),
    [key],
  );
  return [value, setter];
}
