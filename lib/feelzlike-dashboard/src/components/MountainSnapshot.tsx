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
  baseElevation?: number;
  /** Section number prefix in the byline (defaults to "02") */
  sectionNumber?: string;
  /** Heading text (defaults to "Conditions at a glance") */
  heading?: string;
  /** Copy locale for labels + tier sentences (defaults to english) */
  locale?: "en" | "ja";
  /**
   * Display-edge unit hooks (member units preference). Canonical inputs stay
   * metric km/h + metres; pass converters + labels to render mph/ft for
   * imperial members. Defaults preserve the metric presentation.
   */
  formatWind?: (kmh: number) => number;
  windUnitLabel?: string;
  formatElevation?: (m: number) => number;
  elevationUnitLabel?: string;
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

/**
 * Plain-language copy, en + ja. The freezing tier sentences deliberately say
 * "likely / tends to" - the dial shows the model 0°C altitude, and the real
 * rain-snow boundary sits somewhat below it depending on the day, so absolute
 * claims ("IS rain") would overstate what the input supports.
 */
const COPY = {
  en: {
    freezeLabel: "Rain or snow line",
    freezeUnit: "snow above",
    belowTop: "below the top",
    aboveTop: "above the top",
    windLabel: "Wind on the hill",
    gustsUnit: "gusts",
    steady: "steady",
    liftsLabel: "Lifts open",
    onSnow: "on the snow",
    windHold: ["Wind-hold likely", "Strong enough to close chairs and gondolas"],
    chairsHold: ["Chairs may hold", "Exposed chairlifts could pause in gusts"],
    breezy: ["Breezy up top", "Exposed lifts may run slower"],
    fineForLifts: ["Fine for lifts", "Not windy enough to trouble the lifts"],
    awaiting: ["Awaiting model", "No reading right now"],
    snowToBase: ["Snow to the base", "Cold enough that falls should be snow all the way down"],
    midMountain: ["Snow up high · rain likely lower down", "Below about this height, falls tend to be rain"],
    tooWarm: ["Likely too warm for snow", "Falls will mostly land as rain, even up top"],
  },
  ja: {
    freezeLabel: "雨雪境界のめやす",
    freezeUnit: "これより上は雪",
    belowTop: "山頂より下",
    aboveTop: "山頂より上",
    windLabel: "山の風",
    gustsUnit: "突風",
    steady: "平均",
    liftsLabel: "運行中リフト",
    onSnow: "運行中",
    windHold: ["運休の可能性大", "チェアやゴンドラが止まるほどの強風"],
    chairsHold: ["リフト一時停止の恐れ", "風にさらされるリフトは突風で止まることも"],
    breezy: ["山頂は風が強め", "露出したリフトは減速運転の可能性"],
    fineForLifts: ["リフト運行に支障なし", "リフトに影響するほどの風ではありません"],
    awaiting: ["データ待ち", "現在読み取れません"],
    snowToBase: ["麓まで雪", "麓まで雪で降る寒さです"],
    midMountain: ["上部は雪 · 下部は雨の見込み", "この高さより下ではおおむね雨になります"],
    tooWarm: ["雪には暖かすぎる見込み", "山頂付近でもほぼ雨で降ります"],
  },
} as const;

type Copy = (typeof COPY)[keyof typeof COPY];

function classifyGust(gust: number | undefined, windSpeed: number, c: Copy): Tier {
  const g = gust ?? windSpeed;
  if (g >= 90) return tier("rose", "alert", c.windHold[0], c.windHold[1]);
  if (g >= 70) return tier("orange", "warn", c.chairsHold[0], c.chairsHold[1]);
  if (g >= 50) return tier("amber", "caution", c.breezy[0], c.breezy[1]);
  return tier("emerald", "ok", c.fineForLifts[0], c.fineForLifts[1]);
}

