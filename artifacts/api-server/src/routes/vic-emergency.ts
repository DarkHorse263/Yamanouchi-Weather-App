import { Router, type IRouter, type Request, type Response } from "express";
import { LruTtlCache } from "../lib/lru-cache.js";

/**
 * VicEmergency incidents endpoint - filters the public Emergency Management
 * Victoria feeds down to events that affect Victoria's High Country alpine
 * road corridors. No upstream API key required.
 *
 * Sources (both pulled in parallel):
 *   - https://data.emergency.vic.gov.au/Show?pageId=getIncidentJSON
 *     (active fire / structure / grass / hazmat incidents from CFA, DELWP, MFB)
 *   - https://data.emergency.vic.gov.au/Show?pageId=getWarningJSON
 *     (official CAP warnings: bushfire, evacuate, road closures, severe weather)
 *
 * Both return `{ results: [...] }` with flat objects keyed by `incidentNo`,
 * `category1`, `incidentType`, `incidentLocation`, `name`, `latitude`,
 * `longitude`, `lastUpdatedDt` etc. (NOT GeoJSON.)
 *
 * Why this exists: VicRoads has no public per-camera API and VicTraffic
 * doesn't cover the alpine routes. VicEmergency is the only free, keyless,
 * authoritative feed for closures, fires, tree-down and severe weather on
 * the Great Alpine Road, Bogong High Plains Road, Mt Buller Road etc.
 *
 * Filtering strategy (in order):
 *   1. Drop "Safe" (resolved) status - we only want active alerts.
 *   2. Coarse bounding box around the High Country.
 *   3. Curated alpine-road keyword match against the `name` + `incidentLocation`
 *      text (since EMV puts the street/road name in `name` and the suburb in
 *      `incidentLocation`).
 *   4. If no road match but coords are inside the bbox AND it's a Warning or
 *      a fire incident, keep it as a regional advisory (mapped to all VHC towns).
 *
 * Cached for 3 minutes (fresh) + 27 minutes (stale-while-revalidate).
 */

const router: IRouter = Router();

const INCIDENTS_URL =
  "https://data.emergency.vic.gov.au/Show?pageId=getIncidentJSON";
const WARNINGS_URL =
  "https://data.emergency.vic.gov.au/Show?pageId=getWarningJSON";

const SOURCE_LABEL = "VicEmergency (Emergency Management Victoria)";
const SOURCE_PAGE_URL = "https://emergency.vic.gov.au/respond/";
const USER_AGENT =
  "feelzlike/0.3 (alpine-conditions; contact@feelzlike.com)";

// Coarse bounding box covering all 6 VHC mountains and their access roads.
// Mansfield (NW) ~ -37.05, 146.09 ; Warburton (SW) ~ -37.76, 145.69 ;
// Mt Hotham (NE) ~ -36.98, 147.20 ; Lake Mtn (S) ~ -37.52, 145.90.
// Padded generously - the road-name filter is the precision step.
const VHC_BBOX = {
  minLat: -37.95,
  maxLat: -36.55,
  minLng: 145.45,
  maxLng: 147.45,
};

const ALL_VHC_TOWNS = [
  "mansfield",
  "bright",
  "mount-beauty",
  "harrietville",
  "dinner-plain",
  "marysville",
  "warburton",
];

/**
 * Curated road -> base-town affinity. Keys are normalized road-name fragments
 * (lowercase, no punctuation) we look for in the incident's name/location
 * text. Values are the VHC base town ids whose access this road affects.
 *
 * Order matters - first hit wins, so keep more-specific names ("bogong high
 * plains road") above shorter ones ("alpine road") that would also match.
 */
