import { motion } from "framer-motion";
import { Snowflake, Wind, Cable, Mountain, ArrowDown, ArrowUp, AlertTriangle } from "lucide-react";
import { MetricRing } from "./MetricRing";
import { cn } from "@/lib/utils";

interface MountainSnapshotProps {
  resortName: string;
  elevation: number;
  freezingLevel?: number;
  gust?: number;
  windSpeed: number;
  liftsOpen?: number;
  totalLifts?: number;
  snowfallNext24h?: number;
  snowfallNext48h?: number;
  snowfallNext72h?: number;
  baseElevation?: number;
}

interface WindTier {
  ringClass: string;
  glowClass: string;
  badgeClass: string;
  label: string;
  detail: string;
}

function classifyGust(gust: number | undefined, windSpeed: number): WindTier {
  const g = gust ?? windSpeed;
  if (g >= 90) return {
    ringClass: "stroke-rose-500",
    glowClass: "bg-rose-500/25",
    badgeClass: "bg-rose-500/10 text-rose-700 border-rose-500/30",
    label: "Wind-hold likely",
    detail: "Gondolas, chairs likely closed",
  };
  if (g >= 70) return {
    ringClass: "stroke-amber-500",
    glowClass: "bg-amber-400/25",
    badgeClass: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    label: "Chairs may hold",
    detail: "Exposed chairlifts at risk",
  };
  if (g >= 50) return {
    ringClass: "stroke-yellow-500",
    glowClass: "bg-yellow-400/20",
    badgeClass: "bg-yellow-500/10 text-yellow-800 border-yellow-500/30",
    label: "Slow operations possible",
    detail: "Exposed lifts may slow",
  };
  return {
    ringClass: "stroke-emerald-500",
    glowClass: "bg-emerald-400/20",
    badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    label: "All clear",
    detail: "Within operating limits",
  };
}

interface FreezeTier {
  ringClass: string;
  glowClass: string;
  badgeClass: string;
  label: string;
}

function classifyFreezing(freezingLevel: number | undefined, summit: number, base: number): FreezeTier {
  if (freezingLevel == null) return {
    ringClass: "stroke-sky-500",
    glowClass: "bg-sky-400/20",
    badgeClass: "bg-slate-500/10 text-muted-foreground border-slate-500/20",
    label: "Awaiting model",
  };
  if (freezingLevel <= base) return {
    ringClass: "stroke-sky-500",
    glowClass: "bg-sky-400/30",
    badgeClass: "bg-sky-500/10 text-sky-700 border-sky-500/30",
    label: "Snow to base",
  };
  if (freezingLevel <= summit) return {
    ringClass: "stroke-amber-500",
    glowClass: "bg-amber-400/25",
    badgeClass: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    label: "Mid-mountain rain line",
  };
  return {
    ringClass: "stroke-rose-500",
    glowClass: "bg-rose-500/25",
    badgeClass: "bg-rose-500/10 text-rose-700 border-rose-500/30",
    label: "Above summit · rain risk",
  };
}

interface LiftTier {
  ringClass: string;
  glowClass: string;
}

function classifyLifts(open: number, total: number): LiftTier {
  if (total === 0) return { ringClass: "stroke-slate-300", glowClass: "" };
  const pct = open / total;
  if (pct >= 0.7) return { ringClass: "stroke-emerald-500", glowClass: "bg-emerald-400/20" };
  if (pct > 0) return { ringClass: "stroke-amber-500", glowClass: "bg-amber-400/20" };
  return { ringClass: "stroke-slate-300", glowClass: "" };
}

