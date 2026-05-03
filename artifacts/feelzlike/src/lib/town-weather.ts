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

export interface TownWeatherResponse {
  coords: { lat: number; lng: number };
  timezone: string;
  utcOffsetSeconds: number;
  current: TownWeatherCurrent;
  hourly: TownWeatherHourly[];
  daily: TownWeatherDaily[];
}

export function useTownWeather(lat: number | undefined, lng: number | undefined) {
  return useQuery<TownWeatherResponse>({
    queryKey: ["town-weather", lat, lng],
    enabled: lat !== undefined && lng !== undefined,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch(`/api/town-weather?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error(`town-weather ${res.status}`);
      return (await res.json()) as TownWeatherResponse;
    },
  });
}

export function uvBand(uv: number | null): { label: string; tone: "ok" | "caution" | "warn" } {
  if (uv == null) return { label: "—", tone: "ok" };
  if (uv < 3) return { label: "Low", tone: "ok" };
  if (uv < 6) return { label: "Moderate", tone: "ok" };
  if (uv < 8) return { label: "High", tone: "caution" };
  if (uv < 11) return { label: "Very High", tone: "warn" };
  return { label: "Extreme", tone: "warn" };
}

export function windBand(kph: number | null): { label: string; tone: "ok" | "caution" | "warn" } {
  if (kph == null) return { label: "—", tone: "ok" };
  if (kph < 20) return { label: "Light", tone: "ok" };
  if (kph < 40) return { label: "Moderate", tone: "ok" };
  if (kph < 60) return { label: "Strong", tone: "caution" };
  return { label: "Gale", tone: "warn" };
}

export function visibilityKm(metres: number | null): string {
  if (metres == null) return "—";
  if (metres >= 10000) return "10+ km";
  return `${(metres / 1000).toFixed(1)} km`;
}
