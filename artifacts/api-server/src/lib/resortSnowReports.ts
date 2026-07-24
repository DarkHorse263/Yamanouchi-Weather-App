// ─────────────────────────────────────────────────────────────────────────────
// resortSnowReports.ts - resort-REPORTED snow conditions from official feeds.
//
// Adapters: Thredbo (structured XML feed), Falls Creek (ski-patrol JSON the
// resort site publishes), Mt Hotham (label-anchored parse of the resort's
// server-rendered snow-report page). This is the "reported" side of the
// snowDepthSource seam (see feelzlike skiSeason.ts): only a resort-reported
// figure may assert "no base" - weather-model depth is snowmaking-blind and
// stays advisory.
//
// Snowy Hydro official snow-course adapter (kind "course"): weekly measured
// NATURAL depth at Spencers Creek (1830m, between Perisher and Charlotte
// Pass - the course Perisher's own report cites). Off-resort + snowmaking-
// blind + weekly cadence, so it gets its own source kind, a 10-day freshness
// window (vs 36h for resort feeds), and - like model depth - may NEVER
// assert "no base" (see skiSeason.ts snowDepthSource contract).
//
// Deliberately ABSENT (checked July 2026): Perisher publishes numbers only in
// free prose (unparseable honestly); Mt Buller renders client-side from an
// API whose base URL isn't discoverable without JS. Excluded > guessed.
// Selwyn is deliberately NOT wired to Three Mile Dam (1460m): its natural
// reading is 0 for long stretches while the resort runs on snowmaking - an
// official-looking 0 would mislead worse than "not reported".
//
// Honesty rules baked in:
//   - STRICT parse: units="metric" required, <base amount> must be present and
//     numeric or the whole report is ABSENT (never defaulted to 0, which would
//     silently assert "no base" without evidence).
//   - 36h age guard applied at SERVE time against the feed's own `updated`
//     timestamp - a stale weekend feed degrades to null and the client falls
//     back to model depth, it never masquerades as fresh.
//   - Adapter registry keyed by weather locationId - resorts without a
//     structured feed simply have no entry and get `null` (the route always
//     answers 200 so the shared client fetch never error-retries).
//
// Fetch discipline (mirrors radar.ts / snowCache.ts patterns):
//   10s timeout · 30min TTL · in-flight dedupe · serve-stale ≤24h on failure ·
//   identifying User-Agent.
// ─────────────────────────────────────────────────────────────────────────────

import { XMLParser } from "fast-xml-parser";

export interface ResortSnowReport {
  /**
   * Provenance: "resort" = the resort's own official report; "course" = an
   * official off-resort snow-course measurement (natural snow only). The
   * client captions and skiability gates differ - a course reading may
   * display a base but never assert "no base".
   */
  kind: "resort" | "course";
  /** Reported snow base depth in centimetres. */
  baseCm: number;
  /** Cumulative season snowfall in cm, when the feed provides it. */
  seasonSnowfallCm: number | null;
  /** Most recent (24h) snowfall in cm, when the feed provides it. */
  lastSnowfallCm: number | null;
  /** ISO 8601 timestamp the RESORT last updated the report (feed attr). */
  updatedAt: string;
  /** Human name of the reporting resort, e.g. "Thredbo". */
  sourceName: string;
  /** Human snow-report page to credit/link - NOT the feed URL. */
  sourceUrl: string;
}

export type SnowReportAdapter = {
  /** Machine feed endpoint (or a builder when the URL is date-dependent). */
  feedUrl?: string;
  buildFeedUrl?: () => string;
  /** Human page shown to users as the source. */
  humanUrl: string;
  sourceName: string;
  /** Accept header for the feed fetch; defaults to XML. */
  accept?: string;
  /** Serve-time freshness window override (default MAX_REPORT_AGE_MS 36h).
   *  Weekly snow-course readings use ~10 days. */
  maxAgeMs?: number;
  parse: (raw: string, adapter: SnowReportAdapter) => ResortSnowReport | null;
};
type Adapter = SnowReportAdapter;

const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 30 * 60 * 1000; // refresh every 30 min
const STALE_MAX_MS = 24 * 60 * 60 * 1000; // serve-stale window on fetch failure
/** Feed's own `updated` older than this -> treat report as absent. */
const MAX_REPORT_AGE_MS = 36 * 60 * 60 * 1000;

