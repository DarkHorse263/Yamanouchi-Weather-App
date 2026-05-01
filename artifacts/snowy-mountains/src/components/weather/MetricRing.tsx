import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MetricRingProps {
  value: number;
  max: number;
  min?: number;
  size?: number;
  strokeWidth?: number;
  trackClassName?: string;
  ringClassName?: string;
  glowClassName?: string;
  children?: ReactNode;
  delay?: number;
  ariaLabel?: string;
}

export function MetricRing({
  value,
  max,
  min = 0,
  size = 168,
  strokeWidth = 12,
  trackClassName = "stroke-slate-200/80",
  ringClassName = "stroke-primary",
  glowClassName,
  children,
  delay = 0,
  ariaLabel,
}: MetricRingProps) {
  const reduce = useReducedMotion();
  const range = Math.max(0.0001, max - min);
  const ratio = Math.min(1, Math.max(0, (value - min) / range));

  // Leave a few pixels of padding inside the box so the rounded line cap and
  // drop-shadow glow don't get clipped at the SVG edge.
  const padding = 4;
  const r = (size - strokeWidth) / 2 - padding;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;

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

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {glowClassName && (
        <div
          aria-hidden
          className={cn("absolute inset-2 rounded-full blur-2xl opacity-60 pointer-events-none", glowClassName)}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
        className="-rotate-90 overflow-visible"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClassName}
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={C}
          style={{ strokeDashoffset: dashOffset }}
          className={cn("drop-shadow-[0_0_6px_currentColor] transition-colors", ringClassName)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
