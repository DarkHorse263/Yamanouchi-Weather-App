import { useMemo } from "react";
import { ArrowDown, ArrowUp, CloudSnow, Mountain, Snowflake, Wind } from "lucide-react";
import {
  getGetElevationForecastQueryKey,
  useGetElevationForecast,
} from "@workspace/api-client-react";
import { useLanguage } from "@workspace/feelzlike-shell";

interface Props {
  lat: number | undefined;
  lng: number | undefined;
  summitElevationM: number | undefined;
  name?: string;
}

/**
 * Elevation-banded 7-day forecast (upper / mid / lower) sourced from
 * Open-Meteo. Renders a 3xN grid of snow + temp readings so skiers can
 * see how conditions differ between the summit and the village base.
 *
 * The API server makes three Open-Meteo calls (one per elevation band)
 * so the temperature lapse rate is applied per band. Self-hides when
 * coordinates or summit elevation are missing, or when upstream returns
 * no data · this is an additive layer over the existing single-elevation
 * readings, not a replacement.
 */
export function ElevationBands({ lat, lng, summitElevationM, name }: Props) {
  const { t } = useLanguage();
  const enabled =
    typeof lat === "number" &&
    typeof lng === "number" &&
    typeof summitElevationM === "number" &&
    summitElevationM > 0;

  const params = {
    lat: lat ?? 0,
    lng: lng ?? 0,
    summitElevationM: summitElevationM ?? 0,
    ...(name ? { name } : {}),
  };
  const q = useGetElevationForecast(params, {
    query: {
      enabled,
      queryKey: getGetElevationForecastQueryKey(params),
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
          {t("source · open-meteo", "出典 · open-meteo")}
        </p>
      </div>

      {/* MOBILE · stacked day cards (sm- only). The 5-column table below
          gets too cramped at 390px wide, so on mobile we render one card
          per day with the 3 elevation bands stacked vertically inside.
          Easier to scan one day at a time. */}
      <div className="mt-4 space-y-2 md:hidden">
        {days.slice(0, 7).map((d, i) => (
          <DayCard
            key={d.date + i}
            day={d}
            idx={i}
            upperM={upperM}
            midM={midM}
            lowerM={lowerM}
            t={t}
          />
        ))}
      </div>

      {/* TABLET / DESKTOP · original 5-column table. */}
      <div className="mt-4 overflow-x-auto -mx-2 hidden md:block">
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

type DayPayload = {
  date: string;
  weatherDescription?: string;
  windMaxKmh?: number | null;
  freezingLevelM?: number | null;
  bands: {
    upper: { tempMaxC: number | null; tempMinC: number | null; snowfallCm: number | null };
    mid: { tempMaxC: number | null; tempMinC: number | null; snowfallCm: number | null };
    lower: { tempMaxC: number | null; tempMinC: number | null; snowfallCm: number | null };
  };
};

function DayCard({
  day,
  idx,
  upperM,
  midM,
  lowerM,
  t,
}: {
  day: DayPayload;
  idx: number;
  upperM: number | null;
  midM: number | null;
  lowerM: number | null;
  t: (en: string, ja: string) => string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white p-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display font-semibold text-foreground text-sm">
            {fmtDay(day.date, idx)}
          </p>
          {day.weatherDescription && (
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">
              {day.weatherDescription}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-display font-semibold text-foreground text-sm">
            <span className="inline-flex items-center gap-1">
              <Wind className="w-3 h-3 text-muted-foreground/70" />
              {day.windMaxKmh != null ? `${Math.round(day.windMaxKmh)}` : "-"}
              <span className="text-[11px] text-muted-foreground/70 font-normal">km/h</span>
            </span>
          </p>
          {day.freezingLevelM != null && (
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              {t("frz", "凍結")} · {Math.round(day.freezingLevelM)}m
            </p>
          )}
        </div>
      </div>
      <div className="mt-2.5 divide-y divide-border/50 border-t border-border/50">
        <BandRow
          label={t("upper", "山頂")}
          elevationM={upperM}
          band={day.bands.upper}
          tone="text-sky-700"
        />
        <BandRow
          label={t("mid", "中腹")}
          elevationM={midM}
          band={day.bands.mid}
          tone="text-sky-600"
        />
        <BandRow
          label={t("base", "山麓")}
          elevationM={lowerM}
          band={day.bands.lower}
          tone="text-sky-500"
        />
      </div>
    </div>
  );
}

function BandRow({
  label,
  elevationM,
  band,
  tone,
}: {
  label: string;
  elevationM: number | null;
  band: { tempMaxC: number | null; tempMinC: number | null; snowfallCm: number | null };
  tone: string;
}) {
  const snow = band.snowfallCm;
  const hasSnow = snow != null && snow > 0;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className={`inline-flex items-center gap-1.5 ${tone} min-w-0`}>
        <Mountain className="w-3 h-3 shrink-0" />
        <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
        {elevationM != null && (
          <span className="text-[10px] text-muted-foreground/60 normal-case tracking-normal">
            {elevationM}m
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-display font-semibold text-foreground text-sm tabular-nums">
          <span className="inline-flex items-center gap-0.5">
            <ArrowUp className="w-2.5 h-2.5 text-muted-foreground/60" />
            {band.tempMaxC != null ? `${Math.round(band.tempMaxC)}°` : "-"}
          </span>
          <span className="mx-1 text-muted-foreground/40">·</span>
          <span className="inline-flex items-center gap-0.5">
            <ArrowDown className="w-2.5 h-2.5 text-muted-foreground/60" />
            {band.tempMinC != null ? `${Math.round(band.tempMinC)}°` : "-"}
          </span>
        </span>
        <span
          className={`text-[11px] inline-flex items-center gap-1 tabular-nums w-[58px] justify-end ${
            hasSnow ? "text-sky-700 font-medium" : "text-muted-foreground/60"
          }`}
        >
          {hasSnow ? <Snowflake className="w-2.5 h-2.5" /> : <CloudSnow className="w-2.5 h-2.5" />}
          {snow != null ? `${snow.toFixed(1)} cm` : "·"}
        </span>
      </div>
    </div>
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
