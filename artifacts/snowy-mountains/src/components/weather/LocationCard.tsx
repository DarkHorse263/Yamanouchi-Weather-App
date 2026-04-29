import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, Wind } from "lucide-react";
import { LOCATION_IMAGERY } from "@/lib/mountain-imagery";

interface Props {
  data: any;
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link
        href={`/location/${loc.id}`}
        className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] hover:border-primary/30 hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_12px_32px_-12px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {/* Photo header - 16:10 banner */}
        {imagery && (
          <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
            <img
              src={imagery.thumb}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
            {/* Top scrim only (so the chip + arrow read) - bottom kept clean */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />
            <div className="absolute top-3 left-3">
              <span className="byline text-white drop-shadow-sm">{loc.region ?? "NSW"}</span>
            </div>
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm border border-white/40 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 md:p-5">
          <h3 className="font-display font-semibold text-xl text-foreground tracking-tight leading-tight">
            {loc.name}
          </h3>
          <p className="byline text-muted-foreground/80 mt-0.5">Elev {loc.elevation}m</p>

          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="display-number text-foreground text-5xl">{temp}</span>
            <span className="text-muted-foreground font-display text-xl">°C</span>
          </div>

          <p className="text-foreground/85 text-sm font-medium capitalize tracking-tight mt-1">
            {cur.description ?? "-"}
          </p>

          <div className="mt-3 pt-3 border-t border-border flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="byline">Feels {feels}°</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1">
              <Wind className="w-3 h-3" />
              {wind} km/h
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
