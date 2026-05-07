import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "wouter";
import {
  Check,
  ChevronDown,
  Filter as FilterIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { isOpenNow } from "@/lib/openNow";
import { cn } from "@/lib/utils";
import type { Eat, PriceBand, RegionSlug } from "@/types/stayEat";

// ──────────────────────────────────────────────────────────────────────────────
// Eat-specific shape: filters tuned for restaurant discovery.
//
// DRY note: This bar mirrors `StayFilterBar`'s URL-sync, sticky-shell, sheet
// trigger, and "active chips" structure. The two were left as siblings rather
// than extracted to a generic primitive because (a) the filter sets diverge
// significantly (no cuisine/openNow on stays, no onsen/tattoo on eats) and
// (b) the URL parser/serializer is coupled to its own key set. If a third
// filter bar ever lands, refactor `MaxSlider`/`CheckRow`/`SingleSelect` and
// `FilterSheetContent` into `lib/filterPrimitives.tsx`.
// ──────────────────────────────────────────────────────────────────────────────

// Playbook-pinned filterable type set. The dataset has additional types
// (bottle_shop / fast_food / diner / food_truck / minshuku-equivalents) that
// are intentionally NOT surfaced as filter chips - they remain in the
// listing but won't appear as toggleable filters. "Soba" is surfaced via
// the cuisine multi-select rather than a type chip (the schema has no
// `soba` type; soba shops are stored as `restaurant` with `cuisine: ["soba"]`).
export const EAT_FILTERABLE_TYPES = [
  "restaurant",
  "izakaya",
  "cafe",
  "bar",
  "pub",
  "ramen",
  "bakery",
  "grocery",
  "fuel",
] as const;
export type EatFilterableType = (typeof EAT_FILTERABLE_TYPES)[number];

const EAT_TYPE_LABELS: Record<EatFilterableType, string> = {
  restaurant: "Restaurant",
  izakaya:    "Izakaya",
  cafe:       "Cafe",
  bar:        "Bar",
  pub:        "Pub",
  ramen:      "Ramen",
  bakery:     "Bakery",
  grocery:    "Grocery",
  fuel:       "Fuel",
};

// Filter chip → underlying schema type(s). "Grocery" rolls up the
// `supermarket` and `grocery` schema types; "Fuel" maps to
// `service-station`. All others are 1:1.
const TYPE_CHIP_MATCHES: Record<EatFilterableType, ReadonlyArray<Eat["type"]>> = {
  restaurant: ["restaurant"],
  izakaya:    ["izakaya"],
  cafe:       ["cafe"],
  bar:        ["bar"],
  pub:        ["pub"],
  ramen:      ["ramen"],
  bakery:     ["bakery"],
  grocery:    ["grocery", "supermarket"],
  fuel:       ["service-station"],
};

const PRICE_BANDS: readonly PriceBand[] = ["$", "$$", "$$$", "$$$$"];

export type EatSortKey = "open_first" | "price_asc" | "price_desc" | "name_asc";

export type EnglishMenuFilter = "yes" | "picture_or_better" | "limited_or_better";
export type PaymentFilter = "cards_accepted";
export type VegFilter = "yes" | "limited_or_better";

export interface EatFilters {
  types: EatFilterableType[];
  cuisines: string[];
  prices: PriceBand[];
  openNow: boolean;
  sort: EatSortKey;
  // NSW-only
  apresSki: boolean;
  takeaway: boolean;
  groceries: boolean;
  // JP-only
  englishMenu: EnglishMenuFilter | null;
  payment: PaymentFilter | null;
  vegetarian: VegFilter | null;
  kidFriendly: boolean;
}

export const DEFAULT_EAT_FILTERS: EatFilters = {
  types: [],
  cuisines: [],
  prices: [],
  openNow: false,
  sort: "open_first",
  apresSki: false,
  takeaway: false,
  groceries: false,
  englishMenu: null,
  payment: null,
  vegetarian: null,
  kidFriendly: false,
};

// ──────────────────────────────────────────────────────────────────────────────
// Filter + sort helpers (exported for consumers - mirrors StayFilterBar).
// ──────────────────────────────────────────────────────────────────────────────

export function applyEatFilters(eats: readonly Eat[], filters: EatFilters): Eat[] {
  // Pre-compute the union of allowed schema types when type chips are active.
  // Empty `filters.types` means "no type filter applied" - pass everything.
  const typeSet =
    filters.types.length === 0
      ? null
      : new Set<Eat["type"]>(
          filters.types.flatMap((c) => TYPE_CHIP_MATCHES[c]),
        );
  // Cuisine match is case-insensitive (curated data mixes "Japanese" /
  // "japanese" / "Japanese fusion" - see survey output) and uses substring
  // semantics so a "japanese" filter matches both "Japanese" and "Japanese
  // small plates".
  const cuisineSet =
    filters.cuisines.length === 0
      ? null
      : new Set(filters.cuisines.map((c) => c.toLowerCase()));

  return eats.filter((e) => {
    if (typeSet && !typeSet.has(e.type)) return false;
    if (cuisineSet) {
      const has = e.cuisine.some((c) => cuisineSet.has(c.toLowerCase()));
      if (!has) return false;
    }
    if (filters.prices.length > 0) {
      if (!e.price_band || !filters.prices.includes(e.price_band)) return false;
    }
    if (filters.openNow) {
      // Until Prompt 3.4 plugs in real timezone-aware logic, isOpenNow
      // returns 'unknown' for everything → "open now" filter behaves as
      // "show eats with verified hours that are currently open". Treats
      // 'closing_soon' as open (still possible to walk in).
      const status = isOpenNow(e).status;
      if (status !== "open" && status !== "closing_soon") return false;
    }
    if (e.country === "AU") {
      if (filters.apresSki && e.apres_ski !== "yes") return false;
      if (filters.takeaway && e.takeaway !== "yes") return false;
      if (filters.groceries && e.groceries !== "yes") return false;
    } else {
      if (filters.englishMenu) {
        const m = e.english_menu;
        if (filters.englishMenu === "yes") {
          if (m !== "yes") return false;
        } else if (filters.englishMenu === "picture_or_better") {
          if (m !== "yes" && m !== "picture_menu") return false;
        } else {
          // "limited_or_better"
          if (m !== "yes" && m !== "picture_menu" && m !== "limited") return false;
        }
      }
      if (filters.payment === "cards_accepted") {
        if (e.payment !== "cards_accepted" && e.payment !== "both") return false;
      }
      if (filters.vegetarian) {
        const v = e.vegetarian_friendly;
        if (filters.vegetarian === "yes") {
          if (v !== "yes") return false;
        } else {
          if (v !== "yes" && v !== "limited") return false;
        }
      }
      if (filters.kidFriendly) {
        if (e.kid_friendly !== "yes" && e.kid_friendly !== "limited") return false;
      }
    }
    return true;
  });
}

const PRICE_RANK: Record<PriceBand, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
// open_first sort uses numeric rank; lower = nearer the top.
const OPEN_RANK: Record<ReturnType<typeof isOpenNow>["status"], number> = {
  open: 0,
  closing_soon: 1,
  unknown: 2,
  closed: 3,
};

export function applyEatSort(eats: readonly Eat[], sort: EatSortKey): Eat[] {
  const arr = eats.slice();
  switch (sort) {
    case "name_asc":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "price_asc":
      return arr.sort((a, b) => priceVal(a) - priceVal(b));
    case "price_desc":
      return arr.sort((a, b) => priceVal(b) - priceVal(a));
    case "open_first":
      return arr.sort((a, b) => {
        const ra = OPEN_RANK[isOpenNow(a).status];
        const rb = OPEN_RANK[isOpenNow(b).status];
        if (ra !== rb) return ra - rb;
        // Tie-break on name so the order is stable visit-to-visit.
        return a.name.localeCompare(b.name);
      });
    default:
      return arr;
  }
}

function priceVal(e: Eat): number {
  return e.price_band ? PRICE_RANK[e.price_band] : Number.POSITIVE_INFINITY;
}

// ──────────────────────────────────────────────────────────────────────────────
// URL serialization - same pattern as StayFilterBar (defensive parse,
// minimal serialize, omit defaults).
// ──────────────────────────────────────────────────────────────────────────────

const PRICE_PARAM_MAP: Record<PriceBand, string> = { "$": "1", "$$": "2", "$$$": "3", "$$$$": "4" };
const PARAM_PRICE_MAP: Record<string, PriceBand> = { "1": "$", "2": "$$", "3": "$$$", "4": "$$$$" };

export function parseEatFiltersFromSearch(search: string): EatFilters {
  const p = new URLSearchParams(search);
  const f: EatFilters = { ...DEFAULT_EAT_FILTERS };
  const types = p.get("type");
  if (types) {
    f.types = types
      .split(",")
      .filter((t): t is EatFilterableType =>
        (EAT_FILTERABLE_TYPES as readonly string[]).includes(t),
      );
  }
  const cuisines = p.get("cuisine");
  if (cuisines) {
    // Cuisine values are user-data-derived - be lenient on parse but cap
    // length so a malicious URL can't blow the query string.
    f.cuisines = cuisines
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && c.length <= 60)
      .slice(0, 20);
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
  f.openNow      = p.get("open") === "1";
  // NSW
  f.apresSki     = p.get("apres") === "1";
  f.takeaway     = p.get("take") === "1";
  f.groceries    = p.get("groc") === "1";
  // JP
  const en = p.get("en");
  if (en === "yes" || en === "picture_or_better" || en === "limited_or_better") f.englishMenu = en;
  if (p.get("pay") === "cards") f.payment = "cards_accepted";
  const veg = p.get("veg");
  if (veg === "yes" || veg === "limited_or_better") f.vegetarian = veg;
  f.kidFriendly  = p.get("kid") === "1";
  return f;
}

export function serializeEatFiltersToSearch(filters: EatFilters): string {
  const p = new URLSearchParams();
  if (filters.types.length > 0) p.set("type", filters.types.join(","));
  if (filters.cuisines.length > 0) p.set("cuisine", filters.cuisines.join(","));
  if (filters.prices.length > 0) p.set("price", filters.prices.map((b) => PRICE_PARAM_MAP[b]).join(","));
  if (filters.sort !== DEFAULT_EAT_FILTERS.sort) p.set("sort", filters.sort);
  if (filters.openNow) p.set("open", "1");
  if (filters.apresSki) p.set("apres", "1");
  if (filters.takeaway) p.set("take", "1");
  if (filters.groceries) p.set("groc", "1");
  if (filters.englishMenu) p.set("en", filters.englishMenu);
  if (filters.payment === "cards_accepted") p.set("pay", "cards");
  if (filters.vegetarian) p.set("veg", filters.vegetarian);
  if (filters.kidFriendly) p.set("kid", "1");
  return p.toString();
}

function isValidSort(s: string): s is EatSortKey {
  return s === "open_first" || s === "price_asc" || s === "price_desc" || s === "name_asc";
}

export function getActiveEatFilterCount(f: EatFilters): number {
  let n = 0;
  n += f.types.length;
  n += f.cuisines.length;
  n += f.prices.length;
  if (f.openNow) n++;
  if (f.apresSki) n++;
  if (f.takeaway) n++;
  if (f.groceries) n++;
  if (f.englishMenu) n++;
  if (f.payment) n++;
  if (f.vegetarian) n++;
  if (f.kidFriendly) n++;
  return n;
}

// ──────────────────────────────────────────────────────────────────────────────
// URL state hook - preserves non-filter params (e.g. ?view=map / ?eat={id})
// the same way StayFilterBar does.
// ──────────────────────────────────────────────────────────────────────────────

const EAT_FILTER_PARAM_KEYS = [
  "type",
  "cuisine",
  "price",
  "sort",
  "open",
  "apres",
  "take",
  "groc",
  "en",
  "pay",
  "veg",
  "kid",
] as const;

function setUrlSearch(next: string): void {
  // Mirrors StayFilterBar.setUrlSearch - read current URL, delete only the
  // keys we own, layer the new filter values on top, replaceState +
  // popstate so wouter's useSearch subscribers re-read.
  const cur = new URLSearchParams(window.location.search);
  for (const k of EAT_FILTER_PARAM_KEYS) cur.delete(k);
  const incoming = new URLSearchParams(next);
  for (const [k, v] of incoming) cur.append(k, v);
  const merged = cur.toString();
  const url = merged
    ? `${window.location.pathname}?${merged}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event("popstate"));
}

function useUrlEatFilters(): [EatFilters, (next: EatFilters) => void] {
  const search = useSearch();
  const filters = useMemo(() => parseEatFiltersFromSearch(search), [search]);
  const setFilters = useCallback((next: EatFilters) => {
    setUrlSearch(serializeEatFiltersToSearch(next));
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
  available: readonly EatFilterableType[];
  value: readonly EatFilterableType[];
  onChange: (next: EatFilterableType[]) => void;
}) {
  if (available.length === 0) return null;
  return (
    <ToggleGroup
      type="multiple"
      value={value as string[]}
      onValueChange={(vs) =>
        onChange(
          vs.filter((v): v is EatFilterableType =>
            (EAT_FILTERABLE_TYPES as readonly string[]).includes(v),
          ),
        )
      }
      className="flex-wrap justify-start"
      aria-label="Filter by eat type"
    >
      {available.map((t) => (
        <ToggleGroupItem
          key={t}
          value={t}
          size="sm"
          variant="outline"
          className="rounded-full px-3 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground"
        >
          {EAT_TYPE_LABELS[t]}
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

function OpenNowToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Button
      type="button"
      variant={value ? "default" : "outline"}
      size="sm"
      className={cn(
        "h-9 text-xs gap-1.5",
        value && "bg-foreground text-background",
      )}
      aria-pressed={value}
      onClick={() => onChange(!value)}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          value ? "bg-emerald-300" : "bg-emerald-500",
        )}
      />
      Open now
    </Button>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: EatSortKey;
  onChange: (next: EatSortKey) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as EatSortKey)}>
      <SelectTrigger className="h-9 text-xs w-auto min-w-[160px]" aria-label="Sort eats">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="open_first">Open now first</SelectItem>
        <SelectItem value="price_asc">Price: low to high</SelectItem>
        <SelectItem value="price_desc">Price: high to low</SelectItem>
        <SelectItem value="name_asc">Name A–Z</SelectItem>
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

// Cuisine multi-select - grouped popover with check marks. Built as a flat
// list (not a command-palette) because the cuisine union per town is
// typically <30 items and a flat grid scans faster than a search box.
function CuisineMultiSelect({
  available,
  value,
  onChange,
}: {
  available: readonly string[];
  value: readonly string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = new Set(value.map((v) => v.toLowerCase()));
  if (available.length === 0) return null;
  const toggle = (c: string) => {
    const lc = c.toLowerCase();
    if (selected.has(lc)) {
      onChange(value.filter((v) => v.toLowerCase() !== lc));
    } else {
      onChange([...value, c]);
    }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-1.5"
          aria-label={`Filter by cuisine (${value.length} selected)`}
        >
          Cuisine
          {value.length > 0 ? (
            <span className="inline-flex items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold h-4 min-w-4 px-1">
              {value.length}
            </span>
          ) : (
            <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="max-h-64 overflow-y-auto py-1.5">
          {available.map((c) => {
            const isSel = selected.has(c.toLowerCase());
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted/60"
                aria-pressed={isSel}
              >
                <span className={cn("truncate", isSel && "font-semibold")}>{c}</span>
                {isSel ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
        {value.length > 0 ? (
          <div className="border-t border-border px-2 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-[11px]"
              onClick={() => onChange([])}
            >
              Clear cuisine
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function NSWFilters({
  filters,
  patch,
}: {
  filters: EatFilters;
  patch: (next: Partial<EatFilters>) => void;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
        Snowy Mountains
      </h3>
      <div className="space-y-1">
        <CheckRow
          label="Après-ski (open after 5pm + alcohol)"
          checked={filters.apresSki}
          onChange={(v) => patch({ apresSki: v })}
        />
        <CheckRow
          label="Takeaway available"
          checked={filters.takeaway}
          onChange={(v) => patch({ takeaway: v })}
        />
        <CheckRow
          label="Has groceries (IGA, bakery, bottle-o)"
          checked={filters.groceries}
          onChange={(v) => patch({ groceries: v })}
        />
      </div>
    </section>
  );
}

function JPFilters({
  filters,
  patch,
}: {
  filters: EatFilters;
  patch: (next: Partial<EatFilters>) => void;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
        Yamanouchi
      </h3>
      <SingleSelect
        label="English support"
        value={filters.englishMenu}
        onChange={(v) => patch({ englishMenu: v as EnglishMenuFilter | null })}
        options={[
          { value: "yes",                label: "EN menu" },
          { value: "picture_or_better",  label: "Picture menu or better" },
          { value: "limited_or_better",  label: "Limited or better" },
        ]}
      />
      <SingleSelect
        label="Payment"
        value={filters.payment}
        onChange={(v) => patch({ payment: v as PaymentFilter | null })}
        options={[
          { value: "cards_accepted", label: "Cards accepted (excludes cash-only)" },
        ]}
      />
      <SingleSelect
        label="Vegetarian-friendly"
        value={filters.vegetarian}
        onChange={(v) => patch({ vegetarian: v as VegFilter | null })}
        options={[
          { value: "yes",                label: "Yes" },
          { value: "limited_or_better",  label: "Yes or limited" },
        ]}
      />
      <CheckRow
        label="Kid-friendly"
        checked={filters.kidFriendly}
        onChange={(v) => patch({ kidFriendly: v })}
      />
    </section>
  );
}

interface ActiveChip {
  key: string;
  label: string;
  remove: () => void;
}

function buildActiveChips(
  filters: EatFilters,
  patch: (n: Partial<EatFilters>) => void,
  region: RegionSlug,
): ActiveChip[] {
  const chips: ActiveChip[] = [];
  for (const t of filters.types) {
    chips.push({
      key: `type:${t}`,
      label: EAT_TYPE_LABELS[t],
      remove: () => patch({ types: filters.types.filter((x) => x !== t) }),
    });
  }
  for (const c of filters.cuisines) {
    chips.push({
      key: `cuisine:${c}`,
      label: c,
      remove: () => patch({ cuisines: filters.cuisines.filter((x) => x !== c) }),
    });
  }
  for (const b of filters.prices) {
    chips.push({
      key: `price:${b}`,
      label: b,
      remove: () => patch({ prices: filters.prices.filter((x) => x !== b) }),
    });
  }
  if (filters.openNow) {
    chips.push({ key: "open", label: "Open now", remove: () => patch({ openNow: false }) });
  }
  // Region-specific chips: only render the chips whose underlying control
  // is rendered for the current region (defensive against stale URL params
  // surviving a region switch).
  if (region === "snowy_mountains") {
    if (filters.apresSki)  chips.push({ key: "apres", label: "Après-ski",  remove: () => patch({ apresSki: false }) });
    if (filters.takeaway)  chips.push({ key: "take",  label: "Takeaway",   remove: () => patch({ takeaway: false }) });
    if (filters.groceries) chips.push({ key: "groc",  label: "Groceries",  remove: () => patch({ groceries: false }) });
  } else {
    if (filters.englishMenu) {
      const labels: Record<EnglishMenuFilter, string> = {
        yes:                "EN menu",
        picture_or_better:  "Picture menu+",
        limited_or_better:  "EN: limited+",
      };
      chips.push({
        key: "en",
        label: labels[filters.englishMenu],
        remove: () => patch({ englishMenu: null }),
      });
    }
    if (filters.payment === "cards_accepted") {
      chips.push({ key: "pay", label: "Cards OK", remove: () => patch({ payment: null }) });
    }
    if (filters.vegetarian) {
      const labels: Record<VegFilter, string> = {
        yes: "Vegetarian",
        limited_or_better: "Veg: limited+",
      };
      chips.push({
        key: "veg",
        label: labels[filters.vegetarian],
        remove: () => patch({ vegetarian: null }),
      });
    }
    if (filters.kidFriendly) {
      chips.push({ key: "kid", label: "Kid-friendly", remove: () => patch({ kidFriendly: false }) });
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

export interface EatFilterBarProps {
  eats: readonly Eat[];
  region: RegionSlug;
  onChange: (filters: EatFilters) => void;
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

export function EatFilterBar({
  eats,
  region,
  onChange,
  resultCount,
  className,
  stickyTop = 0,
}: EatFilterBarProps) {
  const [filters, setFilters] = useUrlEatFilters();
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = useState(false);

  // Derive available types from the dataset (intersection with playbook
  // chip set). A chip appears only when at least one eat in the current
  // listing actually has a matching schema type - avoids dead chips.
  const availableTypes = useMemo(() => {
    const present = new Set(eats.map((e) => e.type));
    return EAT_FILTERABLE_TYPES.filter((c) =>
      TYPE_CHIP_MATCHES[c].some((schemaType) => present.has(schemaType)),
    );
  }, [eats]);

  // Cuisine union (case-folded for display, original casing preserved for
  // the chip label since most curated cuisines have proper-case display).
  // Sorted alphabetically for stable popover order.
  const availableCuisines = useMemo(() => {
    const seen = new Map<string, string>(); // lowercase → original-case
    for (const e of eats) {
      for (const c of e.cuisine) {
        const lc = c.toLowerCase();
        // First-seen wins on casing - predictable for the curator.
        if (!seen.has(lc)) seen.set(lc, c);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [eats]);

  const lastEmittedRef = useRef<string | null>(null);
  useEffect(() => {
    const serialized = serializeEatFiltersToSearch(filters);
    if (serialized === lastEmittedRef.current) return;
    lastEmittedRef.current = serialized;
    onChange(filters);
  }, [filters, onChange]);

  const patch = useCallback(
    (next: Partial<EatFilters>) => setFilters({ ...filters, ...next }),
    [filters, setFilters],
  );
  const clearAll = useCallback(() => setFilters(DEFAULT_EAT_FILTERS), [setFilters]);

  const filtered = useMemo(() => {
    if (typeof resultCount === "number") return resultCount;
    return applyEatFilters(eats, filters).length;
  }, [eats, filters, resultCount]);

  const total = eats.length;
  const activeCount = getActiveEatFilterCount(filters);
  const chips = useMemo(
    () => buildActiveChips(filters, patch, region),
    [filters, patch, region],
  );

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
              <CuisineMultiSelect
                available={availableCuisines}
                value={filters.cuisines}
                onChange={(v) => patch({ cuisines: v })}
              />
              <PriceChips value={filters.prices} onChange={(v) => patch({ prices: v })} />
              <OpenNowToggle
                value={filters.openNow}
                onChange={(v) => patch({ openNow: v })}
              />
              <span aria-hidden className="h-5 w-px bg-border mx-1" />
              <SortSelect value={filters.sort} onChange={(v) => patch({ sort: v })} />
              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>{moreFiltersTrigger}</SheetTrigger>
                <FilterSheetContent
                  regionFilters={regionFilters}
                  onClearAll={clearAll}
                  onClose={() => setMoreOpen(false)}
                  activeCount={activeCount}
                />
              </Sheet>
            </>
          ) : (
            <>
              <OpenNowToggle
                value={filters.openNow}
                onChange={(v) => patch({ openNow: v })}
              />
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
                        <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">Cuisine</h3>
                        <CuisineMultiSelect
                          available={availableCuisines}
                          value={filters.cuisines}
                          onChange={(v) => patch({ cuisines: v })}
                        />
                      </section>
                      <section className="space-y-2">
                        <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">Price</h3>
                        <PriceChips value={filters.prices} onChange={(v) => patch({ prices: v })} />
                      </section>
                      <section className="space-y-2">
                        <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">Sort</h3>
                        <SortSelect value={filters.sort} onChange={(v) => patch({ sort: v })} />
                      </section>
                      {regionFilters}
                    </>
                  }
                  onClearAll={clearAll}
                  onClose={() => setMoreOpen(false)}
                  activeCount={activeCount}
                />
              </Sheet>
            </>
          )}

          <div className="ml-auto text-[11px] tabular-nums text-muted-foreground" aria-live="polite">
            Showing <span className="font-semibold text-foreground">{filtered}</span> of {total} eats
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
        <SheetTitle className="font-display text-xl">Filter eats</SheetTitle>
        <SheetDescription className="sr-only">
          Refine the eat list by type, cuisine, price, open-now status, and region-specific options.
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
