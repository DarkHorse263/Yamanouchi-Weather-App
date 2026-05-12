import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ChevronDown, Layers, ShieldCheck, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerSource { source: string; tempMax?: number; tempMin?: number; precip?: number; snow?: number; }
interface EnsembleDay {
  date: string; tempMaxMean: number; tempMinMean: number;
  tempMaxSpread: number; tempMinSpread: number;
  precipMean: number; snowMean: number; snowSpread: number;
  sourcesCount: number;
  confidence: "high" | "medium" | "low";
  perSource: PerSource[];
}
interface SourceMeta { id: string; label: string; detail: string; status: "ok" | "failed"; fetchedAt?: string; }
interface EnsembleResponse { days: EnsembleDay[]; sources: SourceMeta[]; generatedAt: string; }

const CONFIDENCE: Record<EnsembleDay["confidence"], { dot: string; ring: string; label: string; icon: typeof ShieldCheck }> = {
  high:   { dot: "bg-emerald-400", ring: "ring-emerald-400/30", label: "High agreement",   icon: ShieldCheck },
  medium: { dot: "bg-amber-400",   ring: "ring-amber-400/30",   label: "Some disagreement", icon: HelpCircle },
  low:    { dot: "bg-rose-400",    ring: "ring-rose-400/30",    label: "Models disagree",  icon: AlertTriangle },
};

interface Props { locationId: string }

export function EnsembleForecast({ locationId }: Props) {
  const [data, setData] = useState<EnsembleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

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
        <div className="h-6 w-64 bg-muted/40 rounded mb-5" />
        <div className="h-32 bg-muted/20 rounded" />
      </div>
    );
  }

  const okSources = data.sources.filter((s) => s.status === "ok");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      className="glass rounded-3xl p-5 md:p-8"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="byline text-muted-foreground">Forecast intelligence</p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
            <Layers className="text-primary w-5 h-5" />
            Multi-model consensus
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
            One forecast can be wrong. {okSources.length} forecasts that all agree are usually right. We pull predictions from {okSources.length} independent global weather models, blend them into a single number, and show you how much they disagree.
          </p>
          <ul className="text-xs text-muted-foreground/85 mt-3 space-y-1.5 max-w-xl leading-relaxed">
            <li className="flex gap-2"><span className="text-emerald-400 mt-0.5">●</span><span><span className="text-foreground/90 font-medium">Green dot</span> · models agree, plan with confidence.</span></li>
            <li className="flex gap-2"><span className="text-amber-400 mt-0.5">●</span><span><span className="text-foreground/90 font-medium">Amber dot</span> · some disagreement, check again closer to the day.</span></li>
            <li className="flex gap-2"><span className="text-rose-400 mt-0.5">●</span><span><span className="text-foreground/90 font-medium">Red dot</span> · models disagree, don't lock in plans yet.</span></li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {okSources.map((s) => (
            <span
              key={s.id}
              title={s.detail}
              className="byline px-2.5 py-1 rounded-full bg-white/5 text-foreground/80 border border-white/10 hover:border-white/20 transition-colors cursor-help"
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="rule mt-5 mb-2" />

      <div className="divide-y divide-white/5">
        {data.days.map((day, i) => {
          const c = CONFIDENCE[day.confidence];
          const isOpen = expanded === day.date;
          const ConfIcon = c.icon;
          return (
            <div key={day.date} className="py-2">
              <button
                onClick={() => setExpanded(isOpen ? null : day.date)}
                className="w-full flex items-center justify-between gap-3 hover:bg-white/[0.03] rounded-xl px-2 py-2.5 transition-colors text-left"
                aria-expanded={isOpen}
              >
                <div className="w-1/4 min-w-[80px]">
                  <p className="font-medium text-foreground">{i === 0 ? "Today" : format(parseISO(day.date), "EEE")}</p>
                  <p className="byline text-muted-foreground/60">{format(parseISO(day.date), "MMM d")}</p>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={cn("relative flex-shrink-0 w-2 h-2 rounded-full ring-4 ring-offset-0", c.dot, c.ring)} />
                  <span className="text-xs text-foreground/85">{c.label}</span>
                  <span className="byline text-muted-foreground/60 hidden sm:inline truncate">
                    · {day.sourcesCount} sources · ±{day.tempMaxSpread.toFixed(1)}°
                  </span>
                </div>
                <div className="flex items-center gap-3 font-display" data-numeric>
                  <span className="text-foreground text-lg">{Math.round(day.tempMaxMean)}°</span>
                  <span className="text-muted-foreground/60 text-sm">{Math.round(day.tempMinMean)}°</span>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground/60 transition-transform", isOpen && "rotate-180")} />
                </div>
              </button>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                >
                  <div className="bg-black/30 rounded-2xl p-4 mt-1 mb-2 border border-white/5">
                    <div className="flex items-center gap-2 mb-3 byline text-muted-foreground">
                      <ConfIcon className="w-3 h-3" />
                      What each source predicts
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {day.perSource.map((p) => (
                        <div key={p.source} className="flex items-center justify-between bg-white/[0.04] border border-white/5 rounded-lg px-3 py-2">
                          <span className="text-sm text-foreground/90">{p.source}</span>
                          <span className="font-mono text-xs text-muted-foreground" data-numeric>
                            {p.tempMax !== undefined ? `${Math.round(p.tempMax)}°` : "-"}
                            {" / "}
                            {p.tempMin !== undefined ? `${Math.round(p.tempMin)}°` : "-"}
                            {p.snow ? ` · ${p.snow.toFixed(0)}cm` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                    {day.snowMean > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Snow consensus: <span className="text-foreground font-medium">{day.snowMean.toFixed(0)} cm</span>
                        {day.snowSpread > 0 && <> · models range ±{day.snowSpread.toFixed(0)} cm</>}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <details className="mt-5 group">
        <summary className="cursor-pointer byline text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 list-none">
          <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
          Sources & methodology
        </summary>
        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {data.sources.map((s) => (
            <div key={s.id} className="flex items-start gap-2">
              <span className={cn("mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0", s.status === "ok" ? "bg-emerald-400" : "bg-rose-400/70")} />
              <div>
                <span className="text-foreground/90 font-medium">{s.label}</span>
                {s.detail && <span> - {s.detail}</span>}
                {s.status !== "ok" && <span className="text-rose-400/80"> (unavailable)</span>}
              </div>
            </div>
          ))}
          <p className="pt-2 italic text-muted-foreground/70">
            Generated {format(parseISO(data.generatedAt), "PP p")}. Cached 30 min. Confidence reflects how much the models disagree - tighter spread = greater certainty.
          </p>
        </div>
      </details>
    </motion.div>
  );
}
