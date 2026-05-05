import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Utensils, Clock, FilterX, List as ListIcon } from "lucide-react";

import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";

import { EatCard, EatDetailSheet } from "@/components/EatCard";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  EatFilterBar,
  applyEatFilters,
  applyEatSort,
  parseEatFiltersFromSearch,
  DEFAULT_EAT_FILTERS,
  type EatFilters,
} from "@/components/EatFilterBar";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import { Button } from "@/components/ui/button";

import { useEats } from "@/hooks/useStayEat";
import {
  regionIdToSlug,
  townIdToSlug,
  setUrlParams,
  useUrlParam,
} from "@/lib/urlState";
import type { TownSlug } from "@/types/stayEat";

/**
 * Wired Eat page — the curated 121-entry food & drink dataset, mirrored on
 * the same chrome as TownStay so the two sections feel like siblings.
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Header  · region/town byline  · "Open now" tally LiveBadge   │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ EatFilterBar (sticky, stickyTop=64) — owns 12 URL keys       │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ List view (Map view is a Sprint-3.6 follow-up — see TODO)    │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ EatCard grid                                                 │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * URL state:
 *  - filter / sort  → owned by `EatFilterBar` (12 keys, default sort = open_first)
 *  - `?eat={id}`    → opens the standalone EatDetailSheet (same single-sheet
 *                     pattern as TownStay's `?stay={id}`, so deep-links work
 *                     even when the target is filtered out of the visible list)
 *
 * Auto re-render: a 60-second interval re-evaluates `applyEatSort`/
 * `applyEatFilters` so the "Open now" status of every card stays accurate as
 * shop close-times tick by. (`isOpenNow` itself uses the visitor's wall clock
 * via `Intl.DateTimeFormat` against each eat's country-derived TZ — see
 * `src/lib/openNow.ts`.) Cards individually opt into a tighter `nextChange`
 * timer for closing-soon transitions; this 60s outer tick is just safety
 * net for sort-position changes.
 *
 * Region guard: any eat whose `region` doesn't match the current region is
 * dropped with a console.warn (same defence-in-depth as TownStay).
 */
