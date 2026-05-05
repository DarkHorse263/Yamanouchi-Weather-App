import { motion } from "framer-motion";
import { BedDouble, UtensilsCrossed, MapPinned, ArrowRight } from "lucide-react";
import { getAllStays, getAllEats } from "@/data";

/**
 * Curation summary section. Static counts derived from the curated dataset
 * at module load — no API call needed. Three tiles (stays / eats / base
 * towns) → CTAs to the busiest base town in each region as a quick way
 * in.
 */
export function HomeCurationStrip() {
  const stayCount = getAllStays().length;
  const eatCount = getAllEats().length;
  const baseTownCount = 6; // Jindabyne, Berridale, Cooma, Yudanaka, Shibu Onsen, Yomase

  const tiles = [
    {
      icon: BedDouble,
      number: stayCount,
      label: "stays curated for skiers",
      sub: "Ryokans, ski-in lodges, family apartments",
      href: "/yamanouchi/yudanaka/stay",
      cta: "Browse Yudanaka stays",
      accent: "from-sky-400 to-blue-700",
      iconBg: "bg-sky-50 text-sky-600",
    },
    {
      icon: UtensilsCrossed,
      number: eatCount,
      label: "eats hand-picked across both regions",
      sub: "Soba, izakaya, Aussie pubs, after-ski apres",
      href: "/snowy-mountains/jindabyne/eat",
      cta: "Browse Jindabyne eats",
      accent: "from-amber-400 to-rose-500",
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      icon: MapPinned,
      number: baseTownCount,
      label: "base towns, six unique vibes",
      sub: "Each town has its own character — pick yours",
      href: "/yamanouchi",
      cta: "See base towns",
      accent: "from-emerald-400 to-teal-600",
      iconBg: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-5 mt-12 md:mt-20">
      <div className="flex items-end justify-between mb-4 md:mb-5 gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          03 · The depth · curated by hand
        </p>
        <span className="hidden sm:inline text-[11px] text-slate-500 font-medium">
          {stayCount + eatCount} entries · zero algorithmic guesses
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {tiles.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.a
              key={t.label}
              href={t.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 + i * 0.06 }}
              className="group relative flex flex-col rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] transition-all overflow-hidden"
            >
              <div className={`h-1 w-full bg-gradient-to-r ${t.accent}`} />
              <div className="p-5">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${t.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums text-slate-900 leading-none" style={{ fontFamily: "'DIN Pro', system-ui, sans-serif" }}>
                    {t.number}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
                    LIVE
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700 leading-snug">{t.label}</p>
                <p className="mt-1 text-xs text-slate-500 leading-snug">{t.sub}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 group-hover:text-sky-700 transition-colors">
                  {t.cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
