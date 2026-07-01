/**
 * Trip planner · ensemble-per-mountain data hook.
 *
 * Fans out one `/api/forecast/:id` request per saved mountain and maps each
 * response onto a small day contract the comparison snapshot renders. Each
 * mountain fetches at its own mid-mountain elevation so the snow numbers line
 * up with the elevation-adjusted outlook the detail pages already show.
 *
 * Fail-soft is per mountain: one resort 404-ing or timing out becomes a single
 * `error` entry · it never blanks the whole planner or fakes a forecast.
 */
import { useQueries } from "@tanstack/react-query";
import { midMountainElevation } from "@/lib/elevation";
import { mountainKey, type CatalogMountain } from "@/lib/tripPlanner";

/** One day of the elevation-adjusted ensemble outlook, as the snapshot reads it. */
export interface PlannerForecastDay {
  date: string;
  tempMaxMean: number;
  tempMinMean: number;
  precipMean: number;
  snowMean: number;
  snowSpread: number;
  sourcesCount: number;
  confidence: "high" | "medium" | "low";
}

/** Per-mountain fetch state · loading / error is honest, ok carries the days. */
export type PlannerForecastEntry =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; days: PlannerForecastDay[] };

/** The subset of the `/forecast/:id` ensemble payload the planner reads. */
interface ForecastApiDay {
  date: string;
  tempMaxMean: number;
  tempMinMean: number;
  precipMean: number;
  snowMean: number;
  snowSpread: number;
  sourcesCount: number;
  confidence: "high" | "medium" | "low";
}

interface ForecastApiResponse {
  days?: ForecastApiDay[];
  forecastElevationM?: number;
  generatedAt?: string;
}

function toPlannerDay(d: ForecastApiDay): PlannerForecastDay {
  return {
    date: d.date,
    tempMaxMean: d.tempMaxMean,
    tempMinMean: d.tempMinMean,
    precipMean: d.precipMean,
    snowMean: d.snowMean,
    snowSpread: d.snowSpread,
    sourcesCount: d.sourcesCount,
    confidence: d.confidence,
  };
}

/**
 * Fetch the ensemble forecast for every saved mountain and return a map keyed
 * by the mountain's composite key · `forecasts[mountainKey(...)]`.
 */
export function useTripForecasts(
  mountains: CatalogMountain[],
): Record<string, PlannerForecastEntry> {
  const results = useQueries({
    queries: mountains.map((m) => {
      const elev = m.elevationM != null ? midMountainElevation(m.elevationM) : undefined;
      const qs = elev != null ? `?elevationM=${elev}` : "";
      const url = `${import.meta.env.BASE_URL}api/forecast/${m.id}${qs}`;
      return {
        queryKey: ["trip-forecast", m.id, elev ?? null] as const,
        // Ensemble is cached ~30 min server-side · match it so navigating in and
        // out of the planner doesn't refetch every mountain.
        staleTime: 30 * 60 * 1000,
        queryFn: async (): Promise<PlannerForecastDay[]> => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`forecast ${res.status}`);
          const json = (await res.json()) as ForecastApiResponse;
          return (json.days ?? []).map(toPlannerDay);
        },
      };
    }),
  });

  const out: Record<string, PlannerForecastEntry> = {};
  mountains.forEach((m, i) => {
    const key = mountainKey(m.regionId, m.id);
    const r = results[i];
    if (!r || r.isPending) {
      out[key] = { status: "loading" };
    } else if (r.isError) {
      out[key] = { status: "error" };
    } else {
      out[key] = { status: "ok", days: r.data ?? [] };
    }
  });
  return out;
}
