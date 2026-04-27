import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, Wind } from "lucide-react";
import { LOCATION_IMAGERY } from "@/lib/mountain-imagery";
import { cn } from "@/lib/utils";

interface Props {
  data: any; // Keeps wide compatibility with the existing GetWeatherResponse shape
  index: number;
}

export function LocationCard({ data, index }: Props) {
  const loc = data.location;
  const cur = data.current;
  const imagery = LOCATION_IMAGERY[loc.id];
  const temp = Math.round(cur.temperature);
  const feels = Math.round(cur.feelsLike);
  const wind = Math.round(cur.windSpeed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link
        href={`/location/${loc.id}`}
        className="group relative block overflow-hidden rounded-3xl border border-border/60 bg-card aspect-[4/5] focus:outline-none focus:ring-2 focus:ring-primary/60"
      >
        {/* Photographic backdrop */}
        {imagery && (
          <div className="absolute inset-0">
            <img
              src={imagery.thumb}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-black/85" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/5 mix-blend-overlay" />
          </div>
        )}

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="byline text-white/60">{loc.region ?? "NSW"}</p>
              <h3 className="font-display font-semibold text-2xl text-white tracking-tight mt-0.5 leading-tight">
                {loc.name}
              </h3>
              <p className="byline text-white/50 mt-0.5">Elev {loc.elevation}m</p>
            </div>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                "bg-white/10 group-hover:bg-primary/80 backdrop-blur-md border border-white/20"
              )}
            >
              <ArrowUpRight className="w-4 h-4 text-white" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="display-number text-white text-7xl">{temp}</span>
              <span className="text-white/70 font-display text-2xl">°C</span>
            </div>
            <p className="text-white/85 text-sm font-medium capitalize tracking-tight">
              {cur.description ?? "—"}
            </p>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-white/65">
              <span className="byline">Feels {feels}°</span>
              <span className="text-white/30">·</span>
              <span className="inline-flex items-center gap-1">
                <Wind className="w-3 h-3" />
                {wind} km/h
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
