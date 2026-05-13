import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { CalendarDays, Snowflake, CloudRain } from "lucide-react";

interface EnsembleDay {
  date: string;
  tempMaxMean: number;
  tempMinMean: number;
  precipMean: number;
  snowMean: number;
}
interface EnsembleResponse { days: EnsembleDay[]; generatedAt: string; }

interface Props { locationId: string }

/**
 * Six-day forecast strip. Previously this was a "multi-model consensus"
 * panel with confidence dots, per-source breakdowns and methodology
 * footnotes - useful for forecasters, confusing for trip-planners. We now
 * surface just the daily mean numbers and let the underlying ensemble
 * machinery do its job invisibly.
 */
export function EnsembleForecast({ locationId }: Props) {
  const [data, setData] = useState<EnsembleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}api/forecast/${locationId}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [locationId]);

  if (error) return null;
  if (!data) {
    return (
      <div className="glass rounded-3xl p-5 md:p-8 animate-pulse">
        <div className="h-3 w-24 bg-muted/50 rounded mb-3" />
        <div className="h-6 w-48 bg-muted/40 rounded mb-5" />
        <div className="h-32 bg-muted/20 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      className="glass rounded-3xl p-5 md:p-8"
    >
      <div>
        <p className="byline text-muted-foreground">Forecast</p>
        <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
          <CalendarDays className="text-primary w-5 h-5" />
          Next 6 days
        </h2>
      </div>

      <div className="rule mt-5 mb-2" />

      <div className="divide-y divide-white/5">
        {data.days.slice(0, 6).map((day, i) => {
          const showSnow = day.snowMean >= 1;
          const showRain = !showSnow && day.precipMean >= 1;
          return (
            <div
              key={day.date}
              className="py-3 px-2 flex items-center justify-between gap-3"
            >
              <div className="w-1/4 min-w-[80px]">
                <p className="font-medium text-foreground">
                  {i === 0 ? "Today" : format(parseISO(day.date), "EEE")}
                </p>
                <p className="byline text-muted-foreground/60">
                  {format(parseISO(day.date), "MMM d")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0 text-xs text-muted-foreground/85">
                {showSnow && (
                  <span className="inline-flex items-center gap-1">
                    <Snowflake className="w-3 h-3 text-sky-400" />
                    <span data-numeric>{day.snowMean.toFixed(0)} cm</span>
                  </span>
                )}
                {showRain && (
                  <span className="inline-flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-sky-400" />
                    <span data-numeric>{day.precipMean.toFixed(0)} mm</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 font-display" data-numeric>
                <span className="text-foreground text-lg">{Math.round(day.tempMaxMean)}°</span>
                <span className="text-muted-foreground/60 text-sm">{Math.round(day.tempMinMean)}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
