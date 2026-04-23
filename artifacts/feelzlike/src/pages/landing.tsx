import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  ChevronRight,
  ThermometerSun,
  Camera,
  Car,
  BedDouble,
  Mountain,
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

const FEATURES = [
  { icon: ThermometerSun, label: "Live Weather", color: "text-amber-500", bg: "bg-amber-50" },
  { icon: Camera,         label: "Webcams",      color: "text-blue-500",  bg: "bg-blue-50" },
  { icon: Car,            label: "Road Status",  color: "text-rose-500",  bg: "bg-rose-50" },
  { icon: BedDouble,      label: "Stay & Eat",   color: "text-emerald-500", bg: "bg-emerald-50" },
];

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      {/* Background flourish */}
      <div className="absolute inset-x-0 top-0 h-[420px] overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -top-20 right-0 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 pt-8 pb-12 md:pt-14 md:pb-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <img
            src={`${base}branding/logo-full.png`}
            alt="feelzlike"
            className="w-44 md:w-56 mx-auto mb-5 drop-shadow-sm"
          />
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-3">
            <span className="block">I wonder what it</span>
            <span className="flex items-center justify-center gap-x-2 mt-1">
              <img
                src={`${base}branding/wordmark-inline.png`}
                alt="feelzlike"
                className="inline-block h-8 md:h-12 w-auto"
              />
              <span>in...</span>
            </span>
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Mountain weather you can actually trust — plus the cams, roads,
            lifts, and places to stay you need to make the call.
          </p>

          <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-bold text-emerald-700 tracking-wide uppercase">
              Truth-First Mountain Intelligence
            </span>
          </div>
        </motion.div>

        {/* Feature row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-4 gap-2 md:gap-4 mb-8"
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-slate-100 shadow-sm"
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${f.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 ${f.color}`} />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-slate-700 leading-tight">
                  {f.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-5"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <label htmlFor="region-search" className="sr-only">
              Search mountain regions
            </label>
            <input
              id="region-search"
              type="text"
              aria-label="Search mountain regions"
              placeholder="Search a region — Snowy Mountains, Nagano, Yamanouchi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition-all"
            />
          </div>
        </motion.div>

        {/* Section label */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <Mountain className="w-4 h-4 text-slate-400" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Live Mountain Regions
          </p>
          <div className="flex-1 h-px bg-slate-200/70 ml-1" />
          <span className="text-[11px] text-slate-400 font-medium">
            {filtered.length} {filtered.length === 1 ? "region" : "regions"}
          </span>
        </div>

        {/* Region cards */}
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
                transition={{ duration: 0.35, delay: 0.25 + i * 0.08 }}
              >
                <Wrapper
                  {...wrapperProps}
                  className="block w-full text-left group"
                >
                  <div
                    className={`relative flex bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-300 ${
                      isLive
                        ? "hover:shadow-xl hover:border-blue-300 hover:-translate-y-0.5 cursor-pointer"
                        : "opacity-90 cursor-default"
                    }`}
                  >
                    <div className="relative w-32 md:w-44 shrink-0 overflow-hidden">
                      <img
                        src={region.image}
                        alt={region.name}
                        className={`w-full h-full object-cover ${
                          isLive ? "group-hover:scale-110" : ""
                        } transition-transform duration-700`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/0" />
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
                    <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-base md:text-lg truncate leading-snug">
                            {region.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-0.5">
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
                      <p className="text-xs md:text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
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

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium mb-1">
            Built by mountain people, for mountain people.
          </p>
          <p className="text-[11px] text-slate-400">
            Real-time conditions sourced direct from official services
            (BOM, JMA, resort networks, transport authorities).
          </p>
          <img
            src={`${base}branding/wordmark-colour.png`}
            alt="feelzlike"
            className="w-20 mx-auto mt-4 opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
