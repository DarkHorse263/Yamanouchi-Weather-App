import { Router, type IRouter } from "express";
import { LruTtlCache } from "../lib/lru-cache.js";
import { fetchOpenWeatherMapAsOpenMeteo } from "../lib/openweathermap.js";
import { reconcileDryToWet } from "../lib/amedas.js";
import { reconcileNzMetarDryToWet } from "../lib/metar-nz.js";

const router: IRouter = Router();

type RegionStatus = "live" | "soon";

interface RegionConfig {
  id: string;
  name: string;
  country: string;
  countryCode: "AU" | "JP" | "NZ";
  region: string;
  status: RegionStatus;
  href: string;
  baseTowns: string[];
  mountains: string[];
  headlineLabel: string;
  lat?: number;
  lon?: number;
  elevation?: number;
  model?: string;
  timezone?: string;
  sourceLabel?: string;
}

const REGIONS: RegionConfig[] = [
  {
    id: "snowy-mountains",
    name: "Snowy Mountains",
    country: "Australia",
    countryCode: "AU",
    region: "New South Wales",
    status: "live",
    href: "/snowy-mountains/",
    baseTowns: ["Jindabyne", "Berridale", "Cooma"],
    mountains: ["Perisher", "Thredbo", "Selwyn", "Charlotte's Pass"],
    // Headline reading is for the base town (Jindabyne, ~918m) - not the
    // mountain peak - so the home page reflects what visitors actually feel
    // when they arrive in town. Per-mountain peak forecasts live on the
    // dedicated region page.
    headlineLabel: "Jindabyne",
    lat: -36.4137,
    lon: 148.6207,
    timezone: "Australia/Sydney",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "victorias-high-country",
    name: "Victoria's High Country",
    country: "Australia",
    countryCode: "AU",
    region: "Victoria",
    status: "live",
    href: "/victorias-high-country/",
    baseTowns: ["Mansfield", "Bright", "Mount Beauty", "Harrietville", "Dinner Plain", "Omeo", "Marysville", "Warburton"],
    mountains: ["Mt Buller", "Falls Creek", "Mt Hotham", "Mt Stirling", "Lake Mountain", "Mt Donna Buang"],
    // Headline reading is for Mount Beauty (~357m) - closest sealed-road
    // town to Falls Creek and the most-stayed base for Victoria's High
    // Country off-mountain visitors. Per-mountain peak forecasts live on
    // the dedicated region page.
    headlineLabel: "Mount Beauty",
    lat: -36.7327,
    lon: 147.1696,
    timezone: "Australia/Melbourne",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "tasmania",
    name: "Tasmania",
    country: "Australia",
    countryCode: "AU",
    region: "Tasmania",
    status: "live",
    href: "/tasmania/",
    baseTowns: ["Ben Lomond Base", "Launceston", "Hobart"],
    mountains: ["Ben Lomond"],
    // Headline reading from Launceston (~30m) · closest city base and
    // where most visiting skiers actually arrive. Ben Lomond summit
    // forecast lives on the dedicated mountain page.
    headlineLabel: "Launceston",
    lat: -41.4332,
    lon: 147.1442,
    timezone: "Australia/Hobart",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "yamanouchi",
    name: "Yamanouchi Town",
    country: "Japan",
    countryCode: "JP",
    region: "Nagano",
    status: "live",
    href: "/yamanouchi/",
    baseTowns: ["Yudanaka", "Shibu Onsen", "Yomase"],
    mountains: ["Shiga Kogen", "Yomase", "X-Jam", "Ryuoo"],
    // Headline reading is for the base town (Yudanaka Onsen, ~600m) - not
    // the Shiga Kogen peak - so the home page shows what visitors feel on
    // arrival. Per-mountain peak forecasts live on the dedicated region page.
    headlineLabel: "Yudanaka",
    lat: 36.7414,
    lon: 138.4242,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "nozawa-onsen",
    name: "Nozawa Onsen",
    country: "Japan",
    countryCode: "JP",
    region: "Nagano",
    status: "live",
    href: "/nozawa-onsen/",
    baseTowns: ["Nozawa Onsen"],
    mountains: ["Nozawa Onsen"],
    // Headline reading from the onsen village core (~565m) - what guests
    // step out into off the bus from Iiyama Shinkansen.
    headlineLabel: "Nozawa Onsen",
    lat: 36.9243,
    lon: 138.4485,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "iiyama",
    name: "Iiyama",
    country: "Japan",
    countryCode: "JP",
    region: "Nagano",
    status: "live",
    href: "/iiyama/",
    baseTowns: ["Iiyama", "Madarao Kogen", "Togari Onsen", "Kijimadaira"],
    mountains: ["Madarao", "Tangram", "Togari Onsen", "Kijimadaira · Romance no Kamisama", "Kijima Snow Park"],
    // Headline reading from Iiyama City (~315m) - Hokuriku Shinkansen
    // gateway and the rail-in pivot for the whole north-east Nagano
    // resort cluster.
    headlineLabel: "Iiyama",
    lat: 36.8514,
    lon: 138.3676,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "hakuba-valley",
    name: "Hakuba Valley",
    country: "Japan",
    countryCode: "JP",
    region: "Nagano",
    status: "live",
    href: "/hakuba-valley/",
    baseTowns: ["Hakuba", "Otari", "Omachi"],
    mountains: ["Happo-One", "Hakuba Goryu", "Hakuba 47", "Hakuba Iwatake", "Tsugaike Kogen", "Hakuba Norikura", "Hakuba Cortina", "Hakuba Sanosaka", "Kashimayari", "Jiigatake"],
    // Headline reading from Hakuba village (~700m) · the central base and
    // the valley's main hotel/ryokan hub beneath the Happo lifts.
    headlineLabel: "Hakuba",
    lat: 36.6982,
    lon: 137.8619,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "myoko",
    name: "Myoko",
    country: "Japan",
    countryCode: "JP",
    region: "Niigata",
    status: "live",
    href: "/myoko/",
    baseTowns: ["Akakura Onsen", "Ikenotaira Onsen", "Suginosawa", "Arai"],
    mountains: ["Akakura Onsen", "Akakura Kanko", "Ikenotaira Alpen Blick", "Myoko Suginohara", "Seki Onsen", "Lotte Arai"],
    // Headline reading from Akakura Onsen village (~750m) · Myoko's main
    // hub with the largest strip of ryokan and restaurants, beneath the
    // Akakura Onsen / Akakura Kanko slopes.
    headlineLabel: "Akakura Onsen",
    lat: 36.8876,
    lon: 138.1802,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "niseko",
    name: "Niseko",
    country: "Japan",
    countryCode: "JP",
    region: "Hokkaido",
    status: "live",
    href: "/niseko/",
    baseTowns: ["Hirafu", "Kutchan", "Niseko Town"],
    mountains: ["Grand Hirafu", "Hanazono", "Niseko Village", "Annupuri", "Moiwa"],
    // Headline reading from Hirafu village (~260m) · the hub village at
    // the foot of Grand Hirafu where most international guests stay.
    headlineLabel: "Hirafu",
    lat: 42.8577,
    lon: 140.6982,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "furano",
    name: "Furano",
    country: "Japan",
    countryCode: "JP",
    region: "Hokkaido",
    status: "live",
    href: "/furano/",
    baseTowns: ["Furano", "Kitanomine"],
    mountains: ["Furano Ski Resort", "Kamui Ski Links", "Tomamu"],
    // Headline reading from Furano town (~175m) · the hub town on the
    // JR Furano Line below the Kitanomine gondola.
    headlineLabel: "Furano",
    lat: 43.3420,
    lon: 142.3833,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "yuzawa",
    name: "Yuzawa",
    country: "Japan",
    countryCode: "JP",
    region: "Niigata",
    status: "live",
    href: "/yuzawa/",
    baseTowns: ["Echigo-Yuzawa", "Ishiuchi", "Mitsumata"],
    mountains: ["GALA Yuzawa", "Yuzawa Kogen", "Iwappara", "Ishiuchi Maruyama", "Kagura", "Naeba"],
    // Headline reading from Echigo-Yuzawa town (~360m) · the onsen town
    // around the shinkansen station where most visitors stay, beneath the
    // Yuzawa Kogen ropeway and GALA gondola.
    headlineLabel: "Echigo-Yuzawa",
    lat: 36.9354,
    lon: 138.8090,
    model: "jma_seamless",
    timezone: "Asia/Tokyo",
    sourceLabel: "JMA Seamless",
  },
  {
    id: "queenstown",
    name: "Queenstown",
    country: "New Zealand",
    countryCode: "NZ",
    region: "Otago",
    status: "live",
    href: "/queenstown/",
    baseTowns: ["Queenstown"],
    mountains: ["Coronet Peak", "The Remarkables"],
    // Headline reading from Queenstown town (~310m) · the base everyone
    // arrives into. Per-mountain peak forecasts live on the region page.
    headlineLabel: "Queenstown",
    lat: -45.0312,
    lon: 168.6626,
    timezone: "Pacific/Auckland",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "wanaka",
    name: "Wanaka",
    country: "New Zealand",
    countryCode: "NZ",
    region: "Otago",
    status: "live",
    href: "/wanaka/",
    baseTowns: ["Wanaka"],
    mountains: ["Cardrona", "Treble Cone"],
    // Headline reading from Wanaka town (~300m) · lakeside base for
    // Cardrona and Treble Cone.
    headlineLabel: "Wanaka",
    lat: -44.7032,
    lon: 169.1321,
    timezone: "Pacific/Auckland",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "mt-hutt",
    name: "Mt Hutt",
    country: "New Zealand",
    countryCode: "NZ",
    region: "Canterbury",
    status: "live",
    href: "/mt-hutt/",
    baseTowns: ["Methven"],
    mountains: ["Mt Hutt"],
    // Headline reading from Methven (~320m) · the farm-town base at the
    // foot of the Mt Hutt access road. Summit forecast lives on the
    // mountain page.
    headlineLabel: "Methven",
    lat: -43.6333,
    lon: 171.6500,
    timezone: "Pacific/Auckland",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
  {
    id: "ruapehu",
    name: "Ruapehu",
    country: "New Zealand",
    countryCode: "NZ",
    region: "Central Plateau",
    status: "live",
    href: "/ruapehu/",
    baseTowns: ["Ohakune"],
    mountains: ["Whakapapa", "Turoa"],
    // Headline reading from Ohakune (~610m) · the Turoa-side base town.
    // Per-mountain peak forecasts live on the region page.
    headlineLabel: "Ohakune",
    lat: -39.4181,
    lon: 175.3956,
    timezone: "Pacific/Auckland",
    sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
  },
];

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
};

