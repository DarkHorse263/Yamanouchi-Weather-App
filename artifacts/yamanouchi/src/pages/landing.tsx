import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, MapPin, Snowflake, Sun, ChevronRight } from "lucide-react";
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
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-48 md:w-56 mx-auto mb-8">
            <img
              src={`${import.meta.env.BASE_URL}branding/logo-colour.png?v=3`}
              alt="feelzlike"
              className="w-full h-auto"
            />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight leading-tight mb-4">
            I wonder what it{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              feelzlike
            </span>{" "}
            in...
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Real-time weather intelligence, resort conditions, and local guides for
            mountain regions around the world.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-lg mx-auto mb-14"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search a region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm text-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((region, i) => (
            <motion.div
              key={region.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            >
              <button
                onClick={() => {
                  if (region.status === "live") navigate(region.path);
                }}
                disabled={region.status !== "live"}
                className="w-full text-left group"
              >
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={region.image}
                      alt={region.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-white/90" />
                      <span className="text-white text-sm font-medium">{region.country}</span>
                    </div>
                    {region.status === "coming-soon" && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                        Coming Soon
                      </div>
                    )}
                    {region.status === "live" && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Live
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-800 text-lg">{region.name}</h3>
                      {region.status === "live" && (
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{region.description}</p>
                    <div className="flex gap-2">
                      {region.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Snowflake className="w-4 h-4" />
              <span>Winter</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <Sun className="w-4 h-4" />
              <span>Green Season</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Weather-powered travel intelligence — year-round
          </p>
          <img
            src={`${import.meta.env.BASE_URL}branding/wordmark-colour.png?v=3`}
            alt="feelzlike"
            className="w-32 mx-auto mt-6 opacity-60"
          />
        </motion.div>
      </div>
    </div>
  );
}
