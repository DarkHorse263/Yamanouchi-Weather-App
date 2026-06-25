// New Zealand surface-observation reconciliation from airport METAR.
//
// Why this exists: the global forecast model (Open-Meteo / OpenWeatherMap) that
// drives "current conditions" routinely headlines "Clear sky / light drizzle, 0mm"
// for a valley town while solid rain is actually falling - the model lags reality
// by a couple of hours. Japan corrects this against JMA AMeDAS (see amedas.ts) and
// Australia against BOM AWS (see bom-obs.ts). New Zealand has no free real-time
// surface-obs API (NIWA / MetService feeds are paid; CliFlo is ~24h delayed), so
// the only free, key-less, real-time "is it raining right now" signal is airport
// METAR from the NOAA Aviation Weather Center. NZ airports report AUTO METARs whose
// present-weather group (RA / SN / DZ / SHRA ...) is a real observation of what is
// falling. Queenstown Airport (NZQN) sits in the Queenstown valley, which fixes the
// reported "clear sky while pouring" case for the town.
//
// Philosophy (mirrors amedas.ts + bom-obs.ts): RECONCILE, never replace. We only
// ever correct a model "dry/clear" headline towards wetter/cloudier reality - we
// never turn a wet model reading dry. Curated airport stations with strict distance
// AND elevation gates so a valley airport never "corrects" a peak 1300m above it
// (a resort high above its nearest airport simply gets no override). Fail-soft: a
// METAR outage degrades to "no override", it never breaks the weather response.

const ENDPOINT = "https://aviationweather.gov/api/data/metar";
const UA = "feelzlike/1.0 (mountain-weather-pwa; contact: hello@feelzlike.app)";

// Curated airport stations near the NZ towns/regions the app covers. Only stations
// genuinely co-located with a town can produce an override (see the gates below);
// the rest are candidates that simply lose the distance/elevation test for alpine
// resorts. Coordinates/elevation are read from each live METAR record, so this list
// is only an id allow-list (no stale hand-maintained coordinates).
const STATION_IDS = [
  "NZQN", // Queenstown Airport (valley, ~356m) - co-located with Queenstown town
  "NZWF", // Wanaka Airport - co-located with Wanaka town
  "NZMC", // Mount Cook Aerodrome
  "NZCH", // Christchurch International
  "NZTU", // Timaru
  "NZDN", // Dunedin
  "NZAP", // Taupo
  "NZRO", // Rotorua
  "NZOH", // Ohakea (RNZAF, central North Island)
];

// New Zealand bounding box - lets every caller short-circuit before doing any METAR
// work for non-NZ coordinates.
const NZ = { latMin: -47.5, latMax: -34, lonMin: 166, lonMax: 179 };
export function isInNewZealand(lat: number, lon: number): boolean {
  return lat >= NZ.latMin && lat <= NZ.latMax && lon >= NZ.lonMin && lon <= NZ.lonMax;
}

// Eligibility gates. A town's nearest airport must be both close AND at a similar
// altitude before we trust its observation to represent that town's conditions.
const MAX_DIST_KM = 30;
const MAX_ELEV_DELTA_M = 250;
// 1m of elevation difference costs as much as 0.05km of horizontal distance when
// breaking ties between two eligible stations (same convention as amedas.ts).
const ELEV_PENALTY_PER_M = 0.05;

type Intensity = "light" | "moderate" | "heavy";

export interface ParsedWx {
  rain: boolean;
  snow: boolean;
  drizzle: boolean;
  snowGrains: boolean;
  hail: boolean;
  shower: boolean;
  thunder: boolean;
  intensity: Intensity;
  /** true when any precipitation type was observed at the station. */
  any: boolean;
}

export interface NzMetarOverride {
  weatherCode: number;
  stationName: string;
  distanceKm: number;
  observedAt: string;
  rateMmh: number;
}

interface MetarRecord {
  icaoId: string;
  obsTime?: number;
  reportTime?: string;
  temp?: number;
  dewp?: number;
  wxString?: string | null;
  lat: number;
  lon: number;
  elev?: number;
  name?: string;
  cover?: string;
  clouds?: Array<{ cover?: string; base?: number | null }>;
}