function describe(code: number | undefined): string {
  if (code == null) return "-";
  return WEATHER_DESCRIPTIONS[code] ?? "-";
}

function compass(deg: number | undefined): string {
  if (deg == null || Number.isNaN(deg)) return "";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

interface HeadlineReading {
  locationName: string;
  tempC: number;
  feelsLikeC: number;
  windKph: number;
  windDirection: string;
  windDirectionDeg: number | null;
  description: string;
  weatherCode: number | null;
  snowfallMmNext24h: number;
  observedAt: string;
  source: string;
  forecast: Array<{
    date: string;
    maxC: number;
    minC: number;
    weatherCode: number | null;
    description: string;
    precipMm: number;
    snowfallMm: number;
  }>;
}

interface RegionPayload extends Omit<RegionConfig, "lat" | "lon" | "elevation" | "model" | "timezone" | "sourceLabel"> {
  elevation?: number;
  sourceLabel?: string;
  headline: HeadlineReading | null;
}

// ── Cache + dogpile protection ────────────────────────────────────────────
// freshUntil: serve straight from cache, no upstream call
// staleUntil: serve cached data immediately AND kick off a background refresh
// past staleUntil: must wait for fresh data (or return null on failure)
interface CacheEntry { data: HeadlineReading; freshUntil: number; staleUntil: number }
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<HeadlineReading | null>>();
const FRESH_MS = 5 * 60 * 1000;          // serve straight from cache for 5 min
const STALE_MS = 6 * 60 * 60 * 1000;     // keep stale entries usable for 6 hours

let cacheStats = { hits: 0, staleServed: 0, upstreamCalls: 0, upstreamFails: 0, coalesced: 0 };
export function getCacheStats() { return { ...cacheStats, entries: cache.size, inFlight: inFlight.size }; }

async function fetchHeadline(r: RegionConfig): Promise<HeadlineReading | null> {
  if (r.status === "soon" || !r.lat || !r.lon) return null;

  const cacheKey = r.id;
  const now = Date.now();
  const cached = cache.get(cacheKey);

  // Fresh hit - fastest path
  if (cached && cached.freshUntil > now) {
    cacheStats.hits++;
    return cached.data;
  }

  // Coalesce: if a refresh is already in flight for this key, ride it
  const existing = inFlight.get(cacheKey);
  if (existing) {
    cacheStats.coalesced++;
    // If we have stale data, serve it immediately rather than waiting
    if (cached && cached.staleUntil > now) {
      cacheStats.staleServed++;
      return cached.data;
    }
    return existing;
  }

  // Kick off the refresh
  const refresh = fetchHeadlineUpstream(r)
    .then((fresh) => {
      if (fresh) {
        cache.set(cacheKey, {
          data: fresh,
          freshUntil: Date.now() + FRESH_MS,
          staleUntil: Date.now() + STALE_MS,
        });
        cacheStats.upstreamCalls++;
        return fresh;
      }
      // Upstream gave us nothing usable
      cacheStats.upstreamFails++;
      return cached?.data ?? null;
    })
    .catch((err) => {
      cacheStats.upstreamFails++;
      console.warn(`[regions] headline fetch failed for ${r.id}:`, err);
      return cached?.data ?? null; // serve stale on error if we have any
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, refresh);

  // Stale-while-revalidate: serve cached data immediately, refresh runs in background
  if (cached && cached.staleUntil > now) {
    cacheStats.staleServed++;
    return cached.data;
  }

  // No cache at all - must wait for fresh
  return refresh;
}

async function fetchHeadlineUpstream(r: RegionConfig): Promise<HeadlineReading | null> {
  const params = new URLSearchParams({
    latitude: String(r.lat),
    longitude: String(r.lon),
    elevation: String(r.elevation ?? ""),
    current: "temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,snowfall",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,weather_code",
    hourly: "snowfall",
    forecast_days: "7",
    forecast_hours: "24",
    timezone: r.timezone ?? "auto",
    ...(r.model ? { models: r.model } : {}),
  });

  try {
    // Open-Meteo asks all integrators to identify themselves so they can reach
    // out about quota / abuse before throttling. They're CC-BY 4.0; commercial
    // use needs their commercial tier - see replit.md "External Dependencies".
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "feelzlike/1.0 (mountain-weather-pwa; contact: hello@feelzlike.com)",
      },
    });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const d: any = await res.json();
    const cur = d.current ?? {};
    const daily = d.daily ?? {};
    const hourly = d.hourly ?? {};

    // ── Open-Meteo returns naive local time + utc_offset_seconds; build proper ISO UTC
    const utcOffsetSec = Number.isFinite(d.utc_offset_seconds) ? Number(d.utc_offset_seconds) : 0;
    const toIsoUtc = (localStr: string | undefined): string => {
      if (!localStr) return new Date().toISOString();
      const epochAsIfUtc = new Date(`${localStr}Z`).getTime();
      if (Number.isNaN(epochAsIfUtc)) return new Date().toISOString();
      return new Date(epochAsIfUtc - utcOffsetSec * 1000).toISOString();
    };

    // Open-Meteo snowfall default unit is cm - *10 converts to mm
    const snowfallCm24 = Array.isArray(hourly.snowfall)
      ? hourly.snowfall.slice(0, 24).reduce((a: number, b: number) => a + (Number.isFinite(b) ? Number(b) : 0), 0)
      : 0;
    const snowfallMm24 = Math.round(snowfallCm24 * 10 * 10) / 10;

    const numOrNull = (v: unknown): number | null => (Number.isFinite(v) ? Number(v) : null);
    const tempC = numOrNull(cur.temperature_2m);
    const feelsLikeC = numOrNull(cur.apparent_temperature);
    const windKph = numOrNull(cur.wind_speed_10m);

    if (tempC == null) {
      console.warn(`[regions] ${r.id}: upstream returned no temperature, skipping cache`);
      return null;
    }

    const headline: HeadlineReading = {
      locationName: r.headlineLabel,
      tempC,
      feelsLikeC: feelsLikeC ?? tempC,
      windKph: windKph != null ? Math.round(windKph) : 0,
      windDirection: compass(cur.wind_direction_10m),
      windDirectionDeg: numOrNull(cur.wind_direction_10m),
      description: describe(cur.weather_code),
      weatherCode: numOrNull(cur.weather_code),
      snowfallMmNext24h: snowfallMm24,
      observedAt: toIsoUtc(cur.time),
      source: r.sourceLabel ?? "Open-Meteo",
      forecast: (daily.time ?? []).slice(0, 6).map((date: string, i: number) => {
        const max = numOrNull(daily.temperature_2m_max?.[i]);
        const min = numOrNull(daily.temperature_2m_min?.[i]);
        return {
          date,
          maxC: max != null ? Math.round(max) : 0,
          minC: min != null ? Math.round(min) : 0,
          weatherCode: numOrNull(daily.weather_code?.[i]),
          description: describe(daily.weather_code?.[i]),
          precipMm: Math.round((Number.isFinite(daily.precipitation_sum?.[i]) ? Number(daily.precipitation_sum[i]) : 0) * 10) / 10,
          snowfallMm: Math.round((Number.isFinite(daily.snowfall_sum?.[i]) ? Number(daily.snowfall_sum[i]) : 0) * 10 * 10) / 10,
        };
      }),
    };

    // JMA AMeDAS reconciliation: correct a "clear" headline when a nearby
    // Japanese station is actually reporting rain/snow at this moment.
    if (r.countryCode === "JP" && r.lat != null && r.lon != null) {
      const override = await reconcileDryToWet({
        lat: r.lat,
        lon: r.lon,
        modelWeatherCode: headline.weatherCode,
        tempC: headline.tempC,
        refElevationM: numOrNull(d.elevation) ?? r.elevation ?? null,
      });
      if (override) {
        headline.weatherCode = override.weatherCode;
        headline.description = describe(override.weatherCode);
        headline.source = `JMA AMeDAS \u00b7 ${override.stationName}`;
        headline.observedAt = override.observedAt;
      }
    }

    // NZ airport-METAR reconciliation: same idea for New Zealand, where the only
    // free real-time surface-obs signal is airport METAR. Only fires when a town
    // is genuinely co-located with an airport (Queenstown -> NZQN, Wanaka -> NZWF).
    if (r.countryCode === "NZ" && r.lat != null && r.lon != null) {
      const override = await reconcileNzMetarDryToWet({
        lat: r.lat,
        lon: r.lon,
        modelWeatherCode: headline.weatherCode,
        tempC: headline.tempC,
        refElevationM: numOrNull(d.elevation) ?? r.elevation ?? null,
      });
      if (override) {
        headline.weatherCode = override.weatherCode;
        headline.description = describe(override.weatherCode);
        headline.source = `METAR \u00b7 ${override.stationName}`;
        headline.observedAt = override.observedAt;
      }
    }

    return headline;
  } catch (err) {
    console.warn(`[regions] upstream fetch failed for ${r.id}:`, err);
    throw err; // let the caller fall back to stale cache
  }
}

