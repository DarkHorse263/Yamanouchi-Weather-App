// JMA AMeDAS surface observations - real measured precipitation across ~1300
// Japanese stations, refreshed every 10 minutes, free and key-less.
//
// Why this exists: NWP models (Open-Meteo / OpenWeatherMap) routinely report
// "clear, 0mm" for the current timestep while light orographic/convective rain is
// actually falling in the mountains - the model lags reality by a couple of hours.
// AMeDAS is a network of ground sensors, so it catches "it is raining right now"
// when the forecast models don't. We use it to reconcile (never replace) the
// model-derived "current conditions" the rest of the app shows: when the model
// says dry but a nearby station is wet, we override the headline to match reality.
//
// Endpoints (all under https://www.jma.go.jp/bosai/amedas):
//   const/amedastable.json  - station id -> { lat:[deg,min], lon:[deg,min], alt, names }
//   data/latest_time.txt    - ISO timestamp of the most recent observation map
//   data/map/{YYYYMMDDhhmmss}.json - ALL stations for that timestamp in one fetch
//
// One map fetch per ~5min covers every Japanese surface in the app.

const BASE = "https://www.jma.go.jp/bosai/amedas";
const TABLE_URL = `${BASE}/const/amedastable.json`;
const LATEST_TIME_URL = `${BASE}/data/latest_time.txt`;
const mapUrl = (ts: string) => `${BASE}/data/map/${ts}.json`;
const UA = "feelzlike/1.0 (mountain-weather-pwa; contact: info@feelzlike.com)";

// Japan bounding box - lets every caller short-circuit before doing any AMeDAS
// work for non-Japanese coordinates (AMeDAS only covers Japan).
const JP = { latMin: 24, latMax: 46, lonMin: 122, lonMax: 154 };
export function isInJapan(lat: number, lon: number): boolean {
  return lat >= JP.latMin && lat <= JP.latMax && lon >= JP.lonMin && lon <= JP.lonMax;
}

export interface Station {
  id: string;
  lat: number;
  lon: number;
  alt: number | null;
  name: string;
}

// Raw map values are [value, qualityFlag] tuples; we only read value (index 0).
export type RawObs = Record<string, [number, number] | undefined>;
interface MapData {
  observedAt: string; // ISO local time string from latest_time.txt
  obs: Record<string, RawObs>;
}

export interface ObservedPrecip {
  rateMmh: number; // best-estimate precipitation rate, mm/h
  precip10mMm: number | null;
  precip1hMm: number | null;
  tempC: number | null; // station temperature where reported
  stationName: string;
  distanceKm: number;
  observedAt: string;
}

export interface PrecipOverride {
  weatherCode: number;
  stationName: string;
  distanceKm: number;
  observedAt: string;
  rateMmh: number;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

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

// ── Station table: changes rarely, cache for the process lifetime ──────────────
let stationTable: Station[] | null = null;
let stationTablePromise: Promise<Station[]> | null = null;

async function loadStationTable(): Promise<Station[]> {
  if (stationTable) return stationTable;
  if (stationTablePromise) return stationTablePromise;
  stationTablePromise = (async () => {
    const res = await fetch(TABLE_URL, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": UA },
    });
    if (!res.ok) throw new Error(`AMeDAS table ${res.status}`);
    const raw = (await res.json()) as Record<string, any>;
    const list: Station[] = [];
    for (const [id, m] of Object.entries(raw)) {
      if (!Array.isArray(m?.lat) || !Array.isArray(m?.lon)) continue;
      const lat = Number(m.lat[0]) + Number(m.lat[1]) / 60;
      const lon = Number(m.lon[0]) + Number(m.lon[1]) / 60;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const name =
        typeof m.enName === "string" && m.enName
          ? m.enName
          : typeof m.kjName === "string"
            ? m.kjName
            : id;
      list.push({ id, lat, lon, alt: num(m.alt), name });
    }
    stationTable = list;
    return list;
  })().catch((err) => {
    stationTablePromise = null; // allow a later retry
    throw err;
  });
  return stationTablePromise;
}

// ── Latest observation map: refresh at most every 5min (AMeDAS cadence is 10) ──
let mapData: { data: MapData; fetchedAt: number } | null = null;
let mapPromise: Promise<MapData | null> | null = null;
const MAP_TTL_MS = 5 * 60 * 1000;

