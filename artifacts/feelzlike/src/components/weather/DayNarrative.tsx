import { useMemo } from "react";
import { buildDayNarrative, type DayNarrativeInput } from "@/lib/dayNarrative";

/**
 * one-line plain-english day summary shown at the top of every weather page ·
 * answers "should i go outside, what should i wear" before any numbers.
 * renders nothing when there isn't enough data (fail-soft).
 */
export default function DayNarrative({
  hourly,
  current,
  utcOffsetSeconds,
  isMountain,
  lang = "en",
}: DayNarrativeInput & { lang?: "en" | "ja" }) {
  const narrative = useMemo(
    () => buildDayNarrative({ hourly, current, utcOffsetSeconds, isMountain }),
    [hourly, current, utcOffsetSeconds, isMountain],
  );
  if (!narrative) return null;
  return (
    <div
      className="mt-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3"
      data-testid="text-day-narrative"
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
        {lang === "ja" ? "今日の予報" : "today's forecast"}
      </p>
      <p className="mt-0.5 text-[15px] leading-snug text-sky-900">
        {lang === "ja" ? narrative.ja : narrative.en}
      </p>
    </div>
  );
}
