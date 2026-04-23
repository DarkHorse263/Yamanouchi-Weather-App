import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

const REGIONS = [
  {
    id: "snowy-mountains",
    name: "Snowy Mountains",
    nameJa: "スノーウィー山脈",
    country: "Australia",
    description: "Australia's alpine playground — Perisher, Thredbo, Charlotte's Pass",
    tags: ["Ski", "Hiking", "Lakes"],
    status: "live" as const,
    href: "/snowy-mountains/",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop",
  },
  {
    id: "yamanouchi",
    name: "Yamanouchi Town",
    nameJa: "山ノ内町",
    country: "Japan",
    description: "Snow monkeys, 21 ski resorts, hot springs",
    tags: ["Ski", "Onsen", "Snow Monkeys"],
    status: "live" as const,
    href: "/yamanouchi/",
    image: "https://images.unsplash.com/photo-1522156373667-4c7234bbd804?w=800&h=500&fit=crop",
  },
  {
    id: "nagano",
    name: "Nagano Prefecture",
    nameJa: "長野県",
    country: "Japan",
    description: "80 ski resorts across the Japan Alps — Hakuba, Shiga Kogen, Nozawa",
    tags: ["Ski", "Culture", "Mountains"],
    status: "live" as const,
    href: "/nagano/",
    image: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&h=500&fit=crop",
  },
];

const COVERAGE = ["Live weather", "Webcams", "Road status", "Lifts", "Stay & eat"];

export default function Landing() {
  const [search, setSearch] = useState("");
  const base = import.meta.env.BASE_URL;

  const filtered = REGIONS.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.country.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Bright snowy hero — chosen so dark-blue transparent logos read naturally */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=2000&h=1200&fit=crop&q=80"
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Soft sky-to-snow wash; the logo art is dark blue and needs a light backdrop. */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100/85 via-white/40 to-slate-100/90" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 pt-8 pb-16 md:pt-12 md:pb-24 text-center">
          {/* Transparent logo, no box */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-5 md:mb-7"
          >
            <img
              src={`${base}branding/logo-full.png`}
              alt="feelzlike"
              className="h-20 md:h-24 w-auto"
              style={{ mixBlendMode: "multiply" }}
            />
          </motion.div>

          {/* Tagline — dark text now that hero is light */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-3"
          >
            <span className="block">I wonder what it</span>
            <span className="inline-flex items-baseline justify-center gap-x-2 mt-1 flex-wrap">
              <img
                src={`${base}branding/wordmark-inline.png`}
                alt="feelzlike"
                className="inline-block h-8 md:h-12 w-auto translate-y-1"
                style={{ mixBlendMode: "multiply" }}
              />
              <span>in…</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg text-slate-700 max-w-xl mx-auto leading-relaxed mt-4 mb-7 md:mb-9 font-medium"
          >
            Mountain weather you can actually trust — plus the cams, roads,
            lifts, and places to stay you need to make the call.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <label htmlFor="region-search" className="sr-only">
                Search mountain regions
              </label>
              <input
                id="region-search"
                type="text"
                aria-label="Search mountain regions"
                placeholder="Search a mountain region..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-4 py-4 md:py-5 rounded-2xl border border-slate-200 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 shadow-2xl transition-all"
                style={{ paddingLeft: "3.25rem" }}
              />
            </div>

            {/* Coverage line — descriptive, not clickable */}
            <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 mt-5 text-[11px] md:text-xs text-slate-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-0.5" />
              <span className="text-emerald-700 font-semibold mr-2">
                Truth-first coverage:
              </span>
              {COVERAGE.map((c, i) => (
                <span key={c} className="inline-flex items-center">
                  {c}
                  {i < COVERAGE.length - 1 && (
                    <span className="mx-1.5 text-slate-400">·</span>
                  )}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </header>

      {/* Region list */}
      <main className="relative max-w-3xl mx-auto px-4 -mt-8 md:-mt-10 pb-12 md:pb-20">
        <div className="bg-white rounded-3xl shadow-xl p-4 md:p-6 border border-slate-100">
          <div className="flex items-center gap-2 mb-3 px-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Live Mountain Regions
            </p>
            <div className="flex-1 h-px bg-slate-200/70 ml-1" />
            <span className="text-[11px] text-slate-400 font-medium">
              {filtered.length} {filtered.length === 1 ? "region" : "regions"}
            </span>
          </div>

          <div className="space-y-3">
            {filtered.map((region, i) => {
              const isLive = region.status === "live";
              const Wrapper: any = isLive ? "a" : "div";
              const wrapperProps = isLive ? { href: region.href } : {};
              return (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
                >
                  <Wrapper
                    {...wrapperProps}
                    className="block w-full text-left group"
                  >
                    <div
                      className={`relative flex bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 ${
                        isLive
                          ? "hover:shadow-lg hover:border-blue-300 hover:-translate-y-0.5 cursor-pointer"
                          : "opacity-90 cursor-default"
                      }`}
                    >
                      <div className="relative w-28 sm:w-36 md:w-44 shrink-0 overflow-hidden">
                        <img
                          src={region.image}
                          alt={region.name}
                          className={`w-full h-full object-cover ${
                            isLive ? "group-hover:scale-110" : ""
                          } transition-transform duration-700`}
                        />
                        {!isLive && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <span className="bg-white/95 backdrop-blur-sm text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                              Soon
                            </span>
                          </div>
                        )}
                        {isLive && (
                          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            Live
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3.5 md:p-4 flex flex-col justify-center min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-lg md:text-xl leading-tight">
                              {region.name}
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="text-xs text-slate-500 font-medium">
                                {region.country}
                              </span>
                            </div>
                          </div>
                          {isLive && (
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="hidden sm:block text-xs md:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {region.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {region.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Wrapper>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-500 font-medium mb-1">
            Built by mountain people, for mountain people.
          </p>
          <p className="text-[11px] text-slate-400">
            Real-time conditions sourced direct from official services
            (BOM, JMA, resort networks, transport authorities).
          </p>
        </div>
      </main>
    </div>
  );
}