async function getLatestMap(): Promise<MapData | null> {
  const now = Date.now();
  if (mapData && now - mapData.fetchedAt < MAP_TTL_MS) return mapData.data;
  if (mapPromise) return mapPromise;
  mapPromise = (async () => {
    const tRes = await fetch(LATEST_TIME_URL, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": UA },
    });
    if (!tRes.ok) throw new Error(`AMeDAS latest_time ${tRes.status}`);
    const iso = (await tRes.text()).trim(); // e.g. 2026-06-12T05:20:00+09:00
    // map files are named YYYYMMDDhhmmss; strip separators and pad seconds.
    const ts = iso.replace(/[-:T]/g, "").slice(0, 12) + "00";
    const mRes = await fetch(mapUrl(ts), {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": UA },
    });
    if (!mRes.ok) throw new Error(`AMeDAS map ${mRes.status}`);
    const obs = (await mRes.json()) as Record<string, RawObs>;
    const data: MapData = { observedAt: iso, obs };
    mapData = { data, fetchedAt: Date.now() };
    return data;
  })()
    .catch((err) => {
      console.warn("[amedas] map fetch failed:", err);
      return mapData?.data ?? null; // serve last-known on a blip
    })
    .finally(() => {
      mapPromise = null;
    });
  return mapPromise;
}

const RADIUS_KM = 25;
// 1m of elevation difference costs as much as 0.05km of horizontal distance.
// This is what makes a similar-elevation valley station 19km away beat a 1473m
// ridge sensor 10km away that (being above the weather) reads 0mm while the
// valley pours - exactly the failure that produced "sunny while raining".
const ELEV_PENALTY_PER_M = 0.05;

// Real measured precipitation nearest to a point. refElevationM, when known,
// biases selection toward stations at a similar altitude.
export async function getObservedPrecip(
  lat: number,
  lon: number,
  refElevationM?: number | null,
): Promise<ObservedPrecip | null> {
  if (!isInJapan(lat, lon)) return null;
  let table: Station[];
  let map: MapData | null;
  try {
    [table, map] = await Promise.all([loadStationTable(), getLatestMap()]);
  } catch (err) {
    console.warn("[amedas] observation lookup failed:", err);
    return null;
  }
  if (!map) return null;

  let best: { score: number; st: Station; o: RawObs; dist: number } | null = null;
  for (const st of table) {
    const o = map.obs[st.id];
    if (!o) continue;
    const p10 = o.precipitation10m?.[0];
    const p1h = o.precipitation1h?.[0];
    if (p10 == null && p1h == null) continue; // no precip sensor / no reading
    const dist = haversineKm(lat, lon, st.lat, st.lon);
    if (dist > RADIUS_KM) continue;
    let score = dist;
    if (refElevationM != null && st.alt != null) {
      score += ELEV_PENALTY_PER_M * Math.abs(st.alt - refElevationM);
    }
    if (!best || score < best.score) best = { score, st, o, dist };
  }
  if (!best) return null;

  const p10 = num(best.o.precipitation10m?.[0]);
  const p1h = num(best.o.precipitation1h?.[0]);
  const temp = num(best.o.temp?.[0]);
  // 10-min total is the freshest "right now" signal; ×6 -> mm/h. Fall back to
  // the trailing-hour total if the 10-min field is missing.
  const rateMmh = p10 != null ? p10 * 6 : (p1h ?? 0);
  return {
    rateMmh,
    precip10mMm: p10,
    precip1hMm: p1h,
    tempC: temp,
    stationName: best.st.name,
    distanceKm: Math.round(best.dist * 10) / 10,
    observedAt: map.observedAt,
  };
}

// Map an observed precipitation rate to a WMO weather code, splitting rain vs
// snow by temperature (this is a ski app - the distinction matters).
export function precipRateToWmo(rateMmh: number, tempC: number | null): number | null {
  if (!(rateMmh > 0)) return null;
  const snowing = tempC != null && tempC <= 1;
  if (snowing) return rateMmh < 1 ? 71 : rateMmh < 4 ? 73 : 75;
  return rateMmh < 0.6 ? 51 : rateMmh < 2.5 ? 61 : rateMmh < 7.6 ? 63 : 65;
}

