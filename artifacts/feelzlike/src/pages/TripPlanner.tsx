import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageMeta } from "@/lib/seo/PageMeta";
import {
  CalendarRange,
  Plus,
  ArrowLeft,
  Snowflake,
  Check,
  MountainSnow,
} from "lucide-react";
import {
  tripPlannerCatalog,
  readSavedMountains,
  addSavedMountain,
  removeSavedMountain,
  findCatalogMountain,
  mountainKey,
  MAX_TRIP_MOUNTAINS,
  type CatalogMountain,
} from "@/lib/tripPlanner";
import {
  useTripForecasts,
  type PlannerForecastDay,
  type PlannerForecastEntry,
} from "@/lib/tripForecasts";

// ─── Presentation helpers ──────────────────────────────────────────────────

function asDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}
function fmtDow(dateStr: string): string {
  return asDate(dateStr).toLocaleDateString("en-AU", { weekday: "short" }).toLowerCase();
}
function fmtDayNum(dateStr: string): string {
  return String(asDate(dateStr).getDate());
}

/** Days we show in a snapshot · a week is plenty to compare at a glance. */
const SNAPSHOT_DAYS = 7;

// ─── Snapshot day cell ──────────────────────────────────────────────────────

function DayCell({ day }: { day: PlannerForecastDay }) {
  const snow = Math.round(day.snowMean);
  return (
    <div className="rounded-xl bg-secondary/40 border border-border/50 px-1.5 py-2 flex flex-col items-center text-center">
      <span className="text-[10px] font-bold uppercase text-foreground leading-none">
        {fmtDow(day.date)}
      </span>
      <span className="text-[9px] text-muted-foreground mt-0.5 leading-none">
        {fmtDayNum(day.date)}
      </span>
      <span
        className={`mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold leading-none ${
          snow > 0 ? "text-sky-700" : "text-muted-foreground/60"
        }`}
      >
        <Snowflake className="w-2.5 h-2.5" />
        {snow}cm
      </span>
      <span className="text-[11px] text-foreground font-semibold mt-1 leading-none">
        {Math.round(day.tempMaxMean)}°
      </span>
    </div>
  );
}

// ─── Per-destination snapshot card ──────────────────────────────────────────

function DestinationCard({
  mountain,
  entry,
}: {
  mountain: CatalogMountain;
  entry: PlannerForecastEntry | undefined;
}) {
  const days =
    entry?.status === "ok" ? entry.days.slice(0, SNAPSHOT_DAYS) : [];
  const totalSnow = days.reduce((sum, d) => sum + Math.max(0, d.snowMean), 0);

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-black text-foreground leading-tight truncate">
            {mountain.name.toLowerCase()}
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {mountain.regionName.toLowerCase()}
          </p>
        </div>
        {entry?.status === "ok" && days.length > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-sky-700">
            <Snowflake className="w-4 h-4" />
            {Math.round(totalSnow)}cm
          </span>
        )}
      </div>

      <div className="mt-3">
        {entry?.status === "loading" || entry === undefined ? (
          <div className="h-16 rounded-xl bg-secondary/50 animate-pulse" />
        ) : entry.status === "error" || days.length === 0 ? (
          <p className="text-[12px] text-muted-foreground/70">
            no reliable outlook for this mountain right now · try again later.
          </p>
        ) : (
          <>
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            >
              {days.map((d) => (
                <DayCell key={d.date} day={d} />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-2">
              fresh snow · daytime temp · next {days.length} days
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Picker ─────────────────────────────────────────────────────────────────

function MountainPicker({
  saved,
  onToggle,
}: {
  saved: string[];
  onToggle: (key: string, isSaved: boolean) => void;
}) {
  const catalog = tripPlannerCatalog();
  const byRegion = useMemo(() => {
    const groups = new Map<string, { name: string; mountains: CatalogMountain[] }>();
    for (const m of catalog) {
      const g = groups.get(m.regionId) ?? { name: m.regionName, mountains: [] };
      g.mountains.push(m);
      groups.set(m.regionId, g);
    }
    return [...groups.values()];
  }, [catalog]);

  const full = saved.length >= MAX_TRIP_MOUNTAINS;

  return (
    <div className="space-y-4">
      {byRegion.map((group) => (
        <div key={group.name}>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {group.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.mountains.map((m) => {
              const key = mountainKey(m.regionId, m.id);
              const isSaved = saved.includes(key);
              const disabled = !isSaved && full;
              return (
                <button
                  key={key}
                  onClick={() => onToggle(key, isSaved)}
                  disabled={disabled}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isSaved
                      ? "bg-foreground text-background border-foreground"
                      : disabled
                      ? "bg-secondary/40 text-muted-foreground/50 border-border cursor-not-allowed"
                      : "bg-white text-foreground border-border hover:border-foreground"
                  }`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground/70">
        {full
          ? `that's the max of ${MAX_TRIP_MOUNTAINS} · remove one to add another.`
          : `pick up to ${MAX_TRIP_MOUNTAINS} mountains you're choosing between.`}
      </p>
    </div>
  );
}

// ─── Results ────────────────────────────────────────────────────────────────

function TripResults({ mountains }: { mountains: CatalogMountain[] }) {
  const forecasts = useTripForecasts(mountains);
  return (
    <div className="space-y-3">
      {mountains.map((m) => (
        <DestinationCard
          key={mountainKey(m.regionId, m.id)}
          mountain={m}
          entry={forecasts[mountainKey(m.regionId, m.id)]}
        />
      ))}
    </div>
  );
}

export default function TripPlanner() {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    setSaved(readSavedMountains());
  }, []);

  const onToggle = (key: string, isSaved: boolean) => {
    setSaved(isSaved ? removeSavedMountain(key) : addSavedMountain(key));
  };

  const savedMountains = saved
    .map((k) => findCatalogMountain(k))
    .filter((m): m is CatalogMountain => m !== undefined);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Trip planner"
        description="Compare the snow across the mountains you're choosing between. See the next week of fresh snow and temps side by side, so you can pick where to go."
        path="/plan"
      />
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> back
        </Link>

        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
            <CalendarRange className="w-3.5 h-3.5" /> trip planner
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mt-2 leading-tight">
            compare your mountains.
          </h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            pick the mountains you're choosing between and see the next week of
            fresh snow and daytime temps side by side · a quick snapshot to help
            you decide where to go.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-black text-foreground mb-3">your mountains</h2>
          <MountainPicker saved={saved} onToggle={onToggle} />
        </section>

        <section>
          {savedMountains.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center">
              <MountainSnow className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                pick a mountain above to compare the snow.
              </p>
            </div>
          ) : (
            <TripResults mountains={savedMountains} />
          )}
        </section>

        <p className="text-[11px] text-muted-foreground/70 text-center pt-2">
          © 2026 navigate work digital · feelzlike
        </p>
      </div>
    </div>
  );
}
