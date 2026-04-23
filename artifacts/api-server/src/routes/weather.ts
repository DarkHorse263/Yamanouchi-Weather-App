import { Router, type IRouter } from "express";
import { GetWeatherResponse, GetLocationWeatherResponse, GetLocationWeatherParams } from "@workspace/api-zod";

const router: IRouter = Router();

interface LocationConfig {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  description: string;
  bomStation: string;
  bomStationId: string;
  bomWmoId: number;
  bomSecondaryWmoId?: number;
  bomSecondaryStation?: string;
}

const LOCATIONS: LocationConfig[] = [
  {
    id: "thredbo",
    name: "Thredbo",
    latitude: -36.5054,
    longitude: 148.3089,
    elevation: 1365,
    description: "Australia's premier alpine resort village, home to the longest ski runs in the country with a vertical drop of 672m.",
    bomStation: "Thredbo Village AWS",
    bomStationId: "071032",
    bomWmoId: 95908,
    bomSecondaryWmoId: 95909,
    bomSecondaryStation: "Thredbo Top Station AWS"
  },
  {
    id: "perisher",
    name: "Perisher",
    latitude: -36.3717,
    longitude: 148.4086,
    elevation: 1720,
    description: "Australia's largest ski resort spanning four interconnected resort areas: Perisher Valley, Blue Cow, Smiggin Holes, and Guthega.",
    bomStation: "Perisher Valley AWS",
    bomStationId: "071075",
    bomWmoId: 94915
  },
  {
    id: "charlottes-pass",
    name: "Charlotte's Pass",
    latitude: -36.4314,
    longitude: 148.3297,
    elevation: 1837,
    description: "Australia's highest ski resort and snowsure destination, accessible only by oversnow transport during winter.",
    // BOM has no AWS at Charlotte's Pass; the nearest (Cabramurra at ~1500m)
    // would understate cold by hundreds of metres of lapse rate. We use
    // elevation-corrected Open-Meteo as the truthful primary source instead.
    bomStation: "Open-Meteo (no BOM station at 1837m)",
    bomStationId: "",
    bomWmoId: 0,
  },
  {
    id: "jindabyne",
    name: "Jindabyne",
    latitude: -36.4174,
    longitude: 148.6217,
    elevation: 918,
    description: "The gateway town to the Snowy Mountains, situated on the shores of Lake Jindabyne. Base for all ski resort access.",
    bomStation: "Cooma Airport AWS",
    bomStationId: "071014",
    bomWmoId: 94921,
    bomSecondaryStation: "Cooma Airport AWS (nearest BOM station)"
  }
];

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail"
};

function getWeatherDescription(code: number): string {
  return WEATHER_DESCRIPTIONS[code] || "Unknown";
}

interface BomObservation {
  air_temp: number | null;
  apparent_t: number | null;
  dewpt: number | null;
  rel_hum: number | null;
  wind_spd_kmh: number | null;
  wind_dir: string | null;
  gust_kmh: number | null;
  press: number | null;
  press_msl: number | null;
  rain_trace: string | null;
  cloud: string | null;
  cloud_oktas: number | null;
  vis_km: string | null;
  weather: string | null;
  local_date_time: string | null;
  local_date_time_full: string | null;
  aifstime_utc: string | null;
  name: string;
}

function bomCloudToDescription(cloud: string | null, weather: string | null, openMeteoCode?: number): string {
  if (weather && weather !== "-") return weather;
  if (cloud && cloud !== "-") {
    const c = cloud.toLowerCase();
    if (c === "clear") return "Clear sky";
    if (c === "sunny") return "Sunny";
    if (c.includes("partly")) return "Partly cloudy";
    if (c.includes("mostly")) return "Mostly cloudy";
    if (c.includes("cloudy") || c.includes("overcast")) return "Overcast";
    return cloud;
  }
  if (openMeteoCode !== undefined) return getWeatherDescription(openMeteoCode);
  return "Unknown";
}

function windDirToDegrees(dir: string | null): number {
  if (!dir || dir === "-" || dir === "CALM") return 0;
  const dirs: Record<string, number> = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
    E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
    S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
    W: 270, WNW: 292.5, NW: 315, NNW: 337.5
  };
  return dirs[dir.toUpperCase()] ?? 0;
}

async function fetchBomObservations(wmoId: number): Promise<BomObservation[] | null> {
  if (!wmoId) return null;
  try {
    const response = await fetch(
      `http://www.bom.gov.au/fwo/IDN60801/IDN60801.${wmoId}.json`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; SnowyMtsWeatherApp/1.0)" } }
    );
    if (!response.ok) return null;
    const data = await response.json() as any;
    return data?.observations?.data ?? null;
  } catch {
    return null;
  }
}

// BOM stations sometimes drop offline for hours. Treat any reading older than
// this as stale so we don't display an old daytime peak as "current".
const BOM_MAX_AGE_MS = 90 * 60 * 1000; // 90 minutes

