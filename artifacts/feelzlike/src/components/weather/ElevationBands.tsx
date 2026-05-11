import { useMemo } from "react";
import { ArrowDown, ArrowUp, CloudSnow, Mountain, Snowflake, Wind } from "lucide-react";
import {
  getGetElevationForecastQueryKey,
  useGetElevationForecast,
} from "@workspace/api-client-react";
import { useLanguage } from "@workspace/feelzlike-shell";

interface Props {
  weatherUnlockedId: number | undefined;
}

/**
 * Elevation-banded 7-day forecast (upper / mid / lower lift) sourced from
 * Weather Unlocked. Renders a 3xN grid of snow + temp readings so skiers
 * can see how conditions differ between the summit and the village base.
 *
 * Self-hides when `weatherUnlockedId` is undefined (mountain not mapped),
 * when the integration is unconfigured (no API keys), or when upstream
 * returns no data Â· the component is intentionally an additive layer
 * over the existing Open-Meteo readings, not a replacement.
 */
export function ElevationBands({ weatherUnlockedId }: Props) {
  const { t } = useLanguage();
  const enabled = typeof weatherUnlockedId === "number" && weatherUnlockedId > 0;

  const safeId = weatherUnlockedId ?? 0;
  const q = useGetElevationForecast(safeId, {
    query: {
      enabled,
      queryKey: getGetElevationForecastQueryKey(safeId),
    },
  });

  const days = useMemo(() => q.data?.forecast?.days ?? [], [q.data]);
  const upperM = q.data?.forecast?.upperLiftElevationM ?? null;
  const midM = q.data?.forecast?.midLiftElevationM ?? null;
  const lowerM = q.data?.forecast?.lowerLiftElevationM ?? null;

  if (!enabled) return null;
  if (q.isLoading) return null;
  if (!q.data?.configured) return null;
  if (days.length === 0) return null;

  return (
    <section className="mt-4 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <p className="byline text-muted-foreground/70">
          {t("elevation forecast", "標高別予報")}
        </p>
        <p className="text-[11px] text-muted-foreground/60">
          {t("source · weather unlocked", "出典 · weather unlocked")}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto -mx-2">
        <table className="min-w-full text-sm border-separate border-spacing-0 px-2">
          <thead>
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium pb-2 pr-3">
                {t("day", "日")}
              </th>
              <BandHead
                label={t("upper", "山頂")}
                elevationM={upperM}
                tone="text-sky-700"
              />
              <BandHead
                label={t("mid", "中腹")}
                elevationM={midM}
                tone="text-sky-600"
              />
              <BandHead
                label={t("base", "山麓")}
                elevationM={lowerM}
                tone="text-sky-500"
              />
              <th className="text-right text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium pb-2 pl-3">
                <span className="inline-flex items-center gap-1">
                  <Wind className="w-3 h-3" /> {t("wind", "風")}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {days.slice(0, 7).map((d, i) => (
              <tr
                key={d.date + i}
                className="border-t border-border/60 align-top"
              >
                <td className="py-3 pr-3 border-t border-border/60">
                  <p className="font-display font-semibold text-foreground text-sm">
                    {fmtDay(d.date, i)}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-1">
                    {d.weatherDescription || "·"}
                  </p>
                </td>
                <BandCell band={d.bands.upper} />
                <BandCell band={d.bands.mid} />
                <BandCell band={d.bands.lower} />
                <td className="py-3 pl-3 border-t border-border/60 text-right">
                  <p className="font-display font-semibold text-foreground text-sm">
                    {d.windMaxKmh != null ? `${Math.round(d.windMaxKmh)}` : "-"}
                    <span className="text-[11px] text-muted-foreground/70 ml-0.5">
                      km/h
                    </span>
                  </p>
                  {d.freezingLevelM != null && (
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      {t("frz", "凍結")} · {Math.round(d.freezingLevelM)}m
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BandHead({
  label,
  elevationM,
  tone,
}: {
  label: string;
  elevationM: number | null;
  tone: string;
}) {
  return (
    <th className="text-center text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium pb-2 px-2">
      <span className={`inline-flex items-center gap-1 ${tone}`}>
        <Mountain className="w-3 h-3" /> {label}
      </span>
      {elevationM != null && (
        <span className="block text-[10px] text-muted-foreground/50 normal-case tracking-normal mt-0.5">
          {elevationM}m
        </span>
      )}
    </th>
  );
}

function BandCell({
  band,
}: {
  band: { tempMaxC: number | null; tempMinC: number | null; snowfallCm: number | null };
}) {
  const snow = band.snowfallCm;
  const hasSnow = snow != null && snow > 0;
  return (
    <td className="py-3 px-2 border-t border-border/60 text-center">
      <p className="font-display font-semibold text-foreground text-sm leading-tight">
        <span className="inline-flex items-center gap-0.5">
          <ArrowUp className="w-2.5 h-2.5 text-muted-foreground/60" />
          {band.tempMaxC != null ? `${Math.round(band.tempMaxC)}°` : "-"}
        </span>
        <span className="mx-1 text-muted-foreground/40">·</span>
        <span className="inline-flex items-center gap-0.5">
          <ArrowDown className="w-2.5 h-2.5 text-muted-foreground/60" />
          {band.tempMinC != null ? `${Math.round(band.tempMinC)}°` : "-"}
        </span>
      </p>
      <p
        className={`text-[11px] mt-1 inline-flex items-center gap-1 ${
          hasSnow ? "text-sky-700 font-medium" : "text-muted-foreground/60"
        }`}
      >
        {hasSnow ? <Snowflake className="w-2.5 h-2.5" /> : <CloudSnow className="w-2.5 h-2.5" />}
        {snow != null ? `${snow.toFixed(1)} cm` : "·"}
      </p>
    </td>
  );
}

function fmtDay(iso: string, idx: number): string {
  if (idx === 0) return "today";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString(undefined, { weekday: "short", day: "numeric" })
    .toLowerCase();
}

export default ElevationBands;