const ALPINE_ROADS: Array<{
  match: string[];
  displayName: string;
  towns: string[];
}> = [
  {
    match: ["bogong high plains road", "bogong high plains rd"],
    displayName: "Bogong High Plains Road",
    towns: ["mount-beauty"],
  },
  {
    match: ["mount buller road", "mt buller road", "mt buller rd"],
    displayName: "Mt Buller Road",
    towns: ["mansfield"],
  },
  {
    match: ["mount stirling road", "mt stirling road", "stirling road"],
    displayName: "Mt Stirling Road",
    towns: ["mansfield"],
  },
  {
    match: ["lake mountain road", "lake mountain rd"],
    displayName: "Lake Mountain Road",
    towns: ["marysville"],
  },
  {
    match: ["mount donna buang road", "donna buang road", "donna buang rd"],
    displayName: "Mt Donna Buang Road",
    towns: ["warburton"],
  },
  {
    match: ["great alpine road", "great alpine rd"],
    displayName: "Great Alpine Road",
    // Bright + Harrietville + Dinner Plain all sit on the GAR.
    towns: ["bright", "harrietville", "dinner-plain"],
  },
  {
    match: ["maroondah highway", "maroondah hwy"],
    displayName: "Maroondah Highway",
    towns: ["marysville"],
  },
  {
    match: ["warburton highway", "warburton hwy"],
    displayName: "Warburton Highway",
    towns: ["warburton"],
  },
  {
    match: ["mansfield woods point road", "mansfield-woods point road"],
    displayName: "Mansfield-Woods Point Road",
    towns: ["mansfield"],
  },
  {
    match: ["kiewa valley highway", "kiewa valley hwy"],
    displayName: "Kiewa Valley Highway",
    towns: ["mount-beauty"],
  },
  {
    match: ["tawonga gap road", "tawonga gap rd"],
    displayName: "Tawonga Gap Road",
    towns: ["bright", "mount-beauty"],
  },
];

/**
 * Suburbs that sit on the alpine corridors - if an incident's
 * `incidentLocation` matches one of these we map it to the nearby town(s)
 * even if the `name` field doesn't contain a recognisable road.
 */
const SUBURB_TOWNS: Record<string, string[]> = {
  mansfield: ["mansfield"],
  bright: ["bright"],
  harrietville: ["harrietville"],
  porepunkah: ["bright"],
  "mount beauty": ["mount-beauty"],
  tawonga: ["mount-beauty"],
  "tawonga south": ["mount-beauty"],
  "dinner plain": ["dinner-plain"],
  hotham: ["dinner-plain"],
  "hotham heights": ["dinner-plain"],
  "falls creek": ["mount-beauty"],
  marysville: ["marysville"],
  buxton: ["marysville"],
  "lake mountain": ["marysville"],
  warburton: ["warburton"],
  "east warburton": ["warburton"],
  "mt buller": ["mansfield"],
  "mount buller": ["mansfield"],
};

interface NormalizedIncident {
  id: string;
  category: string;
  subCategory?: string;
  status?: string;
  sourceOrg?: string;
  name: string;
  location?: string;
  description?: string;
  url?: string;
  roadName?: string;
  nearbyTownIds: string[];
  lat?: number;
  lng?: number;
  updated: string;
}

interface CachedPayload {
  incidents: NormalizedIncident[];
  fetchedAt: string;
}

const cache = new LruTtlCache<CachedPayload>({
  maxEntries: 4,
  freshMs: 3 * 60_000,
  staleMs: 27 * 60_000,
});

const CACHE_KEY = "vhc";

