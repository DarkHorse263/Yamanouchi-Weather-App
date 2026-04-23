import { useGetWeather } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LocationCard } from "@/components/weather/LocationCard";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useGetWeather();
  const base = import.meta.env.BASE_URL;

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-4 md:space-y-5 max-w-7xl mx-auto">
        {/* feelzlike wonder strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-2 pb-1"
        >
          <h2 className="text-base md:text-lg font-semibold text-slate-700 tracking-tight leading-snug inline-flex items-center gap-x-2 flex-wrap justify-center">
            <span>I wonder what it</span>
            <img
              src={`${base}branding/wordmark-inline.png`}
              alt="feelzlike"
              className="inline-block h-5 md:h-6 w-auto"
            />
            <span>in the Snowy Mountains right now...</span>
          </h2>
        </motion.div>

        {/* Gradient hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl overflow-hidden shadow-xl"
          style={{
            minHeight: 240,
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #60a5fa 100%)",
          }}
        >
          <div className="absolute inset-0">
            <img
              src={`${base}images/hero-bg.png`}
              alt=""
              className="w-full h-full object-cover opacity-25 mix-blend-overlay"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="relative z-10 p-6 md:p-8 flex flex-col min-h-[240px] justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-white/80 font-semibold text-[11px] tracking-widest uppercase">
                  LIVE · BOM Australia
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-2 drop-shadow-sm">
                Snowy Mountains
              </h1>
              <p className="text-white/85 text-sm md:text-base font-medium">
                Australia's Alpine Country
              </p>
              <p className="text-white/60 text-xs font-medium mt-1">
                Thredbo · Perisher · Charlotte's Pass · Jindabyne
              </p>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur px-3.5 py-2 rounded-xl inline-flex items-center gap-2 border border-white/20">
                <Activity className="w-4 h-4 text-blue-200" />
                <span className="text-white font-bold text-sm">
                  {data?.locations.length ?? 4} Resort Towns
                </span>
              </div>
              <p className="text-white/55 text-[11px]">
                Updated{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Location cards grid */}
        {isLoading ? (
          <div className="bg-card rounded-3xl shadow-md p-12">
            <LoadingState message="Fetching latest resort conditions..." />
          </div>
        ) : error ? (
          <div className="bg-card rounded-3xl shadow-md p-12">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
              Resort Conditions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.locations.map((loc, idx) => (
                <LocationCard key={loc.location.id} data={loc} index={idx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
