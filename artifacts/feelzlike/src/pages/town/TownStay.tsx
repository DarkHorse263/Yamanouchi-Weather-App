import { useCallback, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bed, Trophy, List as ListIcon, Map as MapIcon, FilterX } from "lucide-react";

import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";

import { StayCard, StayDetailSheet } from "@/components/StayCard";
import { StayMap } from "@/components/StayMap";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  StayFilterBar,
  applyStayFilters,
  applyStaySort,
  parseFiltersFromSearch,
  DEFAULT_FILTERS,
  type StayFilters,
} from "@/components/StayFilterBar";
import { StayPlatformBar } from "@/components/StayPlatformBar";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { useStays } from "@/hooks/useStayEat";
import { useTodaysWinner } from "@/hooks/useTodaysWinner";
import {
  regionIdToSlug,
  townIdToSlug,
  setUrlParams,
  useUrlParam,
} from "@/lib/urlState";
import { type CountryCode } from "@/lib/places";
import type { TownSlug } from "@/types/stayEat";

type ViewMode = "list" | "map";

/**
 * Wired Stay page. Reads from the curated 228-entry dataset (NOT live Google
 * Places — that pattern was retired in Sprint 2). Layout:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Header  · region/town byline  · LiveBadge                    │
 *   │ Today's #1 mountain badge (when scoring data is available)   │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ StayFilterBar (sticky, stickyTop=64)                         │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ View toggle  [ List | Map ]                                  │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ List  → StayCard grid  /  Map → StayMap with mountain colors │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ Secondary StayPlatformBar ("not seeing what you want?")      │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * URL state:
 *  - filter / sort  → owned by `StayFilterBar`
 *  - `?view=map`    → toggled by us (preserved across filter writes via the
 *                     non-filter param fix in `StayFilterBar.setUrlSearch`)
 *  - `?stay={id}`   → opens the detail sheet on mount and on click; backed
 *                     by `StayCard`'s controlled `open` prop
 *
 * Region guard: any stay whose `region` doesn't match the current region is
 * dropped with a console.warn — defence-in-depth against the same class of
 * bug that surfaced in the Cooma Coaches transport leak.
 */
