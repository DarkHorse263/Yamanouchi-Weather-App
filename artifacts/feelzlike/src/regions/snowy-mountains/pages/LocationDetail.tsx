import { useRoute, Link } from "wouter";
import { useRegion } from "@workspace/feelzlike-shell";
import { useGetLocationWeather, useGetLocationWebcams, useGetLocationLiftStatus } from "@workspace/api-client-react";
import { MountainSnapshot } from "@workspace/feelzlike-dashboard";
import { ElevationBands } from "@/components/weather/ElevationBands";
import { LoadingState } from "../components/ui/loading-state";
import { ErrorState } from "../components/ui/error-state";
import { ForecastChart } from "../components/weather/ForecastChart";
import { EnsembleForecast } from "../components/weather/EnsembleForecast";
import { SafetyStrip } from "../components/weather/SafetyStrip";
import { formatTemp } from "../lib/utils";
import { motion } from "framer-motion";
import {
  Wind,
  Droplets,
  Snowflake,
  CalendarDays,
  BarChart2,
  Camera,
  Cable,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Gauge,
  Thermometer,
  CloudRain,
  Eye,
  Navigation,
  ArrowDown,
  ArrowLeft,
  Sun,
  Cloud,
  CloudSun,
  CloudDrizzle,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Sunrise,
  Sunset,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";

function WeatherIcon({ code, isDay = true, className = "w-5 h-5" }: { code: number | null | undefined; isDay?: boolean; className?: string }) {
  if (code == null) return <Cloud className={className} />;
  if (code === 0) return <Sun className={className} />;
  if (code === 1 || code === 2) return isDay ? <CloudSun className={className} /> : <Cloud className={className} />;
  if (code === 3) return <Cloud className={className} />;
  if (code === 45 || code === 48) return <CloudFog className={className} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className={className} />;
  if (code >= 61 && code <= 67) return <CloudRain className={className} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={className} />;
  if (code >= 80 && code <= 82) return <CloudRain className={className} />;
  if (code >= 85 && code <= 86) return <CloudSnow className={className} />;
  if (code >= 95) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}

function formatAgo(iso: string | undefined | null, now: number): string {
  if (!iso) return "-";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "-";
  const diffSec = Math.max(0, Math.round((now - t) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}
import { cn } from "../lib/utils";
import { HourlyForecast } from "@/components/HourlyForecast";
import { PowderCalendar } from "@/components/PowderCalendar";
import { LiftWindHoldPanel } from "@/components/LiftWindHoldPanel";
import { getLiftsForMountain } from "@/data/lifts";
import { POWDER_THRESHOLDS_AU } from "@/types/weather";
import { PremiumGate, useOptionalSeason } from "@workspace/feelzlike-shell";
import { ThredboSummer } from "../components/ThredboSummer";
import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";

type LocationId = "thredbo" | "perisher" | "charlottes-pass" | "selwyn" | "jindabyne";

/**
 * Lift operating windows for the AU resorts. Times are NSW-published
 * winter daily windows · Skitube to Perisher runs much earlier from
 * Bullocks Flat. Used by the hero strip so visitors see first / last
 * lifts before scrolling.
 */
const AU_LIFT_HOURS: Record<string, { hours: string; note?: string }> = {
  thredbo: { hours: "First lifts 8:30am · last lifts 4:00pm" },
  perisher: { hours: "First lifts 8:30am · last lifts 4:00pm", note: "Skitube from 6:00am" },
  "charlottes-pass": { hours: "First lifts 9:00am · last lifts 4:00pm" },
  selwyn: { hours: "First lifts 9:00am · last lifts 4:00pm" },
};

function getStatusColor(status: string) {
  switch (status) {
    case "open": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "closed": return "bg-white/5 text-muted-foreground border-white/10";
    case "wind-hold": return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "on-hold": return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "scheduled": return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    default: return "bg-white/5 text-muted-foreground border-white/10";
  }
}
function getStatusIcon(status: string) {
  switch (status) {
    case "open": return <CheckCircle2 className="w-3 h-3" />;
    case "closed": return <XCircle className="w-3 h-3" />;
    case "wind-hold": return <Wind className="w-3 h-3" />;
    case "on-hold": return <AlertCircle className="w-3 h-3" />;
    case "scheduled": return <Clock className="w-3 h-3" />;
    default: return null;
  }
}

export default function LocationDetail() {
  const [, mParams] = useRoute("/mountain/:id");
  const [, rParams] = useRoute("/resort/:id");
  const params = mParams ?? rParams;
  const locationId = params?.id as LocationId;
  const { region } = useRegion();

  const { data: weatherData, isLoading: weatherLoading, error: weatherError, refetch: weatherRefetch } = useGetLocationWeather(locationId, { query: { enabled: !!locationId } as never });
  const { data: webcamData } = useGetLocationWebcams(locationId, { query: { enabled: !!locationId } as never });
  const isResort = locationId === "thredbo" || locationId === "perisher" || locationId === "charlottes-pass" || locationId === "selwyn";
  const { data: liftData } = useGetLocationLiftStatus(locationId as any, { query: { enabled: isResort } as never });
  // Snowy region opts in to season-aware UI · in summer the snow/lift
  // panels make no sense, so we hide them and surface alternative content
  // (Thredbo is the only resort that operates year-round, so it gets a
  // dedicated summer panel; the others just drop the lift card).
  const seasonCtx = useOptionalSeason();
  const isSummer = seasonCtx?.season === "green";
  const showLiftAndDials = !isSummer;
  const showThredboSummer = isSummer && locationId === "thredbo";

  const [activeChartMetric, setActiveChartMetric] = useState<"temperature" | "snowfall" | "windSpeed">("temperature");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (weatherLoading) return <><LoadingState message="Reading live conditions…" /></>;
  if (weatherError || !weatherData) return <><ErrorState error={weatherError} onRetry={() => weatherRefetch()} /></>;

  const { location, current, daily, hourly } = weatherData;
  // lastUpdated is the ISO UTC timestamp from when the server fetched/observed the reading.
  // BOM's bomObservationTime is YYYYMMDDHHMMSS in local AU time and would need DST-aware parsing
  // (AEST/AEDT swaps), so we deliberately use lastUpdated for the "X min ago" display.
  const observedTime = (weatherData as any).lastUpdated as string | undefined;

  // Snow next 24h: prefer the API-supplied value; otherwise sum the first
  // 24 hourly snowfall buckets so the tile is never empty when we have
  // hourly data.
  const snow24h: number | null = (() => {
    if (current.snowfallNext24h != null) return current.snowfallNext24h;
    if (Array.isArray(hourly) && hourly.length > 0) {
      return hourly
        .slice(0, 24)
        .reduce((sum: number, h: any) => sum + (Number(h.snowfall) || 0), 0);
    }
    return null;
  })();

  const stats = [
    { label: "feelzlike", value: formatTemp(current.feelsLike), icon: Thermometer },
    { label: "Wind", value: `${current.windSpeed} km/h${current.windDirectionCompass ? ` ${current.windDirectionCompass}` : ""}`, icon: Navigation },
    ...(current.windGust ? [{ label: "Gusts", value: `${current.windGust} km/h`, icon: Wind }] : []),
    { label: "Humidity", value: `${current.humidity}%`, icon: Droplets },
    { label: "Snow depth", value: current.snowDepth != null ? `${current.snowDepth} cm` : "-", icon: Snowflake },
    ...(snow24h != null ? [{ label: "Snow next 24h", value: `${snow24h.toFixed(1)} cm`, icon: CloudSnow }] : []),
    ...(current.dewpoint !== undefined ? [{ label: "Dew point", value: formatTemp(current.dewpoint), icon: Droplets }] : []),
    ...(current.pressure !== undefined ? [{ label: "Pressure", value: `${current.pressure} hPa`, icon: Gauge }] : []),
    ...(current.rainSince9am !== undefined ? [{ label: "Rain since 9am", value: `${current.rainSince9am} mm`, icon: CloudRain }] : []),
    ...(current.visibility && current.visibility !== 10000 ? [{ label: "Visibility", value: `${(current.visibility / 1000).toFixed(0)} km`, icon: Eye }] : []),
  ];

  return (
    <>
      {/* ─── Aurora fintech hero ────────────────── */}
      <section className="relative overflow-hidden isolate">
        {/* Aurora backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1400px] h-[700px] rounded-full opacity-80"
            style={{
              background:
                "radial-gradient(ellipse at center, hsla(210,90%,55%,0.28), transparent 55%), radial-gradient(ellipse at 28% 60%, hsla(265,85%,60%,0.22), transparent 60%), radial-gradient(ellipse at 75% 35%, hsla(180,90%,55%,0.22), transparent 60%)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, transparent 65%, hsl(var(--background)) 100%), repeating-linear-gradient(0deg, hsla(220,30%,12%,0.04) 0px, hsla(220,30%,12%,0.04) 1px, transparent 1px, transparent 64px), repeating-linear-gradient(90deg, hsla(220,30%,12%,0.04) 0px, hsla(220,30%,12%,0.04) 1px, transparent 1px, transparent 64px)",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 md:px-10 pt-8 md:pt-16 pb-6 md:pb-9">
          {/* Back to base town · towns-first IA · fixes mountain dead-end. */}
          {(() => {
            const baseTown =
              region.baseTowns?.find((bt) => bt.nearbyMountainIds?.includes(locationId)) ??
              region.baseTowns?.[0] ??
              null;
            if (!baseTown) return null;
            return (
              <Link
                href={`~/${region.id}/${baseTown.id}`}
                className="inline-flex items-center gap-1.5 mb-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-sky-700/80 hover:text-sky-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {baseTown.name}
              </Link>
            );
          })()}
          {/* Source byline + live pill */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
          >
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {(() => {
                if (current.dataSource !== "BOM") return "Live";
                const raw = current.bomStation?.trim();
                // Treat empty / placeholder values as "no station name" rather
                // than rendering a literal "UNKNOWN" badge in the header.
                const stationName =
                  raw && raw.toUpperCase() !== "UNKNOWN" ? raw : location.name;
                return `BOM Live · ${stationName}`;
              })()}
            </span>
            {current.dataSource !== "BOM" && (
              <span className="byline text-muted-foreground/80">Source · {current.dataSource ?? "BOM + models"}</span>
            )}
            <span className="byline text-muted-foreground/70">Elev {location.elevation}m</span>
            {observedTime && (
              <span className="byline text-muted-foreground/80 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-card border border-border">
                <Clock className="w-3 h-3" />
                <span>Updated <span className="text-foreground tabular-nums">{formatAgo(observedTime, now)}</span></span>
              </span>
            )}
            {AU_LIFT_HOURS[locationId] && (
              <span className="byline text-muted-foreground/80 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-card border border-border">
                <Clock className="w-3 h-3 text-primary" />
                <span className="text-foreground">{AU_LIFT_HOURS[locationId].hours}</span>
                {AU_LIFT_HOURS[locationId].note && (
                  <span className="text-muted-foreground/70">· {AU_LIFT_HOURS[locationId].note}</span>
                )}
              </span>
            )}
          </motion.div>

          {/* Headline + temperature */}
          <div className="mt-5 md:mt-8 grid md:grid-cols-12 gap-6 md:gap-10 items-end">
            <div className="md:col-span-7">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display font-semibold text-[clamp(3rem,8vw,5.5rem)] leading-[0.92] tracking-tight"
                style={{ letterSpacing: "-0.035em" }}
              >
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(120deg, hsl(220,30%,12%) 0%, hsl(210,90%,46%) 60%, hsl(265,85%,55%) 100%)",
                  }}
                >
                  {location.name}
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mt-4 text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed"
              >
                {location.description}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-5 relative"
            >
              <div className="relative">
                <div className="flex items-start gap-3">
                  <span
                    className="display-number text-[clamp(7rem,18vw,11rem)] bg-clip-text text-transparent"
                    data-numeric
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, hsl(210,90%,46%) 0%, hsl(265,85%,55%) 60%, hsl(180,90%,45%) 100%)",
                    }}
                  >
                    {Math.round(current.temperature)}
                  </span>
                  <span className="font-display text-foreground/70 text-3xl md:text-4xl mt-4">°C</span>
                </div>
                <p className="byline text-muted-foreground mt-1">
                  {current.weatherDescription} · feelzlike {Math.round(current.feelsLike)}°
                </p>
              </div>
            </motion.div>
          </div>

          {/* CONDITIONS RIGHT NOW - May 2026 v3: was the dense 3-tile strip
              (Snow depth / Snow next 24h / Wind+gusts). Replaced with the
              full measurements panel that used to live inside the paid
              Detailed Conditions block, since it's the first thing an
              off-mountain skier actually wants to see. */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-6 md:mt-9 glass rounded-3xl p-5 md:p-8"
          >
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="byline text-muted-foreground">conditions</p>
                <h2 className="font-display font-semibold text-xl md:text-2xl mt-1">
                  right now
                </h2>
              </div>
              <p className="byline text-muted-foreground/70 hidden md:block">
                {stats.length} measurements
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-5 gap-x-4">
              {stats.map((s, i) => (
                <div key={i} className="group">
                  <div className="flex items-center gap-1.5 byline text-muted-foreground/80 mb-1.5">
                    <s.icon className="w-3 h-3 text-muted-foreground/60" />
                    {s.label}
                  </div>
                  <p
                    className="font-display text-2xl md:text-3xl text-foreground tracking-tight"
                    data-numeric
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Scroll cue */}
          <div className="mt-6 md:mt-8 flex items-center gap-2 text-muted-foreground/70">
            <span className="byline">Live conditions below</span>
            <ArrowDown className="w-3 h-3" />
          </div>
        </div>
      </section>

      {/* ─── Body ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 pb-20 space-y-5 md:space-y-6 -mt-2">
        {/* HOUR BY HOUR - next 48h. AU thresholds (0.5cm/hr, <25km/h)
            relaxed vs Japow benchmarks. */}
        <HourlyForecast
          hourly={hourly}
          utcOffsetSeconds={(weatherData as any).utcOffsetSeconds ?? 0}
          thresholds={POWDER_THRESHOLDS_AU}
        />

        {/* WEATHER OUTLOOK - free 5-day mountain strip. Anything past day 5
            is gated below in the Extended Outlook teaser. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-3xl p-5 md:p-8"
        >
          <div className="flex items-end justify-between mb-4 gap-3">
            <div>
              <p className="byline text-muted-foreground">Weather outlook</p>
              <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
                <CalendarDays className="text-primary w-5 h-5" />
                5-day mountain forecast
              </h2>
            </div>
            <p className="byline text-muted-foreground/70 hidden md:block tabular-nums">
              {location.elevation}m · top elevation
            </p>
          </div>

          {(() => {
            const days = daily.slice(0, 5);
            const maxSnow = Math.max(0.1, ...days.map((d: any) => Number(d.snowfallSum) || 0));
            const maxRain = Math.max(0.1, ...days.map((d: any) => Number(d.precipitationSum) || 0));
            return (
              <div className={cn("grid gap-px rounded-2xl overflow-hidden bg-white/5 border border-white/5",
                days.length === 6 ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3 md:grid-cols-7")}
              >
                {days.map((day: any, i: number) => {
                  const snow = Number(day.snowfallSum) || 0;
                  const rain = Number(day.precipitationSum) || 0;
                  const snowH = Math.round((snow / maxSnow) * 100);
                  const rainH = Math.round((rain / maxRain) * 100);
                  return (
                    <div key={day.date} className="bg-background/40 px-3 py-4 md:px-4 md:py-4 flex flex-col items-center text-center gap-2">
                      <p className="font-display font-medium text-base md:text-lg text-foreground tracking-tight">
                        {i === 0 ? "Today" : format(parseISO(day.date), "EEE")}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground tabular-nums -mt-1">
                        {format(parseISO(day.date), "d MMM")}
                      </p>

                      <div className="my-1.5 text-primary/90">
                        <WeatherIcon code={day.weatherCode} className="w-9 h-9 md:w-11 md:h-11" />
                      </div>
                      <p className="text-xs text-muted-foreground capitalize line-clamp-1 leading-snug min-h-[1.1em]">
                        {(day.weatherDescription || "").toLowerCase()}
                      </p>

                      <div className="flex items-baseline justify-center gap-2 font-display mt-1" data-numeric>
                        <span className="text-foreground text-2xl md:text-3xl font-medium">{Math.round(day.maxTemp)}°</span>
                        <span className="text-muted-foreground text-base">{Math.round(day.minTemp)}°</span>
                      </div>

                      {/* snowfall / rainfall bars */}
                      <div className="w-full flex items-end justify-center gap-1.5 h-10 mt-2" aria-hidden>
                        <div className="flex flex-col items-center justify-end h-full">
                          <div
                            className="w-3 rounded-t-sm bg-sky-400/80"
                            style={{ height: `${snow > 0 ? Math.max(8, snowH) : 0}%` }}
                            title={`${snow.toFixed(1)} mm snow`}
                          />
                          <Snowflake className="w-3 h-3 text-sky-400/80 mt-1" />
                        </div>
                        <div className="flex flex-col items-center justify-end h-full">
                          <div
                            className="w-3 rounded-t-sm bg-blue-500/60"
                            style={{ height: `${rain > 0 ? Math.max(8, rainH) : 0}%` }}
                            title={`${rain.toFixed(1)} mm rain`}
                          />
                          <CloudRain className="w-3 h-3 text-blue-500/70 mt-1" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs tabular-nums text-foreground/80 mt-1">
                        <span className="font-medium text-sky-700">{snow > 0 ? `${snow.toFixed(snow >= 10 ? 0 : 1)}mm` : "-"}</span>
                        <span className="text-muted-foreground/50">/</span>
                        <span className="font-medium text-blue-700">{rain > 0 ? `${rain.toFixed(rain >= 10 ? 0 : 1)}mm` : "-"}</span>
                      </div>

                      {day.windSpeedMax != null && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                          <Wind className="w-3 h-3" />
                          <span className="tabular-nums font-medium text-foreground/90">{Math.round(day.windSpeedMax)}</span>
                          <span>km/h</span>
                        </div>
                      )}

                      {day.sunrise && day.sunset && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 pt-2 border-t border-border/50 w-full justify-center tabular-nums">
                          <span className="inline-flex items-center gap-1"><Sunrise className="w-3 h-3" />{format(parseISO(day.sunrise), "H:mm")}</span>
                          <span className="inline-flex items-center gap-1"><Sunset className="w-3 h-3" />{format(parseISO(day.sunset), "H:mm")}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div className="mt-3 flex items-center justify-end gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-400/80" /> Snowfall</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500/60" /> Rainfall</span>
          </div>
        </motion.div>

        {/* PREMIUM · Next 6 days · the 5-day strip above is free; this
            gates the 6-day+ outlook (extending to 7/14/21 once the model
            data is wired). Renamed May 2026 v4 from "Extended outlook"
            to align with the cross-region paywall sequence:
            Next 6 days → Elevation forecast → Lift hold likely. */}
        <PremiumGate
          title="Next 6 days"
          titleJa="今後6日間"
          blurb="See further out than the free 5-day window · 7 / 14 / 21 day extended outlook for trip planning."
          blurbJa="無料5日予報を超える長期予報 · 7・14・21日の見通しで旅行計画に。"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.27 }}
            className="glass rounded-3xl p-5 md:p-8"
          >
            <div className="flex items-end justify-between mb-4 gap-3">
              <div>
                <p className="byline text-muted-foreground">Weather outlook</p>
                <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
                  <CalendarDays className="text-primary w-5 h-5" />
                  Extended (7 / 14 / 21 day)
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {daily.slice(5, 8).map((day: any) => (
                <div key={day.date} className="rounded-2xl bg-background/40 border border-white/5 p-4 text-center">
                  <p className="font-display text-base text-foreground">
                    {format(parseISO(day.date), "EEE d MMM")}
                  </p>
                  <div className="my-2 text-primary/90 inline-block">
                    <WeatherIcon code={day.weatherCode} className="w-7 h-7" />
                  </div>
                  <div className="flex items-baseline justify-center gap-1.5 font-display" data-numeric>
                    <span className="text-foreground text-lg">{Math.round(day.maxTemp)}°</span>
                    <span className="text-muted-foreground/60 text-xs">{Math.round(day.minTemp)}°</span>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-muted-foreground/70 text-xs">
                14 / 21-day horizon coming soon
              </div>
            </div>
          </motion.div>
        </PremiumGate>

        {/* PREMIUM · Elevation forecast · upper / mid / base snow + temp.
            Added May 2026 v4 to align with the cross-region paywall
            sequence: Next 6 days → Elevation forecast → Lift hold likely.
            Self-hides inside ElevationBands when coords/elevation missing. */}
        {location.latitude != null && location.longitude != null && location.elevation != null && (
          <PremiumGate
            title="Elevation forecast"
            titleJa="標高別予報"
            blurb="See conditions across upper / mid / base elevations · snow and temperature for each band."
            blurbJa="山頂・中腹・ベースの標高別コンディション · 降雪と気温。"
          >
            <ElevationBands
              lat={location.latitude}
              lng={location.longitude}
              summitElevationM={location.elevation}
              name={location.name}
            />
          </PremiumGate>
        )}

        {/* FREE · 7-day powder forecast calendar. Moved to sit right after
            Elevation forecast (May 2026 v6) so the powder outlook reads as
            a continuation of the multi-day weather story rather than
            interrupting the hour-by-hour strip. AU thresholds keep grading
            honest for the lower-snow Snowy range. */}
        {hourly && hourly.length > 0 && (
          <PowderCalendar hourly={hourly} thresholds={POWDER_THRESHOLDS_AU} sectionNumber="" />
        )}

        {showThredboSummer && <ThredboSummer />}

        {/* FREE · LIFT STATUS · moved above the Detailed conditions
            paywall so users see today's lift count before any paid
            content. Lift Hold Likely (the wind-driven prediction)
            sits inside the paid bundle below it.
            Hidden in summer · snow/lift data is meaningless when resorts
            are closed, and Thredbo's summer activities live in
            <ThredboSummer /> above. */}
        {showLiftAndDials && isResort && liftData && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="glass rounded-3xl p-5 md:p-8 flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="byline text-muted-foreground">Lift status</p>
                <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
                  <Cable className="text-primary w-5 h-5" />
                  On the snow
                </h2>
              </div>
              <div className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                liftData.seasonStatus === "open" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                "bg-amber-500/15 text-amber-300 border-amber-500/30"
              )}>
                {liftData.seasonStatus.replace("-", " ")}
              </div>
            </div>

            {(liftData.seasonStatus === "pre-season" || liftData.seasonStatus === "closed") && liftData.liftsOpen === 0 && (
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-700 px-2.5 py-1 text-[11px] font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
                </span>
                {liftData.seasonStatus === "pre-season"
                  ? "Pre-season · NSW lifts typically spin up early June"
                  : "Off-season · NSW lifts close early October"}
              </div>
            )}

            <div className="flex gap-6 mb-4 pb-4 border-b border-white/5">
              <div>
                <p className="byline text-muted-foreground/70 mb-1">Lifts open</p>
                <p className="font-display text-3xl text-foreground" data-numeric>
                  <span className={liftData.liftsOpen > 0 ? "text-primary" : ""}>{liftData.liftsOpen}</span>
                  <span className="text-muted-foreground/40 text-xl">/{liftData.totalLifts}</span>
                </p>
              </div>
              {liftData.runsOpen !== undefined && liftData.totalRuns !== undefined && (
                <div>
                  <p className="byline text-muted-foreground/70 mb-1">Runs open</p>
                  <p className="font-display text-3xl text-foreground" data-numeric>
                    <span className={liftData.runsOpen > 0 ? "text-primary" : ""}>{liftData.runsOpen}</span>
                    <span className="text-muted-foreground/40 text-xl">/{liftData.totalRuns}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1 flex-1 overflow-y-auto max-h-[280px] pr-1 hide-scrollbar">
              {liftData.lifts.map((lift: any) => (
                <div key={lift.id} className="flex justify-between items-center px-2 py-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-sm text-foreground">{lift.name}</p>
                    <p className="byline text-muted-foreground/60">{lift.type.replace("-", " ")}</p>
                  </div>
                  <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1", getStatusColor(lift.status))}>
                    {getStatusIcon(lift.status)}
                    <span className="capitalize">{lift.status.replace("-", " ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* PREMIUM · Mountain dials · MountainSnapshot rings only.
            The wind-driven lift-hold call was removed here because the
            per-lift hold panel below already delivers it with finer
            per-lift gust tolerances. Order matches Yamanouchi (May 2026 v5).
            Same season gate as the lift card · the freezing-level / snow
            rings are winter signals. */}
        {showLiftAndDials && (
        <PremiumGate
          title="Mountain dials"
          titleJa="マウンテン計器盤"
          blurb="Freezing level, gusts and incoming snow at a glance."
          blurbJa="凍結高度・突風・降雪を一目で。"
        >
          {location.elevation != null && current.windSpeed != null && (
            <MountainSnapshot
              resortName={location.name}
              elevation={location.elevation}
              freezingLevel={current.freezingLevel ?? undefined}
              gust={current.windGust ?? undefined}
              windSpeed={current.windSpeed}
              liftsOpen={liftData?.liftsOpen}
              totalLifts={liftData?.totalLifts}
              snowfallNext24h={current.snowfallNext24h ?? undefined}
              snowfallNext48h={current.snowfallNext48h ?? undefined}
              snowfallNext72h={current.snowfallNext72h ?? undefined}
            />
          )}
        </PremiumGate>
        )}

        {/* PREMIUM · Per-lift hold forecast · hour-by-hour hold risk
            for each named lift on this mountain, using lift-specific
            gust tolerances. Page-level gated by getLiftsForMountain so
            free users don't see a lock for empty data (matches VIC). */}
        {hourly && hourly.length > 0 && getLiftsForMountain(locationId).length > 0 && (
          <PremiumGate
            title="Per-lift hold forecast"
            titleJa="リフト別ホールド予測"
            blurb="Hour-by-hour hold risk for each named lift on this mountain · uses lift-specific gust tolerances."
            blurbJa="各リフトの時間別ホールドリスク · リフト固有の耐風基準を使用。"
          >
            <LiftWindHoldPanel
              mountainId={locationId}
              resortElevationM={location.elevation}
              hourly={hourly as any}
              sectionNumber=""
            />
          </PremiumGate>
        )}

        {/* PREMIUM · 24-hour trend chart · interactive temp/snow/wind. */}
        <PremiumGate
          title="24-hour trend"
          titleJa="24時間推移"
          blurb="Interactive chart · switch between temperature, snowfall and wind for the next 24 hours."
          blurbJa="気温・降雪・風速を切り替えて24時間の推移を確認。"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-5 md:p-8"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-5 gap-3">
              <div>
                <p className="byline text-muted-foreground">24-hour trend</p>
                <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
                  <BarChart2 className="text-primary w-5 h-5" />
                  How it's tracking
                </h2>
              </div>
              <div className="flex bg-secondary/40 p-1 rounded-xl border border-white/5">
                {(["temperature", "snowfall", "windSpeed"] as const).map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setActiveChartMetric(metric)}
                    className={cn(
                      "px-3 md:px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                      activeChartMetric === metric
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {metric.replace("Speed", "")}
                  </button>
                ))}
              </div>
            </div>
            <ForecastChart data={hourly} metric={activeChartMetric} />
          </motion.div>
        </PremiumGate>

        {/* PREMIUM · Ensemble forecast · multi-model consensus. */}
        <PremiumGate
          title="Ensemble forecast"
          titleJa="アンサンブル予報"
          blurb="Multi-model consensus · agreement across BOM, ECMWF and other models for the next 7 days."
          blurbJa="BOM・ECMWFなど複数モデルの合意度を可視化（今後7日間）。"
        >
          <EnsembleForecast locationId={locationId} />
        </PremiumGate>

        {/* PREMIUM - Personalised alerts (UI only for now).
            Hidden in green season - powder alerts are snow-only. */}
        {!isSummer && (
          <PremiumGate
            title="Powder & weather alerts"
            titleJa="降雪・気象アラート"
            blurb="Get a push when conditions hit. Set thresholds for snowfall, wind, freezing level."
            blurbJa="条件達成時にプッシュ通知。降雪・風速・凍結高度を設定。"
          >
            <div className="glass rounded-3xl p-5 md:p-8">
              <div className="mb-4">
                <p className="byline text-muted-foreground">Alerts</p>
                <h2 className="font-display font-semibold text-xl md:text-2xl mt-1">
                  Personalised triggers
                </h2>
              </div>
              <AlertSubscribeForm defaultRegion="snowy-mountains" />
            </div>
          </PremiumGate>
        )}

        {/* Webcams (free) · Lift Status was lifted above the Detailed
            conditions paywall so it sits closer to free Conditions. */}
        <div className="grid grid-cols-1 gap-6 md:gap-8">
          {webcamData && webcamData.webcams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-3xl p-5 md:p-8"
            >
              <div className="flex items-end justify-between mb-4 gap-4">
                <div>
                  <p className="byline text-muted-foreground">Eyes on the mountain</p>
                  <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
                    <Camera className="text-primary w-5 h-5" />
                    Live webcams
                  </h2>
                </div>
                {webcamData.webcamPageUrl && (
                  <a
                    href={webcamData.webcamPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                  >
                    All cams ↗
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {webcamData.webcams.map((webcam: any) => (
                  <a
                    key={webcam.id}
                    href={webcam.pageUrl ?? webcam.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block overflow-hidden rounded-2xl bg-muted/40 border border-border hover:border-primary/40 transition-colors"
                  >
                    <div className="relative aspect-video bg-muted/60 overflow-hidden">
                      <img
                        src={webcam.imageUrl}
                        alt={webcam.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                          const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (fb) fb.style.display = "flex";
                        }}
                      />
                      <div
                        style={{ display: "none" }}
                        className="absolute inset-0 flex-col items-center justify-center text-muted-foreground text-[10px] gap-1 bg-muted/40"
                      >
                        <Camera className="w-5 h-5 opacity-50" />
                        <span>Open live feed</span>
                      </div>
                    </div>
                    <div className="px-3 py-2">
                      <p className="font-semibold text-foreground text-xs truncate">{webcam.name}</p>
                      {webcam.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{webcam.description}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

        </div>

        <SafetyStrip resortId={locationId} />

      </div>
    </>
  );
}
