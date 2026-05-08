import { useRoute } from "wouter";
import { useGetLocationWeather, useGetLocationWebcams, useGetLocationLiftStatus } from "@workspace/api-client-react";
import { LoadingState } from "../components/ui/loading-state";
import { ErrorState } from "../components/ui/error-state";
import { ForecastChart } from "../components/weather/ForecastChart";
import { EnsembleForecast } from "../components/weather/EnsembleForecast";
import { MountainSnapshot } from "../components/weather/MountainSnapshot";
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
import { skyGradient } from "../lib/mountain-imagery";
import { HourlyForecast } from "@/components/HourlyForecast";
import { PowderFactorBadge } from "@/components/PowderFactorBadge";
import { POWDER_THRESHOLDS_AU } from "@/types/weather";
import { PremiumGate } from "@workspace/feelzlike-shell";
import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";

type LocationId = "thredbo" | "perisher" | "charlottes-pass" | "selwyn" | "jindabyne";

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

  const { data: weatherData, isLoading: weatherLoading, error: weatherError, refetch: weatherRefetch } = useGetLocationWeather(locationId, { query: { enabled: !!locationId } });
  const { data: webcamData } = useGetLocationWebcams(locationId, { query: { enabled: !!locationId } });
  const isResort = locationId === "thredbo" || locationId === "perisher" || locationId === "charlottes-pass" || locationId === "selwyn";
  const { data: liftData } = useGetLocationLiftStatus(locationId as any, { query: { enabled: isResort } });

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
  const sky = skyGradient({ tempC: current.temperature, description: current.weatherDescription });

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

        <div className="relative max-w-7xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-8 md:pb-12">
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
              {current.dataSource === "BOM" ? `BOM Live · ${current.bomStation ?? "AU"}` : "Live"}
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
          </motion.div>

          {/* Headline + temperature */}
          <div className="mt-6 md:mt-10 grid md:grid-cols-12 gap-6 md:gap-10 items-end">
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

          {/* Live stat tiles */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {/* May 2026 v2: Snow depth, Snow next 24h, Wind (with gusts as
                a hint line). Freezing Level tile removed - rarely useful
                off-mountain, lives inside Detailed Conditions for paying
                users instead. */}
            {[
              {
                label: "Snow depth",
                value: current.snowDepth != null ? `${current.snowDepth}` : "-",
                unit: "cm",
                hint: undefined,
                icon: Snowflake,
                tint: "hsl(190,90%,45%)",
              },
              {
                label: "Snow next 24h",
                value: snow24h != null ? snow24h.toFixed(1) : "-",
                unit: "cm",
                hint: undefined,
                icon: CloudSnow,
                tint: "hsl(210,90%,46%)",
              },
              {
                label: "Wind",
                value: `${Math.round(current.windSpeed)}`,
                unit: `km/h${current.windDirectionCompass ? ` ${current.windDirectionCompass}` : ""}`,
                hint:
                  current.windGust != null
                    ? `Gusts ${Math.round(current.windGust)} km/h`
                    : undefined,
                icon: Wind,
                tint: "hsl(265,85%,55%)",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${s.tint}33, ${s.tint}11)`,
                  padding: "1px",
                }}
              >
                <div className="rounded-[15px] bg-card/80 backdrop-blur-md p-4 h-full">
                  <div className="flex items-center gap-1.5 byline text-muted-foreground/80">
                    <s.icon className="w-3 h-3" style={{ color: s.tint }} />
                    {s.label}
                  </div>
                  <p className="mt-2 font-display font-semibold text-2xl md:text-3xl text-foreground tnum tracking-tight" data-numeric>
                    {s.value}
                    <span className="text-sm md:text-base text-muted-foreground/70 font-normal ml-1">{s.unit}</span>
                  </p>
                  {s.hint && (
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{s.hint}</p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Scroll cue */}
          <div className="mt-8 md:mt-10 flex items-center gap-2 text-muted-foreground/70">
            <span className="byline">Live conditions below</span>
            <ArrowDown className="w-3 h-3" />
          </div>
        </div>
      </section>

      {/* ─── Body ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 pb-20 space-y-6 md:space-y-8 -mt-2">
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
          <div className="flex items-end justify-between mb-5 gap-3">
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
                    <div key={day.date} className="bg-background/40 px-3 py-4 md:px-4 md:py-5 flex flex-col items-center text-center gap-2">
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

        {/* PREMIUM - Extended outlook 7/14/21 day. Free tier sees a blurred
            tease of any remaining days the API gave us; subscribers get the
            full extended horizon (we'll wire 14/21-day model data when the
            API is ready). */}
        <PremiumGate
          title="Extended outlook 7 / 14 / 21 day"
          titleJa="長期予報 7・14・21日"
          blurb="See further out than the free 5-day window. Plan trips with confidence."
          blurbJa="無料の5日予報を超える長期予報。旅行計画に最適。"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.27 }}
            className="glass rounded-3xl p-5 md:p-8"
          >
            <div className="flex items-end justify-between mb-5 gap-3">
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

        {/* PREMIUM - Detailed conditions. Bundles MountainSnapshot, the
            full conditions strip, the 24-hour ForecastChart trend, the
            Powder Factor backwards-looking score and the multi-model
            EnsembleForecast into one paid panel. */}
        <PremiumGate
          title="Detailed conditions"
          titleJa="詳細コンディション"
          blurb="The full instrument panel: snapshot rings, every measurement, 24-hour trend chart, powder score and multi-model consensus."
          blurbJa="フル計器盤:スナップショット、全測定値、24時間推移、パウダースコア、マルチモデル合意。"
        >
          <div className="space-y-6 md:space-y-8">
            <MountainSnapshot
              resortName={location.name}
              elevation={location.elevation}
              freezingLevel={current.freezingLevel}
              gust={current.windGust}
              windSpeed={current.windSpeed}
              liftsOpen={liftData?.liftsOpen}
              totalLifts={liftData?.totalLifts}
              snowfallNext24h={current.snowfallNext24h}
              snowfallNext48h={current.snowfallNext48h}
              snowfallNext72h={current.snowfallNext72h}
            />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="glass rounded-3xl p-5 md:p-8"
            >
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="byline text-muted-foreground">Conditions</p>
                  <h2 className="font-display font-semibold text-xl md:text-2xl mt-1">Right now</h2>
                </div>
                <p className="byline text-muted-foreground/70 hidden md:block">{stats.length} measurements</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4">
                {stats.map((s, i) => (
                  <div key={i} className="group">
                    <div className="flex items-center gap-1.5 byline text-muted-foreground/80 mb-1.5">
                      <s.icon className="w-3 h-3 text-muted-foreground/60" />
                      {s.label}
                    </div>
                    <p className="font-display text-2xl md:text-3xl text-foreground tracking-tight" data-numeric>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-3xl p-5 md:p-8"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
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

            <PowderFactorBadge hourly={hourly} t={(en) => en} sectionNumber="" />
            <EnsembleForecast locationId={locationId} />
          </div>
        </PremiumGate>

        {/* PREMIUM - Personalised alerts (UI only for now). */}
        <PremiumGate
          title="Powder & weather alerts"
          titleJa="降雪・気象アラート"
          blurb="Get a push when conditions hit. Set thresholds for snowfall, wind, freezing level."
          blurbJa="条件達成時にプッシュ通知。降雪・風速・凍結高度を設定。"
        >
          <div className="glass rounded-3xl p-5 md:p-8">
            <div className="mb-5">
              <p className="byline text-muted-foreground">Alerts</p>
              <h2 className="font-display font-semibold text-xl md:text-2xl mt-1">
                Personalised triggers
              </h2>
            </div>
            <AlertSubscribeForm defaultRegion="snowy-mountains" />
          </div>
        </PremiumGate>

        {/* Webcams + Lifts (free) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {webcamData && webcamData.webcams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-3xl p-5 md:p-8 lg:col-span-2"
            >
              <div className="flex items-end justify-between mb-5 gap-4">
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
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{webcam.description}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {isResort && liftData && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass rounded-3xl p-5 md:p-8 flex flex-col"
            >
              <div className="flex justify-between items-start mb-5">
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

              <div className="flex gap-6 mb-5 pb-5 border-b border-white/5">
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
        </div>

        <SafetyStrip />

      </div>
    </>
  );
}
