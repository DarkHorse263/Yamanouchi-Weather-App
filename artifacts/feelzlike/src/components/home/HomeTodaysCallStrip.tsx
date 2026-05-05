import { motion } from "framer-motion";
import { Trophy, ArrowRight, Snowflake, Wind } from "lucide-react";

interface RegionHeadlineLite {
  id: string;
  name: string;
  href: string;
  countryCode: "AU" | "JP";
  headlineLabel: string;
  headline: {
    tempC: number;
    feelsLikeC: number;
    windKph: number;
    snowfallMmNext24h: number;
  } | null;
}

/**
 * "Today's Call" preview strip. Per playbook 6.1, the homepage should show
 * the top mountain in each region with a quick read of conditions and a
 * link to the full ranking page. To keep the homepage fast (no extra
 * fetches), we derive this from the same `/api/regions` payload the page
 * already loads — the headline reading IS the top mountain for each region.
 *
 * The "score" surfaced here is a ten-second qualitative impression
 * (POWDER / BLUEBIRD / FAIR / MARGINAL) computed from the headline's
 * snowfall + wind, NOT the full 4-component composite used inside
 * `/{region}/today`. This is intentional: showing a precise 0-100 number
 * here would fight for attention with the real Today's Call page; we want
 * a tease that compels the click.
 */
function vibeFor(h: RegionHeadlineLite["headline"]): { label: string; tone: string } {
  if (!h) return { label: "—", tone: "text-slate-400" };
  const snow = h.snowfallMmNext24h;
  const wind = h.windKph;
  if (snow >= 8 && wind <= 30) return { label: "POWDER LOOK", tone: "text-sky-300" };
  if (snow >= 3) return { label: "FRESH SNOW", tone: "text-sky-200" };
  if (wind <= 25) return { label: "BLUEBIRD", tone: "text-amber-200" };
  if (wind >= 50) return { label: "WINDY", tone: "text-rose-300" };
  return { label: "FAIR", tone: "text-emerald-300" };
}

export function HomeTodaysCallStrip({ regions }: { regions: RegionHeadlineLite[] }) {
  const live = regions.filter((r) => r.headline);
  if (live.length === 0) return null;

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-5">
      <div className="rounded-2xl bg-slate-900/85 backdrop-blur border border-white/10 shadow-[0_24px_60px_-30px_rgba(2,6,23,0.7)] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
            <Trophy className="w-3.5 h-3.5" />
            Today's Call · live across both regions
          </span>
          <span className="hidden sm:inline text-[10px] text-white/40 uppercase tracking-[0.18em]">
            Auto-refreshing
          </span>
        </div>
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {live.map((r, i) => {
            const v = vibeFor(r.headline);
            const h = r.headline!;
            return (
              <motion.a
                key={r.id}
                href={`${r.href}today`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 + i * 0.08 }}
                className="group block px-5 py-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
                    {r.countryCode === "AU" ? "🇦🇺" : "🇯🇵"} {r.name}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${v.tone}`}>
                    {v.label}
                  </span>
                </div>
                <p className="mt-2 text-white text-base font-semibold leading-tight">
                  {r.headlineLabel}
                </p>
                <div className="mt-2 flex items-center gap-4 text-[12px] text-white/80">
                  <span className="inline-flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums text-white">{Math.round(h.tempC)}</span>
                    <span className="text-white/60">°C</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-white/50" />
                    <span className="tabular-nums font-semibold">{h.windKph}</span>
                    <span className="text-white/50">km/h</span>
                  </span>
                  {h.snowfallMmNext24h > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Snowflake className="w-3.5 h-3.5 text-sky-300" />
                      <span className="tabular-nums font-semibold">{h.snowfallMmNext24h.toFixed(1)}</span>
                      <span className="text-white/50">mm/24h</span>
                    </span>
                  )}
                </div>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 group-hover:text-amber-200">
                  See full ranking
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export type { RegionHeadlineLite };
