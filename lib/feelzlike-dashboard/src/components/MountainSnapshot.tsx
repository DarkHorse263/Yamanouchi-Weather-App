import { motion } from "framer-motion";
import { Snowflake, Wind, Cable, ArrowDown, ArrowUp, AlertTriangle } from "lucide-react";
import { MetricRing } from "./MetricRing";
import { cn } from "../lib/cn";

export interface MountainSnapshotProps {
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
  /** Section number prefix in the byline (defaults to "02") */
  sectionNumber?: string;
  /** Heading text (defaults to "Conditions at a glance") */
  heading?: string;
  /** Source label for snowfall outlook (defaults to "Open-Meteo · ECMWF") */
  modelSource?: string;
}

type Tone = "neutral" | "ok" | "info" | "caution" | "warn" | "alert";

interface Tier {
  ringClass: string;
  gradient: { from: string; to: string };
  wash: string;
  glowClass: string;
  tone: Tone;
  label: string;
  detail?: string;
}

const GRAD = {
  emerald: { from: "hsl(160, 84%, 45%)", to: "hsl(190, 90%, 50%)" },
  sky:     { from: "hsl(200, 95%, 55%)", to: "hsl(220, 90%, 60%)" },
  amber:   { from: "hsl(38, 95%, 55%)",  to: "hsl(20, 95%, 55%)" },
  orange:  { from: "hsl(24, 95%, 55%)",  to: "hsl(0, 90%, 60%)" },
  rose:    { from: "hsl(345, 90%, 60%)", to: "hsl(280, 80%, 60%)" },
  slate:   { from: "hsl(215, 16%, 65%)", to: "hsl(215, 16%, 50%)" },
} as const;

const WASH = {
  emerald: "hsl(160, 84%, 45%)",
  sky:     "hsl(210, 95%, 55%)",
  amber:   "hsl(38, 95%, 55%)",
  orange:  "hsl(24, 95%, 55%)",
  rose:    "hsl(345, 90%, 60%)",
  slate:   "hsl(215, 16%, 60%)",
} as const;

const GLOW = {
  emerald: "bg-emerald-400/40",
  sky:     "bg-sky-400/40",
  amber:   "bg-amber-400/40",
  orange:  "bg-orange-400/40",
  rose:    "bg-rose-400/40",
  slate:   "bg-slate-300/30",
} as const;

const TONE = {
  neutral: { dot: "bg-slate-400", text: "text-slate-500", banner: "bg-slate-50 border-slate-200/80 text-slate-700" },
  ok:      { dot: "bg-emerald-500", text: "text-emerald-700", banner: "bg-emerald-50/80 border-emerald-200/80 text-emerald-800" },
  info:    { dot: "bg-sky-500", text: "text-sky-700", banner: "bg-sky-50/80 border-sky-200/80 text-sky-800" },
  caution: { dot: "bg-amber-500", text: "text-amber-700", banner: "bg-amber-50/90 border-amber-200/90 text-amber-900" },
  warn:    { dot: "bg-orange-500", text: "text-orange-700", banner: "bg-orange-50/90 border-orange-200/90 text-orange-900" },
  alert:   { dot: "bg-rose-500", text: "text-rose-700", banner: "bg-rose-50/90 border-rose-200/90 text-rose-900" },
} as const;

function tier(palette: keyof typeof GRAD, tone: Tone, label: string, detail?: string): Tier {
  return {
    ringClass: `stroke-${palette}-500`,
    gradient: GRAD[palette],
    wash: WASH[palette],
    glowClass: GLOW[palette],
    tone,
    label,
    detail,
  };
}

function classifyGust(gust: number | undefined, windSpeed: number): Tier {
  const g = gust ?? windSpeed;
  if (g >= 90) return tier("rose", "alert", "Wind-hold likely", "Gondolas and chairs likely closed");
  if (g >= 70) return tier("orange", "warn", "Chairs may hold", "Exposed chairlifts at risk");
  if (g >= 50) return tier("amber", "caution", "Slow operations possible", "Exposed lifts may slow");
  return tier("emerald", "ok", "All clear", "Within operating limits");
}

