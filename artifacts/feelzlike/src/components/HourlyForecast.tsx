import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  detectPowderWindows,
  type HourlyForecast as HourlyForecastT,
  type PowderGrade,
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
  /** Powder Window thresholds. Default = Japow (1cm/hr, <20km/h, ≥3h, ≤+2°C). */
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
 */
function formatHourLabel(timeIso: string): string {
  const h = Number(timeIso.slice(11, 13));
  if (!Number.isFinite(h)) return "-";
  const period = h < 12 ? "am" : "pm";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${period}`;
}

/** Add 1 hour to an "Hh"-style label for the badge end-marker. */
function nextHourLabel(timeIso: string): string {
  const h = Number(timeIso.slice(11, 13));
  if (!Number.isFinite(h)) return "-";
  const next = (h + 1) % 24;
  const period = next < 12 ? "am" : "pm";
  const display = next === 0 ? 12 : next > 12 ? next - 12 : next;
  return `${display}${period}`;
}

// ---------------------------------------------------------------------------
// Grade styling - exported so PowderCalendar + RegionOverview reuse the same palette
// ---------------------------------------------------------------------------

export const GRADE_STYLES: Record<
  PowderGrade,
  {
    /** Used for the highlighted hour cell. */
    cell: string;
    /** Used for the badge above the strip. */
    badge: string;
    /** Tone used in calendar pills. */
    pill: string;
    /** Plain label. */
    label: string;
    labelJa: string;
  }
> = {
  gold: {
    cell: "bg-amber-50 border-amber-300/70 ring-1 ring-amber-300/40 text-amber-900",
    badge: "border-amber-300/70 bg-amber-50 text-amber-900",
    pill: "bg-amber-100 text-amber-900 border-amber-300",
    label: "GOLD",
    labelJa: "ゴールド",
  },
  silver: {
    cell: "bg-slate-100 border-slate-300/70 ring-1 ring-slate-300/40 text-slate-900",
    badge: "border-slate-300/70 bg-slate-100 text-slate-900",
    pill: "bg-slate-200 text-slate-900 border-slate-300",
    label: "SILVER",
    labelJa: "シルバー",
  },
  bronze: {
    cell: "bg-orange-50 border-orange-300/70 ring-1 ring-orange-300/40 text-orange-900",
    badge: "border-orange-300/70 bg-orange-50 text-orange-900",
    pill: "bg-orange-100 text-orange-900 border-orange-300",
    label: "BRONZE",
    labelJa: "ブロンズ",
  },
};

/**
 * "Next 48 hours" forecast strip with multi-window Powder detection.
 *
 * Source: Open-Meteo hourly via /api/weather/locations/:id (timestamps are
 * naive ISO in the location's local timezone - we use `utcOffsetSeconds`
 * for past/future math and parse the hour digits directly for display).
 *
 * Renders ALL qualifying powder windows in the next `hours`, each tinted
 * by GOLD/SILVER/BRONZE quality. Best (gold) windows get a subtle shimmer.
 * Tap a badge to open a detail panel.
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
  const [openIdx, setOpenIdx] = useState<number | null>(null);

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

  const windows = useMemo(
    () => detectPowderWindows(future, thresholds),
    [future, thresholds],
  );

  /**
   * Lookup map: hour-index → (window, gradeStyle) so each cell knows which
   * window it belongs to. Built once per render for O(1) lookup in the map.
   */
  const cellWindowMap = useMemo(() => {
    const m = new Map<number, { win: PowderWindow; idx: number }>();
    windows.forEach((win, idx) => {
      for (let i = win.startIdx; i < win.endIdx; i++) {
        m.set(i, { win, idx });
      }
    });
    return m;
  }, [windows]);

  if (future.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.23 }}
      className="glass rounded-3xl p-5 md:p-8"
      aria-label={tx("Next 48 hours", "今後48時間")}
    >
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-5">
        <div>
          <p className="byline text-muted-foreground">
            {tx("Hour by hour", "時間別")}
          </p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
            <Snowflake className="text-primary w-5 h-5" aria-hidden />
            {tx("Next 48 hours", "今後48時間")}
          </h2>
        </div>
        {windows.length > 0 && (
          <div className="flex flex-wrap gap-2 md:justify-end">
            {windows.map((win, idx) => (
              <PowderBadge
                key={`${win.startIdx}-${win.endIdx}`}
                window={win}
                hours={future}
                t={tx}
                onClick={() => setOpenIdx(idx)}
                isExpanded={openIdx === idx}
              />
            ))}
          </div>
        )}
      </header>

      {/* Detail card for the currently-open window (if any) */}
      <AnimatePresence>
        {openIdx !== null && windows[openIdx] && (
          <PowderDetail
            window={windows[openIdx]}
            hours={future}
            t={tx}
            onClose={() => setOpenIdx(null)}
            thresholds={thresholds}
          />
        )}
      </AnimatePresence>

      {/* Horizontal scroll strip - native scroll-snap for mobile. Made
          keyboard-focusable so users can scroll with arrow keys. */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory hide-scrollbar focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
        role="list"
        tabIndex={0}
        aria-label={tx(
          "Hourly forecast - scroll horizontally for later hours",
          "時間別予報 - 横スクロールで後の時間を表示",
        )}
      >
        {future.map((h, i) => {
          const cellWin = cellWindowMap.get(i);
          return (
            <HourCell
              key={`${h.time}-${i}`}
              hour={h}
              powderGrade={cellWin?.win.grade ?? null}
              isFirst={i === 0}
            />
          );
        })}
      </div>

      {windows.length === 0 && future.some((h) => (h.snowfall ?? 0) > 0) && (
        <p className="mt-3 text-[11px] text-muted-foreground/80 text-center">
          {tx(
            "Snow forecast - but no sustained Powder Window in the next 48h.",
            "降雪はあるものの、今後48時間にパウダーウィンドウは見込まれません。",
          )}
        </p>
      )}
    </motion.section>
  );
}

function HourCell({
  hour,
  powderGrade,
  isFirst,
}: {
  hour: HourlyForecastT;
  powderGrade: PowderGrade | null;
  isFirst: boolean;
}) {
  const hourLabel = formatHourLabel(hour.time);
  const snow = Math.round((hour.snowfall ?? 0) * 10) / 10;
  const wind = Math.round(hour.windSpeed ?? 0);
  const temp = Math.round(hour.temperature ?? 0);
  const cellTone = powderGrade ? GRADE_STYLES[powderGrade].cell : "bg-white/60 border-border";
  const iconTone = powderGrade === "gold"
    ? "text-amber-700"
    : powderGrade === "silver"
      ? "text-slate-700"
      : powderGrade === "bronze"
        ? "text-orange-700"
        : "text-foreground/80";

  return (
    <div
      role="listitem"
      className={cn(
        "snap-start shrink-0 w-[58px] md:w-[64px] flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 transition-colors",
        cellTone,
      )}
      title={`${hourLabel} · ${temp}°C · ${snow > 0 ? `${snow}cm snow · ` : ""}${wind} km/h wind${powderGrade ? ` · ${powderGrade.toUpperCase()} powder window` : ""}`}
    >
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider tabular-nums",
          isFirst ? "text-primary" : "text-muted-foreground",
        )}
      >
        {isFirst ? "Now" : hourLabel}
      </p>
      <div className={iconTone}>
        <WeatherIcon code={hour.weatherCode} className="w-5 h-5" />
      </div>
      <p
        className="font-display text-base text-foreground tabular-nums leading-none"
        data-numeric
      >
        {temp}°
      </p>
      {snow > 0 ? (
        <div className={cn("flex items-center gap-0.5 text-[10px] font-semibold tabular-nums leading-none", iconTone)}>
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

/**
 * Compact powder window badge that appears above the hourly strip. Multiple
 * badges may stack - one per non-overlapping window. Click to open the
 * detail card. GOLD badges get a subtle shimmer overlay (Framer Motion).
 */
function PowderBadge({
  window,
  hours,
  t,
  onClick,
  isExpanded,
}: {
  window: PowderWindow;
  hours: HourlyForecastT[];
  t: Tx;
  onClick: () => void;
  isExpanded: boolean;
}) {
  const startTime = hours[window.startIdx]?.time;
  const endTime = hours[window.endIdx - 1]?.time;
  const startLabel = startTime ? formatHourLabel(startTime) : "";
  const endLabel = endTime ? nextHourLabel(endTime) : "";
  const style = GRADE_STYLES[window.grade];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isExpanded}
      aria-label={t(
        `${window.grade.toUpperCase()} Powder Window: ${startLabel}-${endLabel}, ${window.totalSnow}cm forecast`,
        `${style.labelJa}パウダーウィンドウ: ${startLabel}-${endLabel}, ${window.totalSnow}cm 予報`,
      )}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-left overflow-hidden transition-all hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        style.badge,
        isExpanded && "ring-2 ring-primary/40",
      )}
    >
      {window.grade === "gold" ? (
        <Award className="w-4 h-4 text-amber-700 flex-shrink-0" aria-hidden />
      ) : (
        <Sparkles className="w-4 h-4 flex-shrink-0 opacity-80" aria-hidden />
      )}
      <div className="leading-tight">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
          {style.label} · {t("Powder Window", "パウダーウィンドウ")}
        </p>
        <p className="text-xs font-semibold tabular-nums">
          {startLabel}–{endLabel} ·{" "}
          <span className="font-bold">
            {window.totalSnow}cm · {window.avgWind}km/h
          </span>
        </p>
      </div>
      {/* GOLD shimmer overlay - diagonal sheen looping every 2.4s */}
      {window.grade === "gold" && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
            backgroundSize: "250% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0%", "-100% 0%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      )}
    </button>
  );
}

/**
 * Expandable detail card explaining the metrics behind a powder window.
 * Mounted once per click; closes on the X button or when the user clicks
 * a different badge.
 */
function PowderDetail({
  window,
  hours,
  t,
  onClose,
  thresholds,
}: {
  window: PowderWindow;
  hours: HourlyForecastT[];
  t: Tx;
  onClose: () => void;
  thresholds?: PowderThresholds;
}) {
  const startTime = hours[window.startIdx]?.time;
  const endTime = hours[window.endIdx - 1]?.time;
  const startLabel = startTime ? formatHourLabel(startTime) : "";
  const endLabel = endTime ? nextHourLabel(endTime) : "";
  const style = GRADE_STYLES[window.grade];
  const isAU = thresholds?.minSnowfall === 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "mb-4 rounded-2xl border px-4 py-3 relative",
        style.badge,
      )}
      role="region"
      aria-label={t("Powder Window detail", "パウダーウィンドウ詳細")}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("Close", "閉じる")}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-black/5"
      >
        <X className="w-3.5 h-3.5" aria-hidden />
      </button>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
        {style.label} · {t("Powder Window", "パウダーウィンドウ")}
      </p>
      <p className="font-display text-base font-semibold mt-0.5">
        {startLabel}–{endLabel}
      </p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
        <DetailStat
          label={t("Total snow", "総降雪")}
          value={`${window.totalSnow}cm`}
        />
        <DetailStat
          label={t("Duration", "時間")}
          value={`${window.hours}h`}
        />
        <DetailStat
          label={t("Avg wind", "平均風速")}
          value={`${window.avgWind}km/h`}
        />
        <DetailStat
          label={t("Quality", "品質")}
          value={`${window.qualityScore}/100`}
        />
      </div>
      <p className="mt-3 text-[11px] opacity-80 leading-relaxed">
        {t(
          isAU
            ? "AU thresholds: snowfall ≥0.5cm/hr, wind <25km/h, ≥3 consecutive hours, ≤+2°C."
            : "Thresholds: snowfall ≥1cm/hr, wind <20km/h, ≥3 consecutive hours, ≤+2°C.",
          isAU
            ? "AU基準: 降雪0.5cm/時以上、風速25km/時未満、3時間以上連続、+2℃以下。"
            : "基準: 降雪1cm/時以上、風速20km/時未満、3時間以上連続、+2℃以下。",
        )}
      </p>
    </motion.div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="opacity-60 uppercase tracking-wider font-bold">{label}</p>
      <p className="font-display text-sm font-semibold mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}