export function TownEat() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();

  const expectedRegionSlug = regionIdToSlug(region.id);

  // Convert kebab BaseTown.id → snake TownSlug for the dataset query.
  const townSlug: TownSlug | null = town ? townIdToSlug(town.id) : null;

  const eatsQuery = useEats(townSlug ?? ("jindabyne" as TownSlug));
  const allEats = useMemo(
    () => (townSlug ? (eatsQuery.data ?? []) : []),
    [townSlug, eatsQuery.data],
  );

  // Defensive region guard.
  const safeEats = useMemo(() => {
    return allEats.filter((e) => {
      if (e.region !== expectedRegionSlug) {
        // eslint-disable-next-line no-console
        console.warn(
          `[TownEat] region leak prevented: eat '${e.id}' region='${e.region}' but page region='${expectedRegionSlug}'`,
        );
        return false;
      }
      return true;
    });
  }, [allEats, expectedRegionSlug]);

  // Filters: initialise from URL once, then re-receive on every change from
  // the bar via onChange. The bar owns the URL hook itself.
  const [filters, setFilters] = useState<EatFilters>(() => {
    if (typeof window === "undefined") return DEFAULT_EAT_FILTERS;
    return parseEatFiltersFromSearch(window.location.search);
  });

  // 60-second tick to re-sort/re-filter as "Open now" status drifts. We don't
  // depend on it for *card-level* status (each card schedules its own
  // `nextChange` rerender) but the page-level sort needs to be recomputed
  // when an eat flips closed/open. Bump a counter to invalidate the memo.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Apply filters + sort. `tick` is in the deps so re-renders happen even
  // though the eats array reference is stable.
  const processed = useMemo(() => {
    const filtered = applyEatFilters(safeEats, filters);
    return applyEatSort(filtered, filters.sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeEats, filters, tick]);

  // Open-now tally for the LiveBadge. Uses the same `applyEatFilters` path
  // so we stay consistent with the bar's definition of "open".
  const openNowCount = useMemo(() => {
    return applyEatFilters(safeEats, { ...DEFAULT_EAT_FILTERS, openNow: true }).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeEats, tick]);

  // Detail sheet (?eat={id} URL state).
  const [openEatId, setOpenEatId] = useUrlParam("eat");
  const openEat = useMemo(() => {
    if (!openEatId) return null;
    return (
      processed.find((e) => e.id === openEatId) ??
      safeEats.find((e) => e.id === openEatId) ??
      null
    );
  }, [openEatId, processed, safeEats]);

  // If the URL points at an eat that doesn't exist in this town, clean up.
  useEffect(() => {
    if (!openEatId) return;
    if (eatsQuery.isLoading) return;
    const exists = safeEats.some((e) => e.id === openEatId);
    if (!exists) setOpenEatId(null);
  }, [openEatId, safeEats, eatsQuery.isLoading, setOpenEatId]);

  // ─── Render ─────────────────────────────────────────────────────

  if (!town) {
    return (
      <div className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
        <EmptyStateCard
          icon={Utensils}
          title={t("Pick a town first", "町を選んでください")}
          body={t(
            "Choose a base town from the picker to see hand-picked restaurants, izakaya, cafes and bars nearby.",
            "上のピッカーから町を選ぶと、近くの厳選レストラン・居酒屋・カフェ・バーが表示されます。",
          )}
        />
      </div>
    );
  }

  const totalCurated = safeEats.length;
  const filteredCount = processed.length;
  const isFilteredEmpty = totalCurated > 0 && filteredCount === 0;
  const isTownEmpty = !eatsQuery.isLoading && totalCurated === 0;
  const townDisplayName = t(town.name, town.nameJa);

  // Quick "Open now" toggle — one tap to filter. Drives the same `openNow`
  // URL key the EatFilterBar owns, so checking it here flips the bar's chip
  // and vice-versa (single source of truth = the URL).
  const toggleOpenNow = useCallback(() => {
    setUrlParams({ open: filters.openNow ? null : "1" });
  }, [filters.openNow]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-6 md:px-10 pt-8 md:pt-12"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">
              {region.name} · {townDisplayName}
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {t("Eat", "食事")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {totalCurated > 0
                ? t(
                    `${totalCurated} curated ${totalCurated === 1 ? "spot" : "spots"} in ${townDisplayName} — restaurants, izakaya, cafes and bars.`,
                    `${townDisplayName}の厳選${totalCurated}軒・レストラン・居酒屋・カフェ・バー。`,
                  )
                : t(
                    `Hand-picked restaurants, izakaya, cafes and bars near ${townDisplayName}.`,
                    `${townDisplayName}周辺の厳選レストラン・居酒屋・カフェ・バー。`,
                  )}
            </p>
          </div>
          <LiveBadge
            label={
              eatsQuery.isFetching
                ? t("Loading", "読込中")
                : totalCurated > 0
                  ? t(`${openNowCount} open now`, `${openNowCount}軒営業中`)
                  : t("Curated", "厳選")
            }
          />
        </div>

        {/* Quick "Open now" filter chip — prominently placed per playbook 3.5 */}
        {totalCurated > 0 ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleOpenNow}
              aria-pressed={filters.openNow}
              className={
                filters.openNow
                  ? "inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 transition-colors"
                  : "inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground/70 transition-colors hover:bg-muted"
              }
            >
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {t("Open now", "営業中")}
              <span className="tabular-nums opacity-80">{openNowCount}</span>
            </button>
          </div>
        ) : null}

        <div className="rule mt-6" />
      </motion.header>

      {/* Filter bar — sticky below AppShell topbar (h=64). */}
      {totalCurated > 0 ? (
        <EatFilterBar
          eats={safeEats}
          region={expectedRegionSlug}
          onChange={setFilters}
          stickyTop={64}
          className="mt-4"
        />
      ) : null}

      {/* View toggle — list-only for now (Map view shipping in 3.6 once
          StayMap.inner is generalized to take an `items` prop). The toggle
          is rendered as a single static affordance so the slot is reserved
          and the visual rhythm matches TownStay. */}
      {totalCurated > 0 && filteredCount > 0 ? (
        <div className="px-6 md:px-10 pt-4 flex items-center justify-between gap-3 flex-wrap">
          <div
            className="rounded-full border border-border bg-background p-0.5 inline-flex"
            aria-label={t("View mode", "表示モード")}
          >
            <span
              aria-current="true"
              className="rounded-full px-3 h-8 inline-flex items-center gap-1.5 text-xs bg-foreground text-background"
            >
              <ListIcon className="h-3.5 w-3.5" aria-hidden />
              {t("List", "リスト")}
            </span>
          </div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 tabular-nums">
            {t(
              `${filteredCount} of ${totalCurated} shown`,
              `${totalCurated}軒中${filteredCount}軒表示`,
            )}
          </p>
        </div>
      ) : null}

      {/* Loading skeleton */}
      {eatsQuery.isLoading ? (
        <div className="px-6 md:px-10 pt-6">
          <EatsSkeleton />
        </div>
      ) : null}

      {/* Town has eats AND filtered set is non-empty */}
      {totalCurated > 0 && filteredCount > 0 ? (
        <section className="px-6 md:px-10 pt-6 pb-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {processed.map((eat) => (
              <EatCard key={eat.id} eat={eat} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Filtered-zero (town has eats but the active filters hide them all) */}
      {isFilteredEmpty ? (
        <section className="px-6 md:px-10 pt-10 pb-10">
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-white px-6 py-10 text-center">
            <div className="mx-auto inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-foreground/5 text-foreground/70">
              <FilterX className="w-5 h-5" aria-hidden />
            </div>
            <h2 className="font-display font-semibold text-xl tracking-tight text-foreground mt-4">
              {t("No spots match these filters", "条件に合うお店はありません")}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {t(
                `Try widening your filters — ${totalCurated} spot${totalCurated === 1 ? " is" : "s are"} curated in ${townDisplayName}.`,
                `条件を広げてみてください ・ ${townDisplayName}には${totalCurated}軒の厳選店があります。`,
              )}
            </p>
            <div className="mt-5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Atomic single-write clear. Same playbook as TownStay —
                  // 12 EatFilterBar URL keys + the bar reads them on the
                  // same popstate.
                  setUrlParams({
                    type: null,
                    cuisine: null,
                    price: null,
                    sort: null,
                    open: null,
                    apres: null,
                    take: null,
                    groc: null,
                    en: null,
                    pay: null,
                    veg: null,
                    kid: null,
                  });
                }}
                className="rounded-full"
              >
                {t("Clear all filters", "すべてのフィルタを解除")}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Town has zero curated eats */}
      {isTownEmpty ? (
        <section className="px-6 md:px-10 pt-10 pb-10 space-y-8">
          <EmptyStateCard
            icon={Utensils}
            title={t("Eat list launching this week", "食事リスト、今週公開")}
            body={t(
              `We're curating hand-picked restaurants, izakaya, cafes and bars near ${townDisplayName}. Suggest a spot you love and we'll add it.`,
              `${townDisplayName}周辺の厳選レストラン・居酒屋・カフェ・バーを準備中です。おすすめのお店があればぜひ。`,
            )}
            eta={t("ETA: Next 7 days", "公開予定：7日以内")}
            ctaLabel={t("Suggest a spot", "お店を提案")}
            ctaHref={`mailto:feedback@feelzlike.com?subject=Eat%20suggestion%20for%20${encodeURIComponent(townDisplayName)}`}
          />
        </section>
      ) : null}

      {/* Standalone controlled detail sheet — owns the `?eat={id}` URL state */}
      <Sheet
        open={!!openEat}
        onOpenChange={(o) => {
          if (!o) setOpenEatId(null);
        }}
      >
        {openEat ? (
          <EatDetailSheet eat={openEat} />
        ) : (
          <SheetContent side="right" className="hidden" />
        )}
      </Sheet>
    </div>
  );
}

function EatsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white overflow-hidden">
          <div className="aspect-[16/9] bg-secondary animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 rounded bg-secondary animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-secondary animate-pulse" />
            <div className="h-8 w-full rounded bg-secondary animate-pulse mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
