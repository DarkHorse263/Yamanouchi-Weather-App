import { Snowflake } from "lucide-react";
import type { PlannerForecastDay } from "../../lib/tripForecastDay";
import type { useUnits } from "../auth/UserPrefsProvider";

type Units = Pick<ReturnType<typeof useUnits>, "temp" | "tempUnit" | "snowVal" | "snowUnit">;

/** The API date is already mountain-local. UTC formatting avoids browser DST shifts. */
export function formatPlannerDate(date: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { ...options, timeZone: "UTC" }).toLowerCase();
}

export function DayCell({ day, u }: { day: PlannerForecastDay; u: Units }) {
  const snow = Math.round(day.snowMean);
  const hasFeelzlike = day.feelsLikeMaxMean !== null && day.feelsLikeMinMean !== null;
  const temp = (value: number | null) => `${u.temp(value)}${u.tempUnit}`;
  const coverage = `feelzlike uses ${day.feelsLikeSources.length} of ${day.sourcesCount} forecast sources`;
  return (
    <div
      role="group"
      aria-label={formatPlannerDate(day.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      data-testid={`trip-day-${day.date}`}
      className="rounded-xl bg-secondary/40 border border-border/50 px-1.5 py-2 flex flex-col items-center text-center"
    >
      <span className="text-[10px] font-bold uppercase text-foreground leading-none">
        {formatPlannerDate(day.date, { weekday: "short" })}
      </span>
      <span className="text-[9px] text-muted-foreground mt-0.5 leading-none">
        {formatPlannerDate(day.date, { day: "numeric" })}
      </span>
      <span
        aria-label={`fresh snow ${u.snowVal(snow)} ${u.snowUnit}`}
        className={`mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold leading-none ${snow > 0 ? "text-snow-accent" : "text-slate-700"}`}
      >
        <Snowflake aria-hidden="true" className="w-2.5 h-2.5" />
        {u.snowVal(snow)}{u.snowUnit}
      </span>
      <div className="text-[11px] text-foreground mt-2 leading-snug">
        <span className="block font-bold">air temp</span>
        <span className="block" aria-label={`actual temperature high ${temp(day.tempMaxMean)}`}>hi {temp(day.tempMaxMean)}</span>
        <span className="block" aria-label={`actual temperature low ${temp(day.tempMinMean)}`}>lo {temp(day.tempMinMean)}</span>
      </div>
      <div className="text-[11px] text-sky-800 mt-2 leading-snug">
        <span className="block font-bold">feelzlike</span>
        {hasFeelzlike ? (
          <>
            <span className="block" aria-label={`feelzlike high ${temp(day.feelsLikeMaxMean)}`}>hi {temp(day.feelsLikeMaxMean)}</span>
            <span className="block" aria-label={`feelzlike low ${temp(day.feelsLikeMinMean)}`}>lo {temp(day.feelsLikeMinMean)}</span>
          </>
        ) : (
          <span className="block text-[10px] text-slate-700" aria-label="feelzlike unavailable">unavailable</span>
        )}
      </div>
      <span
        className="text-[9px] text-slate-700 mt-1"
        aria-label={`${coverage}${hasFeelzlike ? `: ${day.feelsLikeSources.join(", ")}` : ""}`}
        title={hasFeelzlike ? day.feelsLikeSources.join(", ") : "no comparable apparent-temperature readings"}
      >
        {day.feelsLikeSources.length}/{day.sourcesCount} sources
      </span>
    </div>
  );
}