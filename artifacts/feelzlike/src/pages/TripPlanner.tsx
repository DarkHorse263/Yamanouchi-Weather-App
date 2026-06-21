import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageMeta } from "@/lib/seo/PageMeta";
import {
  CalendarRange,
  Plus,
  X,
  ArrowLeft,
  Snowflake,
  Wind,
  Check,
} from "lucide-react";
import { useTownWeather, type TownWeatherDaily } from "@/lib/town-weather";
import {
  tripPlannerCatalog,
  readSavedMountains,
  addSavedMountain,
  removeSavedMountain,
  findCatalogMountain,
  mountainKey,
  scoreTripDay,
  MAX_TRIP_MOUNTAINS,
  type CatalogMountain,
  type TripDayTone,
} from "@/lib/tripPlanner";

const TONE_STYLE: Record<TripDayTone, { bg: string; text: string; dot: string }> = {
  powder: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  bluebird: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  fair: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  marginal: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  "no-go": { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400" },
  "no-data": { bg: "bg-secondary/40", text: "text-muted-foreground", dot: "bg-muted-foreground/40" },
};

function dayLabel(dateStr: string): { dow: string; dom: string } {
  const d = new Date(dateStr + "T00:00:00");
  return {
    dow: d.toLocaleDateString("en-AU", { weekday: "short" }).toLowerCase(),
    dom: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }).toLowerCase(),
  };
}

/** One mountain's 7-day stacked forecast strip. */
function MountainRow({
  mountain,
  onRemove,
}: {
  mountain: CatalogMountain;
  onRemove: () => void;
}) {
  const { data, isLoading, isError } = useTownWeather(mountain.lat, mountain.lng);
  const days: TownWeatherDaily[] = data?.daily?.slice(0, 7) ?? [];

  const best = useMemo(() => {
    if (!days.length) return null;
    let bestIdx = -1;
    let bestScore = 0;
    days.forEach((d, i) => {
      const s = scoreTripDay(d).total;
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    });
    // No day cleared zero (e.g. every day was no-data) · don't fake a winner.
    if (bestIdx < 0) return null;
    return { idx: bestIdx, date: days[bestIdx].date };
  }, [days]);

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-black text-foreground leading-snug truncate">
            {mountain.name}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {mountain.regionShortTag}
            {mountain.elevationM ? ` · ${mountain.elevationM}m` : ""}
            {best ? ` · best day ${dayLabel(best.date).dow}` : ""}
          </p>
        </div>
        <button
          onClick={onRemove}
          aria-label={`remove ${mountain.name}`}
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-secondary/60 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          couldn't load conditions for {mountain.name}. try again shortly.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            const score = scoreTripDay(d);
            const tone = TONE_STYLE[score.tone];
            const { dow, dom } = dayLabel(d.date);
            const isBest = best?.idx === i;
            return (
              <div
                key={d.date}
                className={`relative rounded-xl border p-2 flex flex-col items-center text-center ${tone.bg} ${
                  isBest ? "border-foreground ring-1 ring-foreground" : "border-transparent"
                }`}
              >
                {isBest && (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-foreground text-background">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
                <span className="text-[10px] font-bold text-foreground uppercase">{dow}</span>
                <span className="text-[9px] text-muted-foreground leading-tight">{dom}</span>
                <span className={`mt-1 inline-flex items-center gap-0.5 text-[9px] font-bold uppercase ${tone.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                  {score.label}
                </span>
                <div className="mt-1 text-[10px] text-foreground font-semibold leading-tight">
                  {d.tempMax != null ? Math.round(d.tempMax) : "·"}°
                  <span className="text-muted-foreground font-normal">
                    /{d.tempMin != null ? Math.round(d.tempMin) : "·"}°
                  </span>
                </div>
                <div className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] text-sky-700">
                  <Snowflake className="w-2.5 h-2.5" />
                  {d.snowfallSum != null ? `${Math.round(d.snowfallSum)}cm` : "·"}
                </div>
                <div className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                  <Wind className="w-2.5 h-2.5" />
                  {(d.windGustMax ?? d.windSpeedMax) != null
                    ? `${Math.round(d.windGustMax ?? d.windSpeedMax ?? 0)}`
                    : "·"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** The picker · grouped by region, add/remove from the saved set. */
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
          : `pick up to ${MAX_TRIP_MOUNTAINS} mountains to compare.`}
      </p>
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
        description="Plan your mountain trip. Compare snow forecasts across resorts and find the best days to ski or snowboard."
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
            pick your window. let the best day jump out.
          </h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            stack the next 7 days across the mountains you're choosing between.
            fresh snow, wind and the temp window, scored per day · so you book
            the right day, not just the right hill.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-black text-foreground mb-3">your mountains</h2>
          <MountainPicker saved={saved} onToggle={onToggle} />
        </section>

        <section className="space-y-3">
          {savedMountains.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center">
              <CalendarRange className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                pick a mountain above to see its next 7 days.
              </p>
            </div>
          ) : (
            savedMountains.map((m) => (
              <MountainRow
                key={mountainKey(m.regionId, m.id)}
                mountain={m}
                onRemove={() => onToggle(mountainKey(m.regionId, m.id), true)}
              />
            ))
          )}
        </section>

        <p className="text-[11px] text-muted-foreground/70 text-center pt-2">
          © 2026 navigate work digital · feelzlike
        </p>
      </div>
    </div>
  );
}