const USER_AGENT =
  "feelzlike-weather-app/1.0 (+https://feelzlike.com; snow report attribution shown to users)";

/** Coerce an XML attribute / JSON field to a finite number, else null. NEVER
 *  defaults - and a blank/whitespace string is "unknown", not 0 (Number(" ")
 *  would coerce to 0 and silently assert "no base"). */
function attrNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// ── Thredbo XML adapter ──────────────────────────────────────────────────────
// Feed shape (LivePassSnowReport.Generic.xsd):
//   <snowReport updated="2026-07-09T07:57:13.000+10:00" units="metric">
//     <mountain name="Thredbo">
//       <snow24Hours amount="0"/> <snow7Days amount="43"/>
//       <season amount="43"/> <base amount="35.4"/> ...
function parseThredboXml(raw: string, adapter: Adapter): ResortSnowReport | null {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  let doc: unknown;
  try {
    doc = parser.parse(raw);
  } catch {
    return null;
  }
  const report = (doc as Record<string, any>)?.["snowReport"];
  if (!report) return null;

  // Strict: refuse imperial or unknown units rather than mislabel cm.
  if (String(report["@_units"] ?? "").toLowerCase() !== "metric") return null;

  const updatedAt = String(report["@_updated"] ?? "");
  if (!updatedAt || Number.isNaN(Date.parse(updatedAt))) return null;

  const mountain = Array.isArray(report.mountain) ? report.mountain[0] : report.mountain;
  if (!mountain) return null;

  // Base must be present AND numeric - absence is "unknown", never 0.
  const baseCm = attrNumber(mountain.base?.["@_amount"]);
  if (baseCm == null || baseCm < 0) return null;

  return {
    kind: "resort",
    baseCm,
    seasonSnowfallCm: attrNumber(mountain.season?.["@_amount"]),
    lastSnowfallCm: attrNumber(mountain.snow24Hours?.["@_amount"]),
    updatedAt,
    sourceName: mountain["@_name"] ? String(mountain["@_name"]) : adapter.sourceName,
    sourceUrl: adapter.humanUrl,
  };
}

// ── Falls Creek JSON adapter ─────────────────────────────────────────────────
// The resort site renders its snow report from a public ski-patrol JSON blob:
//   { "LastUpdate": "2026-07-13 09:10 UTC",
//     "Patrol": { "PatrolNaturalSnowDepth": 38, "PatrolFreshSnow": 12,
//                 "SeasonalSnowfallToDate": "" }, ... }
// The "_2021" in the URL is a theme-era filename, not a vintage - the blob is
// refreshed every morning (verified live). If the theme is ever rebuilt and
// the URL rots, strict parse fails -> report absent -> model fallback.
export function parseFallsCreekJson(raw: string, adapter: Adapter): ResortSnowReport | null {
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch {
    return null;
  }
  const root = doc as Record<string, any>;
  if (!root || typeof root !== "object") return null;

  // "2026-07-13 09:10 UTC" is not ISO - normalise or the 36h guard would
  // reject every report. A malformed stamp means NO report, never a fake one.
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?\s*UTC$/.exec(
    String(root.LastUpdate ?? "").trim(),
  );
  if (!m) return null;
  const updatedAt = `${m[1]}T${m[2]}:${m[3] ?? "00"}Z`;
  if (Number.isNaN(Date.parse(updatedAt))) return null;

  const patrol = root.Patrol;
  if (!patrol || typeof patrol !== "object") return null;

  // Natural depth measured by ski patrol - must be present AND numeric.
  const baseCm = attrNumber(patrol.PatrolNaturalSnowDepth);
  if (baseCm == null || baseCm < 0) return null;

  return {
    kind: "resort",
    baseCm,
    seasonSnowfallCm: attrNumber(patrol.SeasonalSnowfallToDate),
    lastSnowfallCm: attrNumber(patrol.PatrolFreshSnow),
    updatedAt,
    sourceName: adapter.sourceName,
    sourceUrl: adapter.humanUrl,
  };
}

