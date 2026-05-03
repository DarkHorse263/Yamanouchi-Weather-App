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
        href={`/resort/${loc.id}`}
        className="group relative block overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-sky-400 hover:shadow-[0_4px_8px_rgba(15,23,42,0.06),0_10px_24px_-12px_rgba(56,128,210,0.25)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
      >
        {/* logo-blue accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-700" />

        <div className="p-3 text-center sm:text-left">
          <div className="flex items-start sm:items-start justify-center sm:justify-between gap-2 flex-col sm:flex-row">
            <div className="min-w-0 w-full sm:w-auto">
              <p className="byline text-sky-700/80 text-[10px]">{loc.region ?? "NSW"}</p>
              <h3 className="font-display font-semibold text-base text-blue-900 group-hover:text-sky-700 transition-colors tracking-tight leading-tight mt-0.5 truncate">
                {loc.name}
              </h3>
              <p className="byline text-muted-foreground/80 text-[10px] mt-0.5">Elev {loc.elevation}m</p>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-sky-600 group-hover:text-blue-700 transition-colors mt-0.5 hidden sm:block" />
          </div>

          <div className="mt-2 flex items-baseline justify-center sm:justify-start gap-1">
            <span className="display-number text-blue-900 text-3xl leading-none">{temp}</span>
            <span className="text-sky-700 font-display text-base">°C</span>
          </div>

          <p className="text-foreground/80 text-xs font-medium capitalize tracking-tight mt-0.5 truncate">
            {cur.description ?? "-"}
          </p>

          <div className="mt-2 pt-2 border-t border-border flex items-center justify-center sm:justify-start gap-2 text-[10px] text-muted-foreground">
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
