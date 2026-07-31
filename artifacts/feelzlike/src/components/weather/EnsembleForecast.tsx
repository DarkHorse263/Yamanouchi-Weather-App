import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO, isToday } from "date-fns";
import { CalendarDays, Snowflake, CloudRain, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnits } from "@/components/auth/UserPrefsProvider";

interface EnsembleSource {
  source: string;
  tempMax?: number;
  tempMin?: number;
  precip?: number;
  snow?: number;
}
interface EnsembleDay {
  date: string;
  tempMaxMean: number;
  tempMinMean: number;
  precipMean: number;
  snowMean: number;
  snowSpread: number;
  sourcesCount: number;
  confidence: "high" | "medium" | "low";
  perSource: EnsembleSource[];
}
interface EnsembleResponse {
  days: EnsembleDay[];
  generatedAt: string;
  forecastElevationM?: number;
  /**
   * Present when every forecast service failed and the server served the last
   * good outlook from cache · `generatedAt` still reflects when that outlook
   * was built, so we can show an honest "as of" line.
   */
  _stale?: { ageSeconds: number } | null;
}

interface Props {
  locationId: string;
  /**
   * On-mountain elevation (m) to compute the ensemble at, so the spread
   * cross-check sits at the SAME height as the headline snow outlook. When
   * omitted the server computes at the village.
   */
  elevationM?: number;
}

const CONFIDENCE: Record<EnsembleDay["confidence"], { label: string; dot: string }> = {
  high: { label: "models agree", dot: "bg-emerald-400" },
  medium: { label: "models mixed", dot: "bg-amber-400" },
  low: { label: "models split", dot: "bg-rose-400" },
};

/**
 * Six-day forecast strip with an honest multi-model cross-check. The daily
 * means stay front and centre for trip-planners, while a compact confidence
 * cue (models agree / mixed / split) plus an opt-in per-source snow compare
 * let the curious see exactly how much the models disagree. Computed at the
 * same on-mountain elevation as the headline snow so the two numbers line up.
 */
export function EnsembleForecast({ locationId, elevationM }: Props) {
  const u = useUnits();
  const [data, setData] = useState<EnsembleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const qs = elevationM != null ? `?elevationM=${Math.round(elevationM)}` : "";
    const url = `${import.meta.env.BASE_URL}api/forecast/${locationId}${qs}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [locationId, elevationM]);

  if (error) return null;
  if (!data) {
    return (
      <div className="glass rounded-3xl p-5 md:p-8 animate-pulse">
        <div className="h-3 w-24 bg-muted/50 rounded mb-3" />
        <div className="h-6 w-48 bg-muted/40 rounded mb-4" />
        <div className="h-32 bg-muted/20 rounded" />
      </div>
    );
  }

  if (data.days.length === 0) {
    // Every forecast service we blend failed and there was no cached outlook to
    // fall back to · say so honestly rather than rendering an empty header.
    return (
      <div className="glass rounded-3xl p-5 md:p-8">
        <p className="byline text-muted-foreground">Forecast</p>
        <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
          <CalendarDays className="text-primary w-5 h-5" />
          Next 6 days
        </h2>
        <div className="rule mt-4 mb-3" />
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          the multi-model outlook is temporarily unavailable · the forecast
          services we blend are being slow right now. current conditions and the
          radar are still up to date.
        </p>
      </div>
    );
  }

  const days = data.days.slice(0, 6);
  const outlookElevationM = data.forecastElevationM;
  // Only worth surfacing a per-source compare when at least one day has more
  // than one model contributing - otherwise there's nothing to compare.
  const hasMultiSource = days.some((d) => d.sourcesCount > 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      className="glass rounded-3xl p-5 md:p-8"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="byline text-muted-foreground">Forecast</p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
            <CalendarDays className="text-primary w-5 h-5" />
            Next 6 days
          </h2>
        </div>
        {outlookElevationM != null && (
          <p className="byline text-muted-foreground/60 text-right tabular-nums mt-1">
            multi-model · at {u.elev(outlookElevationM)}{u.elevUnit}
          </p>
        )}
      </div>

      <div className="rule mt-4 mb-2" />

      {data._stale && (
        <p className="byline text-amber-600/80 mb-2">
          showing the outlook from {format(parseISO(data.generatedAt), "h:mm a")}
          {" "}· live models are catching up
        </p>
      )}

      <div className="divide-y divide-white/5">
        {days.map((day) => {
          const showSnow = day.snowMean >= 1;
          const showRain = !showSnow && day.precipMean >= 1;
          const conf = day.sourcesCount <= 1
            ? { label: "single model", dot: "bg-slate-400" }
            : CONFIDENCE[day.confidence];
          return (
            <div
              key={day.date}
              className="py-3 px-2 flex items-center justify-between gap-3"
            >
              <div className="w-1/4 min-w-[72px]">
                <p className="font-medium text-foreground">
                  {isToday(parseISO(day.date)) ? "Today" : format(parseISO(day.date), "EEE")}
                </p>
                <p className="byline text-muted-foreground/60">
                  {format(parseISO(day.date), "MMM d")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0 text-xs text-muted-foreground/85">
                {showSnow && (
                  <span className="inline-flex items-center gap-1">
                    <Snowflake className="w-3 h-3 text-snow-accent" />
                    <span data-numeric className="text-snow-accent font-medium">{day.snowMean.toFixed(0)} cm</span>
                  </span>
                )}
                {showRain && (
                  <span className="inline-flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-sky-400" />
                    <span data-numeric>{day.precipMean.toFixed(0)} mm</span>
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/70 whitespace-nowrap">
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-none", conf.dot)} />
                  {conf.label}
                  {showSnow && day.snowSpread >= 1 && (
                    <span className="text-muted-foreground/50" data-numeric>
                      · spread {day.snowSpread.toFixed(0)} cm
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3 font-display" data-numeric>
                <span className="text-foreground text-lg">{Math.round(day.tempMaxMean)}°</span>
                <span className="text-muted-foreground/60 text-sm">{Math.round(day.tempMinMean)}°</span>
              </div>
            </div>
          );
        })}
      </div>

      {hasMultiSource && (
        <details className="group mt-4">
          <summary className="byline text-muted-foreground/70 cursor-pointer select-none list-none flex items-center gap-1.5 hover:text-muted-foreground">
            <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
            compare models · snow
          </summary>
          <div className="mt-3 space-y-2">
            {days.map((day) => (
              <div key={day.date} className="flex items-start gap-3 text-[11px]">
                <span className="w-12 flex-none text-muted-foreground/60 pt-0.5">
                  {format(parseISO(day.date), "EEE")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {day.perSource.length === 0 && (
                    <span className="text-muted-foreground/50">no model breakdown</span>
                  )}
                  {day.perSource.map((s) => (
                    <span
                      key={s.source}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary/40 px-1.5 py-0.5 text-muted-foreground/85"
                    >
                      <span className="text-muted-foreground/55">{s.source}</span>
                      <span data-numeric>{s.snow != null ? s.snow.toFixed(0) : "-"}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="byline text-muted-foreground/50 mt-2 tabular-nums">
              snow in cm{outlookElevationM != null ? ` · at ${u.elev(outlookElevationM)}${u.elevUnit}` : ""}
            </p>
          </div>
        </details>
      )}
    </motion.div>
  );
}