router.get("/regions", async (_req, res) => {
  try {
    const headlines = await Promise.all(
      REGIONS.map((r) => fetchHeadline(r).catch(() => null)),
    );
    const regions: RegionPayload[] = REGIONS.map((r, i) => {
      const { lat, lon, model, timezone, ...rest } = r;
      void lat; void lon; void model; void timezone;
      return { ...rest, headline: headlines[i] };
    });
    // Edge cache: serve fresh for 5 min, allow stale for 1h while revalidating.
    // CDNs/proxies will absorb load; our server-side cache also coalesces.
    res.set(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
    );
    res.json({
      regions,
      generatedAt: new Date().toISOString(),
      sourceCount: 7,
      refreshIntervalMin: 15,
    });
  } catch (err) {
    // Log full error server-side (Sentry catches it via the express handler)
    // but only surface a generic message to the client. Echoing String(err)
    // can leak upstream URLs, stack snippets, or library internals.
    console.error("[regions] error:", err);
    res.status(500).json({ error: "REGIONS_FETCH_ERROR" });
  }
});

// Internal cache stats endpoint - useful for monitoring + debugging
router.get("/regions/_stats", (_req, res) => {
  res.json({
    cache: getCacheStats(),
    fresh_ms: FRESH_MS,
    stale_ms: STALE_MS,
    regions: REGIONS.map((r) => ({ id: r.id, status: r.status })),
  });
});

