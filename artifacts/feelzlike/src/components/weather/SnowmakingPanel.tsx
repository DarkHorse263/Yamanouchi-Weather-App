import { motion } from "framer-motion";
import { Snowflake } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getSnowmakingCapability,
  wetBulbC,
  snowmakingViability,
  bestSnowmakingWindow,
  SNOWMAKING_VIABILITY_COPY,
  type SnowmakingHour,
} from "@/lib/snowmaking";

const TONE = {
  good: { dot: "bg-emerald-400", chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  marginal: { dot: "bg-amber-400", chip: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  warm: { dot: "bg-slate-400", chip: "bg-white/5 text-muted-foreground border-white/10" },
} as const;

interface SnowmakingPanelProps {
  locationId: string;
  tempC: number | null | undefined;
  humidity: number | null | undefined;
  hourly?: SnowmakingHour[] | null;
}

/**
 * Snowmaking panel · shows the honest man-made-snow reality for a resort:
 *   · curated capability (all-weather snow factory vs conventional guns)
 *   · a live wet-bulb window for the conventional guns
 * Renders null for any location without curated capability data, so it is
 * safe to mount unconditionally on the resort page.
 */
export function SnowmakingPanel({ locationId, tempC, humidity, hourly }: SnowmakingPanelProps) {
  const cap = getSnowmakingCapability(locationId);
  if (!cap) return null;

  const nowWb = wetBulbC(tempC, humidity);
  const nowViability = snowmakingViability(nowWb);
  const win = bestSnowmakingWindow(hourly, 24);

  const isAllWeather = cap.type === "all-weather";
  // On an all-weather resort the live window describes the conventional guns
  // on the rest of the mountain · the all-weather machine runs regardless.
  const gunsLabel = isAllWeather ? "conventional guns elsewhere" : "snow guns";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass rounded-3xl p-5 md:p-8"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="byline text-muted-foreground">snowmaking</p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2 text-foreground">
            <Snowflake className="text-snow-accent w-5 h-5" />
            {cap.headline}
          </h2>
        </div>
        {isAllWeather && (
          <span className="shrink-0 mt-1 inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
            runs in any weather
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{cap.summary}</p>

      {cap.areas.length > 0 && (
        <div className="space-y-2 mb-5">
          {cap.areas.map((a) => (
            <div key={a.name} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                {a.name} · {a.system}
              </p>
              <p className="byline text-muted-foreground/70 mt-1 tabular-nums">
                makes snow up to {a.maxTempC}°
                {a.outputM3PerDay != null ? ` · ${a.outputM3PerDay} m³ per day` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <p className="byline text-muted-foreground/70 mb-2">{gunsLabel}</p>
        {nowViability ? (
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
                TONE[SNOWMAKING_VIABILITY_COPY[nowViability].tone].chip,
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  TONE[SNOWMAKING_VIABILITY_COPY[nowViability].tone].dot,
                )}
              />
              {SNOWMAKING_VIABILITY_COPY[nowViability].label} right now
            </span>
            {nowWb != null && (
              <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                wet-bulb {nowWb}°
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">waiting on live conditions</p>
        )}

        <p className="text-[12px] text-muted-foreground/70 mt-2 leading-relaxed">
          {nowViability
            ? SNOWMAKING_VIABILITY_COPY[nowViability].detail
            : "snow guns need cold, dry air"}
        </p>

        {win && (
          <p className="text-[12px] text-muted-foreground/80 mt-3 pt-3 border-t border-white/10 tabular-nums">
            {win.viableHours > 0
              ? `best window · ${formatHour(win.atISO)} · wet-bulb ${win.wetBulbC}° · ${win.viableHours} of next 24h cold enough`
              : "too warm to make snow in the next 24 hours"}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function formatHour(iso: string): string {
  try {
    return format(parseISO(iso), "EEE ha").toLowerCase();
  } catch {
    return "";
  }
}
