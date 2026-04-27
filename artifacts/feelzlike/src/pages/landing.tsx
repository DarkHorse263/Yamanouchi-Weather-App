import { motion } from "framer-motion";
import { Search, MapPin, ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";

const REGIONS = [
  {
    id: "snowy-mountains",
    name: "Snowy Mountains",
    region: "New South Wales, Australia",
    description:
      "Australia's alpine country — Perisher, Thredbo, Charlotte Pass.",
    tags: ["Snow", "Hiking", "Lakes"],
    status: "live" as const,
    href: "/snowy-mountains/",
    image:
      "https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1400&h=900&fit=crop&q=80",
    coords: "36.5° S · 148.3° E",
  },
  {
    id: "yamanouchi",
    name: "Yamanouchi Town",
    region: "Nagano, Japan",
    description:
      "Snow monkeys, 21 ski areas, hot springs and stone-paved onsen streets.",
    tags: ["Snow", "Onsen", "Culture"],
    status: "live" as const,
    href: "/yamanouchi/",
    image:
      "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=1400&h=900&fit=crop&q=80",
    coords: "36.7° N · 138.4° E",
  },
  {
    id: "nagano",
    name: "Nagano Prefecture",
    region: "Honshu, Japan",
    description:
      "80 ski areas across the Japan Alps — Hakuba, Shiga Kogen, Nozawa.",
    tags: ["Snow", "Mountains", "Alps"],
    status: "live" as const,
    href: "/nagano/",
    image:
      "https://images.unsplash.com/photo-1610824352934-c10d87b700cc?w=1400&h=900&fit=crop&q=80",
    coords: "36.6° N · 138.2° E",
  },
];

const COVERAGE = [
  "Live weather",
  "Webcams",
  "Road status",
  "Lifts",
  "Stay & eat",
];

export default function Landing() {
  const [search, setSearch] = useState("");

  const filtered = REGIONS.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100 antialiased">
      {/* ─── HERO ─────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=2400&h=1400&fit=crop&q=85"
            alt=""
            className="w-full h-full object-cover opacity-55"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,15,26,0.55) 0%, rgba(10,15,26,0.65) 45%, rgba(10,15,26,0.95) 100%)",
            }}
          />
          {/* grain */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto px-5 pt-12 pb-20 md:pt-20 md:pb-32">
          {/* tiny brand line */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-8 md:mb-10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/90">
              feelzlike · global mountain weather intelligence
            </span>
          </motion.div>

          {/* editorial headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-[-0.02em] leading-[1.02] text-white"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            <span className="block font-light text-slate-300/90">I wonder what it</span>
            <span className="block mt-1">
              <em className="not-italic font-medium text-white">
                feelz<span className="italic font-semibold text-sky-300">like</span>
              </em>{" "}
              <span className="font-light text-slate-300/90">in…</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-sm md:text-base text-slate-300/80 max-w-xl mt-5 md:mt-7 leading-relaxed font-light"
          >
            Mountain weather you can actually trust — plus the cams, roads,
            lifts and places to stay you need to make the call.
          </motion.p>

          {/* SEARCH */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-8 md:mt-10"
          >
            <div className="relative max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <label htmlFor="region-search" className="sr-only">
                Search mountain regions
              </label>
              <input
                id="region-search"
                type="text"
                aria-label="Search mountain regions"
                placeholder="Search a mountain region…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/[0.06] border border-white/10 text-slate-100 text-sm placeholder:text-slate-500 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300/40 transition-all"
              />
            </div>

            {/* coverage line */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-5 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-emerald-300/90">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-semibold uppercase tracking-[0.16em]">
                  Truth-first
                </span>
              </span>
              {COVERAGE.map((c, i) => (
                <span key={c} className="inline-flex items-center">
                  <span>{c}</span>
                  {i < COVERAGE.length - 1 && (
                    <span className="ml-3 text-slate-600">·</span>
                  )}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </header>

      {/* ─── REGIONS ──────────────────────────────────── */}
      <main className="relative max-w-5xl mx-auto px-5 pb-20 md:pb-28">
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              01 · Live regions
            </p>
            <h2
              className="font-serif text-2xl md:text-3xl mt-1 text-white tracking-tight"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Choose a mountain
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium tabular-nums">
            {filtered.length} {filtered.length === 1 ? "region" : "regions"}
          </span>
        </div>

        <div className="grid gap-4 md:gap-5">
          {filtered.map((region, i) => (
            <motion.a
              key={region.id}
              href={region.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.07 }}
              className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] transition-all duration-500"
            >
              <div className="flex flex-col md:flex-row">
                {/* image */}
                <div className="relative w-full md:w-2/5 aspect-[16/10] md:aspect-auto overflow-hidden">
                  <img
                    src={region.image}
                    alt={region.name}
                    className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0a0f1a]/80 via-[#0a0f1a]/10 to-transparent" />
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                      Live
                    </span>
                  </div>
                </div>

                {/* content */}
                <div className="flex-1 p-5 md:p-7 flex flex-col justify-between min-w-0">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-1.5">
                      <MapPin className="w-3 h-3 inline-block mr-1 -mt-0.5 text-slate-500" />
                      {region.region}
                    </p>
                    <h3
                      className="font-serif text-2xl md:text-3xl text-white tracking-tight leading-tight"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      {region.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed font-light line-clamp-2">
                      {region.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {region.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium uppercase tracking-wider text-slate-300/80 bg-white/[0.05] border border-white/10 px-2 py-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 group-hover:text-sky-200 group-hover:gap-2.5 transition-all whitespace-nowrap"
                    >
                      Open
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* trust footer */}
        <div className="mt-14 md:mt-20 pt-10 border-t border-white/5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">
                02 · Where the data comes from
              </p>
              <p
                className="font-serif text-xl md:text-2xl text-white tracking-tight max-w-lg leading-tight"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                Built by mountain people, for mountain people.
              </p>
              <p className="text-sm text-slate-400 mt-3 max-w-lg leading-relaxed font-light">
                Real-time conditions sourced direct from official services —
                national weather agencies, resort networks and transport
                authorities. We surface the consensus, not a single guess.
              </p>
            </div>

            <div className="flex flex-col gap-2 md:items-end text-[11px] text-slate-500">
              <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">
                Sources
              </span>
              <span>Bureau of Meteorology · Australia</span>
              <span>Japan Meteorological Agency · Japan</span>
              <span>+ leading international forecast models</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