// ── Local weather (arbitrary coords) + nearest region ─────────────────────
// Powers the location-first landing: given the visitor's GPS coordinates we
// return (a) their current local conditions and (b) the nearest live mountain
// region. Open-Meteo is the source for arbitrary coords - this is a plain
// "where you are" reading (auto timezone, no elevation/model correction), not
// a peak forecast. Results are cached by coarse (2dp ≈ 1.1km) coordinates so a
// burst of nearby visitors stays a good citizen of Open-Meteo's shared quota.
interface LocalCurrent {
  tempC: number;
  feelsLikeC: number;
  windKph: number;
  windDirection: string;
  windDirectionDeg: number | null;
  description: string;
  weatherCode: number | null;
  isDay: boolean;
  todayMaxC: number | null;
  todayMinC: number | null;
  // How heavy it's coming down right now. precipMm is total precipitation
  // (mm) over the preceding hour; snowfallCm is fresh snow (cm) over the same
  // window. Null when the upstream source doesn't report it.
  precipMm: number | null;
  snowfallCm: number | null;
  observedAt: string;
  source: string;
}

// Unlike the 6-key regions cache, this is keyed by an unbounded set of visitor
// coordinates, so it must be bounded - the LRU caps memory and Open-Meteo quota
// burn. Fresh for 10min; stale-but-servable for 6h so an upstream blip still
// returns last-known local conditions.
const localCache = new LruTtlCache<LocalCurrent>({
  maxEntries: 5000,
  freshMs: 10 * 60 * 1000,
  staleMs: 6 * 60 * 60 * 1000,
});

