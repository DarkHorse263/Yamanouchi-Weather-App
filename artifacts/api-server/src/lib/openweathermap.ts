/**
 * OpenWeatherMap fallback source.
 *
 * Open-Meteo is the primary forecast source for every non-BOM location
 * (all of Victoria's High Country, Tasmania and Japan, plus the AU gateway
 * towns). When Open-Meteo is unreachable (gateway 502s / timeouts / IP
 * throttling) those pages used to hard-fail with a 500 and the UI hung on
 * "Loading mountain conditions...". This module fetches OpenWeatherMap's
 * free 2.5 endpoints and reshapes the payload into the SAME object shape
 * Open-Meteo returns, so `fetchLocationWeather` can consume it unchanged.
 *
 * Units are normalised to match Open-Meteo's conventions:
 * - wind: m/s -> km/h (* 3.6)
 * - snowfall: OWM reports liquid-equivalent mm; Open-Meteo reports cm of
 *   fresh snow at a 7:1 ratio (7cm snow = 10mm water), so cm = mm * 0.7.
 * - hourly: OWM forecast is 3-hourly; we expand to 1-hourly (accumulation
 *   fields divided across the three hours) so the downstream next-24/48/72h
 *   snowfall sums keep their per-hour semantics.
 *
 * It is intentionally a degraded fallback: freezing level and lying snow
 * depth are not available from OWM 2.5 and are left undefined / 0.
 */

export interface OwmLocationInput {
  latitude: number;
  longitude: number;
  timezone?: string;
}

const OWM_BASE = "https://api.openweathermap.org/data/2.5";

/** Map an OpenWeatherMap condition id to the nearest WMO code used by the
 *  app's getWeatherDescription() table. */
function owmToWmo(id: number): number {
  if (id >= 200 && id < 300) return 95; // thunderstorm
  if (id >= 300 && id < 400) return 51; // drizzle
  if (id >= 500 && id < 600) {
    if (id === 500) return 61; // light rain
    if (id === 501) return 63; // moderate rain
    if (id === 511) return 66; // freezing rain
    if (id >= 520) return 80; // shower rain
    return 65; // heavy rain (502-504)
  }
  if (id >= 600 && id < 700) {
    if (id === 600) return 71; // light snow
    if (id === 601) return 73; // snow
    if (id === 602) return 75; // heavy snow
    if (id >= 611) return 85; // sleet / snow showers
    return 73;
  }
  if (id >= 700 && id < 800) return 45; // mist / fog / haze
  if (id === 800) return 0; // clear
  if (id === 801) return 1; // few clouds
  if (id === 802) return 2; // scattered clouds
  return 3; // broken / overcast (803, 804)
}

/** Format a unix-seconds instant as a naive local ISO string (no offset),
 *  matching how Open-Meteo returns hourly/daily timestamps. */
