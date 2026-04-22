import { Link } from "wouter";
import { motion } from "framer-motion";
import { formatTemp, formatSnow } from "@/lib/utils";
import { WeatherIcon } from "@/components/ui/weather-icon";
import { ArrowRight, Wind, Snowflake, Droplets } from "lucide-react";
import type { LocationWeather } from "@workspace/api-client-react";

interface LocationCardProps {
  data: LocationWeather;
  index: number;
}

export function LocationCard({ data, index }: LocationCardProps) {
  const { location, current } = data;

  return (
    <Link href={`/location/${location.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
        className="group relative bg-card rounded-3xl p-6 shadow-sm border border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden isolate"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {location.name}
              </h3>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Elev: {location.elevation}m
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="p-3 bg-secondary/50 rounded-2xl">
                <WeatherIcon code={current.weatherCode} isDay={current.isDay} className="w-8 h-8" />
              </div>
              {current.dataSource === "BOM" && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  BOM Live
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end gap-3 mb-2">
            <span className="text-5xl font-display font-bold tracking-tighter">
              {formatTemp(current.temperature)}
            </span>
            <span className="text-lg text-muted-foreground font-medium pb-1.5">
              Feels {formatTemp(current.feelsLike)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">{current.weatherDescription}</p>

          <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-4">
            <div className="flex flex-col items-center p-2 rounded-xl bg-snow/50 text-snow-foreground">
              <Snowflake className="w-4 h-4 mb-1 text-blue-400" />
              <span className="text-xs font-semibold">{formatSnow(current.snowDepth)}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-70">Snow</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-muted/30">
              <Wind className="w-4 h-4 mb-1 text-muted-foreground" />
              <span className="text-xs font-semibold">
                {current.windSpeed} km/h
                {current.windDirectionCompass && <span className="text-muted-foreground"> {current.windDirectionCompass}</span>}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Wind</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-muted/30">
              <Droplets className="w-4 h-4 mb-1 text-muted-foreground" />
              <span className="text-xs font-semibold">{current.humidity}%</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Humidity</span>
            </div>
          </div>

          <div className="absolute top-6 right-6 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
