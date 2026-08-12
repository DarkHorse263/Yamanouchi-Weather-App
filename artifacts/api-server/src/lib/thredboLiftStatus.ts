// ─────────────────────────────────────────────────────────────────────────────
// thredboLiftStatus.ts - Thredbo's OFFICIAL live per-lift status feed.
//
// Feed (LivePassLiftStatus.Generic.xsd):
//   https://www.thredbo.com.au/feeds/lift-status-report/
//   <liftStatusReport updated="2026-08-12T09:25:03.000+10:00">
//     <area name="Thredbo">
//       <lift name="Kosciuszko Chairlift" open="true" openingTime="08:30 am"
//             closingTime="04:30 pm" liftType="quad" status="open"/> ...
//
// This is the first VERIFIED live AU lift source (Phase 2 of the lift honesty
// plan - see the landmine note in routes/lifts.ts). Honesty rules:
//   - STRICT parse: a parseable `updated` stamp and at least one lift row with
//     a name + boolean-ish open flag are mandatory, or the result is null.
//   - Freshness guard at SERVE time: `updated` older than 24h -> null. The
//     resort refreshes the feed many times a day in season; a day-old claim
//     is not live status.
//   - Fail-soft: fetch/parse failure -> null (short serve-stale window only).
//     Callers fall back to the honest "no live status" mode - the static
//     catalogue must NEVER be dressed up as live data.
//
// Fetch discipline mirrors resortSnowReports.ts: 10s timeout · 5min TTL ·
// in-flight dedupe · serve-stale ≤30min on failure · identifying User-Agent.
// ─────────────────────────────────────────────────────────────────────────────

import { XMLParser } from "fast-xml-parser";

export interface LiveLift {
  id: string;
  name: string;
  type: "chairlift" | "t-bar" | "poma" | "gondola" | "magic-carpet" | "surface";
  status: "open" | "closed" | "on-hold" | "wind-hold" | "scheduled";
  openingTime?: string;
  closingTime?: string;
}

export interface ThredboLiveLiftStatus {
  lifts: LiveLift[];
  /** ISO 8601 stamp from the feed's own `updated` attribute. */
  updatedAt: string;
}

const FEED_URL = "https://www.thredbo.com.au/feeds/lift-status-report/";
const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 5 * 60 * 1000; // live status - refresh every 5 min
const STALE_MAX_MS = 30 * 60 * 1000; // serve-stale window on fetch failure
/** Feed `updated` older than this -> not live, return null. */
const MAX_FEED_AGE_MS = 24 * 60 * 60 * 1000;

const USER_AGENT =
  "feelzlike-weather-app/1.0 (+https://feelzlike.com; lift status attribution shown to users)";

/** Map the feed's liftType attribute onto our Lift.type enum. Unknown or
 *  blank types degrade to "surface" (the least specific claim). */
function mapLiftType(raw: string, name: string): LiveLift["type"] {
  const t = raw.trim().toLowerCase();
  if (t === "gondola") return "gondola";
  if (t === "tbar" || t === "t-bar") return "t-bar";
  if (t === "poma") return "poma";
  if (["quad", "double", "triple", "six", "chairlift", "chair"].includes(t)) return "chairlift";
  // Thredbo tags its beginner carpets liftType="surface"; call the ones that
  // are clearly carpets what they are.
  if (t === "surface" && /carpet|snow runner|conveyor/i.test(name)) return "magic-carpet";
  if (t === "surface" || t === "carpet") return t === "carpet" ? "magic-carpet" : "surface";
  // Blank liftType (e.g. "Merritts Gondola (Scenic)") - infer from the name.
  if (/gondola/i.test(name)) return "gondola";
  if (/t-bar|tbar/i.test(name)) return "t-bar";
  if (/chair/i.test(name)) return "chairlift";
  return "surface";
}

/** Map the feed's status/open pair onto our status enum. open=true is
 *  authoritative for "open"; otherwise map the status word conservatively -
 *  anything we don't recognise reads as "closed" (never invents "open"). */