export function TownStay() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();

  const expectedRegionSlug = regionIdToSlug(region.id);
  const country = (region.shortTag as CountryCode) ?? "JP";

  // Convert kebab BaseTown.id → snake TownSlug for the dataset query.
  const townSlug: TownSlug | null = town ? townIdToSlug(town.id) : null;

  const staysQuery = useStays(townSlug ?? ("jindabyne" as TownSlug));
  const allStays = useMemo(
    () => (townSlug ? (staysQuery.data ?? []) : []),
    [townSlug, staysQuery.data],
  );

  // Defensive region guard — never let a stay from the wrong region render.
  const safeStays = useMemo(() => {
    return allStays.filter((s) => {
      if (s.region !== expectedRegionSlug) {
        // eslint-disable-next-line no-console
        console.warn(
          `[TownStay] region leak prevented: stay '${s.id}' region='${s.region}' but page region='${expectedRegionSlug}'`,
        );
        return false;
      }
      return true;
    });
  }, [allStays, expectedRegionSlug]);

  // Today's #1 mountain — drives the default sort + colour-codes the map.
  const winnerQ = useTodaysWinner(region);
  const winner = winnerQ.winner;
  const driveKey = winner?.driveKey;

  // Filters: initialise from URL once, then re-receive on every change from
  // the bar via onChange. We do NOT useUrlFilters() ourselves here — the bar
  // owns that hook; we just hold the latest emitted snapshot.
  const [filters, setFilters] = useState<StayFilters>(() => {
    if (typeof window === "undefined") return DEFAULT_FILTERS;
    return parseFiltersFromSearch(window.location.search);
  });

  // Apply filters + sort. When today's #1 is unavailable, `applyStaySort`
  // falls through to `drive_nearest` automatically.
  const processed = useMemo(() => {
    const filtered = applyStayFilters(safeStays, filters);
    return applyStaySort(filtered, filters.sort, {
      topMountainDriveKey: driveKey,
    });
  }, [safeStays, filters, driveKey]);

  // View toggle (?view=map URL state).
  const [viewParam, setViewParam] = useUrlParam("view");
  const view: ViewMode = viewParam === "map" ? "map" : "list";
  const setView = useCallback(
    (next: ViewMode) => setViewParam(next === "map" ? "map" : null),
    [setViewParam],
  );

  // Detail sheet (?stay={id} URL state). Backed by StayCard's controlled mode.
  const [openStayId, setOpenStayId] = useUrlParam("stay");
  const openStay = useMemo(() => {
    if (!openStayId) return null;
    return (
      processed.find((s) => s.id === openStayId) ??
      safeStays.find((s) => s.id === openStayId) ??
      null
    );
  }, [openStayId, processed, safeStays]);

  // If the URL points at a stay that doesn't exist in this town, clean up.
  useEffect(() => {
    if (!openStayId) return;
    if (staysQuery.isLoading) return;
    const exists = safeStays.some((s) => s.id === openStayId);
    if (!exists) setOpenStayId(null);
  }, [openStayId, safeStays, staysQuery.isLoading, setOpenStayId]);

  // Town centroid for empty-map fallback.
  const townCenter = town ? { lat: town.lat, lng: town.lng } : null;

  // ─── Render ─────────────────────────────────────────────────────

  if (!town) {
    return (
      <div className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
        <EmptyStateCard
          icon={Bed}
          title={t("Pick a town first", "町を選んでください")}
          body={t(
            "Choose a base town from the picker to see hand-picked stays nearby.",
            "上のピッカーから町を選ぶと、近くの厳選宿泊施設が表示されます。",
          )}
        />
      </div>
    );
  }

  const totalCurated = safeStays.length;
  const filteredCount = processed.length;
  const isFilteredEmpty = totalCurated > 0 && filteredCount === 0;
  const isTownEmpty = !staysQuery.isLoading && totalCurated === 0;
  const townDisplayName = t(town.name, town.nameJa);

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
              {t("Stay", "宿泊")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {totalCurated > 0
                ? t(
                    `${totalCurated} hand-picked ${totalCurated === 1 ? "stay" : "stays"} in ${townDisplayName}${driveKey ? " — sorted by drive time to today's #1 mountain" : ""}.`,
                    `${townDisplayName}の厳選宿泊施設${totalCurated}軒${driveKey ? "・本日のNo.1マウンテンへのドライブ時間順" : ""}。`,
                  )
                : t(
                    `Hand-picked ryokan, lodges and apartments around ${townDisplayName}.`,
                    `${townDisplayName}周辺の厳選旅館・ロッジ・アパートメント。`,
                  )}
            </p>
          </div>
          <LiveBadge label={staysQuery.isFetching ? t("Loading", "読込中") : t("Curated", "厳選")} />
        </div>

        {winner ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/60 px-3 py-1.5 text-xs">
            <Trophy className="h-3.5 w-3.5 text-amber-600" aria-hidden />
            <span className="font-bold uppercase tracking-wider text-amber-800">
              {t("Today's #1", "本日のNo.1")}
            </span>
            <span className="font-display font-semibold text-foreground">
              {t(winner.name, winner.nameJa)}
            </span>
            <span className="tabular-nums text-foreground/70">
              {winner.scoreTotal}/100
            </span>
          </div>
        ) : null}

        <div className="rule mt-6" />
      </motion.header>

      {/* Filter bar — sticky below AppShell topbar (h=64). */}
      {totalCurated > 0 ? (
        <StayFilterBar
          stays={safeStays}
          region={expectedRegionSlug}
          onChange={setFilters}
          topMountainDriveKey={driveKey}
          stickyTop={64}
          className="mt-4"
        />
      ) : null}

      {/* View toggle (only meaningful when results exist). */}
      {totalCurated > 0 && filteredCount > 0 ? (
        <div className="px-6 md:px-10 pt-4 flex items-center justify-between gap-3 flex-wrap">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => {
              // Radix emits "" when the user clicks the active item — coerce
              // back to "list" so we never end up in an undefined view.
              if (v === "list" || v === "map") setView(v);
            }}
            aria-label={t("View mode", "表示モード")}
            className="rounded-full border border-border bg-background p-0.5"
          >
            <ToggleGroupItem
              value="list"
              aria-label={t("List view", "リスト表示")}
              className="rounded-full px-3 h-8 text-xs gap-1.5 data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              <ListIcon className="h-3.5 w-3.5" aria-hidden />
              {t("List", "リスト")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="map"
              aria-label={t("Map view", "地図表示")}
              className="rounded-full px-3 h-8 text-xs gap-1.5 data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              <MapIcon className="h-3.5 w-3.5" aria-hidden />
              {t("Map", "地図")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      ) : null}

      {/* Loading skeleton */}
      {staysQuery.isLoading ? (
        <div className="px-6 md:px-10 pt-6">
          <PlacesSkeleton />
        </div>
      ) : null}

      {/* Town has stays AND filtered set is non-empty */}
      {totalCurated > 0 && filteredCount > 0 && view === "list" ? (
        <section className="px-6 md:px-10 pt-6 pb-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {processed.map((stay) => (
              <StayCard key={stay.id} stay={stay} />
            ))}
          </div>
        </section>
      ) : null}

      {totalCurated > 0 && filteredCount > 0 && view === "map" ? (
        <section className="pt-6 pb-10 md:px-10">
          <StayMap
            stays={processed}
            topMountainDriveKey={driveKey ?? null}
            fallbackCenter={townCenter}
            className=""
          />
        </section>
      ) : null}

      {/* Filtered-zero (town has stays but the active filters hide them all) */}
      {isFilteredEmpty ? (
        <section className="px-6 md:px-10 pt-10 pb-10">
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-white px-6 py-10 text-center">
            <div className="mx-auto inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-foreground/5 text-foreground/70">
              <FilterX className="w-5 h-5" aria-hidden />
            </div>
            <h2 className="font-display font-semibold text-xl tracking-tight text-foreground mt-4">
              {t("No stays match these filters", "条件に合う宿泊施設はありません")}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {t(
                `Try widening your filters — ${totalCurated} stay${totalCurated === 1 ? " is" : "s are"} available in ${townDisplayName}.`,
                `条件を広げてみてください ・ ${townDisplayName}には${totalCurated}軒の宿泊施設があります。`,
              )}
            </p>
            <div className="mt-5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Atomic single-write clear: one replaceState + one popstate
                  // → one render cycle, instead of 14 (architect-flagged perf
                  // win). Round-tripping through the URL keeps us decoupled
                  // from the bar's internal serializer; its read-side picks
                  // up the cleared state on the same popstate.
                  setUrlParams({
                    type: null,
                    price: null,
                    sort: null,
                    dry: null,
                    ski: null,
                    pet: null,
                    self: null,
                    kmThredbo: null,
                    kmSkitube: null,
                    onsen: null,
                    tattoo: null,
                    meal: null,
                    en: null,
                    walk: null,
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

      {/* Town has zero curated stays (e.g. dataset gap) */}
      {isTownEmpty ? (
        <section className="px-6 md:px-10 pt-10 pb-10 space-y-8">
          <EmptyStateCard
            icon={Bed}
            title={t("Stays launching this week", "宿泊リスト、今週公開")}
            body={t(
              `We're curating hand-picked ryokan, lodges and apartments near ${townDisplayName}. In the meantime, browse availability on your favourite booking site.`,
              `${townDisplayName}周辺の旅館・ロッジ・アパートメントを厳選中です。それまでは下記のお気に入りの予約サイトからどうぞ。`,
            )}
            eta={t("ETA: Next 7 days", "公開予定：7日以内")}
          />
        </section>
      ) : null}

      {/* Standalone controlled detail sheet — owns the `?stay={id}` URL state
          so deep-links work uniformly: a) when the target is in the current
          filtered list, b) when the target is filtered out, c) when the user
          is in map view. The list cards no longer pass `open`/`onOpenChange`
          (they revert to Radix uncontrolled mode for click-to-open); URL
          state goes through this sheet. Same single-source-of-truth pattern
          used by `StayMap.inner.tsx`. */}
      <Sheet
        open={!!openStay}
        onOpenChange={(o) => {
          if (!o) setOpenStayId(null);
        }}
      >
        {openStay ? (
          <StayDetailSheet stay={openStay} />
        ) : (
          <SheetContent side="right" className="hidden" />
        )}
      </Sheet>

      {/* Secondary platform bar — always rendered when the town has stays so
          guests who don't see what they want can still cross-shop. Hidden in
          the town-empty state because the EmptyStateCard already owns that. */}
      {totalCurated > 0 ? (
        <section className="px-6 md:px-10 pb-12">
          <p className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-3">
            {t(
              "Looking for something not listed? Search across major booking sites",
              "リストにないものをお探しですか? 主要予約サイトで検索",
            )}
          </p>
          <StayPlatformBar
            variant="banner"
            country={country}
            query={`${town.name}, ${region.name}`}
            lat={town.lat}
            lng={town.lng}
          />
        </section>
      ) : null}
    </div>
  );
}

function PlacesSkeleton() {
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
