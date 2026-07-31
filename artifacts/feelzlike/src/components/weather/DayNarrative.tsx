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
    <p
      className="mt-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-[15px] leading-snug text-sky-900"
      data-testid="text-day-narrative"
    >
      {lang === "ja" ? narrative.ja : narrative.en}
    </p>
  );
}
