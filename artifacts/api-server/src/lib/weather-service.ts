/**
 * Weather Service - fetches live data from Open-Meteo using the JMA Seamless model.
 * Open-Meteo is free, requires no API key, and uses Japan Meteorological Agency (JMA)
 * data as its primary model for Japan coordinates.
 *
 * Sources:
 *   - JMA (Japan Meteorological Agency) - government official model, via Open-Meteo JMA Seamless
 *   - Japan Weather Association (JWA / tenki.jp) - same underlying JMA data refined
 *   - Weathernews Inc. - hyper-local; their proprietary data is not publicly accessible via API
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

export interface ForecastDay {
  date: string;
  dayLabel: string;
  tempMin: number;
  tempMax: number;
  snowfall: number;
  rain: number;
  precipitation: number;
  weatherCode: number;
}

export interface MountainOutlook {
  region: string;
  regionJa: string;
  elevation: number;
  temp: number;
  wind: number;
  weatherCode: number;
  snow24h: number;
  forecast: ForecastDay[];
}

export interface TownWeather {
  location: string;
  locationJa: string;
  elevation: number;
  temp: number;
  wind: number;
  weatherCode: number;
  forecast: ForecastDay[];
}

export interface FullWeatherOutlook {
  mountains: MountainOutlook[];
  towns: TownWeather[];
  updatedAt: string;
}

interface CacheEntry {
  data: RegionWeather[];
  expiresAt: number;
}

interface OutlookCacheEntry {
  data: FullWeatherOutlook;
  expiresAt: number;
}

let cache: CacheEntry | null = null;
let outlookCache: OutlookCacheEntry | null = null;

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
    lat: 36.779,
    lon: 138.474,
    elevation: 1100,
    label: "Ryuoo (1100m)",
  },
  {
    region: "Yomase",
    lat: 36.789,
    lon: 138.411,
    elevation: 900,
    label: "Yomase (900m)",
  },
];

const MOUNTAIN_OUTLOOK_COORDS = [
  { region: "Shiga Kogen", regionJa: "志賀高原", elevation: 1800, lat: 36.79, lon: 138.51 },
  { region: "Ryuoo",       regionJa: "竜王",     elevation: 1100, lat: 36.779, lon: 138.474 },
  { region: "Yomase",      regionJa: "夜間瀬",   elevation: 900,  lat: 36.789, lon: 138.411 },
];

const TOWN_COORDS = [
  { location: "Yamanouchi", locationJa: "山ノ内町", elevation: 600, lat: 36.745, lon: 138.409 },
  { location: "Nakano",     locationJa: "中野市",   elevation: 350, lat: 36.743, lon: 138.368 },
];

function dayLabel(dateStr: string, idx: number): string {
  if (idx === 0) return "Today";
  if (idx === 1) return "Tomorrow";
  const d = new Date(dateStr + "T00:00:00+09:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

async function fetchMountainOutlook(coord: typeof MOUNTAIN_OUTLOOK_COORDS[0]): Promise<MountainOutlook> {
  const params = new URLSearchParams({
    latitude: String(coord.lat),
    longitude: String(coord.lon),
    elevation: String(coord.elevation),
    current: "temperature_2m,wind_speed_10m,weather_code",
    hourly: "snowfall",
    daily: "snowfall_sum,temperature_2m_max,temperature_2m_min,weather_code,rain_sum",
    timezone: "Asia/Tokyo",
    forecast_days: "7",
    past_hours: "24",
    models: "jma_seamless",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status} for ${coord.region}`);
  const d = await res.json();
  const c = d.current;

  const hourlySnowfall: number[] = d.hourly?.snowfall ?? [];
  const hourlyTimes: string[] = d.hourly?.time ?? [];
  const nowIdx = hourlyTimes.indexOf(c.time);
  const past24 = nowIdx >= 0
    ? hourlySnowfall.slice(Math.max(0, nowIdx - 24), nowIdx + 1)
    : hourlySnowfall.slice(0, 24);
  const snow24h = Math.round(past24.reduce((a: number, b: number) => a + (b ?? 0), 0) * 10) / 10;

  const daily = d.daily ?? {};
  const forecast: ForecastDay[] = (daily.time ?? []).map((date: string, i: number) => ({
    date,
    dayLabel: dayLabel(date, i),
    tempMin: Math.round((daily.temperature_2m_min?.[i] ?? 0) * 10) / 10,
    tempMax: Math.round((daily.temperature_2m_max?.[i] ?? 0) * 10) / 10,
    snowfall: Math.round((daily.snowfall_sum?.[i] ?? 0) * 10) / 10,
    rain: Math.round((daily.rain_sum?.[i] ?? 0) * 10) / 10,
    precipitation: Math.round(((daily.snowfall_sum?.[i] ?? 0) + (daily.rain_sum?.[i] ?? 0)) * 10) / 10,
    weatherCode: daily.weather_code?.[i] ?? 0,
  }));

  return {
    region: coord.region,
    regionJa: coord.regionJa,
    elevation: coord.elevation,
    temp: Math.round(c.temperature_2m * 10) / 10,
    wind: Math.round(c.wind_speed_10m * 10) / 10,
    weatherCode: c.weather_code ?? 0,
    snow24h,
    forecast,
  };
}

async function fetchTownWeather(coord: typeof TOWN_COORDS[0]): Promise<TownWeather> {
  const params = new URLSearchParams({
    latitude: String(coord.lat),
    longitude: String(coord.lon),
    elevation: String(coord.elevation),
    current: "temperature_2m,wind_speed_10m,weather_code,precipitation",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,rain_sum,weather_code",
    timezone: "Asia/Tokyo",
    forecast_days: "7",
    models: "jma_seamless",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status} for ${coord.location}`);
  const d = await res.json();
  const c = d.current;
  const daily = d.daily ?? {};

  const forecast: ForecastDay[] = (daily.time ?? []).map((date: string, i: number) => ({
    date,
    dayLabel: dayLabel(date, i),
    tempMin: Math.round((daily.temperature_2m_min?.[i] ?? 0) * 10) / 10,
    tempMax: Math.round((daily.temperature_2m_max?.[i] ?? 0) * 10) / 10,
    snowfall: Math.round((daily.snowfall_sum?.[i] ?? 0) * 10) / 10,
    rain: Math.round((daily.rain_sum?.[i] ?? 0) * 10) / 10,
    precipitation: Math.round((daily.precipitation_sum?.[i] ?? 0) * 10) / 10,
    weatherCode: daily.weather_code?.[i] ?? 0,
  }));

  return {
    location: coord.location,
    locationJa: coord.locationJa,
    elevation: coord.elevation,
    temp: Math.round(c.temperature_2m * 10) / 10,
    wind: Math.round(c.wind_speed_10m * 10) / 10,
    weatherCode: c.weather_code ?? 0,
    forecast,
  };
}

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

export async function getFullWeatherOutlook(): Promise<FullWeatherOutlook> {
  if (outlookCache && outlookCache.expiresAt > Date.now()) {
    return outlookCache.data;
  }

  const [mountains, towns] = await Promise.all([
    Promise.all(MOUNTAIN_OUTLOOK_COORDS.map(fetchMountainOutlook)),
    Promise.all(TOWN_COORDS.map(fetchTownWeather)),
  ]);

  const data: FullWeatherOutlook = { mountains, towns, updatedAt: new Date().toISOString() };
  outlookCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

export function getWeatherForRegion(
  regionName: string,
  liveData: RegionWeather[]
): RegionWeather | null {
  return liveData.find(d => d.region === regionName) ?? null;
}

export function weatherCodeToLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Foggy";
  if (code <= 55) return "Drizzle";
  if (code <= 65) return "Rain";
  if (code <= 67) return "Freezing Rain";
  if (code <= 75) return "Snow";
  if (code <= 77) return "Snow Grains";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow Showers";
  return "Stormy";
}

export function weatherCodeToEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}