function isBomReadingFresh(obs: BomObservation | null | undefined): boolean {
  // Prefer the UTC timestamp BOM provides; falling back to local-time would
  // misinterpret the timezone on a UTC server and let stale data through.
  const utc = obs?.aifstime_utc;
  if (!utc || utc.length < 12) return false;
  const iso = `${utc.slice(0, 4)}-${utc.slice(4, 6)}-${utc.slice(6, 8)}T${utc.slice(8, 10)}:${utc.slice(10, 12)}:00Z`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return false;
  return Date.now() - ms <= BOM_MAX_AGE_MS;
}

function parseBomDateTime(dtStr: string): Date {
  const year = parseInt(dtStr.slice(0, 4));
  const month = parseInt(dtStr.slice(4, 6)) - 1;
  const day = parseInt(dtStr.slice(6, 8));
  const hour = parseInt(dtStr.slice(8, 10));
  const minute = parseInt(dtStr.slice(10, 12));
  return new Date(year, month, day, hour, minute);
}

function safeParseFloat(val: string | null | undefined): number | undefined {
  if (!val || val === "-" || val === "T" || val.trim() === "") return undefined;
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : undefined;
}

async function fetchLocationWeather(location: LocationConfig) {
  const [openMeteoResult, bomObs, bomSecondaryObs] = await Promise.all([
    fetchOpenMeteo(location).catch(() => null),
    fetchBomObservations(location.bomWmoId),
    location.bomSecondaryWmoId
      ? fetchBomObservations(location.bomSecondaryWmoId)
      : Promise.resolve(null)
  ]);

  const openMeteoData = openMeteoResult;
  if (!openMeteoData && !bomObs && !bomSecondaryObs) {
    throw new Error(`No weather data available for ${location.name} from any source`);
  }

  // Only trust BOM readings that are recent — stale stations cause the
  // wildly inconsistent temperatures we were seeing across resorts.
  const freshPrimary = bomObs?.[0] && isBomReadingFresh(bomObs[0]) ? bomObs[0] : null;
  const freshSecondary = bomSecondaryObs?.[0] && isBomReadingFresh(bomSecondaryObs[0]) ? bomSecondaryObs[0] : null;
  const latestBom = freshPrimary;
  const latestSecondary = freshSecondary;

  const bomTemp = latestBom?.air_temp ?? latestSecondary?.air_temp;
  const bomFeelsLike = latestBom?.apparent_t ?? latestSecondary?.apparent_t;
  const bomHumidity = latestBom?.rel_hum ?? latestSecondary?.rel_hum;
  const bomWindSpeed = latestBom?.wind_spd_kmh ?? latestSecondary?.wind_spd_kmh;
  const bomWindDir = latestBom?.wind_dir ?? latestSecondary?.wind_dir;
  const bomGust = latestBom?.gust_kmh ?? latestSecondary?.gust_kmh;
  const bomPressure = latestBom?.press_msl ?? latestSecondary?.press_msl ?? latestBom?.press ?? latestSecondary?.press;
  const bomCloud = latestBom?.cloud ?? latestSecondary?.cloud;
  const bomWeather = latestBom?.weather ?? latestSecondary?.weather;
  const bomVis = latestBom?.vis_km ?? latestSecondary?.vis_km;
  const bomRain = latestBom?.rain_trace ?? latestSecondary?.rain_trace;
  const bomDewpoint = latestBom?.dewpt ?? latestSecondary?.dewpt;
  const bomObsTime = latestBom?.local_date_time_full ?? latestSecondary?.local_date_time_full;
  const bomStationName = latestBom?.name ?? latestSecondary?.name ?? location.bomStation;

  const hasBomData = bomTemp !== null && bomTemp !== undefined;
  const om = openMeteoData;

  const current = {
    temperature: hasBomData ? bomTemp : (om?.current?.temperature_2m ?? 0),
    feelsLike: bomFeelsLike ?? om?.current?.apparent_temperature ?? (hasBomData ? bomTemp : 0),
    humidity: bomHumidity ?? om?.current?.relative_humidity_2m ?? 0,
    windSpeed: bomWindSpeed ?? om?.current?.wind_speed_10m ?? 0,
    windDirection: bomWindDir ? windDirToDegrees(bomWindDir) : (om?.current?.wind_direction_10m ?? 0),
    windDirectionCompass: bomWindDir ?? undefined,
    windGust: bomGust ?? undefined,
    weatherCode: om?.current?.weather_code ?? 0,
    weatherDescription: hasBomData
      ? bomCloudToDescription(bomCloud, bomWeather, om?.current?.weather_code)
      : getWeatherDescription(om?.current?.weather_code ?? 0),
    isDay: om?.current?.is_day === 1,
    snowDepth: om?.current?.snow_depth ?? 0,
    precipitation: om?.current?.precipitation ?? 0,
    cloudCover: om?.current?.cloud_cover ?? 0,
    visibility: (() => { const v = safeParseFloat(bomVis); return v !== undefined ? v * 1000 : (om ? 10000 : undefined); })(),
    pressure: bomPressure ?? undefined,
    dewpoint: bomDewpoint ?? undefined,
    rainSince9am: safeParseFloat(bomRain),
    dataSource: hasBomData ? "BOM" : "Open-Meteo",
    bomStation: bomStationName,
    bomObservationTime: bomObsTime ?? undefined
  };

  const daily = om?.daily?.time?.map((date: string, i: number) => ({
    date,
    maxTemp: om.daily.temperature_2m_max[i],
    minTemp: om.daily.temperature_2m_min[i],
    weatherCode: om.daily.weather_code[i],
    weatherDescription: getWeatherDescription(om.daily.weather_code[i]),
    precipitationSum: om.daily.precipitation_sum[i],
    snowfallSum: om.daily.snowfall_sum[i],
    windSpeedMax: om.daily.wind_speed_10m_max[i],
    uvIndexMax: om.daily.uv_index_max?.[i] ?? 0,
    sunrise: om.daily.sunrise[i],
    sunset: om.daily.sunset[i]
  })) ?? [];

  const bomHourlyData = buildBomHourly(bomObs, bomSecondaryObs);
  const hourly = bomHourlyData.length > 0
    ? bomHourlyData
    : om?.hourly?.time?.map((time: string, i: number) => ({
        time,
        temperature: om.hourly.temperature_2m[i],
        weatherCode: om.hourly.weather_code[i],
        weatherDescription: getWeatherDescription(om.hourly.weather_code[i]),
        precipitation: om.hourly.precipitation[i],
        snowfall: om.hourly.snowfall?.[i] ?? 0,
        windSpeed: om.hourly.wind_speed_10m[i],
        humidity: om.hourly.relative_humidity_2m[i],
        feelsLike: om.hourly.apparent_temperature[i],
        cloudCover: om.hourly.cloud_cover[i]
      })) ?? [];

  return {
    location: {
      id: location.id,
      name: location.name,
      elevation: location.elevation,
      latitude: location.latitude,
      longitude: location.longitude,
      description: location.description,
      bomStation: bomStationName,
      bomStationId: location.bomStationId
    },
    current,
    daily,
    hourly,
    lastUpdated: new Date().toISOString()
  };
}