// ── Pure parsing / decision (no network, no app imports; unit-testable) ────────

// METAR present-weather precipitation codes. Obscurations (BR/FG/HZ/FU), wind and
// cloud groups never match this, so non-precip tokens are ignored.
const PRECIP_RE = /(DZ|RA|SN|SG|PL|GR|GS)/;

/**
 * Parse a METAR present-weather string (e.g. "-SHRA", "RA HZ", "+SN") into a set
 * of precipitation flags plus an overall intensity. Vicinity ("VC...") groups are
 * ignored - they describe weather *near* the field, not at it.
 */
export function parsePresentWeather(wx: string | null | undefined): ParsedWx {
  const res: ParsedWx = {
    rain: false,
    snow: false,
    drizzle: false,
    snowGrains: false,
    hail: false,
    shower: false,
    thunder: false,
    intensity: "moderate",
    any: false,
  };
  if (!wx) return res;

  let sawHeavy = false;
  let sawModerate = false;
  let sawLight = false;

  for (let tok of wx.toUpperCase().split(/\s+/)) {
    if (!tok) continue;
    if (tok.startsWith("VC")) continue; // in the vicinity, not at the station

    let intensity: Intensity = "moderate";
    if (tok.startsWith("+")) {
      intensity = "heavy";
      tok = tok.slice(1);
    } else if (tok.startsWith("-")) {
      intensity = "light";
      tok = tok.slice(1);
    }

    if (tok.includes("TS")) res.thunder = true;
    if (tok.includes("SH")) res.shower = true;

    if (!PRECIP_RE.test(tok)) continue; // descriptor / obscuration only

    if (tok.includes("SN")) res.snow = true;
    if (tok.includes("RA")) res.rain = true;
    if (tok.includes("DZ")) res.drizzle = true;
    if (tok.includes("SG")) res.snowGrains = true;
    if (tok.includes("GR") || tok.includes("GS")) res.hail = true;

    if (intensity === "heavy") sawHeavy = true;
    else if (intensity === "light") sawLight = true;
    else sawModerate = true;
  }

  res.any = res.rain || res.snow || res.drizzle || res.snowGrains || res.hail;
  res.intensity = sawHeavy ? "heavy" : sawModerate ? "moderate" : sawLight ? "light" : "moderate";
  return res;
}

/**
 * Map parsed present-weather to a WMO weather code, consistent with the codes
 * amedas.ts/bom-obs.ts emit (drizzle 51/53/55, rain 61/63/65, rain showers
 * 80/81/82, snow 71/73/75, snow showers 85/86, snow grains 77). METAR states the
 * precipitation type explicitly, so we trust RA-vs-SN rather than splitting by
 * temperature; temperature only resolves a mixed rain+snow ("sleet") report.
 */
export function presentWeatherToWmo(p: ParsedWx, tempC: number | null): number | null {
  const cold = tempC != null && tempC <= 1;

  if (p.snow) {
    // Mixed rain+snow above freezing reads as rain; otherwise treat as snow.
    if (p.rain && !cold) {
      return p.shower
        ? p.intensity === "light"
          ? 80
          : p.intensity === "heavy"
            ? 82
            : 81
        : p.intensity === "light"
          ? 61
          : p.intensity === "heavy"
            ? 65
            : 63;
    }
    if (p.shower) return p.intensity === "light" ? 85 : 86; // WMO has no "moderate" snow shower
    return p.intensity === "light" ? 71 : p.intensity === "heavy" ? 75 : 73;
  }

  if (p.snowGrains) return 77;

  if (p.rain || p.hail) {
    return p.shower || p.hail
      ? p.intensity === "light"
        ? 80
        : p.intensity === "heavy"
          ? 82
          : 81
      : p.intensity === "light"
        ? 61
        : p.intensity === "heavy"
          ? 65
          : 63;
  }

  if (p.drizzle) return p.intensity === "light" ? 51 : p.intensity === "heavy" ? 55 : 53;

  return null;
}