// Reverse-geocoded place labels change far more slowly than weather, so they
// get their own longer-lived bounded cache. Best-effort: a miss or failure just
// means the client falls back to a neutral "where you are now" label.
const placeNameCache = new LruTtlCache<string>({
  maxEntries: 5000,
  freshMs: 24 * 60 * 60 * 1000,
  staleMs: 24 * 60 * 60 * 1000,
});

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function findNearestRegion(
  lat: number,
  lon: number,
): { r: RegionConfig; distanceKm: number } | null {
  let best: { r: RegionConfig; distanceKm: number } | null = null;
  for (const r of REGIONS) {
    if (r.status !== "live" || r.lat == null || r.lon == null) continue;
    const distanceKm = haversineKm(lat, lon, r.lat, r.lon);
    if (!best || distanceKm < best.distanceKm) best = { r, distanceKm };
  }
  return best;
}

// Reconcile a model-derived current reading against real JMA AMeDAS surface
// observations. When the model claims dry but a nearby Japanese station is
// actually wet, swap in the observed condition (and credit the station) so the
// headline never says "clear" while it rains. No-op outside Japan / when the
// model already shows precipitation. Best-effort: any failure returns as-is.
async function applyObservedOverride(
  current: LocalCurrent,
  lat: number,
  lon: number,
  refElevationM: number | null,
): Promise<LocalCurrent> {
  const override = await reconcileDryToWet({
    lat,
    lon,
    modelWeatherCode: current.weatherCode,
    tempC: current.tempC,
    refElevationM,
  });
  if (override) {
    return {
      ...current,
      weatherCode: override.weatherCode,
      description: describe(override.weatherCode),
      source: `JMA AMeDAS \u00b7 ${override.stationName}`,
      observedAt: override.observedAt,
    };
  }

  // New Zealand: correct a dry headline against a co-located airport METAR.
  const nzOverride = await reconcileNzMetarDryToWet({
    lat,
    lon,
    modelWeatherCode: current.weatherCode,
    tempC: current.tempC,
    refElevationM,
  });
  if (nzOverride) {
    return {
      ...current,
      weatherCode: nzOverride.weatherCode,
      description: describe(nzOverride.weatherCode),
      source: `METAR \u00b7 ${nzOverride.stationName}`,
      observedAt: nzOverride.observedAt,
    };
  }

  return current;
}

