/**
 * Weather Service — fetches live data from Open-Meteo using the JMA Seamless model.
 * Open-Meteo is free, requires no API key, and uses Japan Meteorological Agency (JMA)
 * data as its primary model for Japan coordinates.
 *
 * Sources:
 *   - JMA (Japan Meteorological Agency) — government official model, via Open-Meteo JMA Seamless
 *   - Japan Weather Association (JWA / tenki.jp) — same underlying JMA data refined
 *   - Weathernews Inc. — hyper-local; their proprietary data is not publicly accessible via API
 *
 * Data is cached for 10 minutes. Each refresh fetches one request per region (3 total).
 */

const CACHE_TTL_MS = 10 * 60 * 1000;

export interface RegionWeather {
  region: string;
  temp: number;
  wind: number;
  snow24h: number;
  snowTomorrow: number;
  weatherCode: number;
  fetchedAt: string;
  source: string;
}

interface CacheEntry {
  data: RegionWeather[];
  expiresAt: number;
}

let cache: CacheEntry | null = null;

const REGION_COORDS = [
  {
    region: "Shiga Kogen",
    lat: 36.79,
    lon: 138.51,
    elevation: 1800,
    label: "Shiga Kogen Primary (1800m)",
  },
  {
    region: "Ryuoo",
    lat: 36.678,
    lon: 138.27,
    elevation: 1100,
    label: "Ryuoo (1100m)",
  },
  {
    region: "Yomase",
    lat: 36.72,
    lon: 138.35,
    elevation: 900,
    label: "Yomase (900m)",
  },
];

async function fetchRegionWeather(coord: (typeof REGION_COORDS)[0]): Promise<RegionWeather> {
  const params = new URLSearchParams({
    latitude: String(coord.lat),
    longitude: String(coord.lon),
    elevation: String(coord.elevation),
    current: "temperature_2m,wind_speed_10m,snowfall,weather_code",
    hourly: "snowfall",
    daily: "snowfall_sum",
    timezone: "Asia/Tokyo",
    forecast_days: "2",
    past_hours: "24",
    models: "jma_seamless",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status} for ${coord.label}`);

  const d = await res.json();
  const c = d.current;

  const hourlySnowfall: number[] = d.hourly?.snowfall ?? [];
  const currentTimeStr: string = c.time;
  const hourlyTimes: string[] = d.hourly?.time ?? [];

  const nowIdx = hourlyTimes.indexOf(currentTimeStr);
  const past24 = nowIdx >= 0
    ? hourlySnowfall.slice(Math.max(0, nowIdx - 24), nowIdx + 1)
    : hourlySnowfall.slice(0, 24);
  const snow24h = Math.round(past24.reduce((a: number, b: number) => a + (b ?? 0), 0) * 10) / 10;

  const snowTomorrow = Math.round((d.daily?.snowfall_sum?.[1] ?? 0) * 10) / 10;

  return {
    region: coord.region,
    temp: Math.round(c.temperature_2m * 10) / 10,
    wind: Math.round(c.wind_speed_10m * 10) / 10,
    snow24h,
    snowTomorrow,
    weatherCode: c.weather_code ?? 0,
    fetchedAt: new Date().toISOString(),
    source: "JMA Seamless via Open-Meteo",
  };
}

export async function getLiveWeather(): Promise<RegionWeather[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  const results = await Promise.all(REGION_COORDS.map(fetchRegionWeather));
  cache = { data: results, expiresAt: Date.now() + CACHE_TTL_MS };
  return results;
}

export function getWeatherForRegion(
  regionName: string,
  liveData: RegionWeather[]
): RegionWeather | null {
  return liveData.find(d => d.region === regionName) ?? null;
}

export function weatherCodeToLabel(code: number): string {
  if (code <= 1) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow Showers";
  return "Stormy";
}