// ── Mt Hotham HTML adapter ───────────────────────────────────────────────────
// Hotham's snow-report page is server-rendered (DNN) with labelled stat cards:
//   ... icon-depth.svg ...> Depth </p> <h2 class="...">48cm</h2>
// A label-anchored parse of a page is more rot-prone than a feed, so the
// strictness carries the honesty: Depth + a parseable report timestamp are
// both mandatory or the report is ABSENT; a redesign degrades to null and the
// client falls back to model depth.

/** `Label </p> <h2>NNcm</h2>` stat-card extractor. Chart configs elsewhere on
 *  the page say "Depth (cm)" inside JSON strings and cannot match this shape. */
function extractHothamStatCm(html: string, label: string): number | null {
  const re = new RegExp(
    label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
      String.raw`\s*</p>\s*<h2[^>]*>\s*(\d{1,3}(?:\.\d+)?)\s*cm\s*</h2>`,
    "i",
  );
  const m = re.exec(html);
  if (!m) return null;
  return attrNumber(m[1]);
}

const MONTH_INDEX: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

/** Parse report stamps like "Mon 13 July, 07:47AM" (no year!) into ISO.
 *  Year is inferred: current Melbourne year unless that lands >24h in the
 *  future (a January page still showing "31 December"), then the year before.
 *  Offset uses AEDT (+11) Nov-Mar, AEST (+10) otherwise - within a day of the
 *  actual DST transitions, and a ±1h slip is immaterial to a 36h guard.
 *  Multiple stamps on the page (grooming vs snow report tabs) - take the most
 *  recent non-future one as the freshest report time. */
export function parseHothamTimestamp(html: string, nowMs = Date.now()): string | null {
  const re =
    /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
  let best: number | null = null;
  for (const m of html.matchAll(re)) {
    const day = Number(m[1]);
    const month = MONTH_INDEX[m[2].toLowerCase()];
    if (month == null || !(day >= 1 && day <= 31)) continue;
    let hour = Number(m[3]) % 12;
    if (m[5].toUpperCase() === "PM") hour += 12;
    const minute = Number(m[4]);
    if (!(hour >= 0 && hour <= 23) || !(minute >= 0 && minute <= 59)) continue;
    const offsetH = month >= 10 || month <= 2 ? 11 : 10;
    const nowYear = new Date(nowMs).getUTCFullYear();
    for (const year of [nowYear, nowYear - 1]) {
      const t = Date.UTC(year, month, day, hour - offsetH, minute);
      if (t <= nowMs + 24 * 60 * 60 * 1000) {
        if (best == null || t > best) best = t;
        break;
      }
    }
  }
  return best == null ? null : new Date(best).toISOString();
}

export function parseHothamHtml(raw: string, adapter: Adapter): ResortSnowReport | null {
  // Base depth is mandatory - no number on the page, no report.
  const baseCm = extractHothamStatCm(raw, "Depth");
  if (baseCm == null || baseCm < 0) return null;

  // A parseable timestamp is mandatory too: the 36h guard depends on it and
  // we never fabricate freshness.
  const updatedAt = parseHothamTimestamp(raw);
  if (!updatedAt) return null;

  return {
    kind: "resort",
    baseCm,
    seasonSnowfallCm: extractHothamStatCm(raw, "Season Total"),
    lastSnowfallCm: extractHothamStatCm(raw, "Last 24hrs"),
    updatedAt,
    sourceName: adapter.sourceName,
    sourceUrl: adapter.humanUrl,
  };
}

// ── Snowy Hydro official snow-course adapter ─────────────────────────────────
// Snowy Hydro publishes weekly measured natural snow depths for three courses
// (Spencers Creek 1830m, Deep Creek 1620m, Three Mile Dam 1460m) as JSON:
//   { "2026": { "snowyhydro": { "level": [
//       { "-date": "2026-07-21",
//         "snow": { "-name": "Spencers Creek",
//                   "-dataTimestamp": "2026-07-21T12:00:00",
//                   "-quality": "G", "#text": "68" } }, ... ] } } }
// `snow` appears only on reading dates (lake levels fill the other rows) and
// may be an object or an array. Strictness rules: quality "G" (good) only, a
// parseable date, and a numeric depth - anything else is skipped, and no
// usable entry means NO report (never a defaulted 0).

/** Latest ISO timestamp for a course entry: prefer -dataTimestamp (append
 *  AEST offset when the feed omits a zone), fall back to the row date at
 *  local noon. Returns null when neither parses. */