async function fetchLocalCurrentFromOpenMeteo(
  lat: number,
  lon: number,
): Promise<LocalCurrent | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,is_day,precipitation,rain,snowfall",
    daily: "temperature_2m_max,temperature_2m_min",
    forecast_days: "1",
    timezone: "auto",
  });
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "feelzlike/1.0 (mountain-weather-pwa; contact: hello@feelzlike.com)",
      },
    });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const d: any = await res.json();
    const cur = d.current ?? {};
    const utcOffsetSec = Number.isFinite(d.utc_offset_seconds) ? Number(d.utc_offset_seconds) : 0;
    const toIsoUtc = (localStr: string | undefined): string => {
      if (!localStr) return new Date().toISOString();
      const epochAsIfUtc = new Date(`${localStr}Z`).getTime();
      if (Number.isNaN(epochAsIfUtc)) return new Date().toISOString();
      return new Date(epochAsIfUtc - utcOffsetSec * 1000).toISOString();
    };
    const numOrNull = (v: unknown): number | null => (Number.isFinite(v) ? Number(v) : null);
    const tempC = numOrNull(cur.temperature_2m);
    if (tempC == null) return null;
    const feelsLikeC = numOrNull(cur.apparent_temperature);
    const windKph = numOrNull(cur.wind_speed_10m);
    const daily = d.daily ?? {};
    const todayMaxRaw = numOrNull(Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[0] : null);
    const todayMinRaw = numOrNull(Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[0] : null);
    const base: LocalCurrent = {
      tempC: Math.round(tempC),
      feelsLikeC: feelsLikeC != null ? Math.round(feelsLikeC) : Math.round(tempC),
      windKph: windKph != null ? Math.round(windKph) : 0,
      windDirection: compass(cur.wind_direction_10m),
      windDirectionDeg: numOrNull(cur.wind_direction_10m),
      description: describe(cur.weather_code),
      weatherCode: numOrNull(cur.weather_code),
      isDay: cur.is_day === 1,
      todayMaxC: todayMaxRaw != null ? Math.round(todayMaxRaw) : null,
      todayMinC: todayMinRaw != null ? Math.round(todayMinRaw) : null,
      // Open-Meteo: current.precipitation is mm, current.snowfall is cm.
      precipMm: numOrNull(cur.precipitation) != null ? Math.round(Number(cur.precipitation) * 10) / 10 : null,
      snowfallCm: numOrNull(cur.snowfall) != null ? Math.round(Number(cur.snowfall) * 10) / 10 : null,
      observedAt: toIsoUtc(cur.time),
      source: "Open-Meteo",
    };
    // Open-Meteo returns the grid-cell elevation; use it to prefer same-altitude
    // stations when reconciling against observations.
    return applyObservedOverride(base, lat, lon, numOrNull(d.elevation));
  } catch (err) {
    console.warn("[local-weather] upstream fetch failed:", err);
    return null;
  }
}

