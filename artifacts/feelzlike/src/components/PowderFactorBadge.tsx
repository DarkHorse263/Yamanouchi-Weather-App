import { useId, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, Info, ChevronDown } from "lucide-react";
import type { HourlyForecast } from "@workspace/api-client-react";
import {
  computePowderFactor,
  POWDER_QUALITY_STYLES,
  type PowderFactor,
} from "@/lib/powderFactor";

interface PowderFactorBadgeProps {
  hourly: HourlyForecast[] | null | undefined;
  /** Bilingual translator: t(en, ja) → string. */
  t: (en: string, ja: string) => string;
  /** Optional section number (e.g. "04a"). Omit for inline placement. */
  sectionNumber?: string;
  /** Optional className override for the outer wrapper. */
  className?: string;
  /** Compact mode for tight spaces (Today's Call cells). */
  compact?: boolean;
}

/**
 * Powder Factor - backward-looking snow quality snapshot. Distinct from the
 * forward-looking Powder Window strip (HourlyForecast) and 7-day calendar.
 *
 * Renders as a hero badge by default. Click the chevron to expand sub-scores
 * for transparency. Use `compact` for in-table cells.
 */
export function PowderFactorBadge({
  hourly,
  t,
  sectionNumber,
  className,
  compact = false,
}: PowderFactorBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const factor: PowderFactor = useMemo(
    () => computePowderFactor(hourly ?? null),
    [hourly],
  );

  const styles = POWDER_QUALITY_STYLES[factor.quality];
  const label = t(factor.label, factor.labelJa);
  const reason = t(factor.reason, factor.reasonJa);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${styles.bg} ${styles.text} ${styles.border} ${className ?? ""}`}
        title={`${label} · ${reason}`}
      >
        <Snowflake className="w-3 h-3" />
        <span className="font-display font-semibold text-xs tabular-nums">
          {factor.score}
        </span>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass rounded-3xl p-5 md:p-7 ring-1 ${styles.ring} ${className ?? ""}`}
    >
      {sectionNumber && (
        <p className="byline text-muted-foreground/70 mb-2">
          {sectionNumber} · {t("Powder Factor", "パウダーファクター")}
        </p>
      )}

      <div className="flex items-start gap-4 md:gap-5">
        {/* Score dial */}
        <div
          className={`shrink-0 grid place-items-center rounded-2xl border ${styles.bg} ${styles.border} w-20 h-20 md:w-24 md:h-24`}
        >
          <div className="text-center">
            <div
              className={`font-display font-semibold text-3xl md:text-4xl tabular-nums ${styles.text}`}
            >
              {factor.score}
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
              {t("of 100", "/100")}
            </div>
          </div>
        </div>

        {/* Label + reason */}
        <div className="flex-1 min-w-0">
          {!sectionNumber && (
            <p className="byline text-muted-foreground/70 mb-1">
              {t("Powder Factor", "パウダーファクター")}
            </p>
          )}
          <h3
            className={`font-display font-semibold text-2xl md:text-3xl tracking-tight ${styles.text}`}
          >
            {label}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground mt-1">{reason}</p>

          {factor.totalSnow > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Snowflake className="w-3 h-3" />
                {factor.totalSnow.toFixed(1)}cm{" "}
                {t("in last 48h", "（過去48時間）")}
              </span>
              {isFinite(factor.hoursSinceSnow) && (
                <span>
                  {t(
                    `Last fall ${Math.round(factor.hoursSinceSnow)}h ago`,
                    `最終降雪${Math.round(factor.hoursSinceSnow)}時間前`,
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={t("Show sub-scores", "詳細スコアを表示")}
          className="shrink-0 grid place-items-center w-8 h-8 rounded-full hover:bg-secondary/60 transition-colors text-muted-foreground"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground mb-3">
                {t(
                  "How this score breaks down (max points shown):",
                  "スコア内訳（カッコ内は最大）：",
                )}
              </p>
              <div className="grid grid-cols-5 gap-2 md:gap-3">
                <SubScore
                  label={t("Amount", "降雪量")}
                  value={factor.sub.amount}
                  max={35}
                />
                <SubScore
                  label={t("Temp", "気温")}
                  value={factor.sub.temp}
                  max={20}
                />
                <SubScore
                  label={t("Humidity", "湿度")}
                  value={factor.sub.humidity}
                  max={15}
                />
                <SubScore
                  label={t("Wind", "風")}
                  value={factor.sub.wind}
                  max={15}
                />
                <SubScore
                  label={t("Fresh", "新鮮さ")}
                  value={factor.sub.freshness}
                  max={15}
                />
              </div>

              {(factor.rainedAfterSnow || factor.thawedAfterSnow) && (
                <div className="mt-4 flex items-start gap-2 text-xs text-rose-700 bg-rose-500/5 border border-rose-300/40 rounded-lg p-2.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    {factor.rainedAfterSnow
                      ? t(
                          "Rain fell after the last snow - expect crust, ice patches.",
                          "降雪後に雨。アイスバーンに注意。",
                        )
                      : t(
                          "Temperatures rose above +2°C after the last snow - likely refrozen surface.",
                          "降雪後に気温が+2°Cを超えた。再凍結の可能性あり。",
                        )}
                  </span>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground/70 mt-3">
                {t(
                  "Estimate based on the last 48h of weather. Always check on-mountain reports before committing.",
                  "過去48時間の気象データに基づく推定値。出発前に必ず現地情報をご確認ください。",
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function SubScore({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  // Defensive against future callers passing 0 or non-finite max/value -
  // a NaN width would silently corrupt the bar visual.
  const safeMax = max > 0 ? max : 1;
  const safeValue = Number.isFinite(value) ? value : 0;
  const pct = Math.max(0, Math.min(100, Math.round((safeValue / safeMax) * 100)));
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="font-display font-semibold tabular-nums text-foreground">
        {value}
        <span className="text-muted-foreground/50 text-xs">/{max}</span>
      </div>
      <div className="mt-1 h-1 bg-secondary/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground/70 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
