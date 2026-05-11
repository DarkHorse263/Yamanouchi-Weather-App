import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "wouter";
import {
  ChevronDown,
  Filter as FilterIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PriceBand, RegionSlug, Stay } from "@/types/stayEat";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type StaySortKey =
  | "drive_top"
  | "drive_nearest"
  | "price_asc"
  | "price_desc"
  | "name_asc";

// Playbook-pinned filterable type set. The dataset has additional types
// (motel/cabin/bnb/minshuku/guesthouse/resort) that are intentionally NOT
// surfaced as filter chips per Prompt 2.3 spec - they remain in the listing
// but won't appear as toggleable filters.
export const STAY_FILTERABLE_TYPES = [
  "hotel",
  "ryokan",
  "lodge",
  "apartment",
  "airbnb",
  "hostel",
] as const;
export type StayFilterableType = (typeof STAY_FILTERABLE_TYPES)[number];

const STAY_TYPE_LABELS: Record<StayFilterableType, string> = {
  hotel: "Hotel",
  ryokan: "Ryokan",
  lodge: "Lodge",
  apartment: "Apartment",
  airbnb: "Airbnb",
  hostel: "Hostel",
};

const PRICE_BANDS: readonly PriceBand[] = ["$", "$$", "$$$", "$$$$"];

// AU sliders - each is a MAX-distance filter (show stays within X km).
const AU_MAX_KM = 100;
// JP slider - MAX walk-time to Yudanaka Station.
const JP_MAX_WALK_MIN = 30;

export type OnsenFilter = "public" | "private" | "both";
export type TattooFilter = "allowed" | "private_only" | "not_allowed";
// "half_board_or_kaiseki" matches either the curated `half_board` OR
// `kaiseki` enum on Stay.meal_plan - the playbook bundles them as a single
// "Half-board (kaiseki)" UI option.
export type MealFilter = "half_board_or_kaiseki" | "breakfast" | "none";
export type EnglishFilter = "yes" | "limited_or_better";

export interface StayFilters {
  types: StayFilterableType[];
  prices: PriceBand[];
  sort: StaySortKey;
  // AU-only
  dryingRoom: boolean;
  skiStorage: boolean;
  petFriendly: boolean;
  selfContained: boolean;
  maxKmThredbo: number;
  maxKmSkitube: number;
  // JP-only
  onsen: OnsenFilter | null;
  tattoo: TattooFilter | null;
  meal: MealFilter | null;
  english: EnglishFilter | null;
  maxWalkMinStation: number;
}

export const DEFAULT_FILTERS: StayFilters = {
  types: [],
  prices: [],
  sort: "drive_top",
  dryingRoom: false,
  skiStorage: false,
  petFriendly: false,
  selfContained: false,
  maxKmThredbo: AU_MAX_KM,
  maxKmSkitube: AU_MAX_KM,
  onsen: null,
  tattoo: null,
  meal: null,
  english: null,
  maxWalkMinStation: JP_MAX_WALK_MIN,
};

// ──────────────────────────────────────────────────────────────────────────────
// Filter + sort helpers (exported for consumers)
// ──────────────────────────────────────────────────────────────────────────────