// Conservative estimated precipitation rate (mm/h) for each WMO code. METAR carries
// no rain rate, so this is only a best-estimate number to surface alongside the
// corrected condition - never a measurement.
const RATE_BY_WMO: Record<number, number> = {
  51: 0.3,
  53: 0.6,
  55: 1.0,
  61: 0.5,
  63: 2.0,
  65: 6.0,
  71: 0.3,
  73: 1.0,
  75: 3.0,
  77: 0.3,
  80: 1.0,
  81: 3.0,
  82: 8.0,
  85: 0.5,
  86: 3.0,
};
export function rateForWmo(code: number): number {
  return RATE_BY_WMO[code] ?? 0.4;
}

/** Relative humidity (%) derived from temperature and dewpoint (Magnus formula). */
export function deriveRelHumidity(tempC: number | null, dewpC: number | null): number | null {
  if (tempC == null || dewpC == null || !Number.isFinite(tempC) || !Number.isFinite(dewpC)) {
    return null;
  }
  const es = (x: number) => Math.exp((17.625 * x) / (243.04 + x));
  const rh = (100 * es(dewpC)) / es(tempC);
  return Math.max(0, Math.min(100, rh));
}

// At/above this humidity a saturated station sitting under broken/overcast cloud is
// provably not under a "clear sky".
const INCLOUD_RH = 97;

/**
 * Decide whether a station's METAR contradicts a "dry/clear" model headline.
 * Pure and synchronous so it is trivially unit-testable. Returns the override to
 * apply, or null to leave the model reading untouched. DRY->WET only.
 */
export function decideNzOverride(input: {
  wxString: string | null | undefined;
  tempC: number | null;
  dewpC: number | null;
  cloudCovers?: string[];
  modelWeatherCode: number | null;
}): { weatherCode: number; rateMmh: number } | null {
  const { wxString, tempC, dewpC, cloudCovers, modelWeatherCode } = input;

  // Only ever correct a "dry" model headline (WMO < 50 = clear/cloud/fog).
  const modelIsDry = modelWeatherCode == null || modelWeatherCode < 50;
  if (!modelIsDry) return null;

  // Tier 1 - precipitation is actually being observed at the station.
  const p = parsePresentWeather(wxString);
  if (p.any) {
    const code = presentWeatherToWmo(p, tempC);
    if (code != null) return { weatherCode: code, rateMmh: rateForWmo(code) };
  }

  // Tier 2 - in-cloud sanity: the model says clear but the station is saturated and
  // sitting under broken/overcast cloud. Don't invent precipitation; just stop the
  // false "Clear sky". Stricter than BOM's RH-only rule because METAR temp/dewpoint
  // are integer-rounded, so we additionally require BKN/OVC cloud cover.
  const modelClear = modelWeatherCode === 0 || modelWeatherCode === 1;
  if (modelClear) {
    const rh = deriveRelHumidity(tempC, dewpC);
    const overcast =
      Array.isArray(cloudCovers) && cloudCovers.some((c) => c === "OVC" || c === "BKN");
    if (rh != null && rh >= INCLOUD_RH && overcast) {
      return { weatherCode: 3, rateMmh: 0 };
    }
  }

  return null;
}

// ── Network + station selection (fail-soft, shared cache) ──────────────────────

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

// One fetch of all curated stations covers every NZ surface in the app. Refresh at
// most every ~5min (METAR cadence is ~30-60min, but conditions can change fast).
let cache: { records: MetarRecord[]; fetchedAt: number } | null = null;
let inflight: Promise<MetarRecord[] | null> | null = null;
const TTL_MS = 5 * 60 * 1000;