function classifyFreezing(freezingLevel: number | undefined, summit: number, base: number): Tier {
  if (freezingLevel == null) return tier("slate", "neutral", "Awaiting model");
  if (freezingLevel <= base) return tier("sky", "info", "Snow to base");
  if (freezingLevel <= summit) return tier("amber", "caution", "Mid-mountain rain line");
  return tier("rose", "alert", "Above summit · rain risk");
}

function classifyLifts(open: number, total: number): Tier {
  if (total === 0) return tier("slate", "neutral", "Closed");
  const pct = open / total;
  if (pct >= 0.7) return tier("emerald", "ok", `${open} of ${total} operating`);
  if (pct > 0) return tier("amber", "caution", `${open} of ${total} operating`);
  return tier("slate", "neutral", `0 of ${total} operating`);
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
  sectionNumber = "02",
  heading = "Conditions at a glance",
  modelSource = "Open-Meteo · ECMWF",
}: MountainSnapshotProps) {
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

  const snow24 = snowfallNext24h ?? 0;
  const snow48 = snowfallNext48h ?? 0;
  const snow72 = snowfallNext72h ?? 0;
  const snowMax = Math.max(20, snow24, snow48, snow72);
  const hasSnowOutlook = snow24 > 0 || snow48 > 0 || snow72 > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.4 }}
      className="glass rounded-3xl p-6 md:p-8"
    >
      <div className="flex items-end justify-between mb-6 gap-3">
        <div>
          <p className="byline text-muted-foreground">{sectionNumber} · Mountain snapshot</p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 text-foreground">
            {heading}
          </h2>
        </div>
        <p className="byline text-muted-foreground/70 hidden md:block tabular-nums">
          {resortName} · {elevation}m
        </p>
      </div>

      {showWindAlert && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className={cn(
            "mb-7 flex items-center gap-3 rounded-xl px-4 py-2.5 border",
            TONE[windTier.tone].banner,
          )}
        >
          <AlertTriangle className="w-4 h-4 flex-none opacity-80" strokeWidth={2.25} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-tight">{windTier.label}</p>
            {windTier.detail && (
              <p className="text-[11px] opacity-75 leading-tight mt-0.5">{windTier.detail}</p>
            )}
          </div>
          <p className="font-display text-xl tabular-nums flex-none" data-numeric>
            {Math.round(gust ?? windSpeed)}
            <span className="text-[11px] opacity-70 ml-1 font-normal">km/h</span>
          </p>
        </motion.div>
      )}

      <div className={cn(
        "grid gap-8 md:gap-6 justify-items-center",
        showLifts ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
      )}>
        <RingTile label="Freezing level" tone={freezeTier.tone} sublabel={freezeTier.label}>
          <MetricRing
            value={freezingLevel ?? 0}
            max={3000}
            gradient={freezeTier.gradient}
            innerWash={freezeTier.wash}
            glowClassName={freezeTier.glowClass}
            ringClassName={freezeTier.ringClass}
            ariaLabel={`Freezing level ${freezingLevel ?? "unknown"} metres`}
            delay={0.05}
          >
            <Snowflake className="w-3.5 h-3.5 text-muted-foreground/60 mb-1.5" strokeWidth={1.75} />
            <p className="font-display text-3xl md:text-[2.25rem] leading-none text-foreground tabular-nums" data-numeric>
              {freezingLevel != null ? freezingLevel : "—"}
            </p>
            <p className="byline text-muted-foreground/70 mt-1.5">m a.s.l.</p>
            {verticalDelta != null && (
              <p className={cn(
                "text-[11px] mt-1.5 inline-flex items-center gap-0.5 tabular-nums font-medium",
                verticalDelta < 0 ? "text-sky-700" : "text-rose-700",
              )}>
                {verticalDelta < 0
                  ? <><ArrowDown className="w-3 h-3" strokeWidth={2} /> {Math.abs(verticalDelta)} m</>
                  : <><ArrowUp className="w-3 h-3" strokeWidth={2} /> {verticalDelta} m</>
                }
              </p>
            )}
          </MetricRing>
        </RingTile>

        <RingTile label="Wind & gusts" tone={windTier.tone} sublabel={windTier.label}>
          <MetricRing
            value={Math.min(120, gust ?? windSpeed)}
            max={120}
            gradient={windTier.gradient}
            innerWash={windTier.wash}
            glowClassName={windTier.glowClass}
            ringClassName={windTier.ringClass}
            ariaLabel={`Wind gusts ${gust ?? windSpeed} kilometres per hour`}
            delay={0.12}
          >
            <Wind className="w-3.5 h-3.5 text-muted-foreground/60 mb-1.5" strokeWidth={1.75} />
            <p className="font-display text-3xl md:text-[2.25rem] leading-none text-foreground tabular-nums" data-numeric>
              {Math.round(gust ?? windSpeed)}
            </p>
            <p className="byline text-muted-foreground/70 mt-1.5">km/h gust</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1.5 tabular-nums font-medium">
              avg {Math.round(windSpeed)} km/h
            </p>
          </MetricRing>
        </RingTile>

        {showLifts && liftTier && (
          <RingTile label="Lifts open" tone={liftTier.tone} sublabel={liftTier.label}>
            <MetricRing
              value={liftsOpen!}
              max={totalLifts!}
              gradient={liftTier.gradient}
              innerWash={liftTier.wash}
              glowClassName={liftTier.glowClass}
              ringClassName={liftTier.ringClass}
              ariaLabel={`${liftsOpen} of ${totalLifts} lifts open`}
              delay={0.18}
            >
              <Cable className="w-3.5 h-3.5 text-muted-foreground/60 mb-1.5" strokeWidth={1.75} />
              <p className="font-display text-3xl md:text-[2.25rem] leading-none text-foreground tabular-nums" data-numeric>
                {liftsOpen}
                <span className="text-muted-foreground/40 text-xl font-normal">/{totalLifts}</span>
              </p>
              <p className="byline text-muted-foreground/70 mt-1.5">on the snow</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1.5 tabular-nums font-medium">
                {Math.round((liftsOpen! / totalLifts!) * 100)}%
              </p>
            </MetricRing>
          </RingTile>
        )}
      </div>

      {hasSnowOutlook && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 pt-6 border-t border-slate-200/70"
        >
          <div className="flex items-baseline justify-between mb-4">
            <p className="byline text-muted-foreground">Snowfall outlook</p>
            <p className="byline text-muted-foreground/60">{modelSource}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <SnowBar label="Next 24h" value={snow24} max={snowMax} delay={0} />
            <SnowBar label="Next 48h" value={snow48} max={snowMax} delay={0.08} />
            <SnowBar label="Next 72h" value={snow72} max={snowMax} delay={0.16} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function RingTile({
  label,
  sublabel,
  tone,
  children,
}: {
  label: string;
  sublabel: string;
  tone: Tone;
  children: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className="flex flex-col items-center text-center max-w-[200px]">
      <p className="byline text-muted-foreground/80 mb-3">{label}</p>
      {children}
      <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-tight">
        <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />
        <span className={t.text}>{sublabel}</span>
      </span>
    </div>
  );
}

function SnowBar({ label, value, max, delay }: { label: string; value: number; max: number; delay: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="byline text-muted-foreground/80">{label}</p>
        <p className="font-display text-base text-foreground tabular-nums" data-numeric>
          {value > 0 ? `${value.toFixed(value >= 10 ? 0 : 1)}` : "—"}
          <span className="text-muted-foreground/60 text-[10px] ml-1 font-normal">cm</span>
        </p>
      </div>
      <div className="h-1 rounded-full bg-slate-200/70 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value > 0 ? Math.max(4, pct) : 0}%` }}
          transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
          className="h-full bg-slate-700"
        />
      </div>
    </div>
  );
}
