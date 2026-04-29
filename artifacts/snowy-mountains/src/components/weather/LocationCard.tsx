import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, Wind } from "lucide-react";

interface Props {
  data: any;
  index: number;
}

export function LocationCard({ data, index }: Props) {
  const loc = data.location;
  const cur = data.current;
  const temp = Math.round(cur.temperature);
  const feels = Math.round(cur.feelsLike);
  const wind = Math.round(cur.windSpeed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link
        href={`/location/${loc.id}`}
        className="group relative block rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-primary/30 hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_8px_20px_-12px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="byline text-muted-foreground/70 text-[10px]">{loc.region ?? "NSW"}</p>
              <h3 className="font-display font-semibold text-base text-foreground tracking-tight leading-tight mt-0.5 truncate">
                {loc.name}
              </h3>
              <p className="byline text-muted-foreground/80 text-[10px] mt-0.5">Elev {loc.elevation}m</p>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
          </div>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="display-number text-foreground text-3xl leading-none">{temp}</span>
            <span className="text-muted-foreground font-display text-base">°C</span>
          </div>

          <p className="text-foreground/80 text-xs font-medium capitalize tracking-tight mt-0.5 truncate">
            {cur.description ?? "-"}
          </p>

          <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="byline">Feels {feels}°</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1">
              <Wind className="w-2.5 h-2.5" />
              {wind} km/h
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
