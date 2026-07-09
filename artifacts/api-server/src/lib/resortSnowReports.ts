// ─────────────────────────────────────────────────────────────────────────────
// resortSnowReports.ts - resort-REPORTED snow conditions from official feeds.
//
// Pilot: Thredbo's structured XML feed. This is the "reported" side of the
// snowDepthSource seam (see feelzlike skiSeason.ts): only a resort-reported
// figure may assert "no base" - weather-model depth is snowmaking-blind and
// stays advisory.
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
  /** Resort-reported snow base depth in centimetres. */
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

type Adapter = {
  /** Machine feed endpoint. */
  feedUrl: string;
  /** Human page shown to users as the source. */
  humanUrl: string;
  sourceName: string;
  parse: (raw: string, adapter: Adapter) => ResortSnowReport | null;
};

const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 30 * 60 * 1000; // refresh every 30 min
const STALE_MAX_MS = 24 * 60 * 60 * 1000; // serve-stale window on fetch failure
/** Feed's own `updated` older than this -> treat report as absent. */
const MAX_REPORT_AGE_MS = 36 * 60 * 60 * 1000;

const USER_AGENT =
  "feelzlike-weather-app/1.0 (+https://feelzlike.com; snow report attribution shown to users)";

/** Coerce an XML attribute to a finite number, else null. NEVER defaults. */
function attrNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value));
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
    baseCm,
    seasonSnowfallCm: attrNumber(mountain.season?.["@_amount"]),
    lastSnowfallCm: attrNumber(mountain.snow24Hours?.["@_amount"]),
    updatedAt,
    sourceName: mountain["@_name"] ? String(mountain["@_name"]) : adapter.sourceName,
    sourceUrl: adapter.humanUrl,
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
    const res = await fetch(adapter.feedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/xml,text/xml" },
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

  // 36h feed-age guard at serve time - the resort's own timestamp governs.
  if (report) {
    const age = now - Date.parse(report.updatedAt);
    if (!Number.isFinite(age) || age > MAX_REPORT_AGE_MS) return null;
  }
  return report;
}
