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

  const stats = [
    { label: "Feels like", value: formatTemp(current.feelsLike), icon: Thermometer },
    { label: "Wind", value: `${current.windSpeed} km/h${current.windDirectionCompass ? ` ${current.windDirectionCompass}` : ""}`, icon: Navigation },
    ...(current.windGust ? [{ label: "Gusts", value: `${current.windGust} km/h`, icon: Wind }] : []),
    { label: "Humidity", value: `${current.humidity}%`, icon: Droplets },
    { label: "Snow depth", value: current.snowDepth != null ? `${current.snowDepth} cm` : "-", icon: Snowflake },
    ...(current.dewpoint !== undefined ? [{ label: "Dew point", value: formatTemp(current.dewpoint), icon: Droplets }] : []),
    ...(current.pressure !== undefined ? [{ label: "Pressure", value: `${current.pressure} hPa`, icon: Gauge }] : []),
    ...(current.rainSince9am !== undefined ? [{ label: "Rain since 9am", value: `${current.rainSince9am} mm`, icon: CloudRain }] : []),
    ...(current.visibility && current.visibility !== 10000 ? [{ label: "Visibility", value: `${(current.visibility / 1000).toFixed(0)} km`, icon: Eye }] : []),
    ...(current.freezingLevel !== undefined ? [{ label: "Freezing level", value: `${current.freezingLevel} m`, icon: Snowflake }] : []),
  ];

  return (
    <>
      {/* ─── Atmospheric hero ────────────────── */}
      <section className="relative overflow-hidden grain isolate">
        {/* Atmospheric backdrop - sky condition wash, no photo */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0" style={{ background: sky.wash }} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
          <div className="absolute inset-0" style={{ background: sky.glow }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 md:px-10 pt-10 md:pt-20 pb-10 md:pb-16">
          {/* Source byline */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
          >
            {current.dataSource === "BOM" && (
              <span className="inline-flex items-center gap-1.5 text-accent">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
                </span>
                <span className="byline">BOM Live · {current.bomStation ?? "Australia"}</span>
              </span>
            )}
            {current.dataSource !== "BOM" && (
              <span className="byline text-muted-foreground">Source · {current.dataSource ?? "Bureau of Meteorology + international models"}</span>
            )}
            <span className="byline text-muted-foreground/60">Elev {location.elevation}m</span>
            {location.bomStation && current.dataSource !== "BOM" && (
              <span className="byline text-muted-foreground/60">BOM ref · {location.bomStation}</span>
            )}
            {observedTime && (
              <span className="byline text-muted-foreground/80 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <Clock className="w-3 h-3" />
                <span>Updated <span className="text-foreground tabular-nums">{formatAgo(observedTime, now)}</span></span>
              </span>
            )}
          </motion.div>

          {/* Headline + temperature, magazine block */}
          <div className="mt-6 md:mt-10 grid md:grid-cols-12 gap-6 md:gap-10 items-end">
            <div className="md:col-span-7">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display font-medium text-foreground text-[clamp(3rem,8vw,5.5rem)] leading-[0.92] tracking-tight"
              >
                {location.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mt-4 text-muted-foreground text-base md:text-lg max-w-xl font-light leading-relaxed"
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
              <div className="halo" />
              <div className="relative">
                <div className="flex items-start gap-3">
                  <span className="display-number text-foreground text-[clamp(7rem,18vw,11rem)]" data-numeric>
                    {Math.round(current.temperature)}
                  </span>
                  <span className="font-display text-foreground/70 text-3xl md:text-4xl mt-4">°C</span>
                </div>
                <p className="byline text-muted-foreground mt-1">
                  {current.weatherDescription} · feels {Math.round(current.feelsLike)}°
                </p>
              </div>
            </motion.div>
          </div>

          {/* Scroll cue */}
          <div className="mt-10 md:mt-14 flex items-center gap-2 text-muted-foreground/60">
            <span className="byline">Live conditions below</span>
            <ArrowDown className="w-3 h-3" />
          </div>
        </div>
      </section>

      {/* ─── Body ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 pb-20 space-y-6 md:space-y-8 -mt-2">
        {/* Premium dashboard headline — animated rings, wind-hold alert, snowfall outlook */}
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

        {/* Conditions strip - editorial data table feel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="glass rounded-3xl p-5 md:p-8"
        >
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="byline text-muted-foreground">03 · Conditions</p>
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

        {/* 24-hour trend (full width) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-5 md:p-8"
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
            <div>
              <p className="byline text-muted-foreground">04 · 24-hour trend</p>
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

        {/* Snow-forecast-style dense 6-day mountain strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-3xl p-5 md:p-8"
        >
          <div className="flex items-end justify-between mb-5 gap-3">
            <div>
              <p className="byline text-muted-foreground">05 · Outlook</p>
              <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
                <CalendarDays className="text-primary w-5 h-5" />
                {daily.length}-day mountain forecast
              </h2>
            </div>
            <p className="byline text-muted-foreground/70 hidden md:block tabular-nums">
              {location.elevation}m · top elevation
            </p>
          </div>

          {(() => {
            const days = daily.slice(0, 6);
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
                    <div key={day.date} className="bg-background/40 px-2 py-3 md:px-3 md:py-4 flex flex-col items-center text-center gap-1.5">
                      <p className="font-display text-sm md:text-base text-foreground tracking-tight">
                        {i === 0 ? "Today" : format(parseISO(day.date), "EEE")}
                      </p>
                      <p className="byline text-muted-foreground/60 -mt-0.5">{format(parseISO(day.date), "d MMM")}</p>

                      <div className="my-1 text-primary/90">
                        <WeatherIcon code={day.weatherCode} className="w-7 h-7 md:w-9 md:h-9" />
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 capitalize line-clamp-1 leading-tight min-h-[1.1em]">
                        {(day.weatherDescription || "").toLowerCase()}
                      </p>

                      <div className="flex items-baseline justify-center gap-1.5 font-display mt-1" data-numeric>
                        <span className="text-foreground text-lg md:text-xl">{Math.round(day.maxTemp)}°</span>
                        <span className="text-muted-foreground/60 text-xs">{Math.round(day.minTemp)}°</span>
                      </div>

                      {/* snowfall / rainfall bars */}
                      <div className="w-full flex items-end justify-center gap-1 h-9 mt-1.5" aria-hidden>
                        <div className="flex flex-col items-center justify-end h-full">
                          <div
                            className="w-2.5 rounded-t-sm bg-sky-400/70"
                            style={{ height: `${snow > 0 ? Math.max(8, snowH) : 0}%` }}
                            title={`${snow.toFixed(1)} mm snow`}
                          />
                          <Snowflake className="w-2.5 h-2.5 text-sky-400/70 mt-0.5" />
                        </div>
                        <div className="flex flex-col items-center justify-end h-full">
                          <div
                            className="w-2.5 rounded-t-sm bg-blue-500/50"
                            style={{ height: `${rain > 0 ? Math.max(8, rainH) : 0}%` }}
                            title={`${rain.toFixed(1)} mm rain`}
                          />
                          <CloudRain className="w-2.5 h-2.5 text-blue-500/60 mt-0.5" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground/80 mt-0.5">
                        <span className="text-sky-300/90">{snow > 0 ? `${snow.toFixed(snow >= 10 ? 0 : 1)}mm` : "-"}</span>
                        <span className="text-muted-foreground/40">/</span>
                        <span className="text-blue-300/90">{rain > 0 ? `${rain.toFixed(rain >= 10 ? 0 : 1)}mm` : "-"}</span>
                      </div>

                      {day.windSpeedMax != null && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 mt-1">
                          <Wind className="w-2.5 h-2.5" />
                          <span className="tabular-nums">{Math.round(day.windSpeedMax)}</span>
                          <span>km/h</span>
                        </div>
                      )}

                      {day.sunrise && day.sunset && (
                        <div className="hidden md:flex items-center gap-2 text-[9px] text-muted-foreground/60 mt-1 pt-1 border-t border-white/5 w-full justify-center">
                          <span className="inline-flex items-center gap-0.5"><Sunrise className="w-2.5 h-2.5" />{format(parseISO(day.sunrise), "H:mm")}</span>
                          <span className="inline-flex items-center gap-0.5"><Sunset className="w-2.5 h-2.5" />{format(parseISO(day.sunset), "H:mm")}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div className="mt-3 flex items-center justify-end gap-3 text-[10px] text-muted-foreground/70">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-400/70" /> Snowfall</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/50" /> Rainfall</span>
          </div>
        </motion.div>

        {/* Multi-model ensemble */}
        <EnsembleForecast locationId={locationId} />

        {/* Webcams + Lifts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {webcamData && webcamData.webcams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-3xl p-5 md:p-8"
            >
              <p className="byline text-muted-foreground">07 · Eyes on the mountain</p>
              <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 mb-5 flex items-center gap-2">
                <Camera className="text-primary w-5 h-5" />
                Live webcams
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {webcamData.webcams.slice(0, 4).map((webcam: any) => (
                  <div key={webcam.id} className="group overflow-hidden rounded-2xl bg-black/40 relative aspect-video border border-white/10">
                    <img src={webcam.imageUrl} alt={webcam.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                      <p className="text-white text-xs font-semibold truncate">{webcam.name}</p>
                    </div>
                  </div>
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
                  <p className="byline text-muted-foreground">08 · Lift status</p>
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
