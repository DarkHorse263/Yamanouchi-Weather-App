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
import { tripForecastQuery, type PlannerForecastData } from "./tripForecastData";
export type { PlannerForecastDay } from "./tripForecastDay";

/** Per-mountain fetch state · loading / error is honest, ok carries the days. */
export type PlannerForecastEntry =
  | { status: "loading" }
  | { status: "error" }
  | ({ status: "ok" } & PlannerForecastData);

/**
 * Fetch the ensemble forecast for every saved mountain and return a map keyed
 * by the mountain's composite key · `forecasts[mountainKey(...)]`.
 */
export function useTripForecasts(
  mountains: CatalogMountain[],
): Record<string, PlannerForecastEntry> {
  const results = useQueries({
    queries: mountains.map((m) => {
      const elev = m.elevationM != null
        ? midMountainElevation(m.elevationM, m.elevationBands?.midM)
        : undefined;
      const qs = elev != null ? `?elevationM=${elev}` : "";
      const url = `${import.meta.env.BASE_URL}api/forecast/${m.id}${qs}`;
      return {
        queryKey: ["trip-forecast", "feelzlike-v2", m.id, elev ?? null] as const,
        ...tripForecastQuery(url),
      };
    }),
  });

  const out: Record<string, PlannerForecastEntry> = {};
  mountains.forEach((m, i) => {
    const key = mountainKey(m.regionId, m.id);
    const r = results[i];
    if (!r || r.isPending) {
      out[key] = { status: "loading" };
    } else if (r.isError || !r.data?.days.length) {
      out[key] = { status: "error" };
    } else {
      out[key] = { status: "ok", ...r.data };
    }
  });
  return out;
}
