import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Snowflake,
  Sun,
  Wind,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  detectPowderWindow,
  type HourlyForecast as HourlyForecastT,
  type PowderThresholds,
  type PowderWindow,
} from "@/types/weather";

type Tx = (en: string, ja: string) => string;

interface Props {
  hourly: HourlyForecastT[];
  /**
   * Location timezone offset from UTC, in seconds. Required for correct
   * past/future filtering when the viewer's browser is in a different timezone
   * than the resort. Source: `LocationWeather.utcOffsetSeconds` from the API.
   */
  utcOffsetSeconds: number;
  /** How many hours forward to render. Default 48. */
  hours?: number;
  /** Powder Window thresholds. Default = Japow (1cm/hr, <20km/h, ≥3h). */
  thresholds?: PowderThresholds;
  /** Optional EN/JA translator. If omitted, English-only. */
  t?: Tx;
  /** Section number prefix (e.g. "04") for the editorial byline. */
  sectionNumber?: string;
}

function WeatherIcon({
  code,
  className = "w-5 h-5",
}: {
  code: number | null | undefined;
  className?: string;
}) {
  if (code == null) return <Cloud className={className} aria-hidden />;
  if (code === 0) return <Sun className={className} aria-hidden />;
  if (code === 1 || code === 2) return <CloudSun className={className} aria-hidden />;
  if (code === 3) return <Cloud className={className} aria-hidden />;
  if (code === 45 || code === 48) return <CloudFog className={className} aria-hidden />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className={className} aria-hidden />;
  if (code >= 61 && code <= 67) return <CloudRain className={className} aria-hidden />;
  if (code >= 71 && code <= 77) return <CloudSnow className={className} aria-hidden />;
  if (code >= 80 && code <= 82) return <CloudRain className={className} aria-hidden />;
  if (code >= 85 && code <= 86) return <CloudSnow className={className} aria-hidden />;
  if (code >= 95) return <CloudLightning className={className} aria-hidden />;
  return <Cloud className={className} aria-hidden />;
}

/**
 * Open-Meteo `time` strings are naive ISO ("YYYY-MM-DDTHH:MM") in the
 * resort's local timezone. Parsing them as if UTC gives a "fake-UTC" ms
 * value that represents the local wall-clock hour. We then compare against
 * "now in the resort's local wall clock" computed from `Date.now() + offset`.
 * This makes filtering timezone-safe regardless of the viewer's browser TZ.
 */
function parseLocalAsFakeUtc(timeIso: string): number {
  return Date.parse(timeIso + "Z");
}

/**
 * Format the wall-clock hour directly from the ISO string parts so the label
 * is always the resort's local hour regardless of the viewer's browser TZ.
 * (Using `format(parseISO(t), "ha")` would shift by the browser's offset.)
 */
