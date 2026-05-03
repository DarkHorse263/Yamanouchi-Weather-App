import { motion } from "framer-motion";
import { CalendarDays, Snowflake, CloudRain, Wind, Sunrise, Sunset, Cloud, Sun, CloudSun, CloudDrizzle, CloudSnow, CloudFog, CloudLightning } from "lucide-react";
import { cn } from "../lib/cn";

export interface OutlookDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode?: number | null;
  weatherDescription?: string;
  precipitationSum?: number;
  snowfallSum?: number;
  windSpeedMax?: number;
  sunrise?: string;
  sunset?: string;
}

export interface MountainOutlookProps {
  days: OutlookDay[];
  /** Maximum number of days to render (defaults to 6) */
  maxDays?: number;
  elevation: number;
  sectionNumber?: string;
  heading?: string;
}

function WeatherIcon({ code, className = "w-5 h-5" }: { code: number | null | undefined; className?: string }) {
  if (code == null) return <Cloud className={className} />;
  if (code === 0) return <Sun className={className} />;
  if (code === 1 || code === 2) return <CloudSun className={className} />;
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

function dayLabel(iso: string, idx: number) {
  if (idx === 0) return "Today";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function dateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function timeLabel(iso: string | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: false });
}

export function MountainOutlook({
  days: rawDays,
  maxDays = 6,
  elevation,
  sectionNumber = "05",
  heading,
}: MountainOutlookProps) {
  const days = rawDays.slice(0, maxDays);
  const headingText = heading ?? `${days.length}-day mountain forecast`;
  const maxSnow = Math.max(0.1, ...days.map((d) => Number(d.snowfallSum) || 0));
  const maxRain = Math.max(0.1, ...days.map((d) => Number(d.precipitationSum) || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass rounded-3xl p-6 md:p-8"
    >
      <div className="flex items-end justify-between mb-6 gap-3">
        <div>
          <p className="byline text-muted-foreground">{sectionNumber} · Outlook</p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2 text-foreground">
            <CalendarDays className="text-muted-foreground/70 w-5 h-5" strokeWidth={1.75} />
            {headingText}
          </h2>
        </div>
        <p className="byline text-muted-foreground/70 hidden md:block tabular-nums">
          {elevation}m · top elevation
        </p>
      </div>

      <div
        className={cn(
          "grid gap-px rounded-2xl overflow-hidden bg-slate-200/40 border border-slate-200/60",
          days.length === 6 ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3 md:grid-cols-7",
        )}
      >
        {days.map((day, i) => {
          const snow = Number(day.snowfallSum) || 0;
          const rain = Number(day.precipitationSum) || 0;
          const snowH = Math.round((snow / maxSnow) * 100);
          const rainH = Math.round((rain / maxRain) * 100);
          return (
            <div
              key={day.date}
              className="bg-white/70 px-2 py-3 md:px-3 md:py-4 flex flex-col items-center text-center gap-1.5"
            >
              <p className="font-display text-sm md:text-base text-foreground tracking-tight">
                {dayLabel(day.date, i)}
              </p>
              <p className="byline text-muted-foreground/60 -mt-0.5">{dateLabel(day.date)}</p>

              <div className="my-1 text-slate-700">
                <WeatherIcon code={day.weatherCode} className="w-7 h-7 md:w-9 md:h-9" />
              </div>
              <p className="text-[10px] text-muted-foreground/80 capitalize line-clamp-1 leading-tight min-h-[1.1em]">
                {(day.weatherDescription || "").toLowerCase()}
              </p>

              <div className="flex items-baseline justify-center gap-1.5 font-display mt-1" data-numeric>
                <span className="text-foreground text-lg md:text-xl">{Math.round(day.maxTemp)}°</span>
                <span className="text-muted-foreground/60 text-xs">{Math.round(day.minTemp)}°</span>
              </div>

              <div className="w-full flex items-end justify-center gap-1 h-9 mt-1.5" aria-hidden>
                <div className="flex flex-col items-center justify-end h-full">
                  <div
                    className="w-2.5 rounded-t-sm bg-sky-500/70"
                    style={{ height: `${snow > 0 ? Math.max(8, snowH) : 0}%` }}
                    title={`${snow.toFixed(1)} mm snow`}
                  />
                  <Snowflake className="w-2.5 h-2.5 text-sky-500/70 mt-0.5" />
                </div>
                <div className="flex flex-col items-center justify-end h-full">
                  <div
                    className="w-2.5 rounded-t-sm bg-slate-400/70"
                    style={{ height: `${rain > 0 ? Math.max(8, rainH) : 0}%` }}
                    title={`${rain.toFixed(1)} mm rain`}
                  />
                  <CloudRain className="w-2.5 h-2.5 text-slate-500/70 mt-0.5" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground/80 mt-0.5">
                <span className="text-sky-700">{snow > 0 ? `${snow.toFixed(snow >= 10 ? 0 : 1)}mm` : "-"}</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-slate-600">{rain > 0 ? `${rain.toFixed(rain >= 10 ? 0 : 1)}mm` : "-"}</span>
              </div>

              {day.windSpeedMax != null && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 mt-1">
                  <Wind className="w-2.5 h-2.5" />
                  <span className="tabular-nums">{Math.round(day.windSpeedMax)}</span>
                  <span>km/h</span>
                </div>
              )}

              {day.sunrise && day.sunset && (
                <div className="hidden md:flex items-center gap-2 text-[9px] text-muted-foreground/60 mt-1 pt-1 border-t border-slate-200/60 w-full justify-center">
                  <span className="inline-flex items-center gap-0.5">
                    <Sunrise className="w-2.5 h-2.5" />
                    {timeLabel(day.sunrise)}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Sunset className="w-2.5 h-2.5" />
                    {timeLabel(day.sunset)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-3 text-[10px] text-muted-foreground/70">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-sky-500/70" /> Snowfall
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-slate-400/70" /> Rainfall
        </span>
      </div>
    </motion.div>
  );
}