function courseEntryTimestamp(entry: Record<string, unknown>, rowDate: string): string | null {
  const stamp = String(entry["-dataTimestamp"] ?? "").trim();
  if (stamp) {
    const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(stamp) ? stamp : `${stamp}+10:00`;
    if (!Number.isNaN(Date.parse(iso))) return iso;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(rowDate)) {
    const iso = `${rowDate}T12:00:00+10:00`;
    if (!Number.isNaN(Date.parse(iso))) return iso;
  }
  return null;
}

export function makeSnowyHydroCourseParser(courseName: string) {
  return function parseSnowyHydroJson(raw: string, adapter: Adapter): ResortSnowReport | null {
    let doc: unknown;
    try {
      doc = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!doc || typeof doc !== "object") return null;

    let best: { atMs: number; report: ResortSnowReport } | null = null;
    for (const yearBlock of Object.values(doc as Record<string, any>)) {
      const levels = yearBlock?.snowyhydro?.level;
      if (!Array.isArray(levels)) continue;
      for (const row of levels) {
        const rowDate = String(row?.["-date"] ?? "");
        const snow = row?.snow;
        if (!snow) continue;
        const entries: unknown[] = Array.isArray(snow) ? snow : [snow];
        for (const e of entries) {
          if (!e || typeof e !== "object") continue;
          const entry = e as Record<string, unknown>;
          if (String(entry["-name"] ?? "").trim() !== courseName) continue;
          // Quality flag: accept "G" (good) only - never surface a reading
          // Snowy Hydro itself marks doubtful.
          if (String(entry["-quality"] ?? "").trim().toUpperCase() !== "G") continue;
          const baseCm = attrNumber(entry["#text"]);
          if (baseCm == null || baseCm < 0) continue;
          const updatedAt = courseEntryTimestamp(entry, rowDate);
          if (!updatedAt) continue;
          const atMs = Date.parse(updatedAt);
          if (best == null || atMs > best.atMs) {
            best = {
              atMs,
              report: {
                kind: "course",
                baseCm,
                seasonSnowfallCm: null,
                lastSnowfallCm: null,
                updatedAt,
                sourceName: adapter.sourceName,
                sourceUrl: adapter.humanUrl,
              },
            };
          }
        }
      }
    }
    return best?.report ?? null;
  };
}

/** Course readings are weekly - the 36h resort-feed guard would reject every
 *  reading, so courses get a ~10-day window and the client shows the reading
 *  DATE (not "Xh ago") so nobody mistakes it for a daily report. */
const COURSE_MAX_AGE_MS = 10 * 24 * 60 * 60 * 1000;

const SNOWY_HYDRO_HUMAN_URL = "https://www.snowyhydro.com.au/generation/live-data/snow-depths/";

/** Feed URL is year-parameterised; use the current year in AU (season is
 *  Jun-Oct so no cross-new-year ambiguity) plus the prior year, mirroring
 *  the site's own chart request. */
function snowyHydroFeedUrl(): string {
  const year = Number(
    new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", year: "numeric" }).format(
      new Date(),
    ),
  );
  return `https://www.snowyhydro.com.au/wp-content/themes/snowyhydro/inc/getData.php?yearA=${year}&yearB=${year - 1}`;
}

function spencersCreekAdapter(): Adapter {
  return {
    buildFeedUrl: snowyHydroFeedUrl,
    humanUrl: SNOWY_HYDRO_HUMAN_URL,
    sourceName: "Snowy Hydro · Spencers Creek",
    accept: "application/json",
    maxAgeMs: COURSE_MAX_AGE_MS,
    parse: makeSnowyHydroCourseParser("Spencers Creek"),
  };
}