function formatHourLabel(timeIso: string): string {
  const h = Number(timeIso.slice(11, 13));
  if (!Number.isFinite(h)) return "—";
  const period = h < 12 ? "am" : "pm";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${period}`;
}

/**
 * "Next 48 hours" forecast strip with Powder Window detection.
 *
 * Source: Open-Meteo hourly via /api/weather/locations/:id (timestamps are
 * naive ISO in the location's local timezone — we use `utcOffsetSeconds`
 * for past/future math and parse the hour digits directly for display).
 *
 * Filters the input to hours from now onward, slices to `hours`, and detects
 * the longest consecutive Powder Window (snowfall ≥ threshold AND wind <
 * threshold for ≥ minDuration hours). Hours inside the window get a sky-blue
 * highlight; the window is summarised in a badge above the strip.
 */
export function HourlyForecast({
  hourly,
  utcOffsetSeconds,
  hours = 48,
  thresholds,
  t,
  sectionNumber = "04",
}: Props) {
  const tx: Tx = t ?? ((en) => en);

  const future = useMemo(() => {
    // "Now" projected into the resort's local wall clock, expressed as
    // a fake-UTC ms (matches `parseLocalAsFakeUtc` above). Include the
    // current hour bucket (anything within the last 60 min counts as "now").
    const nowLocalMs = Date.now() + utcOffsetSeconds * 1000;
    const cutoffMs = nowLocalMs - 60 * 60 * 1000;
    return hourly
      .filter((h) => {
        const t = parseLocalAsFakeUtc(h.time);
        return Number.isFinite(t) && t >= cutoffMs;
      })
      .slice(0, hours);
  }, [hourly, hours, utcOffsetSeconds]);

  const powder = useMemo(
    () => detectPowderWindow(future, thresholds),
    [future, thresholds],
  );

  if (future.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.23 }}
      className="glass rounded-3xl p-5 md:p-8"
      aria-label={tx("Next 48 hours", "今後48時間")}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
        <div>
          <p className="byline text-muted-foreground">
            {sectionNumber} · {tx("Hour by hour", "時間別")}
          </p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
            <Snowflake className="text-primary w-5 h-5" aria-hidden />
            {tx("Next 48 hours", "今後48時間")}
          </h2>
        </div>
        {powder && <PowderBadge window={powder} hours={future} t={tx} />}
      </header>

      {/* Horizontal scroll strip — native scroll-snap for mobile. Made
          keyboard-focusable so users can scroll with arrow keys. */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory hide-scrollbar focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
        role="list"
        tabIndex={0}
        aria-label={tx(
          "Hourly forecast — scroll horizontally for later hours",
          "時間別予報 — 横スクロールで後の時間を表示",
        )}
      >
        {future.map((h, i) => {
          const inWindow =
            !!powder && i >= powder.startIdx && i < powder.endIdx;
          return (
            <HourCell
              key={`${h.time}-${i}`}
              hour={h}
              inPowderWindow={inWindow}
              isFirst={i === 0}
            />
          );
        })}
      </div>

      {!powder && future.some((h) => (h.snowfall ?? 0) > 0) && (
        <p className="mt-3 text-[11px] text-muted-foreground/80 text-center">
          {tx(
            "Snow forecast — but no sustained Powder Window in the next 48h.",
            "降雪はあるものの、今後48時間にパウダーウィンドウは見込まれません。",
          )}
        </p>
      )}
    </motion.section>
  );
}

function HourCell({
  hour,
  inPowderWindow,
  isFirst,
}: {
  hour: HourlyForecastT;
  inPowderWindow: boolean;
  isFirst: boolean;
}) {
  const hourLabel = formatHourLabel(hour.time);
  const snow = Math.round((hour.snowfall ?? 0) * 10) / 10;
  const wind = Math.round(hour.windSpeed ?? 0);
  const temp = Math.round(hour.temperature ?? 0);

  return (
    <div
      role="listitem"
      className={cn(
        "snap-start shrink-0 w-[58px] md:w-[64px] flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 transition-colors",
        inPowderWindow
          ? "bg-sky-50 border-sky-300/70 ring-1 ring-sky-300/40"
          : "bg-white/60 border-border",
      )}
      title={`${hourLabel} · ${temp}°C · ${snow > 0 ? `${snow}cm snow · ` : ""}${wind} km/h wind`}
    >
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider tabular-nums",
          isFirst ? "text-primary" : "text-muted-foreground",
        )}
      >
        {isFirst ? "Now" : hourLabel}
      </p>
      <div className={cn(inPowderWindow ? "text-sky-700" : "text-foreground/80")}>
        <WeatherIcon code={hour.weatherCode} className="w-5 h-5" />
      </div>
      <p
        className="font-display text-base text-foreground tabular-nums leading-none"
        data-numeric
      >
        {temp}°
      </p>
      {snow > 0 ? (
        <div className="flex items-center gap-0.5 text-[10px] font-semibold text-sky-700 tabular-nums leading-none">
          <Snowflake className="w-2.5 h-2.5" aria-hidden />
          {snow}
        </div>
      ) : (
        <div className="h-[12px]" aria-hidden />
      )}
      <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground tabular-nums leading-none">
        <Wind className="w-2.5 h-2.5" aria-hidden />
        {wind}
      </div>
    </div>
  );
}

/** Add 1 hour to an "Hh"-style label for the badge end-marker. */
function nextHourLabel(timeIso: string): string {
  const h = Number(timeIso.slice(11, 13));
  if (!Number.isFinite(h)) return "—";
  const next = (h + 1) % 24;
  const period = next < 12 ? "am" : "pm";
  const display = next === 0 ? 12 : next > 12 ? next - 12 : next;
  return `${display}${period}`;
}

function PowderBadge({
  window,
  hours,
  t,
}: {
  window: PowderWindow;
  hours: HourlyForecastT[];
  t: Tx;
}) {
  const startTime = hours[window.startIdx]?.time;
  const endTime = hours[window.endIdx - 1]?.time;
  const startLabel = startTime ? formatHourLabel(startTime) : "";
  // End label = the START of the hour AFTER the last in-window hour, so a
  // 9am→11am inclusive window labels as "9am–12pm".
  const endLabel = endTime ? nextHourLabel(endTime) : "";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-2xl border border-sky-300/60 bg-sky-50 px-3 py-2 text-sky-900"
      role="status"
      aria-label={t("Powder Window detected", "パウダーウィンドウあり")}
    >
      <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0" aria-hidden />
      <div className="leading-tight">
        <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
          {t("Powder Window", "パウダーウィンドウ")}
        </p>
        <p className="text-xs font-semibold text-sky-900 tabular-nums">
          {startLabel}–{endLabel} ·{" "}
          <span className="font-bold">
            {window.totalSnow}cm {t("forecast", "予報")}
          </span>
        </p>
      </div>
    </div>
  );
}
