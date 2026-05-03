import { useGetWeather } from "@workspace/api-client-react";
import { LocationCard } from "../components/weather/LocationCard";
import { LoadingState } from "../components/ui/loading-state";
import { ErrorState } from "../components/ui/error-state";
import { motion } from "framer-motion";

const AU_LOCATION_IDS = new Set([
  "thredbo",
  "perisher",
  "charlottes-pass",
  "jindabyne",
  "selwyn",
]);

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useGetWeather();
  const updated = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const auLocations = (data?.locations ?? []).filter((loc: any) =>
    AU_LOCATION_IDS.has(loc.location?.id),
  );

  return (
    <>
      {/* ─── Compact hero ─────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-secondary/20 to-background" />

        <div className="relative max-w-7xl mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-10 md:pb-14">
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="byline text-foreground">LIVE · BOM Australia</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display font-semibold text-foreground text-[clamp(2.25rem,5.5vw,4rem)] tracking-tight mt-5 max-w-4xl leading-[1.05]"
          >
            Snowy Mountains
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-muted-foreground text-base md:text-lg max-w-2xl"
          >
            Truthful, source-cited mountain weather for Australia's alpine country.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="mt-6 md:mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
          >
            <span className="byline text-muted-foreground">Reading from</span>
            <span className="font-display text-foreground text-base">Bureau of Meteorology</span>
            <span className="byline text-muted-foreground/80">+ 3 leading international models</span>
            <span className="ml-auto byline text-muted-foreground/80">Updated {updated}</span>
          </motion.div>
        </div>
      </section>

      {/* ─── Resort grid ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 pb-20 -mt-2 md:-mt-4 relative z-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="byline text-muted-foreground">02 · Resort conditions</p>
            <h2 className="font-display font-semibold text-2xl md:text-3xl mt-1">
              Right now in the alps
            </h2>
          </div>
          <p className="byline text-muted-foreground/80 hidden md:block">
            {auLocations.length || 4} towns · live
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-12">
            <LoadingState message="Reading live conditions…" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-border bg-card p-12">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {auLocations.map((loc: any, idx: number) => (
              <LocationCard key={loc.location.id} data={loc} index={idx} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
