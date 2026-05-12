import { motion } from "framer-motion";
import { ArrowDown, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export interface ResortHeroProps {
  name: string;
  description?: string;
  elevation: number;
  temperatureC: number;
  feelsLikeC?: number;
  weatherDescription?: string;
  /** Source label, e.g. "BOM Live · Thredbo Top Station" or "Open-Meteo · ECMWF" */
  sourceLabel?: string;
  /** Highlight the source line (e.g. green dot for live BOM feeds) */
  isLive?: boolean;
  /** ISO timestamp when the reading was observed/fetched */
  observedAt?: string | null;
  /** Region eyebrow shown below the hero, e.g. "Live conditions below" */
  scrollCue?: string;
}

function formatAgo(iso: string | undefined | null, now: number): string {
  if (!iso) return "-";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "-";
  const diffSec = Math.max(0, Math.round((now - t) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

export function ResortHero({
  name,
  description,
  elevation,
  temperatureC,
  feelsLikeC,
  weatherDescription,
  sourceLabel,
  isLive,
  observedAt,
  scrollCue = "Live conditions below",
}: ResortHeroProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden isolate">
      {/* Aurora backdrop · matches AU resort hero (sky · indigo · cyan
          wash inside the brand family). Sits behind the hero content so
          JP resort pages get the same coloured header as Snowy Mountains
          and Victoria, instead of a flat white card. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1600px] h-[820px] rounded-full opacity-95"
          style={{
            background:
              "radial-gradient(ellipse at 50% 35%, hsla(210,95%,58%,0.55), transparent 60%), radial-gradient(ellipse at 25% 65%, hsla(230,85%,62%,0.45), transparent 62%), radial-gradient(ellipse at 78% 40%, hsla(190,95%,58%,0.42), transparent 62%)",
            filter: "blur(36px)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 70%, hsl(var(--background)) 100%), repeating-linear-gradient(0deg, hsla(220,30%,12%,0.04) 0px, hsla(220,30%,12%,0.04) 1px, transparent 1px, transparent 64px), repeating-linear-gradient(90deg, hsla(220,30%,12%,0.04) 0px, hsla(220,30%,12%,0.04) 1px, transparent 1px, transparent 64px)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-10 md:pb-14">
        {/* Source byline */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
        >
          {sourceLabel && (
            <span className={`inline-flex items-center gap-1.5 ${isLive ? "text-emerald-700" : ""}`}>
              {isLive && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
              )}
              <span className="byline">{sourceLabel}</span>
            </span>
          )}
          <span className="byline text-muted-foreground/60 tabular-nums">Elev {elevation}m</span>
          {observedAt && (
            <span className="byline text-muted-foreground/80 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/70 border border-slate-200/80">
              <Clock className="w-3 h-3" strokeWidth={1.75} />
              <span>
                Updated <span className="text-foreground tabular-nums">{formatAgo(observedAt, now)}</span>
              </span>
            </span>
          )}
        </motion.div>

        {/* Headline + temperature */}
        <div className="mt-6 md:mt-10 grid md:grid-cols-12 gap-6 md:gap-10 items-end">
          <div className="md:col-span-7">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display font-medium text-foreground text-[clamp(3rem,8vw,5.5rem)] leading-[0.92] tracking-tight"
            >
              {name}
            </motion.h1>
            {description && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mt-4 text-muted-foreground text-base md:text-lg max-w-xl font-light leading-relaxed"
              >
                {description}
              </motion.p>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-5 relative"
          >
            <div className="relative">
              <div className="flex items-start gap-3">
                <span
                  className="display-number text-foreground text-[clamp(7rem,18vw,11rem)]"
                  data-numeric
                >
                  {Math.round(temperatureC)}
                </span>
                <span className="font-display text-foreground/70 text-3xl md:text-4xl mt-4">°C</span>
              </div>
              {(weatherDescription || feelsLikeC != null) && (
                <p className="byline text-muted-foreground mt-1">
                  {weatherDescription ?? ""}
                  {weatherDescription && feelsLikeC != null && " · "}
                  {feelsLikeC != null && `feelzlike ${Math.round(feelsLikeC)}°`}
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {scrollCue && (
          <div className="mt-10 md:mt-14 flex items-center gap-2 text-muted-foreground/60">
            <span className="byline">{scrollCue}</span>
            <ArrowDown className="w-3 h-3" />
          </div>
        )}
      </div>
    </section>
  );
}
