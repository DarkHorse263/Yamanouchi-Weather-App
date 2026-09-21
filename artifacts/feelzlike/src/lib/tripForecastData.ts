import { toPlannerDay, type ForecastApiDay, type PlannerForecastDay } from "./tripForecastDay";

export interface PlannerForecastData {
  days: PlannerForecastDay[];
  generatedAt: string | null;
  timezone: string | null;
  _stale: { ageSeconds: number } | null;
}

/** Exclude elapsed mountain-local dates before capping the snapshot. Unknown
 * timezones cannot safely support a "next local days" claim. */
export function plannerSnapshotDays(
  data: PlannerForecastData,
  limit: number,
  now = new Date(),
): PlannerForecastDay[] {
  if (!data.timezone) return [];
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: data.timezone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now);
    const part = (type: string) => parts.find((p) => p.type === type)!.value;
    const today = `${part("year")}-${part("month")}-${part("day")}`;
    return data.days.filter((day) => day.date >= today).slice(0, limit);
  } catch {
    return [];
  }
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