function toLocalNaiveISO(unixSec: number, offsetSec: number, dateOnly = false): string {
  const d = new Date((unixSec + offsetSec) * 1000);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  if (dateOnly) return `${y}-${mo}-${da}`;
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da}T${h}:${mi}`;
}

interface OwmForecastEntry {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number; feels_like: number; humidity: number };
  weather: { id: number; icon: string }[];
  wind: { speed: number; deg: number };
  clouds: { all: number };
  rain?: { "3h"?: number };
  snow?: { "3h"?: number };
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch OpenWeatherMap current + forecast and return an Open-Meteo-shaped
 * object (current / hourly / daily / utc_offset_seconds). Returns null if
 * the API key is missing or either upstream call fails.
 */
export async function fetchOpenWeatherMapAsOpenMeteo(
  location: OwmLocationInput,
): Promise<any | null> {
  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) return null;

  const { latitude, longitude } = location;
  const common = `lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

  let current: any;
  let forecast: any;
  try {
    [current, forecast] = await Promise.all([
      fetchJson(`${OWM_BASE}/weather?${common}`),
      fetchJson(`${OWM_BASE}/forecast?${common}`),
    ]);
  } catch {
    return null;
  }

  const offsetSec = Number(forecast?.city?.timezone ?? current?.timezone ?? 0) || 0;
  const list: OwmForecastEntry[] = Array.isArray(forecast?.list) ? forecast.list : [];

  // ── current ──────────────────────────────────────────────
  const curWeatherId = current?.weather?.[0]?.id ?? 800;
  const curIcon: string = current?.weather?.[0]?.icon ?? "01d";
  const curCurrent = {
    temperature_2m: current?.main?.temp ?? null,
    apparent_temperature: current?.main?.feels_like ?? null,
    relative_humidity_2m: current?.main?.humidity ?? null,
    wind_speed_10m: current?.wind?.speed != null ? current.wind.speed * 3.6 : null,
    wind_direction_10m: current?.wind?.deg ?? 0,
    weather_code: owmToWmo(curWeatherId),
    is_day: curIcon.endsWith("d") ? 1 : 0,
    // OWM 2.5 has no snow-depth observation. null = unknown (routes/weather.ts
    // omits it from the payload); a hardcoded 0 would falsely assert "no snow".
    snow_depth: null,
    precipitation: (current?.rain?.["1h"] ?? 0) + (current?.snow?.["1h"] ?? 0),
    cloud_cover: current?.clouds?.all ?? 0,
    // freezing_level_height intentionally omitted (not available from OWM 2.5)
  };

  // ── hourly (expand 3-hourly buckets to 1-hourly, max 72) ──
  const hTime: string[] = [];
  const hTemp: number[] = [];
  const hCode: number[] = [];
  const hPrecip: number[] = [];
  const hSnow: number[] = [];
  const hWind: number[] = [];
  const hHum: number[] = [];
  const hFeels: number[] = [];
  const hCloud: number[] = [];

  for (const entry of list) {
    if (hTime.length >= 72) break;
    const code = owmToWmo(entry.weather?.[0]?.id ?? 800);
    const rain3 = entry.rain?.["3h"] ?? 0;
    const snow3mm = entry.snow?.["3h"] ?? 0;
    const precipPerHour = (rain3 + snow3mm) / 3;
    const snowCmPerHour = (snow3mm * 0.7) / 3; // mm liquid -> cm snow, split over 3h
    const windKmh = (entry.wind?.speed ?? 0) * 3.6;
    for (let h = 0; h < 3 && hTime.length < 72; h++) {
      hTime.push(toLocalNaiveISO(entry.dt + h * 3600, offsetSec));
      hTemp.push(entry.main?.temp ?? 0);
      hCode.push(code);
      hPrecip.push(Math.round(precipPerHour * 100) / 100);
      hSnow.push(Math.round(snowCmPerHour * 100) / 100);
      hWind.push(windKmh);
      hHum.push(entry.main?.humidity ?? 0);
      hFeels.push(entry.main?.feels_like ?? entry.main?.temp ?? 0);
      hCloud.push(entry.clouds?.all ?? 0);
    }
  }

  // ── daily (aggregate 3-hourly buckets by local date, max 7) ──
  const byDate = new Map<string, OwmForecastEntry[]>();
  const dateOrder: string[] = [];
  for (const entry of list) {
    const dateKey = toLocalNaiveISO(entry.dt, offsetSec, true);
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, []);
      dateOrder.push(dateKey);
    }
    byDate.get(dateKey)!.push(entry);
  }

  const sunriseUnix = Number(forecast?.city?.sunrise ?? current?.sys?.sunrise ?? 0) || 0;
  const sunsetUnix = Number(forecast?.city?.sunset ?? current?.sys?.sunset ?? 0) || 0;

  const dTime: string[] = [];
  const dMax: number[] = [];
  const dMin: number[] = [];
  const dCode: number[] = [];
  const dPrecip: number[] = [];
  const dRain: number[] = [];
  const dSnow: number[] = [];
  const dWindMax: number[] = [];
  const dUv: number[] = [];
  const dSunrise: string[] = [];
  const dSunset: string[] = [];

  dateOrder.slice(0, 7).forEach((dateKey, idx) => {
    const entries = byDate.get(dateKey)!;
    const temps = entries.map((e) => e.main?.temp ?? 0);
    const winds = entries.map((e) => (e.wind?.speed ?? 0) * 3.6);
    const precipSum = entries.reduce(
      (s, e) => s + (e.rain?.["3h"] ?? 0) + (e.snow?.["3h"] ?? 0),
      0,
    );
    const snowSumCm = entries.reduce((s, e) => s + (e.snow?.["3h"] ?? 0) * 0.7, 0);
    // Liquid rain only (OWM separates rain/snow buckets), so the reshaped
    // daily.rain_sum matches Open-Meteo's semantics: rain EXCLUDING snow.
    const rainSum = entries.reduce((s, e) => s + (e.rain?.["3h"] ?? 0), 0);
    // Pick the bucket nearest local midday for the day's representative code.
    const midday = entries.reduce((best, e) => {
      const hour = new Date((e.dt + offsetSec) * 1000).getUTCHours();
      const bestHour = new Date((best.dt + offsetSec) * 1000).getUTCHours();
      return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? e : best;
    }, entries[0]);

    dTime.push(dateKey);
    dMax.push(Math.max(...temps));
    dMin.push(Math.min(...temps));
    dCode.push(owmToWmo(midday.weather?.[0]?.id ?? 800));
    dPrecip.push(Math.round(precipSum * 10) / 10);
    dRain.push(Math.round(rainSum * 10) / 10);
    dSnow.push(Math.round(snowSumCm * 10) / 10);
    dWindMax.push(Math.max(...winds));
    dUv.push(0);
    dSunrise.push(toLocalNaiveISO(sunriseUnix + idx * 86400, offsetSec));
    dSunset.push(toLocalNaiveISO(sunsetUnix + idx * 86400, offsetSec));
  });

  return {
    current: curCurrent,
    hourly: {
      time: hTime,
      temperature_2m: hTemp,
      weather_code: hCode,
      precipitation: hPrecip,
      snowfall: hSnow,
      wind_speed_10m: hWind,
      relative_humidity_2m: hHum,
      apparent_temperature: hFeels,
      cloud_cover: hCloud,
    },
    daily: {
      time: dTime,
      temperature_2m_max: dMax,
      temperature_2m_min: dMin,
      weather_code: dCode,
      precipitation_sum: dPrecip,
      rain_sum: dRain,
      snowfall_sum: dSnow,
      wind_speed_10m_max: dWindMax,
      uv_index_max: dUv,
      sunrise: dSunrise,
      sunset: dSunset,
    },
    utc_offset_seconds: offsetSec,
  };
}