export function applyStayFilters(stays: readonly Stay[], filters: StayFilters): Stay[] {
  return stays.filter((s) => {
    if (filters.types.length > 0) {
      const t = s.type as StayFilterableType;
      if (!filters.types.includes(t)) return false;
    }
    if (filters.prices.length > 0) {
      if (!s.price_band || !filters.prices.includes(s.price_band)) return false;
    }
    if (s.country === "AU") {
      if (filters.dryingRoom && s.drying_room !== "yes") return false;
      if (filters.skiStorage && s.ski_storage !== "yes") return false;
      if (filters.petFriendly && s.pet_friendly !== "yes") return false;
      if (filters.selfContained && s.self_contained !== "yes") return false;
      if (filters.maxKmThredbo < AU_MAX_KM) {
        if (typeof s.distance_to_thredbo_km !== "number") return false;
        if (s.distance_to_thredbo_km > filters.maxKmThredbo) return false;
      }
      if (filters.maxKmSkitube < AU_MAX_KM) {
        // Prefer the dedicated skitube field when present, else the perisher
        // field (Skitube is the primary access route to Perisher).
        const km = s.distance_to_skitube_km ?? s.distance_to_perisher_km;
        if (typeof km !== "number") return false;
        if (km > filters.maxKmSkitube) return false;
      }
    } else {
      // JP filters apply to JP rows only - for AU rows they're tacitly
      // ignored above. For JP rows, an active JP filter excludes the row
      // when the field doesn't match.
      if (filters.onsen) {
        if (!s.onsen || s.onsen === "none") return false;
        if (filters.onsen === "both") {
          if (s.onsen !== "both") return false;
        } else if (filters.onsen === "public") {
          if (s.onsen !== "public" && s.onsen !== "both") return false;
        } else if (filters.onsen === "private") {
          if (s.onsen !== "private" && s.onsen !== "both") return false;
        }
      }
      if (filters.tattoo) {
        if (s.tattoo_policy !== filters.tattoo) return false;
      }
      if (filters.meal) {
        if (filters.meal === "half_board_or_kaiseki") {
          if (s.meal_plan !== "half_board" && s.meal_plan !== "kaiseki") return false;
        } else if (filters.meal === "breakfast") {
          if (s.meal_plan !== "breakfast") return false;
        } else if (filters.meal === "none") {
          if (s.meal_plan && s.meal_plan !== "none") return false;
        }
      }
      if (filters.english) {
        if (filters.english === "yes") {
          if (s.english_spoken !== "yes") return false;
        } else {
          // "limited_or_better" → yes OR limited
          if (s.english_spoken !== "yes" && s.english_spoken !== "limited") return false;
        }
      }
      if (filters.maxWalkMinStation < JP_MAX_WALK_MIN) {
        if (typeof s.walk_min_to_yudanaka_station !== "number") return false;
        if (s.walk_min_to_yudanaka_station > filters.maxWalkMinStation) return false;
      }
    }
    return true;
  });
}

const PRICE_RANK: Record<PriceBand, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };

export interface StaySortContext {
  /**
   * Curated key inside `Stay.drive_min_to_each_mountain` for today's #1 mountain
   * (e.g. "thredbo" for Snowy Mountains, "shiga_kogen" for Yamanouchi).
   * Required when `sort === "drive_top"`; if absent or undefined the sort
   * silently falls through to the standard nearest-mountain order.
   */
  topMountainDriveKey?: string;
}

export function applyStaySort(
  stays: readonly Stay[],
  sort: StaySortKey,
  ctx: StaySortContext = {},
): Stay[] {
  const arr = stays.slice();
  switch (sort) {
    case "name_asc":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "price_asc":
      return arr.sort((a, b) => priceVal(a) - priceVal(b));
    case "price_desc":
      return arr.sort((a, b) => priceVal(b) - priceVal(a));
    case "drive_nearest":
      return arr.sort((a, b) => driveNearest(a) - driveNearest(b));
    case "drive_top": {
      const key = ctx.topMountainDriveKey;
      if (!key) return arr.sort((a, b) => driveNearest(a) - driveNearest(b));
      return arr.sort((a, b) => driveToKey(a, key) - driveToKey(b, key));
    }
    default:
      return arr;
  }
}

function priceVal(s: Stay): number {
  return s.price_band ? PRICE_RANK[s.price_band] : Number.POSITIVE_INFINITY;
}

function driveNearest(s: Stay): number {
  return typeof s.drive_min_to_nearest_mountain === "number"
    ? s.drive_min_to_nearest_mountain
    : Number.POSITIVE_INFINITY;
}

function driveToKey(s: Stay, key: string): number {
  const v = s.drive_min_to_each_mountain?.[key];
  return typeof v === "number" ? v : Number.POSITIVE_INFINITY;
}

