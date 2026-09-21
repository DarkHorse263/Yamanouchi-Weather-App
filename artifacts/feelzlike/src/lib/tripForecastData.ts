import { toPlannerDay, type ForecastApiDay, type PlannerForecastDay } from "./tripForecastDay";

export interface PlannerForecastData {
  days: PlannerForecastDay[];
  generatedAt: string | null;
  timezone: string | null;
  _stale: { ageSeconds: number } | null;
}

interface ForecastApiResponse {
  days?: ForecastApiDay[];
  generatedAt?: string;
  timezone?: string;
  _stale?: { ageSeconds: number } | null;
}

export function tripForecastQuery(url: string) {
  return {
    staleTime: (query: { state: { data?: PlannerForecastData } }) =>
      query.state.data?._stale ? 60_000 : 30 * 60_000,
    refetchInterval: (query: { state: { data?: PlannerForecastData } }) =>
      query.state.data?._stale ? 60_000 : false as const,
    queryFn: async (): Promise<PlannerForecastData> => {
      const res = await fetch(url, { cache: "reload" });
      if (!res.ok) throw new Error(`forecast ${res.status}`);
      const json = await res.json() as ForecastApiResponse;
      return {
        days: (json.days ?? []).map(toPlannerDay),
        generatedAt: typeof json.generatedAt === "string" && Number.isFinite(Date.parse(json.generatedAt))
          ? json.generatedAt : null,
        timezone: json.timezone ?? null,
        _stale: json._stale ?? null,
      };
    },
  };
}

/** Never substitute the browser timezone or fetch-completion time. */
export function plannerForecastAsOf(data: PlannerForecastData): string | null {
  if (!data.generatedAt || !data.timezone) return null;
  try {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: data.timezone,
      day: "numeric", month: "short", year: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short",
    }).format(new Date(data.generatedAt));
  } catch {
    return null;
  }
}