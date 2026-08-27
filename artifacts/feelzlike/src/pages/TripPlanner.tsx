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
  plannerCountries,
  MAX_TRIP_MOUNTAINS,
  type CatalogMountain,
} from "@/lib/tripPlanner";
import {
  useTripForecasts,
  type PlannerForecastDay,
  type PlannerForecastEntry,
} from "@/lib/tripForecasts";
import { REGION_COUNTRY, COUNTRY_META, type CountryCode } from "@/regions";
import { readLastTown, readFavouriteRegion } from "@/lib/favouriteRegion";
import { useUnits } from "@/components/auth/UserPrefsProvider";

type Units = ReturnType<typeof useUnits>;

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

/**
 * Which country the planner opens on. `/plan` is a global route with no region
 * context, so we infer the country from (1) an explicit ?country= param, then
 * (2) the last town the user visited, then (3) their favourite region, and
 * finally fall back to the first available country. A switcher lets them change
 * it regardless.
 */
function detectInitialCountry(available: CountryCode[]): CountryCode {
  const fallback = available[0] ?? "AU";
  const isAvailable = (c: CountryCode | undefined): c is CountryCode =>
    c !== undefined && available.includes(c);

  try {
    const param = new URLSearchParams(window.location.search).get("country");
    if (param) {
      const upper = param.toUpperCase() as CountryCode;
      if (isAvailable(upper)) return upper;
    }
  } catch {
    /* ignore · fall through to the persisted signals */
  }

  const lastTown = readLastTown();
  if (lastTown) {
    const c = REGION_COUNTRY[lastTown.regionId];
    if (isAvailable(c)) return c;
  }

  const fav = readFavouriteRegion();
  if (fav) {
    const c = REGION_COUNTRY[fav];
    if (isAvailable(c)) return c;
  }

  return fallback;
}

// ─── Country switcher ───────────────────────────────────────────────────────

