import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Snowflake, Wind, Sparkles, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnits } from "@/components/auth/UserPrefsProvider";

type ResortRef = { id: string; name: string };

interface WeatherLocation {
  location: { id: string; name: string };
  current: {
    windSpeed?: number | null;
    windGust?: number | null;
    snowfallNext24h?: number | null;
    snowfallNext48h?: number | null;
    snowDepth?: number | null;
  };
}

interface Props {
  regionId: string;
  resorts: ResortRef[];
  /** route to link the pick to, with `:id` substituted for the resort id */
  resortHrefPattern?: string;
}

interface Scored {
  id: string;
  name: string;
  snowfallCm24: number;
  windKph: number;
  score: number;
}

/**
 * feelzlike's Daily Pick · winter-only widget that scores each resort in a
 * region by today's conditions and surfaces the best one. "Best" right now
 * means most fresh snow in the next 24 h and lowest current wind · the two
 * factors that most affect a day on the mountain. We deliberately keep
 * the formula simple and transparent so users can second-guess us.
 */
export function DailyPick({ regionId, resorts, resortHrefPattern = "/:id" }: Props) {
  const u = useUnits();
  const [pick, setPick] = useState<Scored | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Callers (RegionHome, TownHome) routinely pass `resorts` inline, so the
  // array identity changes on every parent render. Depending on it directly
  // re-fires the fetch every time setPick re-renders us · an infinite loop.
  // Reduce to a stable string key derived from ids so the effect only re-runs
  // when the set of resorts actually changes. We close over the latest
  // `resorts` inside the effect via a ref-like read of the prop, which is
  // safe because we always recompute `allowed` from the freshest value.
  const resortsKey = useMemo(
    () => resorts.map((r) => r.id).sort().join("|"),
    [resorts],
  );

  useEffect(() => {
    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}api/weather?region=${regionId}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        if (cancelled) return;
        const allowed = new Set(resorts.map((r) => r.id));
        const candidates: Scored[] = ((j.locations as WeatherLocation[]) ?? [])
          .filter((l) => allowed.has(l.location.id))
          .map((l) => {
            // API surfaces snowfallNext24h in centimetres (matches the
            // `cm` units used in EnsembleForecast and MountainSnapshot).
            const snowfallCm24 = Math.max(0, Number(l.current.snowfallNext24h ?? 0));
            const windKph = Math.max(0, Number(l.current.windSpeed ?? 0));
            // Each cm of fresh snow worth 1 pt; each kph of wind costs 1 pt.
            // Fresh snow dominates on big days, wind decides on quiet days.
            const score = Math.max(0, snowfallCm24 - windKph);
            const ref = resorts.find((r) => r.id === l.location.id);
            return {
              id: l.location.id,
              name: ref?.name ?? l.location.name,
              snowfallCm24,
              windKph,
              score,
            };
          })
          .sort((a, b) => b.score - a.score);
        setPick(candidates[0] ?? null);
      })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
    // resortsKey is the stable substitute for `resorts` (see comment above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId, resortsKey]);

  if (error) return null;
  if (!pick) {
    return (
      <div className="glass rounded-3xl p-5 md:p-6 animate-pulse">
        <div className="h-3 w-32 bg-muted/50 rounded mb-3" />
        <div className="h-7 w-56 bg-muted/40 rounded mb-3" />
        <div className="h-4 w-72 bg-muted/30 rounded" />
      </div>
    );
  }

  const href = resortHrefPattern.replace(":id", pick.id);

  // Reason copy is composed at render time so it follows the member's unit
  // preference (canonical data stays metric in state).
  const reasonBits: string[] = [];
  if (pick.snowfallCm24 >= 1) reasonBits.push(`${u.snow(pick.snowfallCm24, 1)} fresh in next 24h`);
  if (pick.windKph <= 20) reasonBits.push("low wind");
  else if (pick.windKph >= 40) reasonBits.push(`windy (${u.wind(pick.windKph)} ${u.windUnit})`);
  const reason = reasonBits.join(" · ") || "calm conditions";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-[2rem] border-0 bg-white p-6 md:p-8 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)]"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-[12px] font-bold lowercase tracking-wider text-[#0055FF] inline-flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#0055FF]" />
            daily pick
          </p>
          <h2 className="font-display font-black text-3xl md:text-4xl mt-2 text-[#0F172A] lowercase">
            {pick.name}
          </h2>
          <p className="text-[15px] font-bold text-slate-500 mt-2 leading-relaxed lowercase">
            {reason}
          </p>
          <div className="mt-4 flex items-center gap-4 text-[13px] font-bold text-slate-500 lowercase">
            <span className="inline-flex items-center gap-1.5">
              <Snowflake className={cn("w-4 h-4", pick.snowfallCm24 >= 1 ? "text-[#EC008C]" : "text-slate-400")} />
              <span data-numeric className={cn(pick.snowfallCm24 >= 1 && "text-[#EC008C] font-black")}>{u.snow(pick.snowfallCm24, 1)}</span>
              <span className="text-slate-400">next 24h</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wind className={cn("w-4 h-4", pick.windKph <= 25 ? "text-emerald-500" : pick.windKph <= 40 ? "text-amber-500" : "text-rose-500")} />
              <span data-numeric className="font-black text-slate-700">{u.wind(pick.windKph)} {u.windUnit}</span>
              <span className="text-slate-400">wind</span>
            </span>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F0F5FF] text-[#0055FF] text-[13px] font-black lowercase tracking-tight transition-colors hover:bg-[#0055FF] hover:text-white shadow-sm"
        >
          See {pick.name}
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
