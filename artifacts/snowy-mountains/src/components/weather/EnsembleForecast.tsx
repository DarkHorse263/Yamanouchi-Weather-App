import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ChevronDown, Layers, ShieldCheck, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerSource {
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
  tempMaxSpread: number;
  tempMinSpread: number;
  precipMean: number;
  snowMean: number;
  snowSpread: number;
  sourcesCount: number;
  confidence: "high" | "medium" | "low";
  perSource: PerSource[];
}

interface SourceMeta {
  id: string;
  label: string;
  detail: string;
  status: "ok" | "failed";
  fetchedAt?: string;
}

interface EnsembleResponse {
  days: EnsembleDay[];
  sources: SourceMeta[];
  generatedAt: string;
}

const CONFIDENCE_STYLES: Record<EnsembleDay["confidence"], { dot: string; text: string; label: string; icon: typeof ShieldCheck }> = {
  high: { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", label: "High agreement", icon: ShieldCheck },
  medium: { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", label: "Some disagreement", icon: HelpCircle },
  low: { dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-400", label: "Models disagree", icon: AlertTriangle },
};

interface Props {
  locationId: string;
}

export function EnsembleForecast({ locationId }: Props) {
  const [data, setData] = useState<EnsembleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}api/forecast/${locationId}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [locationId]);

  if (error) return null;
  if (!data) {
    return (
      <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm animate-pulse">
        <div className="h-6 w-64 bg-muted rounded mb-4" />
        <div className="h-32 bg-muted/50 rounded" />
      </div>
    );
  }

  const okSources = data.sources.filter((s) => s.status === "ok");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm"
    >
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Layers className="text-primary w-6 h-6" />
            Multi-model Forecast
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Consensus of {okSources.length} independent forecast sources. We show you the spread, not just one number.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {okSources.map((s) => (
            <span
              key={s.id}
              title={s.detail}
              className="text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 divide-y divide-border">
        {data.days.map((day, i) => {
          const conf = CONFIDENCE_STYLES[day.confidence];
          const isOpen = expanded === day.date;
          const ConfIcon = conf.icon;
          return (
            <div key={day.date} className="py-3">
              <button
                onClick={() => setExpanded(isOpen ? null : day.date)}
                className="w-full flex items-center justify-between gap-3 hover:bg-muted/40 rounded-xl px-3 py-2 transition-colors text-left"
                aria-expanded={isOpen}
              >
                <div className="w-1/4 min-w-[80px]">
                  <p className="font-semibold">{i === 0 ? "Today" : format(parseISO(day.date), "EEE")}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(day.date), "MMM d")}</p>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className={cn("w-2 h-2 rounded-full", conf.dot)} />
                  <span className={cn("text-xs font-medium", conf.text)}>{conf.label}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    · {day.sourcesCount} sources · ±{day.tempMaxSpread.toFixed(1)}°C spread
                  </span>
                </div>
                <div className="flex items-center gap-3 font-display font-semibold">
                  <span>{Math.round(day.tempMaxMean)}°</span>
                  <span className="text-muted-foreground">{Math.round(day.tempMinMean)}°</span>
                  <ChevronDown
                    className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                  />
                </div>
              </button>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="px-3 pt-3 pb-1 overflow-hidden"
                >
                  <div className="bg-muted/30 rounded-xl p-3 text-xs">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <ConfIcon className="w-3.5 h-3.5" />
                      <span>What each source says for this day:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {day.perSource.map((p) => (
                        <div key={p.source} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
                          <span className="font-medium">{p.source}</span>
                          <span className="font-mono text-muted-foreground">
                            {p.tempMax !== undefined ? `${Math.round(p.tempMax)}°` : "—"}
                            {" / "}
                            {p.tempMin !== undefined ? `${Math.round(p.tempMin)}°` : "—"}
                            {p.snow ? ` · ${p.snow.toFixed(0)}cm` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                    {day.snowMean > 0 && (
                      <p className="mt-2 text-muted-foreground">
                        Snow consensus: <span className="font-semibold text-foreground">{day.snowMean.toFixed(0)} cm</span>
                        {day.snowSpread > 0 && <> (range across models: ±{day.snowSpread.toFixed(0)} cm)</>}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <details className="mt-6 group">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
          Data sources & methodology
        </summary>
        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {data.sources.map((s) => (
            <div key={s.id} className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-1 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0",
                  s.status === "ok" ? "bg-emerald-500" : "bg-rose-400",
                )}
              />
              <div>
                <span className="font-medium text-foreground">{s.label}</span>
                {s.detail && <span> — {s.detail}</span>}
                {s.status !== "ok" && <span className="text-rose-500"> (unavailable right now)</span>}
              </div>
            </div>
          ))}
          <p className="pt-2 italic">
            Generated {format(parseISO(data.generatedAt), "PP p")}. Cached for 30 min. Confidence rating reflects how
            much the models disagree: tighter agreement = greater certainty.
          </p>
        </div>
      </details>
    </motion.div>
  );
}