function mapStatus(open: boolean, rawStatus: string): LiveLift["status"] {
  if (open) return "open";
  const s = rawStatus.trim().toLowerCase();
  if (s.includes("wind")) return "wind-hold";
  if (s.includes("hold")) return "on-hold";
  if (s === "standby" || s === "scheduled") return "scheduled";
  return "closed";
}

function slugify(name: string): string {
  return (
    "thredbo-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  );
}

/** Strict parse of the feed XML. Returns null on any structural surprise. */
export function parseThredboLiftXml(raw: string, nowMs = Date.now()): ThredboLiveLiftStatus | null {
  // htmlEntities: feed attribute values carry numeric entities (e.g.
  // name="Syd&#039;s Snow Runner") which would otherwise render literally.
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    processEntities: true,
    htmlEntities: true,
  });
  let doc: unknown;
  try {
    doc = parser.parse(raw);
  } catch {
    return null;
  }
  const report = (doc as Record<string, any>)?.liftStatusReport;
  if (!report) return null;

  const updatedAt = String(report["@_updated"] ?? "");
  const updatedMs = Date.parse(updatedAt);
  if (!updatedAt || Number.isNaN(updatedMs)) return null;
  // A stale feed is not live status - refuse rather than assert yesterday's
  // open/closed picture as today's.
  if (nowMs - updatedMs > MAX_FEED_AGE_MS) return null;

  const areas = Array.isArray(report.area) ? report.area : report.area ? [report.area] : [];
  const lifts: LiveLift[] = [];
  const seen = new Set<string>();
  for (const area of areas) {
    const rows = Array.isArray(area?.lift) ? area.lift : area?.lift ? [area.lift] : [];
    for (const row of rows) {
      const name = String(row?.["@_name"] ?? "").trim();
      const openRaw = String(row?.["@_open"] ?? "").trim().toLowerCase();
      if (!name || (openRaw !== "true" && openRaw !== "false")) continue;
      const open = openRaw === "true";
      let id = slugify(name);
      // Feed can repeat names across areas (e.g. scenic vs winter gondola
      // rows are distinct names, but be safe about collisions).
      while (seen.has(id)) id = `${id}-2`;
      seen.add(id);
      const openingTime = String(row?.["@_openingTime"] ?? "").trim() || undefined;
      const closingTime = String(row?.["@_closingTime"] ?? "").trim() || undefined;
      lifts.push({
        id,
        name,
        type: mapLiftType(String(row?.["@_liftType"] ?? ""), name),
        status: mapStatus(open, String(row?.["@_status"] ?? "")),
        openingTime,
        closingTime,
      });
    }
  }
  // An empty lift list is a parse failure, not "all lifts removed".
  if (lifts.length === 0) return null;

  return { lifts, updatedAt };
}

let cache: { fetchedAt: number; value: ThredboLiveLiftStatus | null } | null = null;
let inflight: Promise<ThredboLiveLiftStatus | null> | null = null;

async function fetchFeed(): Promise<ThredboLiveLiftStatus | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(FEED_URL, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/xml,text/xml" },
    });
    if (!res.ok) return null;
    return parseThredboLiftXml(await res.text());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Live Thredbo lift status, or null when the feed is down / unparseable /
 * stale. Callers treat null as "no verified live status" and fall back to
 * the honest reference-only mode - never to fabricated open/closed rows.
 */
export async function getThredboLiveLiftStatus(): Promise<ThredboLiveLiftStatus | null> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.value;
  if (inflight) return inflight;

  inflight = (async () => {
    const fresh = await fetchFeed();
    if (fresh) {
      cache = { fetchedAt: Date.now(), value: fresh };
      return fresh;
    }
    // Fetch failed: serve the previous GOOD result briefly (a resort feed
    // blip shouldn't flap the UI), but only within a short window - beyond
    // that, honesty wins and we report no live status.
    if (cache?.value && Date.now() - cache.fetchedAt < STALE_MAX_MS) {
      return cache.value;
    }
    cache = { fetchedAt: Date.now(), value: null };
    return null;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}
