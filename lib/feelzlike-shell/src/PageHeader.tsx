import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { useOptionalSeason } from "./SeasonProvider";
import { cn } from "./cn";

export interface PageHeaderProps {
  /** Small uppercase byline above the title (e.g. "Snowy Mountains · Jindabyne"). */
  byline?: ReactNode;
  /** Main page title. Renders in display font, white. */
  title: ReactNode;
  /** Supporting paragraph beneath the title. */
  description?: ReactNode;
  /** Slot for an UpdateStamp (or similar). Pass `tone="onDark"`. */
  stamp?: ReactNode;
  /** Slot for a top-right badge (e.g. LiveBadge `tone="onDark"`). */
  badge?: ReactNode;
  /** Force a tone instead of season-driven. Useful for non-season pages. */
  tone?: "winter" | "green";
  /** Extra class hooks. */
  className?: string;
}

/**
 * Gradient page-header panel. Replaces the legacy white motion.header pattern
 * across town/region pages. Defaults to a sky→blue gradient (matching the
 * cookie-banner Accept button), and switches to an emerald→green gradient
 * when the active season is "green" (summer / off-season).
 */
export function PageHeader({
  byline,
  title,
  description,
  stamp,
  badge,
  tone,
  className,
}: PageHeaderProps) {
  const seasonCtx = useOptionalSeason();
  const effectiveTone: "winter" | "green" = tone ?? seasonCtx?.season ?? "winter";
  // Bluebird panel · solid saturated surfaces so white text clears WCAG AA.
  const surface =
    effectiveTone === "green"
      ? "bg-emerald-700"
      : "bg-[#0055FF]";

  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-[2rem] px-6 md:px-8 py-6 md:py-7 mb-4 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)]",
        surface,
        className,
      )}
    >
      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          {byline ? (
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/70">
              {byline}
            </p>
          ) : null}
          <h1 className="font-display font-black text-4xl md:text-5xl tracking-tighter text-white mt-2 leading-[1.08] lowercase">
            {title}
          </h1>
          {description ? (
            <p className="text-white/80 mt-3 max-w-xl text-[15px] font-bold leading-relaxed lowercase">
              {description}
            </p>
          ) : null}
          {stamp ? <div className="mt-4">{stamp}</div> : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
    </motion.header>
  );
}
