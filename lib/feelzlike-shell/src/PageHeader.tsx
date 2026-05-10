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
  // Gradient stops are deliberately deep so white text clears WCAG AA
  // (4.5:1) on every stop. Sky-600/Emerald-700 are the lightest stops we
  // can use while keeping body copy legible.
  const gradient =
    effectiveTone === "green"
      ? "from-emerald-700 via-green-700 to-green-900"
      : "from-sky-600 via-blue-700 to-blue-900";

  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl px-6 md:px-8 py-6 md:py-7 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.45)] bg-gradient-to-br",
        gradient,
        className,
      )}
    >
      {/* subtle bottom-right vignette only - no top-left highlight, which
          would lift the lightest stop and break WCAG AA on byline text. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          {byline ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              {byline}
            </p>
          ) : null}
          <h1 className="font-display font-semibold text-3xl md:text-5xl tracking-tight text-white mt-2 leading-[1.08]">
            {title}
          </h1>
          {description ? (
            <p className="text-white mt-3 max-w-xl text-sm md:text-base leading-relaxed">
              {description}
            </p>
          ) : null}
          {stamp ? <div className="mt-3">{stamp}</div> : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
    </motion.header>
  );
}
