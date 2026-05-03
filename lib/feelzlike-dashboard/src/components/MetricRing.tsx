import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { useEffect, useId, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface MetricRingProps {
  value: number;
  max: number;
  min?: number;
  size?: number;
  strokeWidth?: number;
  trackClassName?: string;
  ringClassName?: string;
  glowClassName?: string;
  /** Gradient stops for the progress arc. Pass two CSS colors for from→to. */
  gradient?: { from: string; to: string };
  /** Soft inner radial wash color behind the value */
  innerWash?: string;
  /** Render subtle tick marks around the perimeter */
  ticks?: boolean;
  children?: ReactNode;
  delay?: number;
  ariaLabel?: string;
}

export function MetricRing({
  value,
  max,
  min = 0,
  size = 168,
  strokeWidth = 8,
  trackClassName = "stroke-slate-200/70",
  ringClassName = "stroke-primary",
  glowClassName,
  gradient,
  innerWash,
  ticks = true,
  children,
  delay = 0,
  ariaLabel,
}: MetricRingProps) {
  const reduce = useReducedMotion();
  const range = Math.max(0.0001, max - min);
  const ratio = Math.min(1, Math.max(0, (value - min) / range));

  const padding = 6;
  const r = (size - strokeWidth) / 2 - padding;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;

  const uid = useId().replace(/:/g, "");
  const gradId = `mring-grad-${uid}`;
  const glowId = `mring-glow-${uid}`;
  const washId = `mring-wash-${uid}`;

  const progress = useMotionValue(reduce ? ratio : 0);
  const dashOffset = useTransform(progress, (p) => C * (1 - p));

  useEffect(() => {
    if (reduce) {
      progress.set(ratio);
      return;
    }
    const controls = animate(progress, ratio, {
      duration: 1.1,
      delay,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [ratio, delay, reduce, progress]);

  const tickCount = 60;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {glowClassName && (
        <div
          aria-hidden
          className={cn("absolute inset-3 rounded-full blur-2xl opacity-50 pointer-events-none", glowClassName)}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
        className="overflow-visible"
      >
        <defs>
          {gradient && (
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient.from} />
              <stop offset="100%" stopColor={gradient.to} />
            </linearGradient>
          )}
          {gradient && (
            <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
          {innerWash && (
            <radialGradient id={washId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={innerWash} stopOpacity="0.18" />
              <stop offset="60%" stopColor={innerWash} stopOpacity="0.06" />
              <stop offset="100%" stopColor={innerWash} stopOpacity="0" />
            </radialGradient>
          )}
        </defs>

        {/* Inner radial wash for depth */}
        {innerWash && (
          <circle cx={cx} cy={cy} r={r - strokeWidth / 2 - 2} fill={`url(#${washId})`} />
        )}

        {/* Tick marks around the perimeter */}
        {ticks && (
          <g transform={`rotate(-90 ${cx} ${cy})`} opacity="0.35">
            {Array.from({ length: tickCount }).map((_, i) => {
              const angle = (i / tickCount) * 2 * Math.PI;
              const isMajor = i % 5 === 0;
              const inner = r + strokeWidth / 2 + 3;
              const outer = inner + (isMajor ? 4 : 2);
              const x1 = cx + Math.cos(angle) * inner;
              const y1 = cy + Math.sin(angle) * inner;
              const x2 = cx + Math.cos(angle) * outer;
              const y2 = cy + Math.sin(angle) * outer;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  strokeWidth={isMajor ? 1 : 0.6}
                  className="stroke-slate-300"
                />
              );
            })}
          </g>
        )}

        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            className={trackClassName}
          />
          {/* Progress arc */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={C}
            style={{ strokeDashoffset: dashOffset }}
            stroke={gradient ? `url(#${gradId})` : undefined}
            filter={gradient ? `url(#${glowId})` : undefined}
            className={cn("transition-colors", !gradient && ringClassName)}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
