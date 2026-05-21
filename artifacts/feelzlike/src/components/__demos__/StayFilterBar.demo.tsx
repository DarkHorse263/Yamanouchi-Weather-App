import { useState } from "react";

import { StayCard } from "@/components/StayCard";
import {
  StayFilterBar,
  applyStayFilters,
  applyStaySort,
  DEFAULT_FILTERS,
  type StayFilters,
} from "@/components/StayFilterBar";
import { getStaysByRegion } from "@/data";
import type { RegionSlug, Stay } from "@/types/stayEat";

interface RegionDemoSpec {
  region: RegionSlug;
  label: string;
  // The curated mountain key inside `Stay.drive_min_to_each_mountain` that
  // represents today's #1 mountain. In the real Stay page this comes from
  // the Today's Call scorer; for the demo we hardcode a plausible #1.
  topMountainDriveKey?: string;
}

const REGION_SPECS: readonly RegionDemoSpec[] = [
  { region: "snowy_mountains", label: "Snowy Mountains (AU)", topMountainDriveKey: "thredbo" },
  { region: "yamanouchi",      label: "Yamanouchi (JP)",      topMountainDriveKey: "shiga_kogen" },
] as const;

function RegionPanel({ spec }: { spec: RegionDemoSpec }) {
  const allStays = getStaysByRegion(spec.region);
  const [filters, setFilters] = useState<StayFilters>(DEFAULT_FILTERS);

  const visible = applyStaySort(
    applyStayFilters(allStays, filters),
    filters.sort,
    { topMountainDriveKey: spec.topMountainDriveKey },
  );

  return (
    <section className="rounded-2xl border border-border bg-background overflow-hidden">
      <header className="px-5 py-3 border-b border-border bg-muted/30">
        <p className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
          Region demo
        </p>
        <h2 className="font-display text-xl mt-0.5">{spec.label}</h2>
      </header>

      <StayFilterBar
        stays={allStays}
        region={spec.region}
        onChange={setFilters}
        topMountainDriveKey={spec.topMountainDriveKey}
        resultCount={visible.length}
        stickyTop={0}
      />

      <div className="p-5">
        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            No stays match the current filters.
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visible.slice(0, 9).map((s: Stay) => (
              <StayCard key={`${s.region}/${s.town}/${s.id}`} stay={s} />
            ))}
          </div>
        )}
        {visible.length > 9 ? (
          <p className="mt-4 text-[11px] text-muted-foreground text-center">
            Showing first 9 of {visible.length} matching stays.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default function StayFilterBarDemo() {
  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <header>
        <p className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
          Component preview · Sprint 2 · Prompt 2.3
        </p>
        <h1 className="font-display text-2xl mt-1">StayFilterBar - region-aware filters</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
          Two regional datasets rendered through the same component. Snowy Mountains
          surfaces drying-room / ski-storage / pet-friendly / self-contained checkboxes
          plus distance-to-Thredbo and distance-to-Skitube sliders. Yamanouchi surfaces
          onsen / tattoo / meal-plan / English-spoken selects plus walk-to-Yudanaka
          slider. Filter state syncs to the URL - share a filtered link and reload the
          page to see filters restored.
        </p>
      </header>

      {REGION_SPECS.map((spec) => (
        <RegionPanel key={spec.region} spec={spec} />
      ))}
    </div>
  );
}