// The reconciliation rule, in one place. Returns an override ONLY when the model
// claims dry conditions but a nearby station is actually wet. Never turns a wet
// model reading dry - we only ever correct false "clear" headlines.
export async function reconcileDryToWet(args: {
  lat: number;
  lon: number;
  modelWeatherCode: number | null;
  tempC: number | null;
  refElevationM?: number | null;
}): Promise<PrecipOverride | null> {
  const { lat, lon, modelWeatherCode, tempC, refElevationM } = args;
  if (!isInJapan(lat, lon)) return null;
  const modelIsDry = modelWeatherCode == null || modelWeatherCode < 50;
  if (!modelIsDry) return null;

  const obs = await getObservedPrecip(lat, lon, refElevationM);
  if (!obs) return null;
  const wet =
    (obs.precip10mMm != null && obs.precip10mMm > 0) ||
    (obs.precip1hMm != null && obs.precip1hMm >= 0.5);
  if (!wet) return null;

  const code = precipRateToWmo(obs.rateMmh, obs.tempC ?? tempC);
  if (code == null) return null;
  return {
    weatherCode: code,
    stationName: obs.stationName,
    distanceKm: obs.distanceKm,
    observedAt: obs.observedAt,
    rateMmh: obs.rateMmh,
  };
}

// ── Observed snow depth (winter only) ──────────────────────────────────────────
//
// A subset of AMeDAS stations carry snow sensors: `snow` = settled depth in cm,
// `snow24h` (and 1h/6h/12h) = fresh snowfall totals in cm. These keys exist in
// the map JSON ONLY while JMA is running its snow network (roughly Nov-May);
// out of season they vanish entirely, so this returns null all (southern-)
// summer - which is exactly the honest behaviour we want.

export interface ObservedSnow {
  depthCm: number;
  snowfall24hCm: number | null;
  stationName: string;
  stationElevationM: number | null;
  distanceKm: number;
  observedAt: string;
}

/**
 * Pure station selection for snow depth - exported so tests can exercise the
 * winter-shaped map JSON with synthetic fixtures (live verification is
 * impossible out of season; archived winter maps are not retained by JMA).
 *
 * Rules mirror getObservedPrecip: 25km radius, elevation-penalised distance
 * score. Only stations reporting a finite, non-negative `snow` depth qualify -
 * a missing key means "no snow sensor / out of season", never "0cm".
 */
export function selectSnowObservation(args: {
  stations: Station[];
  obs: Record<string, RawObs>;
  lat: number;
  lon: number;
  refElevationM?: number | null;
}): Omit<ObservedSnow, "observedAt"> | null {
  const { stations, obs, lat, lon, refElevationM } = args;
  let best: { score: number; st: Station; o: RawObs; dist: number } | null = null;
  for (const st of stations) {
    const o = obs[st.id];
    if (!o) continue;
    const depth = num(o.snow?.[0]);
    if (depth == null || depth < 0) continue; // no snow sensor / bad reading
    const dist = haversineKm(lat, lon, st.lat, st.lon);
    if (dist > RADIUS_KM) continue;
    let score = dist;
    if (refElevationM != null && st.alt != null) {
      score += ELEV_PENALTY_PER_M * Math.abs(st.alt - refElevationM);
    }
    if (!best || score < best.score) best = { score, st, o, dist };
  }
  if (!best) return null;

  const depth = num(best.o.snow?.[0]);
  if (depth == null || depth < 0) return null;
  const s24 = num(best.o.snow24h?.[0]);
  return {
    depthCm: depth,
    snowfall24hCm: s24 != null && s24 >= 0 ? s24 : null,
    stationName: best.st.name,
    stationElevationM: best.st.alt,
    distanceKm: Math.round(best.dist * 10) / 10,
  };
}

// Real measured snow depth nearest to a point. Fail-soft: any fetch problem or
// an out-of-season map (no snow keys anywhere) returns null and the caller
// simply omits the observed block.
export async function getObservedSnowDepth(
  lat: number,
  lon: number,
  refElevationM?: number | null,
): Promise<ObservedSnow | null> {
  if (!isInJapan(lat, lon)) return null;
  let table: Station[];
  let map: MapData | null;
  try {
    [table, map] = await Promise.all([loadStationTable(), getLatestMap()]);
  } catch (err) {
    console.warn("[amedas] snow lookup failed:", err);
    return null;
  }
  if (!map) return null;

  const picked = selectSnowObservation({
    stations: table,
    obs: map.obs,
    lat,
    lon,
    refElevationM,
  });
  if (!picked) return null;
  return { ...picked, observedAt: map.observedAt };
}
