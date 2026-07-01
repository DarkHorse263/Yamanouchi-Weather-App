import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageMeta } from "@/lib/seo/PageMeta";
import {
  CalendarRange,
  Plus,
  X,
  ArrowLeft,
  Snowflake,
  Check,
  Sparkles,
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
import { useTripForecasts, catalogToPlannerMountain } from "@/lib/tripForecasts";
import { TravelDayPanel } from "@/components/trip/TravelDayPanel";
import {
  rankTripWindows,
  scoreBand,
  type WindowCandidate,
  type ScoredDay,
} from "@/lib/tripWindowScore";

// ─── Presentation helpers ──────────────────────────────────────────────────

const BAND_STYLE: Record<
  ReturnType<typeof scoreBand>,
  { label: string; chip: string; dot: string; ring: string }
> = {
  excellent: { label: "excellent", chip: "bg-sky-100 text-sky-800", dot: "bg-sky-500", ring: "ring-sky-400" },
  good: { label: "good", chip: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-400" },
  fair: { label: "fair", chip: "bg-amber-100 text-amber-800", dot: "bg-amber-500", ring: "ring-amber-400" },
  poor: { label: "lean", chip: "bg-rose-100 text-rose-700", dot: "bg-rose-400", ring: "ring-rose-300" },
};

function confidenceCopy(label: WindowCandidate["confidenceLabel"]): string {
  switch (label) {
    case "high":
      return "models agree";
    case "medium":
      return "models mixed";
    case "low":
      return "models split";
    case "single":
      return "single model";
    case "mixed":
      return "mixed agreement";
  }
}

function asDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}
function fmtDow(dateStr: string): string {
  return asDate(dateStr).toLocaleDateString("en-AU", { weekday: "short" }).toLowerCase();
}
function fmtDom(dateStr: string): string {
  return asDate(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short" }).toLowerCase();
}

/** "fri 3 to sun 5 jul" · no en-dash, brand voice. */
function windowRangeLabel(start: string, end: string): string {
  const s = asDate(start);
  const e = asDate(end);
  const sDow = fmtDow(start);
  const eDow = fmtDow(end);
  const sameMonth = s.getMonth() === e.getMonth();
  const month = e.toLocaleDateString("en-AU", { month: "short" }).toLowerCase();
  const sMonth = s.toLocaleDateString("en-AU", { month: "short" }).toLowerCase();
  if (sameMonth) {
    return `${sDow} ${s.getDate()} to ${eDow} ${e.getDate()} ${month}`;
  }
  return `${sDow} ${s.getDate()} ${sMonth} to ${eDow} ${e.getDate()} ${month}`;
}

// ─── Day + window cards ─────────────────────────────────────────────────────

function DayChip({ day }: { day: ScoredDay }) {
  const band = BAND_STYLE[scoreBand(day.score)];
  return (
    <div className="rounded-xl bg-white/70 border border-border/60 p-2 flex flex-col items-center text-center">
      <span className="text-[10px] font-bold uppercase text-foreground leading-none">{fmtDow(day.date)}</span>
      <span className="text-[9px] text-muted-foreground mt-0.5 leading-none">{fmtDom(day.date)}</span>
      <span className={`mt-1.5 w-2 h-2 rounded-full ${band.dot}`} />
      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-sky-700">
        <Snowflake className="w-2.5 h-2.5" />
        {Math.round(day.snowCm)}cm
      </span>
      <span className="text-[10px] text-foreground font-semibold leading-tight">
        {Math.round(day.tempMaxC)}°
      </span>
    </div>
  );
}

/** The recommended best window · the hero of the page. */
function BestWindowCard({ win }: { win: WindowCandidate }) {
  const band = BAND_STYLE[scoreBand(win.score)];
  return (
    <div className={`rounded-3xl border-2 border-foreground/10 bg-sky-50/60 p-5 md:p-6 ring-1 ${band.ring}`}>
      <p className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5" /> best window to go
      </p>
      <div className="mt-2 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-2xl md:text-3xl font-black text-foreground leading-tight">
            {win.mountainName.toLowerCase()}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {windowRangeLabel(win.startDate, win.endDate)}
            {win.regionLabel ? ` · ${win.regionLabel.toLowerCase()}` : ""}
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${band.chip}`}>
          <span className={`w-2 h-2 rounded-full ${band.dot}`} />
          {band.label}
        </span>
      </div>

      <div className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${win.days.length}, minmax(0, 1fr))` }}>
        {win.days.map((d) => (
          <DayChip key={d.date} day={d} />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-x-4 gap-y-1 flex-wrap text-sm">
        <span className="inline-flex items-center gap-1.5 text-sky-700 font-semibold">
          <Snowflake className="w-4 h-4" />
          {win.totalSnowCm}cm fresh over {win.lengthDays} days
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{confidenceCopy(win.confidenceLabel)}</span>
      </div>
    </div>
  );
}

/** A compact alternative window row. */
function AltWindowRow({ win }: { win: WindowCandidate }) {
  const band = BAND_STYLE[scoreBand(win.score)];
  return (
    <div className="rounded-2xl border border-border bg-white p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h4 className="text-base font-bold text-foreground truncate">{win.mountainName.toLowerCase()}</h4>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {windowRangeLabel(win.startDate, win.endDate)} · {win.totalSnowCm}cm · {confidenceCopy(win.confidenceLabel)}
        </p>
      </div>
      <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${band.chip}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${band.dot}`} />
        {band.label}
      </span>
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
  const saved = useMemo(() => mountains.map(catalogToPlannerMountain), [mountains]);
  const { best, alternatives, gaps } = useMemo(
    () => rankTripWindows(saved, forecasts),
    [saved, forecasts],
  );

  const loadingGaps = gaps.filter((g) => g.reason === "loading");
  const realGaps = gaps.filter((g) => g.reason !== "loading");
  const stillChecking = loadingGaps.length > 0;

  const bestMountain = best
    ? mountains.find((m) => mountainKey(m.regionId, m.id) === best.mountainKey)
    : undefined;

  // Still waiting on the first forecast · show a skeleton, not a "no window".
  if (!best && stillChecking) {
    return (
      <div className="space-y-3">
        <div className="h-40 rounded-3xl bg-secondary/50 animate-pulse" />
        <div className="h-16 rounded-2xl bg-secondary/40 animate-pulse" />
      </div>
    );
  }

  // Everything resolved but nothing scored · be honest about why.
  if (!best) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center">
        <MountainSnow className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          couldn't build a window from the forecast right now.
        </p>
        {realGaps.length > 0 && (
          <p className="text-[12px] text-muted-foreground/70 mt-2">
            no reliable outlook for {realGaps.map((g) => g.mountainName.toLowerCase()).join(", ")}.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BestWindowCard win={best} />

      {bestMountain && (
        <TravelDayPanel
          regionId={bestMountain.regionId}
          mountainId={bestMountain.id}
          mountainName={bestMountain.name}
        />
      )}

      {alternatives.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            other windows worth a look
          </h3>
          {alternatives.slice(0, 5).map((win) => (
            <AltWindowRow key={`${win.mountainKey}:${win.startDate}:${win.lengthDays}`} win={win} />
          ))}
        </div>
      )}

      {(realGaps.length > 0 || stillChecking) && (
        <p className="text-[12px] text-muted-foreground/70">
          {realGaps.length > 0 &&
            `no reliable outlook for ${realGaps.map((g) => g.mountainName.toLowerCase()).join(", ")}. `}
          {stillChecking && `still checking ${loadingGaps.map((g) => g.mountainName.toLowerCase()).join(", ")}.`}
        </p>
      )}
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
        description="Find the best 2 to 3 day window to go. We rank the next week across the resorts you're choosing between, so the right days to travel jump out."
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
            find the best window to go.
          </h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            pick the mountains you're choosing between. we score every 2 and 3
            day window across the next week · fresh snow, the temp window and how
            much the models agree · so the best days to travel jump out.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-black text-foreground mb-3">your mountains</h2>
          <MountainPicker saved={saved} onToggle={onToggle} />
        </section>

        <section>
          {savedMountains.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center">
              <CalendarRange className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                pick a mountain above to find your best window.
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