function classifyFreezing(freezingLevel: number | undefined, summit: number, base: number, c: Copy): Tier {
  if (freezingLevel == null) return tier("slate", "neutral", c.awaiting[0], c.awaiting[1]);
  if (freezingLevel <= base) return tier("sky", "info", c.snowToBase[0], c.snowToBase[1]);
  if (freezingLevel <= summit) return tier("amber", "caution", c.midMountain[0], c.midMountain[1]);
  return tier("rose", "alert", c.tooWarm[0], c.tooWarm[1]);
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
  baseElevation,
  sectionNumber = "",
  heading = "Conditions at a glance",
  locale = "en",
  formatWind,
  windUnitLabel = "km/h",
  formatElevation,
  elevationUnitLabel = "m",
}: MountainSnapshotProps) {
  const cvWind = formatWind ?? ((kmh: number) => kmh);
  const cvElev = formatElevation ?? ((m: number) => m);
  const summit = elevation;
  const base = baseElevation ?? Math.max(900, summit - 500);
  const verticalDelta = freezingLevel != null ? freezingLevel - summit : null;

  const copy = COPY[locale];
  const windTier = classifyGust(gust, windSpeed, copy);
  const freezeTier = classifyFreezing(freezingLevel, summit, base, copy);
  const liftTier = liftsOpen != null && totalLifts != null
    ? classifyLifts(liftsOpen, totalLifts)
    : null;

  const showLifts = liftsOpen != null && totalLifts != null && totalLifts > 0;
  const showWindAlert = (gust ?? windSpeed) >= 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.4 }}
      className="glass rounded-3xl p-6 md:p-8"
    >
      <div className="flex items-end justify-between mb-6 gap-3">
        <div>
          <p className="byline text-muted-foreground">{sectionNumber ? `${sectionNumber} · ` : ""}Mountain snapshot</p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 text-foreground">
            {heading}
          </h2>
        </div>
        <p className="byline text-muted-foreground/70 hidden md:block tabular-nums">
          {resortName} · {Math.round(cvElev(elevation))}{elevationUnitLabel}
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
            {Math.round(cvWind(gust ?? windSpeed))}
            <span className="text-[11px] opacity-70 ml-1 font-normal">{windUnitLabel}</span>
          </p>
        </motion.div>
      )}

      <div className={cn(
        "grid gap-8 md:gap-6 justify-items-center",
        showLifts ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
      )}>
        <RingTile label={copy.freezeLabel} tone={freezeTier.tone} sublabel={freezeTier.label} detail={freezeTier.detail}>
          <MetricRing
            value={freezingLevel ?? 0}
            max={3000}
            gradient={freezeTier.gradient}
            innerWash={freezeTier.wash}
            glowClassName={freezeTier.glowClass}
            ringClassName={freezeTier.ringClass}
            ariaLabel={`Freezing level ${freezingLevel != null ? `${Math.round(cvElev(freezingLevel))} ${elevationUnitLabel === "ft" ? "feet" : "metres"}` : "unknown"}`}
            delay={0.05}
          >
            <Snowflake className="w-3.5 h-3.5 text-muted-foreground/60 mb-1.5" strokeWidth={1.75} />
            <p className="font-display text-3xl md:text-[2.25rem] leading-none text-foreground tabular-nums" data-numeric>
              {freezingLevel != null ? Math.round(cvElev(freezingLevel)) : "-"}
            </p>
            <p className="byline text-muted-foreground/70 mt-1.5">{elevationUnitLabel} · {copy.freezeUnit}</p>
            {verticalDelta != null && (
              <p className={cn(
                "text-[11px] mt-1.5 inline-flex items-center gap-0.5 tabular-nums font-medium",
                verticalDelta < 0 ? "text-sky-700" : "text-rose-700",
              )}>
                {verticalDelta < 0
                  ? <><ArrowDown className="w-3 h-3" strokeWidth={2} /> {Math.round(cvElev(Math.abs(verticalDelta)))} {elevationUnitLabel} {copy.belowTop}</>
                  : <><ArrowUp className="w-3 h-3" strokeWidth={2} /> {Math.round(cvElev(verticalDelta))} {elevationUnitLabel} {copy.aboveTop}</>
                }
              </p>
            )}
          </MetricRing>
        </RingTile>

        <RingTile label={copy.windLabel} tone={windTier.tone} sublabel={windTier.label} detail={windTier.detail}>
          <MetricRing
            value={Math.min(120, gust ?? windSpeed)}
            max={120}
            gradient={windTier.gradient}
            innerWash={windTier.wash}
            glowClassName={windTier.glowClass}
            ringClassName={windTier.ringClass}
            ariaLabel={`Wind gusts ${Math.round(cvWind(gust ?? windSpeed))} ${windUnitLabel === "mph" ? "miles per hour" : "kilometres per hour"}`}
            delay={0.12}
          >
            <Wind className="w-3.5 h-3.5 text-muted-foreground/60 mb-1.5" strokeWidth={1.75} />
            <p className="font-display text-3xl md:text-[2.25rem] leading-none text-foreground tabular-nums" data-numeric>
              {Math.round(cvWind(gust ?? windSpeed))}
            </p>
            <p className="byline text-muted-foreground/70 mt-1.5">{windUnitLabel} {copy.gustsUnit}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1.5 tabular-nums font-medium">
              {copy.steady} {Math.round(cvWind(windSpeed))} {windUnitLabel}
            </p>
          </MetricRing>
        </RingTile>

        {showLifts && liftTier && (
          <RingTile label={copy.liftsLabel} tone={liftTier.tone} sublabel={liftTier.label}>
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
              <p className="byline text-muted-foreground/70 mt-1.5">{copy.onSnow}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1.5 tabular-nums font-medium">
                {Math.round((liftsOpen! / totalLifts!) * 100)}%
              </p>
            </MetricRing>
          </RingTile>
        )}
      </div>
    </motion.div>
  );
}

function RingTile({
  label,
  sublabel,
  tone,
  detail,
  children,
}: {
  label: string;
  sublabel: string;
  tone: Tone;
  detail?: string;
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
      {detail && (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground/80">{detail}</p>
      )}
    </div>
  );
}

