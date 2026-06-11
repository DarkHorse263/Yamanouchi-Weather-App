import { useQuery } from "@tanstack/react-query";

export interface TownWeatherCurrent {
  time: string | null;
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  isDay: boolean;
  precipitation: number | null;
  rain: number | null;
  showers: number | null;
  snowfall: number | null;
  weatherCode: number | null;
  weatherDescription: string;
  cloudCover: number | null;
  pressure: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  windDirectionCompass: string | null;
  windGust: number | null;
  visibility: number | null;
  uvIndex: number | null;
  dewpoint: number | null;
}

export interface TownWeatherHourly {
  time: string;
  temperature: number | null;
  feelsLike: number | null;
  precipitationProbability: number | null;
  precipitation: number | null;
  snowfall: number | null;
  snowDepth: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  uvIndex: number | null;
}

export interface TownWeatherDaily {
  date: string;
  weatherCode: number | null;
  weatherDescription: string;
  tempMax: number | null;
  tempMin: number | null;
  feelsLikeMax: number | null;
  feelsLikeMin: number | null;
  sunrise: string | null;
  sunset: string | null;
  uvIndexMax: number | null;
  precipitationSum: number | null;
  rainSum: number | null;
  snowfallSum: number | null;
  precipitationProbabilityMax: number | null;
  windSpeedMax: number | null;
  windGustMax: number | null;
}

export interface TownWeatherStaleMeta {
  /** Approx age of the cached payload, in seconds. Parsed from `age=Xs`. */
  ageSeconds: number | null;
  /** "upstream-error" | "upstream-timeout" | other backend reason string. */
  reason: string | null;
  /** Upstream HTTP status that triggered the fallback (e.g. 502, 0 on net error). */
  upstreamStatus: number | null;
}

export interface TownWeatherResponse {
  coords: { lat: number; lng: number };
  timezone: string;
  utcOffsetSeconds: number;
  current: TownWeatherCurrent;
  hourly: TownWeatherHourly[];
  daily: TownWeatherDaily[];
  /**
   * Populated when the backend served this payload from the stale-on-error
   * cache because the upstream weather API failed. Shape parsed out of the
   * `X-Feelzlike-Stale` response header in the queryFn below. UI surfaces
   * a small "served from cache" badge so users know data may be slightly old.
   */
  _stale?: TownWeatherStaleMeta | null;
}

/**
 * Parse the X-Feelzlike-Stale header. Format set by the API:
 *   `1; reason=<reason>; age=<n>s; upstream-status=<status>`
 */
function parseStaleHeader(value: string | null): TownWeatherStaleMeta | null {
  if (!value) return null;
  const parts = value.split(";").map((p) => p.trim());
  if (parts[0] !== "1") return null;
  const meta: TownWeatherStaleMeta = { ageSeconds: null, reason: null, upstreamStatus: null };
  for (const p of parts.slice(1)) {
    const [k, v] = p.split("=");
    if (!k || v === undefined) continue;
    if (k === "reason") meta.reason = v;
    else if (k === "age") {
      const n = parseInt(v.replace(/s$/, ""), 10);
      if (!Number.isNaN(n)) meta.ageSeconds = n;
    } else if (k === "upstream-status") {
      const n = parseInt(v, 10);
      if (!Number.isNaN(n)) meta.upstreamStatus = n;
    }
  }
  return meta;
}

export function useTownWeather(lat: number | undefined, lng: number | undefined) {
  return useQuery<TownWeatherResponse>({
    queryKey: ["town-weather", lat, lng],
    enabled: lat !== undefined && lng !== undefined,
    staleTime: 5 * 60 * 1000,
    // Open-Meteo (free tier) occasionally blips or runs slow. The server already
    // serves stale-on-error for known towns, but uncached visitor coords get a
    // real 502/503. Cap retries at 1 so a genuine outage surfaces an error in
    // bounded time (~16s worst case) instead of react-query's default 3 retries
    // spinning for ~40s · which reads as a frozen "loading" hang.
    retry: 1,
    queryFn: async () => {
      const res = await fetch(`/api/town-weather?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error(`town-weather ${res.status}`);
      const stale = parseStaleHeader(res.headers.get("X-Feelzlike-Stale"));
      const body = (await res.json()) as TownWeatherResponse;
      return { ...body, _stale: stale };
    },
  });
}

export function uvBand(uv: number | null): { label: string; tone: "ok" | "caution" | "warn" } {
  if (uv == null) return { label: "-", tone: "ok" };
  if (uv < 3) return { label: "Low", tone: "ok" };
  if (uv < 6) return { label: "Moderate", tone: "ok" };
  if (uv < 8) return { label: "High", tone: "caution" };
  if (uv < 11) return { label: "Very High", tone: "warn" };
  return { label: "Extreme", tone: "warn" };
}

export function windBand(kph: number | null): { label: string; tone: "ok" | "caution" | "warn" } {
  if (kph == null) return { label: "-", tone: "ok" };
  if (kph < 20) return { label: "Light", tone: "ok" };
  if (kph < 40) return { label: "Moderate", tone: "ok" };
  if (kph < 60) return { label: "Strong", tone: "caution" };
  return { label: "Gale", tone: "warn" };
}

export function visibilityKm(metres: number | null): string {
  if (metres == null) return "-";
  if (metres >= 10000) return "10+ km";
  return `${(metres / 1000).toFixed(1)} km`;
}
