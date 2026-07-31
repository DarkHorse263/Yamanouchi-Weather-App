import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  dailyBestPowderWindows,
  type DailyPowderSummary,
  type HourlyForecast,
  type PowderThresholds,
} from "@/types/weather";
import { GRADE_STYLES } from "./HourlyForecast";
import { useUnits } from "@/components/auth/UserPrefsProvider";

type Units = ReturnType<typeof useUnits>;

type Tx = (en: string, ja: string) => string;

interface Props {
  hourly: HourlyForecast[];
  /** How many days to project. Default 7. */
  days?: number;
  thresholds?: PowderThresholds;
  /** Optional EN/JA translator. */
  t?: Tx;
  /** Section number prefix (e.g. "06") for the editorial byline. */
  sectionNumber?: string;
}

/**
 * 7-day Powder Forecast - glanceable trip-planner forecast.
 *
 * For each day in the next `days`, computes the best powder window (if any)
 * and renders a colour-coded pill: GOLD/SILVER/BRONZE for windows of that
 * grade, neutral grey if no window qualifies. Hover/tap surfaces the
 * window time + snow total.
 *
 * Data source: same hourly array used by HourlyForecast, which is already
 * Open-Meteo's resort-local naive ISO. Day grouping is done by the
 * YYYY-MM-DD prefix so we never apply a viewer-tz shift.
 */
export function PowderCalendar({
  hourly,
  days = 7,
  thresholds,
  t,
  sectionNumber = "",
}: Props) {
  const tx: Tx = t ?? ((en) => en);
  const u = useUnits();
  const summaries = useMemo(
    () => dailyBestPowderWindows(hourly, days, thresholds),
    [hourly, days, thresholds],
  );

  if (summaries.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.27 }}
      className="glass rounded-3xl p-5 md:p-8"
      aria-label={tx("Powder Forecast", "パウダー予報")}
    >
      <header className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="byline text-muted-foreground">
            {sectionNumber ? `${sectionNumber} · ` : ""}{tx("Plan ahead", "事前計画")}
          </p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
            <CalendarDays className="text-primary w-5 h-5" aria-hidden />
            {tx("Powder Forecast", "パウダー予報")}
          </h2>
        </div>
        <p className="byline text-muted-foreground/70 hidden md:block tabular-nums">
          {tx(
            `Best window each day · next ${summaries.length} days`,
            `各日のベストウィンドウ · 今後${summaries.length}日間`,
          )}
        </p>
      </header>

      <div
        role="list"
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2"
      >
        {summaries.map((s) => (
          <DayPill key={s.dateIso} summary={s} t={tx} u={u} />
        ))}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground/80">
        {tx(
          "Grade reflects the single best window each day (snow × inverse-wind × duration). Forecast confidence drops past 5 days.",
          "等級は各日のベストウィンドウ（降雪×風速逆数×継続時間）に基づきます。5日以降は予報精度が低下します。",
        )}
      </p>
    </motion.section>
  );
}

function DayPill({ summary, t, u }: { summary: DailyPowderSummary; t: Tx; u: Units }) {
  const { dateIso, best, daySnow } = summary;
  const date = new Date(dateIso + "T00:00:00Z"); // parse UTC to avoid TZ shift
  const dayOfWeek = date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  const dayOfMonth = date.getUTCDate();

  const tone = best ? GRADE_STYLES[best.grade].pill : "bg-white border-border text-muted-foreground";
  const labelText = best
    ? t(
        `${best.grade.toUpperCase()} window: ${u.snow(best.totalSnow)} over ${best.hours}h, ${best.avgWind}km/h wind`,
        `${best.grade.toUpperCase()}ウィンドウ: ${best.hours}時間で${u.snow(best.totalSnow)}、風速${best.avgWind}km/h`,
      )
    : daySnow > 0
      ? t(`${u.snow(daySnow)} forecast - no sustained window`, `${u.snow(daySnow)}予報 - 持続的なウィンドウなし`)
      : t("No snow forecast", "降雪予報なし");

  return (
    <div
      role="listitem"
      title={labelText}
      aria-label={`${dayOfWeek} ${dayOfMonth}: ${labelText}`}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 transition-all",
        tone,
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{dayOfWeek}</p>
      <p className="font-display text-lg font-semibold tabular-nums leading-none" data-numeric>
        {dayOfMonth}
      </p>
      {best ? (
        <p className="text-[10px] font-semibold tabular-nums leading-tight text-center mt-1">
          {u.snowVal(best.totalSnow)}{u.snowUnit}
        </p>
      ) : daySnow > 0 ? (
        <p className="text-[10px] tabular-nums leading-tight text-center mt-1 inline-flex items-center gap-0.5 opacity-70">
          <Snowflake className="w-2.5 h-2.5" aria-hidden /> {u.snowVal(daySnow)}{u.snowUnit}
        </p>
      ) : (
        <p className="text-[10px] opacity-50 mt-1">-</p>
      )}
    </div>
  );
}