/** Adapter registry keyed by weather locationId (LOCATIONS ids). */
const ADAPTERS: Record<string, Adapter> = {
  thredbo: {
    feedUrl: "https://www.thredbo.com.au/feeds/snow-report/",
    humanUrl: "https://www.thredbo.com.au/weather/weather-report/",
    sourceName: "Thredbo",
    parse: parseThredboXml,
  },
  "falls-creek": {
    feedUrl: "https://www.fallscreek.com.au/wp-content/uploads/FCSnowReport_2021.json",
    humanUrl: "https://www.fallscreek.com.au/snowreport/",
    sourceName: "Falls Creek",
    accept: "application/json",
    parse: parseFallsCreekJson,
  },
  "mt-hotham": {
    feedUrl: "https://www.mthotham.com.au/mountain/conditions/snow-reports",
    humanUrl: "https://www.mthotham.com.au/mountain/conditions/snow-reports",
    sourceName: "Mt Hotham",
    accept: "text/html",
    parse: parseHothamHtml,
  },
  // Official weekly Spencers Creek (1830m) course for the two resorts it sits
  // between. Perisher's own snow report cites this course; Charlotte Pass
  // village is at 1760m right beside it.
  perisher: spencersCreekAdapter(),
  "charlottes-pass": spencersCreekAdapter(),
};

export function hasSnowReportAdapter(locationId: string): boolean {
  return locationId in ADAPTERS;
}

type CacheSlot = { report: ResortSnowReport | null; fetchedAt: number };
const cache = new Map<string, CacheSlot>();
const inflight = new Map<string, Promise<ResortSnowReport | null>>();
/** Short negative-cache after a FETCH failure so a feed outage past the TTL
 *  doesn't hold every request for up to the 10s timeout (in-flight dedupe
 *  only helps concurrent callers). Parse-nulls are NOT failures - the feed
 *  answered - and cache normally for the full TTL. */
const lastFailureAt = new Map<string, number>();
const FAILURE_BACKOFF_MS = 60_000;

async function fetchAndParse(adapter: Adapter): Promise<ResortSnowReport | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const feedUrl = adapter.buildFeedUrl ? adapter.buildFeedUrl() : adapter.feedUrl;
    if (!feedUrl) throw new Error("adapter has no feed URL");
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: adapter.accept ?? "application/xml,text/xml",
      },
    });
    if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
    const raw = await res.text();
    return adapter.parse(raw, adapter);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resort-reported snow conditions for a location, or null when: no adapter,
 * feed failure past the stale window, strict-parse failure, or the resort's
 * own `updated` timestamp is older than 36h (checked at serve time so a
 * cached-fresh-but-feed-stale report still degrades honestly).
 */
export async function getResortSnowReport(locationId: string): Promise<ResortSnowReport | null> {
  const adapter = ADAPTERS[locationId];
  if (!adapter) return null;

  const now = Date.now();
  const slot = cache.get(locationId);
  let report: ResortSnowReport | null;

  if (slot && now - slot.fetchedAt < CACHE_TTL_MS) {
    report = slot.report;
  } else if (now - (lastFailureAt.get(locationId) ?? -Infinity) < FAILURE_BACKOFF_MS) {
    // Recent fetch failure: back off instead of re-attempting on every
    // request. Serve the last good parse within the stale window, else null.
    report = slot && now - slot.fetchedAt < STALE_MAX_MS ? slot.report : null;
  } else {
    let promise = inflight.get(locationId);
    if (!promise) {
      promise = fetchAndParse(adapter)
        .then((parsed) => {
          lastFailureAt.delete(locationId);
          cache.set(locationId, { report: parsed, fetchedAt: Date.now() });
          return parsed;
        })
        .finally(() => inflight.delete(locationId));
      inflight.set(locationId, promise);
    }
    try {
      report = await promise;
    } catch (err) {
      lastFailureAt.set(locationId, Date.now());
      // Serve the last good parse if it's within the stale window; otherwise
      // degrade to null (the client falls back to model depth).
      if (slot && now - slot.fetchedAt < STALE_MAX_MS) {
        console.warn(
          `[resortSnowReports] ${locationId} feed refresh failed, serving stale (age=${now - slot.fetchedAt}ms):`,
          err instanceof Error ? err.message : err,
        );
        report = slot.report;
      } else {
        console.warn(
          `[resortSnowReports] ${locationId} feed unavailable, no usable cache:`,
          err instanceof Error ? err.message : err,
        );
        report = null;
      }
    }
  }

  // Feed-age guard at serve time - the source's own timestamp governs. 36h
  // for resort feeds; per-adapter override for weekly course readings.
  if (report) {
    const age = now - Date.parse(report.updatedAt);
    if (!Number.isFinite(age) || age > (adapter.maxAgeMs ?? MAX_REPORT_AGE_MS)) return null;
  }
  return report;
}