export function MountainSnapshot({
  resortName,
  elevation,
  freezingLevel,
  gust,
  windSpeed,
  liftsOpen,
  totalLifts,
  snowfallNext24h,
  snowfallNext48h,
  snowfallNext72h,
  baseElevation,
}: MountainSnapshotProps) {
  // Approximate resort base when not supplied — most AU resorts span ~400-700m.
  const summit = elevation;
  const base = baseElevation ?? Math.max(900, summit - 500);
  const verticalDelta = freezingLevel != null ? freezingLevel - summit : null;

  const windTier = classifyGust(gust, windSpeed);
  const freezeTier = classifyFreezing(freezingLevel, summit, base);
  const liftTier = liftsOpen != null && totalLifts != null
    ? classifyLifts(liftsOpen, totalLifts)
    : null;

  const showLifts = liftsOpen != null && totalLifts != null && totalLifts > 0;
  const showWindAlert = (gust ?? windSpeed) >= 50;

  // Snowfall outlook scale — pick a reasonable max for visual scaling.
  const snow24 = snowfallNext24h ?? 0;
  const snow48 = snowfallNext48h ?? 0;
  const snow72 = snowfallNext72h ?? 0;
  const snowMax = Math.max(20, snow24, snow48, snow72);
  const hasSnowOutlook = snow24 > 0 || snow48 > 0 || snow72 > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="glass rounded-3xl p-5 md:p-8 relative overflow-hidden"
    >
      {/* subtle aurora wash */}
      <div aria-hidden className="absolute inset-0 -z-0 opacity-70 pointer-events-none">
        <div className="absolute -top-24 -left-12 w-72 h-72 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-10 w-80 h-80 rounded-full bg-emerald-300/25 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-end justify-between mb-6 gap-3">
          <div>
            <p className="byline text-muted-foreground">02 · Mountain snapshot</p>
            <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
              <Mountain className="text-primary w-5 h-5" />
              Conditions at a glance
            </h2>
          </div>
          <p className="byline text-muted-foreground/70 hidden md:block tabular-nums">
            {resortName} · {elevation}m
          </p>
        </div>

        {/* Wind-hold alert strip — only when relevant */}
        {showWindAlert && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className={cn(
              "mb-6 flex items-center gap-3 rounded-2xl px-4 py-3 border backdrop-blur-sm",
              windTier.badgeClass,
            )}
          >
            <AlertTriangle className="w-4 h-4 flex-none" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{windTier.label}</p>
              <p className="text-xs opacity-80 leading-tight mt-0.5">{windTier.detail}</p>
            </div>
            <p className="font-display text-2xl tabular-nums flex-none" data-numeric>
              {Math.round(gust ?? windSpeed)}
              <span className="text-xs opacity-70 ml-1">km/h</span>
            </p>
          </motion.div>
        )}

        {/* Ring deck */}
        <div className={cn(
          "grid gap-6 md:gap-4 justify-items-center",
          showLifts ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
        )}>
          {/* Freezing level ring */}
          <RingTile
            label="Freezing level"
            sublabel={freezeTier.label}
            badgeClass={freezeTier.badgeClass}
          >
            <MetricRing
              value={freezingLevel ?? 0}
              max={3000}
              ringClassName={freezeTier.ringClass}
              glowClassName={freezeTier.glowClass}
              ariaLabel={`Freezing level ${freezingLevel ?? "unknown"} metres`}
              delay={0.05}
            >
              <Snowflake className="w-3.5 h-3.5 text-muted-foreground/70 mb-1" />
              <p className="font-display text-3xl md:text-4xl text-foreground tabular-nums" data-numeric>
                {freezingLevel != null ? freezingLevel : "—"}
              </p>
              <p className="byline text-muted-foreground/70 -mt-1">m a.s.l.</p>
              {verticalDelta != null && (
                <p className={cn(
                  "byline mt-1 inline-flex items-center gap-0.5 tabular-nums",
                  verticalDelta < 0 ? "text-sky-700" : "text-rose-700",
                )}>
                  {verticalDelta < 0
                    ? <><ArrowDown className="w-3 h-3" /> {Math.abs(verticalDelta)} m</>
                    : <><ArrowUp className="w-3 h-3" /> {verticalDelta} m</>
                  }
                </p>
              )}
            </MetricRing>
          </RingTile>

          {/* Wind ring */}
          <RingTile
            label="Wind & gusts"
            sublabel={windTier.label}
            badgeClass={windTier.badgeClass}
          >
            <MetricRing
              value={Math.min(120, gust ?? windSpeed)}
              max={120}
              ringClassName={windTier.ringClass}
              glowClassName={windTier.glowClass}
              ariaLabel={`Wind gusts ${gust ?? windSpeed} kilometres per hour`}
              delay={0.12}
            >
              <Wind className="w-3.5 h-3.5 text-muted-foreground/70 mb-1" />
              <p className="font-display text-3xl md:text-4xl text-foreground tabular-nums" data-numeric>
                {Math.round(gust ?? windSpeed)}
              </p>
              <p className="byline text-muted-foreground/70 -mt-1">km/h gust</p>
              <p className="byline text-muted-foreground/60 mt-1 tabular-nums">
                avg {Math.round(windSpeed)}
              </p>
            </MetricRing>
          </RingTile>

          {/* Lifts ring */}
          {showLifts && liftTier && (
            <RingTile
              label="Lifts open"
              sublabel={`${liftsOpen} of ${totalLifts} operating`}
              badgeClass={liftsOpen! > 0
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                : "bg-slate-500/10 text-muted-foreground border-slate-500/20"}
            >
              <MetricRing
                value={liftsOpen!}
                max={totalLifts!}
                ringClassName={liftTier.ringClass}
                glowClassName={liftTier.glowClass}
                ariaLabel={`${liftsOpen} of ${totalLifts} lifts open`}
                delay={0.18}
              >
                <Cable className="w-3.5 h-3.5 text-muted-foreground/70 mb-1" />
                <p className="font-display text-3xl md:text-4xl text-foreground tabular-nums" data-numeric>
                  {liftsOpen}
                  <span className="text-muted-foreground/40 text-xl">/{totalLifts}</span>
                </p>
                <p className="byline text-muted-foreground/70 -mt-1">on the snow</p>
                <p className="byline text-muted-foreground/60 mt-1 tabular-nums">
                  {Math.round((liftsOpen! / totalLifts!) * 100)}%
                </p>
              </MetricRing>
            </RingTile>
          )}
        </div>

        {/* Snowfall outlook strip */}
        {hasSnowOutlook && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 pt-6 border-t border-white/5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="byline text-muted-foreground">Snowfall outlook · model</p>
              <p className="byline text-muted-foreground/60">Open-Meteo · ECMWF blend</p>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <SnowBar label="Next 24h" value={snow24} max={snowMax} delay={0} />
              <SnowBar label="Next 48h" value={snow48} max={snowMax} delay={0.1} />
              <SnowBar label="Next 72h" value={snow72} max={snowMax} delay={0.2} />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function RingTile({
  label,
  sublabel,
  badgeClass,
  children,
}: {
  label: string;
  sublabel: string;
  badgeClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center max-w-[200px]">
      <p className="byline text-muted-foreground/80 mb-3">{label}</p>
      {children}
      <span className={cn(
        "mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-widest",
        badgeClass,
      )}>
        {sublabel}
      </span>
    </div>
  );
}

function SnowBar({ label, value, max, delay }: { label: string; value: number; max: number; delay: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <p className="byline text-muted-foreground/80">{label}</p>
        <p className="font-display text-base text-foreground tabular-nums" data-numeric>
          {value > 0 ? `${value.toFixed(value >= 10 ? 0 : 1)}` : "—"}
          <span className="text-muted-foreground/60 text-[10px] ml-1">cm</span>
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value > 0 ? Math.max(4, pct) : 0}%` }}
          transition={{ duration: 1.0, delay, ease: [0.16, 1, 0.3, 1] }}
          className="h-full bg-gradient-to-r from-sky-500 to-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.4)]"
        />
      </div>
    </div>
  );
}