function buildBomHourly(
  primary: BomObservation[] | null,
  secondary: BomObservation[] | null
): any[] {
  const obs = primary ?? secondary;
  if (!obs || obs.length === 0) return [];

  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const hourlyReadings: any[] = [];
  const seenHours = new Set<string>();

  for (const reading of obs) {
    if (!reading.local_date_time_full) continue;
    const dt = parseBomDateTime(reading.local_date_time_full);
    if (dt < cutoff) break;

    const hourKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}T${String(dt.getHours()).padStart(2, "0")}:00`;
    if (seenHours.has(hourKey)) continue;
    seenHours.add(hourKey);

    const secReading = secondary?.find(s =>
      s.local_date_time_full === reading.local_date_time_full
    );

    const temp = reading.air_temp ?? secReading?.air_temp;
    if (temp === null || temp === undefined) continue;

    hourlyReadings.push({
      time: hourKey,
      temperature: temp,
      weatherCode: 0,
      weatherDescription: bomCloudToDescription(
        reading.cloud ?? secReading?.cloud,
        reading.weather ?? secReading?.weather
      ),
      precipitation: 0,
      snowfall: 0,
      windSpeed: reading.wind_spd_kmh ?? secReading?.wind_spd_kmh ?? 0,
      humidity: reading.rel_hum ?? secReading?.rel_hum ?? 0,
      feelsLike: reading.apparent_t ?? secReading?.apparent_t ?? temp,
      cloudCover: (reading.cloud_oktas ?? secReading?.cloud_oktas ?? 0) * 12.5
    });
  }

  return hourlyReadings.reverse();
}

async function fetchOpenMeteo(location: LocationConfig) {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    // Critical: pass the resort's true elevation so Open-Meteo lapse-rate-corrects
    // the temperature instead of returning the model's grid-cell surface value.
    elevation: location.elevation.toString(),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,snow_depth",
    hourly: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,snowfall",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,snowfall_sum,wind_speed_10m_max,uv_index_max",
    timezone: "Australia/Sydney",
    forecast_days: "7",
    forecast_hours: "24"
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  return await response.json() as any;
}

router.get("/weather", async (_req, res) => {
  try {
    const weatherPromises = LOCATIONS.map(fetchLocationWeather);
    const locations = await Promise.all(weatherPromises);

    const result = GetWeatherResponse.parse({
      locations,
      lastUpdated: new Date().toISOString()
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "WEATHER_FETCH_ERROR",
      message: error instanceof Error ? error.message : "Failed to fetch weather data"
    });
  }
});

router.get("/weather/:locationId", async (req, res) => {
  try {
    const { locationId } = GetLocationWeatherParams.parse(req.params);
    const location = LOCATIONS.find(l => l.id === locationId);

    if (!location) {
      res.status(404).json({
        error: "LOCATION_NOT_FOUND",
        message: `Location '${locationId}' not found. Valid locations: ${LOCATIONS.map(l => l.id).join(", ")}`
      });
      return;
    }

    const weatherData = await fetchLocationWeather(location);
    const result = GetLocationWeatherResponse.parse(weatherData);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "WEATHER_FETCH_ERROR",
      message: error instanceof Error ? error.message : "Failed to fetch weather data"
    });
  }
});

export default router;
