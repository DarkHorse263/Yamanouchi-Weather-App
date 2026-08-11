import { motion } from "framer-motion";
import { cn } from "../lib/cn";

export interface SnowfallOutlookProps {
  /** Cumulative forecast snowfall totals (cm). */
  next24hCm?: number | null;
  next48hCm?: number | null;
  next72hCm?: number | null;
  /** Source label (defaults to "Open-Meteo · ECMWF"). */
  source?: string;
  /** Elevation (m) the outlook was derived at, for honest labelling. */
  elevationM?: number | null;
  /** Provenance of that elevation ("village" | "mid-mountain"). */
  level?: string | null;
  /**
   * Display-edge unit hooks (member units preference). Canonical inputs stay
   * metric cm; pass a formatter + label to render "in" for imperial members.
   * Defaults preserve the metric presentation.
   */
  formatValue?: (cm: number) => string;
  unitLabel?: string;
  className?: string;
}

/**
 * Compact "Snowfall outlook" strip · next 24h / 48h / 72h cumulative totals.
 *
 * Extracted from MountainSnapshot (July 2026) so the totals can sit at the
 * top of the page inside the "Next 48 hours" hourly panel instead of being
 * buried in the Mountain dials block. Renders null when all totals are zero
 * (green season / dry spell) so it never adds empty chrome.
 */
export function SnowfallOutlook({
  next24hCm,
  next48hCm,
  next72hCm,
  source = "Open-Meteo · ECMWF",
  elevationM,
  level,
  formatValue,
  unitLabel = "cm",
  className,
}: SnowfallOutlookProps) {
  const snow24 = next24hCm ?? 0;
  const snow48 = next48hCm ?? 0;
  const snow72 = next72hCm ?? 0;
  if (snow24 <= 0 && snow48 <= 0 && snow72 <= 0) return null;
  const snowMax = Math.max(20, snow24, snow48, snow72);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={className}
    >
      <div className="flex items-baseline justify-between mb-4 gap-3">
        <p className="byline text-muted-foreground">Snowfall outlook</p>
        <div className="text-right">
          <p className="byline text-muted-foreground/60">{source}</p>
          {elevationM != null && (
            <p className="byline text-muted-foreground/50 mt-0.5 tabular-nums">
              {level ?? "village"} · {Math.round(elevationM)}m
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        <SnowBar label="Next 24h" value={snow24} max={snowMax} delay={0} formatValue={formatValue} unitLabel={unitLabel} />
        <SnowBar label="Next 48h" value={snow48} max={snowMax} delay={0.08} formatValue={formatValue} unitLabel={unitLabel} />
        <SnowBar label="Next 72h" value={snow72} max={snowMax} delay={0.16} formatValue={formatValue} unitLabel={unitLabel} />
      </div>
    </motion.div>
  );
}

function SnowBar({
  label,
  value,
  max,
  delay,
  formatValue,
  unitLabel,
}: {
  label: string;
  value: number;
  max: number;
  delay: number;
  formatValue?: (cm: number) => string;
  unitLabel: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const display = formatValue
    ? formatValue(value)
    : value.toFixed(value >= 10 ? 0 : 1);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="byline text-muted-foreground/80">{label}</p>
        <p className={cn("font-display text-base tabular-nums", value > 0 ? "text-snow-accent" : "text-foreground")} data-numeric>
          {value > 0 ? display : "0"}
          <span className="text-muted-foreground/60 text-[10px] ml-1 font-normal">{unitLabel}</span>
        </p>
      </div>
      <div className="h-1 rounded-full bg-slate-200/70 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value > 0 ? Math.max(4, pct) : 0}%` }}
          transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
          className={cn("h-full", value > 0 ? "bg-snow-accent" : "bg-slate-700")}
        />
      </div>
    </div>
  );
}
