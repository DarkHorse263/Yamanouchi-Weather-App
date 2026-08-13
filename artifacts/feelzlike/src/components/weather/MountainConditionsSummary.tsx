import { useMemo } from "react";
import {
  buildMountainSummary,
  type MountainSummaryInput,
} from "@/lib/mountainSummary";
import { useUnits } from "@/components/auth/UserPrefsProvider";

/**
 * "up there today" · short generated conditions paragraph opening every
 * mountain/resort page (OpenSnow-style written summary, machine-derived).
 * Supersedes the plain DayNarrative block on MOUNTAIN pages — it embeds
 * the same day narrative as its first clause, then adds the headline snow
 * outlook, wind-hold read and base depth. Renders nothing when there isn't
 * enough data (fail-soft, never blocks the page).
 */
export default function MountainConditionsSummary({
  lang = "en",
  ...input
}: Omit<MountainSummaryInput, "fmt"> & { lang?: "en" | "ja" }) {
  const u = useUnits();
  const summary = useMemo(
    () =>
      buildMountainSummary({
        ...input,
        fmt: {
          snow: (cm, dp) => u.snowVal(cm, dp) ?? cm,
          snowUnit: u.snowUnit,
          wind: (kmh) => u.wind(kmh) ?? kmh,
          windUnit: u.windUnit,
          elev: (m) => u.elev(m) ?? m,
          elevUnit: u.elevUnit,
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      input.hourly,
      input.current,
      input.utcOffsetSeconds,
      input.snowNext24Cm,
      input.snowfallOutlookElevationM,
      input.snowfallOutlookLevel,
      input.reportedBaseCm,
      input.reportedBaseMinCm,
      input.reportedBaseSource,
      input.trustedModelBaseCm,
      u,
    ],
  );
  if (!summary) return null;
  return (
    <div
      className="mt-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 max-w-3xl"
      data-testid="text-mountain-summary"
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
        {lang === "ja" ? "今日の山の様子" : "up there today"}
      </p>
      <p className="mt-0.5 text-[15px] leading-snug text-sky-900">
        {lang === "ja" ? summary.ja : summary.en}
      </p>
    </div>
  );
}