async function getMetars(): Promise<MetarRecord[] | null> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) return cache.records;
  if (inflight) return inflight;
  inflight = (async () => {
    const url = `${ENDPOINT}?ids=${STATION_IDS.join(",")}&format=json`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": UA },
    });
    if (!res.ok) throw new Error(`metar ${res.status}`);
    const json = (await res.json()) as unknown;
    const records: MetarRecord[] = Array.isArray(json)
      ? (json as MetarRecord[]).filter(
          (r) => r && Number.isFinite(r.lat) && Number.isFinite(r.lon),
        )
      : [];
    cache = { records, fetchedAt: Date.now() };
    return records;
  })()
    .catch((err) => {
      console.warn("[metar-nz] fetch failed:", err);
      return cache?.records ?? null; // serve last-known on a blip
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

// Nearest curated station to a point that passes the distance + elevation gates.
async function getNzMetarObs(
  lat: number,
  lon: number,
  refElevationM: number | null,
): Promise<{ record: MetarRecord; distanceKm: number } | null> {
  const records = await getMetars();
  if (!records || records.length === 0) return null;

  let best: { score: number; record: MetarRecord; distanceKm: number } | null = null;
  for (const r of records) {
    const dist = haversineKm(lat, lon, r.lat, r.lon);
    if (dist > MAX_DIST_KM) continue;
    const elev = Number.isFinite(r.elev) ? (r.elev as number) : null;
    if (refElevationM != null && elev != null && Math.abs(elev - refElevationM) > MAX_ELEV_DELTA_M) {
      continue; // station too far above/below the town to represent it
    }
    let score = dist;
    if (refElevationM != null && elev != null) score += ELEV_PENALTY_PER_M * Math.abs(elev - refElevationM);
    if (!best || score < best.score) best = { score, record: r, distanceKm: dist };
  }
  return best ? { record: best.record, distanceKm: best.distanceKm } : null;
}

// "Queenstown Arpt, OT, NZ" -> "NZQN Queenstown Airport" for the source credit.
function stationLabel(rec: MetarRecord): string {
  const raw = (rec.name ?? "").split(",")[0]?.trim() ?? "";
  const pretty = raw.replace(/\bArpt\b/i, "Airport").replace(/\bIntl\b/i, "International");
  return pretty ? `${rec.icaoId} ${pretty}` : rec.icaoId;
}

/**
 * The reconciliation rule, in one place. Returns an override ONLY when the model
 * claims dry conditions but a co-located NZ airport METAR reports active precip
 * (or an in-cloud saturated overcast). Never turns a wet model reading dry, no-ops
 * outside New Zealand, and is best-effort: any failure returns null.
 */
export async function reconcileNzMetarDryToWet(args: {
  lat: number;
  lon: number;
  modelWeatherCode: number | null;
  tempC: number | null;
  refElevationM?: number | null;
}): Promise<NzMetarOverride | null> {
  const { lat, lon, modelWeatherCode, tempC, refElevationM } = args;
  if (!isInNewZealand(lat, lon)) return null;

  const modelIsDry = modelWeatherCode == null || modelWeatherCode < 50;
  if (!modelIsDry) return null;

  let obs: { record: MetarRecord; distanceKm: number } | null;
  try {
    obs = await getNzMetarObs(lat, lon, refElevationM ?? null);
  } catch (err) {
    console.warn("[metar-nz] observation lookup failed:", err);
    return null;
  }
  if (!obs) return null;

  const rec = obs.record;
  const decision = decideNzOverride({
    wxString: rec.wxString ?? null,
    tempC: Number.isFinite(rec.temp) ? (rec.temp as number) : tempC,
    dewpC: Number.isFinite(rec.dewp) ? (rec.dewp as number) : null,
    cloudCovers: Array.isArray(rec.clouds)
      ? rec.clouds.map((c) => c.cover ?? "").filter(Boolean)
      : rec.cover
        ? [rec.cover]
        : [],
    modelWeatherCode,
  });
  if (!decision) return null;

  const observedAt =
    rec.reportTime ||
    (Number.isFinite(rec.obsTime) ? new Date((rec.obsTime as number) * 1000).toISOString() : new Date().toISOString());

  return {
    weatherCode: decision.weatherCode,
    stationName: stationLabel(rec),
    distanceKm: Math.round(obs.distanceKm * 10) / 10,
    observedAt,
    rateMmh: decision.rateMmh,
  };
}