// OpenWeatherMap fallback for current conditions. Open-Meteo throttles the
// Replit egress IP for sustained periods, and a cold visitor's unique coords
// have no warm cache to serve from, so the cheap local-current request must
// have the same fallback the town pages already use. Reuses the shared
// reshaper (Open-Meteo object shape) and pulls just the current + today's
// range out of it.
async function fetchLocalCurrentFromOwm(
  lat: number,
  lon: number,
): Promise<LocalCurrent | null> {
  try {
    const om = await fetchOpenWeatherMapAsOpenMeteo({ latitude: lat, longitude: lon });
    if (!om) return null;
    const cur = om.current ?? {};
    const numOrNull = (v: unknown): number | null => (Number.isFinite(v) ? Number(v) : null);
    const tempC = numOrNull(cur.temperature_2m);
    if (tempC == null) return null;
    const feelsLikeC = numOrNull(cur.apparent_temperature);
    const windKph = numOrNull(cur.wind_speed_10m); // already km/h from the reshaper
    const daily = om.daily ?? {};
    const todayMaxRaw = numOrNull(Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[0] : null);
    const todayMinRaw = numOrNull(Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[0] : null);
    const base: LocalCurrent = {
      tempC: Math.round(tempC),
      feelsLikeC: feelsLikeC != null ? Math.round(feelsLikeC) : Math.round(tempC),
      windKph: windKph != null ? Math.round(windKph) : 0,
      windDirection: compass(cur.wind_direction_10m),
      windDirectionDeg: numOrNull(cur.wind_direction_10m),
      description: describe(cur.weather_code),
      weatherCode: numOrNull(cur.weather_code),
      isDay: cur.is_day === 1,
      todayMaxC: todayMaxRaw != null ? Math.round(todayMaxRaw) : null,
      todayMinC: todayMinRaw != null ? Math.round(todayMinRaw) : null,
      // OWM reshaper exposes current.precipitation (mm liquid-equivalent);
      // it has no separate snow-cm field, so snowfallCm stays null on this path.
      precipMm: numOrNull(cur.precipitation) != null ? Math.round(Number(cur.precipitation) * 10) / 10 : null,
      snowfallCm: numOrNull(cur.snowfall) != null ? Math.round(Number(cur.snowfall) * 10) / 10 : null,
      observedAt: new Date().toISOString(),
      source: "OpenWeatherMap",
    };
    // No grid elevation on the OWM path; reconcile by distance alone.
    return applyObservedOverride(base, lat, lon, null);
  } catch (err) {
    console.warn("[local-weather] OWM fallback failed:", err);
    return null;
  }
}

// Resolve current conditions for arbitrary visitor coords, Open-Meteo first
// with an OpenWeatherMap fallback. Never let a single degraded upstream leave
// the visitor with "local conditions unavailable" when the other source works.
async function fetchLocalCurrent(lat: number, lon: number): Promise<LocalCurrent | null> {
  const direct = await fetchLocalCurrentFromOpenMeteo(lat, lon);
  if (direct) return direct;
  return fetchLocalCurrentFromOwm(lat, lon);
}

// Friendly locality label for arbitrary coords. Builds "Locality, Subdivision"
// (e.g. "Woolloomooloo, New South Wales"), best-effort: any failure returns null
// and the client falls back to a neutral label.
//
// Three sources, tried in order of suburb-accuracy then reliability
// (see fetchPlaceName):
//   - Google Geocoding API (keyed by GOOGLE_PLACES_API_KEY) is the primary: a
//     server-appropriate, reliable source that resolves the actual suburb
//     ("Woolloomooloo") from its locality/sublocality components. Billable, but
//     labels are cached per ~1.1km cell for 24h (placeNameCache) so real call
//     volume - and cost - stays tiny.
//   - BigDataCloud's keyless "reverse-geocode-client" is a free suburb-level
//     backup, used only when Google is unavailable. It is a browser-intended
//     geocoder that can get rate-limited when hammered from a single server IP,
//     so we never depend on it alone.
//   - OpenWeatherMap's keyed reverse-geocoder is the dependable floor: it only
//     resolves to town/city ("Sydney"), never the suburb, but it always answers,
//     so the label degrades to the city rather than vanishing.
async function fetchPlaceNameFromOwm(
  lat: number,
  lon: number,
): Promise<string | null> {
  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const arr: unknown = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const d = arr[0] as Record<string, unknown>;
    const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    const locality = str(d.name);
    const region = str(d.state);
    const parts = [locality, region].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    return locality || null;
  } catch (err) {
    console.warn("[local-weather] OWM reverse-geocode failed:", err);
    return null;
  }
}

async function fetchPlaceNameFromBigDataCloud(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const d: any = await res.json();
    const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    // Prefer the suburb (`locality`, e.g. "Woolloomooloo") over the broader
    // `city` ("Sydney") - the finer label is the whole point of this source. In
    // rural areas `locality` is the town (e.g. "Jindabyne") while `city` is the
    // wider LGA ("Snowy Monaro"), so suburb-first is the better label there too.
    // Fall through to null (not the country) so the chain can prefer OWM's town
    // label over a useless "Australia".
    const locality = str(d.locality) || str(d.city);
    const region = str(d.principalSubdivision);
    const parts = [locality, region].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    return null;
  } catch (err) {
    console.warn("[local-weather] BigDataCloud reverse-geocode failed:", err);
    return null;
  }
}

