import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, MapPin, ChevronRight } from "lucide-react";
import { useState } from "react";

const REGIONS = [
  {
    id: "yamanouchi",
    name: "Yamanouchi Town",
    nameJa: "山ノ内町",
    country: "Japan",
    description: "Snow monkeys, 21 ski resorts, hot springs",
    tags: ["Ski", "Onsen", "Snow Monkeys"],
    status: "live" as const,
    path: "/",
    image: "https://images.unsplash.com/photo-1522156373667-4c7234bbd804?w=400&h=250&fit=crop",
  },
  {
    id: "nagano",
    name: "Nagano Prefecture",
    nameJa: "長野県",
    country: "Japan",
    description: "Olympic city, alpine adventures, temple walks",
    tags: ["Ski", "Culture", "Mountains"],
    status: "coming-soon" as const,
    path: "#",
    image: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&h=250&fit=crop",
  },
  {
    id: "snowy-mountains",
    name: "Snowy Mountains",
    nameJa: "スノーウィー山脈",
    country: "Australia",
    description: "Australia's alpine playground — Perisher, Thredbo, Charlotte Pass",
    tags: ["Ski", "Hiking", "Lakes"],
    status: "coming-soon" as const,
    path: "#",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop",
  },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const filtered = REGIONS.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.country.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-10 md:pt-10 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5"
        >
          <img
            src={`${import.meta.env.BASE_URL}branding/logo-colour.png?v=3`}
            alt="feelzlike"
            className="w-28 md:w-36 mx-auto mb-4"
          />
          <h1 className="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight leading-snug mb-2">
            I wonder what it{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              feelzlike
            </span>{" "}
            in...
          </h1>
          <p className="text-sm md:text-base text-slate-500 max-w-md mx-auto">
            Real-time weather intelligence, resort conditions, and local guides
            for mountain regions around the world.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-5"
        >
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search a region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white transition-all"
            />
          </div>
        </motion.div>

        <div className="space-y-3">
          {filtered.map((region, i) => (
            <motion.div
              key={region.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 + i * 0.08 }}
            >
              <button
                onClick={() => {
                  if (region.status === "live") navigate(region.path);
                }}
                disabled={region.status !== "live"}
                className="w-full text-left group"
              >
                <div className="flex bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:border-blue-300">
                  <div className="relative w-28 md:w-36 shrink-0 overflow-hidden">
                    <img
                      src={region.image}
                      alt={region.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {region.status === "coming-soon" && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="bg-white/90 backdrop-blur-sm text-slate-600 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Soon
                        </span>
                      </div>
                    )}
                    {region.status === "live" && (
                      <div className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                        Live
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm truncate">{region.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-xs text-slate-400">{region.country}</span>
                        </div>
                      </div>
                      {region.status === "live" && (
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{region.description}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      {region.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[11px] text-slate-400">
            Weather-powered travel intelligence — year-round
          </p>
          <img
            src={`${import.meta.env.BASE_URL}branding/wordmark-colour.png?v=3`}
            alt="feelzlike"
            className="w-20 mx-auto mt-2 opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