function pickString(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

function pickNumber(
  obj: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

function withinBbox(lat: number, lng: number) {
  return (
    lat >= VHC_BBOX.minLat &&
    lat <= VHC_BBOX.maxLat &&
    lng >= VHC_BBOX.minLng &&
    lng <= VHC_BBOX.maxLng
  );
}

function matchAlpineRoad(haystack: string):
  | { displayName: string; towns: string[] }
  | undefined {
  const lower = haystack.toLowerCase();
  for (const road of ALPINE_ROADS) {
    if (road.match.some((m) => lower.includes(m))) {
      return { displayName: road.displayName, towns: road.towns };
    }
  }
  return undefined;
}

function matchSuburb(suburbRaw: string | undefined): string[] {
  if (!suburbRaw) return [];
  const key = suburbRaw.toLowerCase().trim();
  if (SUBURB_TOWNS[key]) return SUBURB_TOWNS[key];
  // Some EMV entries include compound location like "5KM SW OF BRIGHT" -
  // try to match any known suburb word inside the string.
  for (const [sub, towns] of Object.entries(SUBURB_TOWNS)) {
    if (key.includes(sub)) return towns;
  }
  return [];
}

async function fetchFeed(url: string): Promise<unknown[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!r.ok) throw new Error(`upstream ${r.status} for ${url}`);
    const json = (await r.json()) as unknown;
    if (
      json &&
      typeof json === "object" &&
      Array.isArray((json as { results?: unknown[] }).results)
    ) {
      return (json as { results: unknown[] }).results;
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function normalize(
  raw: unknown,
  feedKind: "incident" | "warning",
): NormalizedIncident | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;

  const status = pickString(r, "incidentStatus", "status");
  // Drop resolved events - we only want active ones.
  if (status && /^(safe|complete|cancell?ed|resolved|stopped|out)$/i.test(status))
    return undefined;

  const lat = pickNumber(r, "latitude", "lat");
  const lng = pickNumber(r, "longitude", "lng", "long");

  // For incidents we have coords; for warnings sometimes we don't.
  // If we have coords, require bbox containment.
  if (typeof lat === "number" && typeof lng === "number") {
    if (!withinBbox(lat, lng)) return undefined;
  } else if (feedKind === "incident") {
    // Incidents without coords are unusual - skip.
    return undefined;
  }

  const name = pickString(r, "name", "title", "webHeadline") ?? "";
  const location = pickString(
    r,
    "incidentLocation",
    "location",
    "address",
  );
  const municipality = pickString(r, "municipality");

  const haystack = `${name} ${location ?? ""} ${municipality ?? ""}`;
  const roadMatch = matchAlpineRoad(haystack);
  // NOTE: `||` is wrong here - empty array is truthy in JS, so the
  // municipality fallback would never fire. Use length check explicitly.
  const locationTowns = matchSuburb(location);
  const suburbTowns =
    locationTowns.length > 0 ? locationTowns : matchSuburb(municipality);

  // If there's no road match AND no recognised suburb AND we have no coords,
  // we can't tie it to VHC - skip.
  if (
    !roadMatch &&
    suburbTowns.length === 0 &&
    (typeof lat !== "number" || typeof lng !== "number")
  ) {
    return undefined;
  }

  const category =
    pickString(r, "category1", "category", "feedType") ??
    (feedKind === "warning" ? "Warning" : "Incident");
  const subCategory = pickString(
    r,
    "category2",
    "subCategory",
    "incidentType",
    "type",
  );

  // Regional advisory mapping (all 7 VHC towns) is intentionally narrow:
  // we only do it for warnings or fire-like incidents that are inside the
  // bbox but don't pin to a specific road or suburb. Otherwise an unrelated
  // grass-cut or vehicle accident in a far corner of the bbox would surface
  // on every town page as if it were relevant.
  const isWarning = feedKind === "warning" || /warning/i.test(category);
  const isFireLike = /fire|burn|bushfire|grass/i.test(
    `${category} ${subCategory ?? ""}`,
  );
  const allowRegionalFallback = isWarning || isFireLike;
  const sourceOrg = pickString(r, "agency", "sourceOrg", "territory");
  const id =
    pickString(r, "incidentNo", "id", "guid") ??
    (typeof r["incidentNo"] === "number" ? String(r["incidentNo"]) : undefined) ??
    `${feedKind}-${Math.random().toString(36).slice(2, 10)}`;

  // EMV gives us either an epoch-ms `lastUpdatedDt` or the human string
  // `lastUpdatedDtStr`. Prefer epoch -> ISO; fall back to the string.
  let updated: string;
  const epoch = pickNumber(r, "lastUpdatedDt");
  if (typeof epoch === "number") {
    updated = new Date(epoch).toISOString();
  } else {
    updated =
      pickString(r, "lastUpdatedDtStr", "lastUpdateDateTime", "originDateTime") ??
      new Date().toISOString();
  }

  // Description: synthesise something useful from the raw fields since EMV
  // doesn't always populate `webBody`. Format: "<incidentType> · <size> · <status>"
  const incidentType = pickString(r, "incidentType");
  const incidentSize = pickString(r, "incidentSizeFmt", "incidentSize");
  const descParts = [incidentType, incidentSize, status].filter(Boolean);
  const description = descParts.length ? descParts.join(" · ") : undefined;

  // Town affinity: road match wins (most specific), then suburb, then -
  // only for warnings or fire-like events - regional advisory across all
  // VHC towns. Anything else without a road/suburb match is dropped so we
  // don't surface unrelated bbox noise on every town page.
  let nearbyTownIds: string[];
  if (roadMatch) {
    nearbyTownIds = roadMatch.towns;
  } else if (suburbTowns.length > 0) {
    nearbyTownIds = suburbTowns;
  } else if (allowRegionalFallback) {
    nearbyTownIds = ALL_VHC_TOWNS;
  } else {
    return undefined;
  }

  return {
    id: String(id),
    category,
    subCategory,
    status,
    sourceOrg,
    name: name || roadMatch?.displayName || "Alpine area incident",
    location: location ? toTitleCase(location) : undefined,
    description,
    roadName: roadMatch?.displayName,
    nearbyTownIds,
    lat,
    lng,
    updated,
  };
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

class BothFeedsUnavailableError extends Error {
  constructor(message = "Both VicEmergency feeds failed") {
    super(message);
    this.name = "BothFeedsUnavailableError";
  }
}

async function fetchAndFilter(): Promise<CachedPayload> {
  // Track upstream success so that if BOTH feeds fail we can surface an
  // explicit error to the UI instead of returning an empty array (which the
  // UI would render as "no active alerts" - a dangerously misleading
  // false-clear).
  let incidentsOk = false;
  let warningsOk = false;
  const [incidents, warnings] = await Promise.all([
    fetchFeed(INCIDENTS_URL)
      .then((r) => {
        incidentsOk = true;
        return r;
      })
      .catch((e) => {
        console.error("[vic-emergency] incidents feed failed", e);
        return [] as unknown[];
      }),
    fetchFeed(WARNINGS_URL)
      .then((r) => {
        warningsOk = true;
        return r;
      })
      .catch((e) => {
        console.error("[vic-emergency] warnings feed failed", e);
        return [] as unknown[];
      }),
  ]);

  if (!incidentsOk && !warningsOk) {
    throw new BothFeedsUnavailableError();
  }

  const all: NormalizedIncident[] = [];
  for (const raw of incidents) {
    const n = normalize(raw, "incident");
    if (n) all.push(n);
  }
  for (const raw of warnings) {
    const n = normalize(raw, "warning");
    if (n) all.push(n);
  }

  // De-dupe by id (warnings & incidents sometimes overlap).
  const seen = new Set<string>();
  const unique = all.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });

  // Most-recent first.
  unique.sort((a, b) => (a.updated < b.updated ? 1 : -1));

  return { incidents: unique, fetchedAt: new Date().toISOString() };
}

async function getCached(): Promise<CachedPayload> {
  const entry = cache.get(CACHE_KEY);
  if (entry?.fresh) return entry.value;

  if (entry?.stale) {
    fetchAndFilter()
      .then((p) => cache.set(CACHE_KEY, p))
      .catch((err) =>
        console.error("[vic-emergency] background refresh failed", err),
      );
    return entry.value;
  }

  // Cold cache. If both upstreams fail this throws BothFeedsUnavailableError,
  // which the route handler maps to 502 (so the UI's isError state fires
  // instead of showing a misleading "no alerts").
  const fresh = await fetchAndFilter();
  cache.set(CACHE_KEY, fresh);
  return fresh;
}

router.get("/vic-emergency-incidents", async (req: Request, res: Response) => {
  try {
    const payload = await getCached();
    const town =
      typeof req.query["town"] === "string" ? req.query["town"] : undefined;

    const incidents = town
      ? payload.incidents.filter((i) => i.nearbyTownIds.includes(town))
      : payload.incidents;

    res.json({
      incidents,
      lastUpdated: payload.fetchedAt,
      source: SOURCE_LABEL,
      sourceUrl: SOURCE_PAGE_URL,
    });
  } catch (err) {
    console.error("[vic-emergency] fetch failed", err);
    res.status(502).json({
      error: "UPSTREAM_UNAVAILABLE",
      message: "VicEmergency feed is currently unavailable.",
    });
  }
});

export default router;