// ──────────────────────────────────────────────────────────────────────────────
// URL serialization (filters are URL-synced so users can share filtered links)
// ──────────────────────────────────────────────────────────────────────────────

const PRICE_PARAM_MAP: Record<PriceBand, string> = { "$": "1", "$$": "2", "$$$": "3", "$$$$": "4" };
const PARAM_PRICE_MAP: Record<string, PriceBand> = { "1": "$", "2": "$$", "3": "$$$", "4": "$$$$" };

export function parseFiltersFromSearch(search: string): StayFilters {
  const p = new URLSearchParams(search);
  const f = { ...DEFAULT_FILTERS };
  const types = p.get("type");
  if (types) {
    f.types = types
      .split(",")
      .filter((t): t is StayFilterableType =>
        (STAY_FILTERABLE_TYPES as readonly string[]).includes(t),
      );
  }
  const prices = p.get("price");
  if (prices) {
    f.prices = prices
      .split(",")
      .map((d) => PARAM_PRICE_MAP[d])
      .filter((b): b is PriceBand => Boolean(b));
  }
  const sort = p.get("sort");
  if (sort && isValidSort(sort)) f.sort = sort;
  // AU
  f.dryingRoom    = p.get("dry") === "1";
  f.skiStorage    = p.get("ski") === "1";
  f.petFriendly   = p.get("pet") === "1";
  f.selfContained = p.get("self") === "1";
  const kmThredbo = numParam(p.get("kmThredbo"));
  if (kmThredbo != null) f.maxKmThredbo = clamp(kmThredbo, 0, AU_MAX_KM);
  const kmSkitube = numParam(p.get("kmSkitube"));
  if (kmSkitube != null) f.maxKmSkitube = clamp(kmSkitube, 0, AU_MAX_KM);
  // JP
  const onsen = p.get("onsen");
  if (onsen === "public" || onsen === "private" || onsen === "both") f.onsen = onsen;
  const tattoo = p.get("tattoo");
  if (tattoo === "allowed" || tattoo === "private_only" || tattoo === "not_allowed") f.tattoo = tattoo;
  const meal = p.get("meal");
  if (meal === "half_board_or_kaiseki" || meal === "breakfast" || meal === "none") f.meal = meal;
  const english = p.get("en");
  if (english === "yes" || english === "limited_or_better") f.english = english;
  const walk = numParam(p.get("walk"));
  if (walk != null) f.maxWalkMinStation = clamp(walk, 0, JP_MAX_WALK_MIN);
  return f;
}

export function serializeFiltersToSearch(filters: StayFilters): string {
  const p = new URLSearchParams();
  if (filters.types.length > 0) p.set("type", filters.types.join(","));
  if (filters.prices.length > 0) p.set("price", filters.prices.map((b) => PRICE_PARAM_MAP[b]).join(","));
  if (filters.sort !== DEFAULT_FILTERS.sort) p.set("sort", filters.sort);
  if (filters.dryingRoom) p.set("dry", "1");
  if (filters.skiStorage) p.set("ski", "1");
  if (filters.petFriendly) p.set("pet", "1");
  if (filters.selfContained) p.set("self", "1");
  if (filters.maxKmThredbo < AU_MAX_KM) p.set("kmThredbo", String(filters.maxKmThredbo));
  if (filters.maxKmSkitube < AU_MAX_KM) p.set("kmSkitube", String(filters.maxKmSkitube));
  if (filters.onsen) p.set("onsen", filters.onsen);
  if (filters.tattoo) p.set("tattoo", filters.tattoo);
  if (filters.meal) p.set("meal", filters.meal);
  if (filters.english) p.set("en", filters.english);
  if (filters.maxWalkMinStation < JP_MAX_WALK_MIN) p.set("walk", String(filters.maxWalkMinStation));
  return p.toString();
}