function CountrySwitcher({
  countries,
  current,
  onChange,
}: {
  countries: CountryCode[];
  current: CountryCode;
  onChange: (c: CountryCode) => void;
}) {
  if (countries.length < 2) return null;
  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-border bg-white p-1 sm:inline-grid sm:w-auto sm:grid-cols-5 sm:rounded-full">
      {countries.map((c) => {
        const active = c === current;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-pressed={active}
            className={`min-w-0 rounded-xl px-2.5 py-2 text-center text-sm font-semibold leading-tight transition-colors sm:rounded-full sm:px-3.5 sm:py-1.5 ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {COUNTRY_META[c].name.toLowerCase()}
          </button>
        );
      })}
    </div>
  );
}

// ─── Snapshot day cell ──────────────────────────────────────────────────────

function DayCell({ day, u }: { day: PlannerForecastDay; u: Units }) {
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
          snow > 0 ? "text-snow-accent" : "text-muted-foreground/60"
        }`}
      >
        <Snowflake className="w-2.5 h-2.5" />
        {u.snowVal(snow)}{u.snowUnit}
      </span>
      <span className="text-[11px] text-foreground font-semibold mt-1 leading-none">
        {u.temp(day.tempMaxMean)}{u.tempUnit}
      </span>
    </div>
  );
}

// ─── Per-destination snapshot card ──────────────────────────────────────────

function DestinationCard({
  mountain,
  entry,
  u,
}: {
  mountain: CatalogMountain;
  entry: PlannerForecastEntry | undefined;
  u: Units;
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
          <span className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-snow-accent">
            <Snowflake className="w-4 h-4" />
            {u.snowVal(Math.round(totalSnow))}{u.snowUnit}
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
                <DayCell key={d.date} day={d} u={u} />
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
  country,
  saved,
  onToggle,
}: {
  country: CountryCode;
  saved: string[];
  onToggle: (key: string, isSaved: boolean) => void;
}) {
  const catalog = useMemo(() => tripPlannerCatalog(country), [country]);
  const byRegion = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; mountains: CatalogMountain[] }>();
    for (const m of catalog) {
      const g = groups.get(m.regionId) ?? {
        id: m.regionId,
        name: m.regionName,
        mountains: [],
      };
      g.mountains.push(m);
      groups.set(m.regionId, g);
    }
    return [...groups.values()];
  }, [catalog]);

  const full = saved.length >= MAX_TRIP_MOUNTAINS;

  return (
    <div className="space-y-4">
      {byRegion.map((group) => (
        <div key={group.id}>
          <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
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
                      ? "bg-white text-[#0055FF] border-white"
                      : disabled
                      ? "bg-white/10 text-white/40 border-white/10 cursor-not-allowed"
                      : "bg-transparent text-white border-white/30 hover:border-white"
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
      <p className="text-[11px] text-white/70">
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
  const u = useUnits();
  return (
    <div className="space-y-3">
      {mountains.map((m) => (
        <DestinationCard
          key={mountainKey(m.regionId, m.id)}
          mountain={m}
          entry={forecasts[mountainKey(m.regionId, m.id)]}
          u={u}
        />
      ))}
    </div>
  );
}

import { PremiumFeaturePrompt } from "@/components/PremiumFeaturePrompt";

export default function TripPlanner() {
  const countries = useMemo(() => plannerCountries(), []);
  const [country, setCountry] = useState<CountryCode>(() =>
    detectInitialCountry(countries),
  );
  const [saved, setSaved] = useState<string[]>([]);

  // Load the selected country's saved set (also runs on first mount).
  useEffect(() => {
    setSaved(readSavedMountains(country));
  }, [country]);

  // Reflect the country in the URL so the view is shareable and a refresh keeps
  // it · replaceState (not push) so toggling doesn't spam the back button.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("country", country);
      window.history.replaceState(window.history.state, "", url.toString());
    } catch {
      /* ignore · URL sync is a nicety, not load-bearing */
    }
  }, [country]);

  const onToggle = (key: string, isSaved: boolean) => {
    setSaved(
      isSaved
        ? removeSavedMountain(key, country)
        : addSavedMountain(key, country),
    );
  };

  const savedMountains = saved
    .map((k) => findCatalogMountain(k, country))
    .filter((m): m is CatalogMountain => m !== undefined);

  return (
    <div className="min-h-screen bg-[#0055FF] pb-8 transition-colors duration-500">
      <PageMeta
        title="Compare mountains"
        description="Compare the snow across the mountains you're choosing between. See the next week of fresh snow and temps side by side, so you can pick where to go."
        path="/compare"
      />
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> back
        </Link>

        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 uppercase tracking-wider">
            <CalendarRange className="w-3.5 h-3.5" /> compare mountains
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-white mt-2 leading-tight">
            compare your mountains.
          </h1>
          <p className="text-white/80 mt-2 leading-relaxed">
            pick the mountains you're choosing between and see the next week of
            fresh snow and daytime temps side by side · a quick snapshot to help
            you decide where to go.
          </p>
          {countries.length > 1 && (
            <div className="mt-4">
              <CountrySwitcher
                countries={countries}
                current={country}
                onChange={setCountry}
              />
            </div>
          )}
        </div>

        <section>
          <h2 className="text-lg font-black text-white mb-3">your mountains</h2>
          <MountainPicker country={country} saved={saved} onToggle={onToggle} />
        </section>

        <section className="space-y-4">
          {savedMountains.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
              <MountainSnow className="w-6 h-6 text-white/50 mx-auto mb-2" />
              <p className="text-sm text-white/70">
                pick a mountain above to compare the snow.
              </p>
            </div>
          ) : (
            <TripResults mountains={savedMountains} />
          )}
          <PremiumFeaturePrompt
            id="planner-powder-alerts"
            title="get powder alerts by email"
            blurb="we'll push an alert the moment a big dump hits the forecast for your saved mountains."
            href="/premium"
          />
        </section>

        <p className="text-[11px] text-white/60 text-center pt-2">
          © 2026 navigate work digital · feelzlike
        </p>
      </div>
    </div>
  );
}