async function fetchPlaceNameFromGoogle(
  lat: number,
  lon: number,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=en&key=${apiKey}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    if (data?.status !== "OK" || !Array.isArray(data.results)) return null;
    const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    // Pick the best populated-place label across all results. `locality` is the
    // right unit in BOTH markets: in Australia the suburb is the locality
    // ("Woolloomooloo", "Surry Hills"; the CBD correctly reads "Sydney"), and in
    // Japan the locality is the recognisable town/village ("Hakuba", "Niseko",
    // "Yamanouchi"). Google's JP `sublocality` is a hyper-local district ("Hokujo",
    // "Fujimi") that nobody recognises, so locality MUST rank above sublocality.
    // The finer types are only fallbacks for the rare point with no locality.
    const SUBURB_TYPES = [
      "locality",
      "postal_town",
      "sublocality_level_1",
      "sublocality",
      "neighborhood",
    ];
    let suburb = "";
    let suburbRank = SUBURB_TYPES.length;
    let region = "";
    for (const result of data.results) {
      for (const comp of result?.address_components ?? []) {
        const types: string[] = Array.isArray(comp?.types) ? comp.types : [];
        if (!region && types.includes("administrative_area_level_1")) {
          region = str(comp.long_name);
        }
        for (let i = 0; i < suburbRank; i++) {
          if (types.includes(SUBURB_TYPES[i])) {
            suburb = str(comp.long_name);
            suburbRank = i;
            break;
          }
        }
      }
    }
    if (!suburb) return null;
    const parts = [suburb, region].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  } catch (err) {
    console.warn("[local-weather] Google reverse-geocode failed:", err);
    return null;
  }
}

async function fetchPlaceName(lat: number, lon: number): Promise<string | null> {
  // Google is the reliable suburb-level primary, so try it first and return its
  // label when it answers (the common path - one keyed call, then cached 24h).
  const google = await fetchPlaceNameFromGoogle(lat, lon);
  if (google) return google;
  // Google unavailable (quota/error): fall back to the free suburb source and
  // the dependable town/city floor, resolved in parallel. `bdc ?? cityLevel`
  // still degrades cleanly to "Sydney" rather than no label - never a regression.
  const [bdc, cityLevel] = await Promise.all([
    fetchPlaceNameFromBigDataCloud(lat, lon),
    fetchPlaceNameFromOwm(lat, lon),
  ]);
  return bdc ?? cityLevel;
}

router.get("/local-weather", async (req, res) => {
  const lat = Number(req.query.latitude);
  const lon = Number(req.query.longitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    res.status(400).json({ error: "INVALID_COORDINATES" });
    return;
  }

  try {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cachedWeather = localCache.get(key);
    const cachedName = placeNameCache.get(key);

    // Resolve current conditions and the friendly place label together
    // (cache-first, both best-effort) so a cold cache costs a single round-trip
    // rather than two sequential ones.
    const [current, placeName] = await Promise.all([
      (async (): Promise<LocalCurrent | null> => {
        if (cachedWeather?.fresh) return cachedWeather.value;
        const fresh = await fetchLocalCurrent(lat, lon);
        if (fresh) {
          localCache.set(key, fresh);
          return fresh;
        }
        return cachedWeather?.value ?? null; // serve stale on upstream failure
      })(),
      (async (): Promise<string | null> => {
        if (cachedName?.fresh) return cachedName.value;
        const fresh = await fetchPlaceName(lat, lon);
        if (fresh) {
          placeNameCache.set(key, fresh);
          return fresh;
        }
        return cachedName?.value ?? null;
      })(),
    ]);

    const nearest = findNearestRegion(lat, lon);
    const nearestRegion = nearest
      ? {
          id: nearest.r.id,
          name: nearest.r.name,
          country: nearest.r.country,
          countryCode: nearest.r.countryCode,
          href: nearest.r.href,
          headlineLabel: nearest.r.headlineLabel,
          distanceKm: Math.round(nearest.distanceKm),
        }
      : null;

    if (!current && !nearestRegion) {
      res.status(502).json({ error: "LOCAL_WEATHER_UNAVAILABLE" });
      return;
    }

    // Per-visitor data keyed on their coordinates - mark private so shared
    // CDNs/proxies never serve one person's location to another.
    res.set("Cache-Control", "private, max-age=300");
    res.json({
      place: { latitude: lat, longitude: lon, name: placeName },
      current,
      nearestRegion,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[local-weather] error:", err);
    res.status(500).json({ error: "LOCAL_WEATHER_ERROR" });
  }
});

export default router;