function isValidSort(s: string): s is StaySortKey {
  return s === "drive_top" || s === "drive_nearest" || s === "price_asc" || s === "price_desc" || s === "name_asc";
}
function numParam(v: string | null): number | null {
  if (v == null) return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function getActiveFilterCount(f: StayFilters): number {
  let n = 0;
  n += f.types.length;
  n += f.prices.length;
  if (f.dryingRoom) n++;
  if (f.skiStorage) n++;
  if (f.petFriendly) n++;
  if (f.selfContained) n++;
  if (f.maxKmThredbo < AU_MAX_KM) n++;
  if (f.maxKmSkitube < AU_MAX_KM) n++;
  if (f.onsen) n++;
  if (f.tattoo) n++;
  if (f.meal) n++;
  if (f.english) n++;
  if (f.maxWalkMinStation < JP_MAX_WALK_MIN) n++;
  return n;
}

// ──────────────────────────────────────────────────────────────────────────────
// URL state hook
// ──────────────────────────────────────────────────────────────────────────────

// Filter param keys this bar owns. We only delete/write these on URL sync so
// orthogonal page state (e.g. `?view=map` / `?stay={id}` set by TownStay)
// survives a filter change. Keep in sync with parseFiltersFromSearch /
// serializeFiltersToSearch - any new filter key MUST be added here too.
const FILTER_PARAM_KEYS = [
  "type",
  "price",
  "sort",
  "dry",
  "ski",
  "pet",
  "self",
  "kmThredbo",
  "kmSkitube",
  "onsen",
  "tattoo",
  "meal",
  "en",
  "walk",
] as const;

function setUrlSearch(next: string): void {
  // history.replaceState bypasses base-path concerns and works with any
  // wouter base config. Dispatching popstate notifies wouter's useSearch
  // subscribers so the read-side stays consistent with the URL.
  //
  // Preserve non-filter params: read current URL, delete the keys we own,
  // then layer the new filter values on top. This keeps `view` and `stay`
  // intact when the filter bar writes.
  const cur = new URLSearchParams(window.location.search);
  for (const k of FILTER_PARAM_KEYS) cur.delete(k);
  const incoming = new URLSearchParams(next);
  for (const [k, v] of incoming) cur.append(k, v);
  const merged = cur.toString();
  const url = merged
    ? `${window.location.pathname}?${merged}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event("popstate"));
}

function useUrlFilters(): [StayFilters, (next: StayFilters) => void] {
  const search = useSearch();
  const filters = useMemo(() => parseFiltersFromSearch(search), [search]);
  const setFilters = useCallback((next: StayFilters) => {
    setUrlSearch(serializeFiltersToSearch(next));
  }, []);
  return [filters, setFilters];
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function TypeChips({
  available,
  value,
  onChange,
}: {
  available: readonly StayFilterableType[];
  value: readonly StayFilterableType[];
  onChange: (next: StayFilterableType[]) => void;
}) {
  if (available.length === 0) return null;
  return (
    <ToggleGroup
      type="multiple"
      value={value as string[]}
      onValueChange={(vs) =>
        onChange(
          vs.filter((v): v is StayFilterableType =>
            (STAY_FILTERABLE_TYPES as readonly string[]).includes(v),
          ),
        )
      }
      className="flex-wrap justify-start"
      aria-label="Filter by stay type"
    >
      {available.map((t) => (
        <ToggleGroupItem
          key={t}
          value={t}
          size="sm"
          variant="outline"
          className="rounded-full px-3 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground"
        >
          {STAY_TYPE_LABELS[t]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function PriceChips({
  value,
  onChange,
}: {
  value: readonly PriceBand[];
  onChange: (next: PriceBand[]) => void;
}) {
  return (
    <ToggleGroup
      type="multiple"
      value={value as string[]}
      onValueChange={(vs) => onChange(vs.filter((v): v is PriceBand => v in PRICE_RANK))}
      className="flex-wrap justify-start"
      aria-label="Filter by price band"
    >
      {PRICE_BANDS.map((b) => (
        <ToggleGroupItem
          key={b}
          value={b}
          size="sm"
          variant="outline"
          className="rounded-full px-3 text-xs font-bold data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground"
        >
          {b}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function SortSelect({
  value,
  onChange,
  hasTopMountain,
}: {
  value: StaySortKey;
  onChange: (next: StaySortKey) => void;
  hasTopMountain: boolean;
}) {
  // When today's #1 mountain isn't resolvable yet, the "drive_top" item is
  // disabled - but the URL/default sort may still be "drive_top". Visually
  // fall back to "drive_nearest" in the trigger so the user doesn't see a
  // disabled item as the active value. The underlying state is left alone;
  // applyStaySort already silently falls through to nearest-mountain order
  // when topMountainDriveKey is absent.
  const effectiveValue = !hasTopMountain && value === "drive_top" ? "drive_nearest" : value;
  return (
    <Select value={effectiveValue} onValueChange={(v) => onChange(v as StaySortKey)}>
      <SelectTrigger className="h-9 text-xs w-auto min-w-[200px]" aria-label="Sort stays">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="drive_top" disabled={!hasTopMountain}>
          {hasTopMountain ? "Drive time to today's #1 mountain" : "Drive to today's #1 (no data)"}
        </SelectItem>
        <SelectItem value="drive_nearest">Drive time to nearest mountain</SelectItem>
        <SelectItem value="price_asc">Price: low to high</SelectItem>
        <SelectItem value="price_desc">Price: high to low</SelectItem>
        <SelectItem value="name_asc">Name A-Z</SelectItem>
      </SelectContent>
    </Select>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md py-1.5 px-2 hover:bg-muted/40 cursor-pointer">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        className="h-4 w-4 accent-foreground"
        aria-label={label}
      />
    </label>
  );
}

function MaxSlider({
  label,
  unit,
  value,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm">{label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value >= max ? `Any` : `≤ ${value}${unit}`}
        </span>
      </div>
      <Slider
        min={0}
        max={max}
        step={max <= 30 ? 1 : 5}
        value={[value]}
        onValueChange={(vs) => onChange(vs[0] ?? max)}
        aria-label={label}
      />
    </div>
  );
}

function NSWFilters({
  filters,
  patch,
}: {
  filters: StayFilters;
  patch: (next: Partial<StayFilters>) => void;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
        Snowy Mountains
      </h3>
      <div className="space-y-1">
        <CheckRow label="Drying room" checked={filters.dryingRoom} onChange={(v) => patch({ dryingRoom: v })} />
        <CheckRow label="Ski storage" checked={filters.skiStorage} onChange={(v) => patch({ skiStorage: v })} />
        <CheckRow label="Pet-friendly" checked={filters.petFriendly} onChange={(v) => patch({ petFriendly: v })} />
        <CheckRow label="Self-contained (kitchen)" checked={filters.selfContained} onChange={(v) => patch({ selfContained: v })} />
      </div>
      <MaxSlider
        label="Distance to Thredbo"
        unit="km"
        value={filters.maxKmThredbo}
        max={AU_MAX_KM}
        onChange={(v) => patch({ maxKmThredbo: v })}
      />
      <MaxSlider
        label="Distance to Skitube / Perisher"
        unit="km"
        value={filters.maxKmSkitube}
        max={AU_MAX_KM}
        onChange={(v) => patch({ maxKmSkitube: v })}
      />
    </section>
  );
}

function JPFilters({
  filters,
  patch,
}: {
  filters: StayFilters;
  patch: (next: Partial<StayFilters>) => void;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
        Yamanouchi
      </h3>
      <SingleSelect
        label="Onsen"
        value={filters.onsen}
        onChange={(v) => patch({ onsen: v as OnsenFilter | null })}
        options={[
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
          { value: "both", label: "Both" },
        ]}
      />
      <SingleSelect
        label="Tattoo policy"
        value={filters.tattoo}
        onChange={(v) => patch({ tattoo: v as TattooFilter | null })}
        options={[
          { value: "allowed", label: "Allowed" },
          { value: "private_only", label: "Private only" },
          { value: "not_allowed", label: "Not allowed" },
        ]}
      />
      <SingleSelect
        label="Meal plan"
        value={filters.meal}
        onChange={(v) => patch({ meal: v as MealFilter | null })}
        options={[
          { value: "half_board_or_kaiseki", label: "Half-board (kaiseki)" },
          { value: "breakfast", label: "Breakfast only" },
          { value: "none", label: "None" },
        ]}
      />
      <SingleSelect
        label="English-spoken"
        value={filters.english}
        onChange={(v) => patch({ english: v as EnglishFilter | null })}
        options={[
          { value: "yes", label: "Fluent" },
          { value: "limited_or_better", label: "Limited or better" },
        ]}
      />
      <MaxSlider
        label="Walk to Yudanaka Station"
        unit=" min"
        value={filters.maxWalkMinStation}
        max={JP_MAX_WALK_MIN}
        onChange={(v) => patch({ maxWalkMinStation: v })}
      />
    </section>
  );
}

const ALL_VALUE = "__all__";

function SingleSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | null;
  onChange: (next: string | null) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-sm mb-1.5">{label}</div>
      <Select
        value={value ?? ALL_VALUE}
        onValueChange={(v) => onChange(v === ALL_VALUE ? null : v)}
      >
        <SelectTrigger className="h-9 text-xs" aria-label={label}>
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface ActiveChip {
  key: string;
  label: string;
  remove: () => void;
}

function buildActiveChips(
  filters: StayFilters,
  patch: (n: Partial<StayFilters>) => void,
  region: RegionSlug,
): ActiveChip[] {
  const chips: ActiveChip[] = [];
  for (const t of filters.types) {
    chips.push({
      key: `type:${t}`,
      label: STAY_TYPE_LABELS[t],
      remove: () => patch({ types: filters.types.filter((x) => x !== t) }),
    });
  }
  for (const b of filters.prices) {
    chips.push({
      key: `price:${b}`,
      label: b,
      remove: () => patch({ prices: filters.prices.filter((x) => x !== b) }),
    });
  }
  // Region-specific chips: only render the chips whose underlying control is
  // ALSO rendered for the current region, so a NSW user with a stale `?onsen=`
  // in the URL doesn't see an "Onsen: Public" chip with no matching control.
  if (region === "snowy_mountains") {
    if (filters.dryingRoom) chips.push({ key: "dry", label: "Drying room", remove: () => patch({ dryingRoom: false }) });
    if (filters.skiStorage) chips.push({ key: "ski", label: "Ski storage", remove: () => patch({ skiStorage: false }) });
    if (filters.petFriendly) chips.push({ key: "pet", label: "Pet-friendly", remove: () => patch({ petFriendly: false }) });
    if (filters.selfContained) chips.push({ key: "self", label: "Self-contained", remove: () => patch({ selfContained: false }) });
    if (filters.maxKmThredbo < AU_MAX_KM) {
      chips.push({
        key: "kmThredbo",
        label: `≤ ${filters.maxKmThredbo}km Thredbo`,
        remove: () => patch({ maxKmThredbo: AU_MAX_KM }),
      });
    }
    if (filters.maxKmSkitube < AU_MAX_KM) {
      chips.push({
        key: "kmSkitube",
        label: `≤ ${filters.maxKmSkitube}km Skitube`,
        remove: () => patch({ maxKmSkitube: AU_MAX_KM }),
      });
    }
  } else {
    if (filters.onsen) {
      chips.push({
        key: "onsen",
        label: `Onsen: ${filters.onsen[0].toUpperCase() + filters.onsen.slice(1)}`,
        remove: () => patch({ onsen: null }),
      });
    }
    if (filters.tattoo) {
      const labels: Record<TattooFilter, string> = {
        allowed: "Allowed",
        private_only: "Private only",
        not_allowed: "Not allowed",
      };
      chips.push({
        key: "tattoo",
        label: `Tattoo: ${labels[filters.tattoo]}`,
        remove: () => patch({ tattoo: null }),
      });
    }
    if (filters.meal) {
      const labels: Record<MealFilter, string> = {
        half_board_or_kaiseki: "Half-board (kaiseki)",
        breakfast: "Breakfast only",
        none: "No meals",
      };
      chips.push({
        key: "meal",
        label: labels[filters.meal],
        remove: () => patch({ meal: null }),
      });
    }
    if (filters.english) {
      const labels: Record<EnglishFilter, string> = {
        yes: "EN: Fluent",
        limited_or_better: "EN: Limited+",
      };
      chips.push({
        key: "english",
        label: labels[filters.english],
        remove: () => patch({ english: null }),
      });
    }
    if (filters.maxWalkMinStation < JP_MAX_WALK_MIN) {
      chips.push({
        key: "walk",
        label: `≤ ${filters.maxWalkMinStation} min walk`,
        remove: () => patch({ maxWalkMinStation: JP_MAX_WALK_MIN }),
      });
    }
  }
  return chips;
}

function ActiveChipsRow({
  chips,
  onClearAll,
}: {
  chips: ActiveChip[];
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.remove}
          className="inline-flex items-center gap-1 rounded-full bg-foreground/5 hover:bg-foreground/10 px-2.5 py-0.5 text-[11px] font-semibold text-foreground/85 transition-colors"
          aria-label={`Remove filter ${c.label}`}
        >
          {c.label}
          <X className="h-3 w-3" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-foreground/60 hover:text-foreground transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export interface StayFilterBarProps {
  stays: readonly Stay[];
  region: RegionSlug;
  onChange: (filters: StayFilters) => void;
  /**
   * Curated mountain key inside `Stay.drive_min_to_each_mountain` that
   * represents today's #1 mountain (e.g. "thredbo", "shiga_kogen"). When
   * provided, the default sort uses it; when absent, the sort dropdown
   * disables the "drive to today's #1" option and the filter bar falls
   * through to nearest-mountain sort.
   */
  topMountainDriveKey?: string;
  /** Optional override for the result count caption. */
  resultCount?: number;
  /** className for the outer wrapper so the consumer can position it. */
  className?: string;
  /**
   * Sticky offset from the top of the viewport (px). Defaults to 0; consumer
   * passes the height of any persistent header (e.g. AppShell topbar = 64).
   */
  stickyTop?: number;
}

export function StayFilterBar({
  stays,
  region,
  onChange,
  topMountainDriveKey,
  resultCount,
  className,
  stickyTop = 0,
}: StayFilterBarProps) {
  const [filters, setFilters] = useUrlFilters();
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = useState(false);

  // Derive available types from the dataset (intersection with playbook set).
  const availableTypes = useMemo(() => {
    const present = new Set(stays.map((s) => s.type));
    return STAY_FILTERABLE_TYPES.filter((t) => present.has(t));
  }, [stays]);

  // Re-emit filters whenever URL state changes so the consumer can re-apply
  // them. Calling onChange in an effect (not in render) keeps React happy
  // about not setting parent state during a child render. We compare the
  // serialized form to the last emission so identical URL syncs (e.g. a
  // popstate dispatch echoing the same query) don't cause spurious re-emits
  // for the consumer.
  const lastEmittedRef = useRef<string | null>(null);
  useEffect(() => {
    const serialized = serializeFiltersToSearch(filters);
    if (serialized === lastEmittedRef.current) return;
    lastEmittedRef.current = serialized;
    onChange(filters);
  }, [filters, onChange]);

  const patch = useCallback(
    (next: Partial<StayFilters>) => setFilters({ ...filters, ...next }),
    [filters, setFilters],
  );
  const clearAll = useCallback(() => setFilters(DEFAULT_FILTERS), [setFilters]);

  const filtered = useMemo(() => {
    if (typeof resultCount === "number") return resultCount;
    return applyStayFilters(stays, filters).length;
  }, [stays, filters, resultCount]);

  const total = stays.length;
  const activeCount = getActiveFilterCount(filters);
  const chips = useMemo(() => buildActiveChips(filters, patch, region), [filters, patch, region]);

  const regionFilters =
    region === "snowy_mountains" ? (
      <NSWFilters filters={filters} patch={patch} />
    ) : (
      <JPFilters filters={filters} patch={patch} />
    );

  const moreFiltersTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="h-9 text-xs gap-1.5"
      aria-label={isMobile ? "Open filters" : "More filters"}
    >
      {isMobile ? <FilterIcon className="h-3.5 w-3.5" aria-hidden /> : <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />}
      {isMobile ? "Filters" : "More filters"}
      {activeCount > 0 ? (
        <span
          className="inline-flex items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold h-4 min-w-4 px-1"
          aria-label={`${activeCount} active`}
        >
          {activeCount}
        </span>
      ) : (
        <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
      )}
    </Button>
  );

  return (
    <div
      className={cn(
        "sticky z-30 bg-background/95 backdrop-blur-sm border-b border-border",
        className,
      )}
      style={{ top: stickyTop }}
    >
      <div className="px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {!isMobile ? (
            <>
              <TypeChips
                available={availableTypes}
                value={filters.types}
                onChange={(v) => patch({ types: v })}
              />
              <span aria-hidden className="h-5 w-px bg-border mx-1" />
              <PriceChips value={filters.prices} onChange={(v) => patch({ prices: v })} />
              <span aria-hidden className="h-5 w-px bg-border mx-1" />
              <SortSelect
                value={filters.sort}
                onChange={(v) => patch({ sort: v })}
                hasTopMountain={Boolean(topMountainDriveKey)}
              />
              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>{moreFiltersTrigger}</SheetTrigger>
                <FilterSheetContent regionFilters={regionFilters} onClearAll={clearAll} onClose={() => setMoreOpen(false)} activeCount={activeCount} />
              </Sheet>
            </>
          ) : (
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>{moreFiltersTrigger}</SheetTrigger>
              <FilterSheetContent
                regionFilters={
                  <>
                    <section className="space-y-2">
                      <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">Type</h3>
                      <TypeChips
                        available={availableTypes}
                        value={filters.types}
                        onChange={(v) => patch({ types: v })}
                      />
                    </section>
                    <section className="space-y-2">
                      <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">Price</h3>
                      <PriceChips value={filters.prices} onChange={(v) => patch({ prices: v })} />
                    </section>
                    <section className="space-y-2">
                      <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">Sort</h3>
                      <SortSelect
                        value={filters.sort}
                        onChange={(v) => patch({ sort: v })}
                        hasTopMountain={Boolean(topMountainDriveKey)}
                      />
                    </section>
                    {regionFilters}
                  </>
                }
                onClearAll={clearAll}
                onClose={() => setMoreOpen(false)}
                activeCount={activeCount}
              />
            </Sheet>
          )}

          <div className="ml-auto text-[11px] tabular-nums text-muted-foreground" aria-live="polite">
            Showing <span className="font-semibold text-foreground">{filtered}</span> of {total} stays
          </div>
        </div>

        {chips.length > 0 ? <ActiveChipsRow chips={chips} onClearAll={clearAll} /> : null}
      </div>
    </div>
  );
}

function FilterSheetContent({
  regionFilters,
  onClearAll,
  onClose,
  activeCount,
}: {
  regionFilters: React.ReactNode;
  onClearAll: () => void;
  onClose: () => void;
  activeCount: number;
}) {
  return (
    <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="font-display text-xl">Filter stays</SheetTitle>
        <SheetDescription className="sr-only">
          Refine the stay list by type, price, mountain access, and region-specific amenities.
        </SheetDescription>
      </SheetHeader>
      <div className="py-4 space-y-6">{regionFilters}</div>
      <SheetFooter className="flex-row justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onClearAll} disabled={activeCount === 0}>
          Clear all{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
        <Button size="sm" onClick={onClose}>
          Show results
        </Button>
      </SheetFooter>
    </SheetContent>
  );
}
