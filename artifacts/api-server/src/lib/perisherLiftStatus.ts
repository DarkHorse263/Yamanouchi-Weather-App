// Perisher's OFFICIAL live per-lift status page.
//
// Source:
//   https://www.perisher.com.au/reports-cams/reports/lift-report
//
// The resort server-renders one table row per lift. Each row carries a status
// image with an explicit alt value (Open, Closed, Busy, On Hold, On Standby),
// followed by the lift name and operating times. The page also publishes
// summary counts. We require the rows to exactly match those counts and the
// four expected resort-area sections so a partial/template response can never
// be presented as live.
//
// Perisher does not print an update timestamp on the lift page itself. Its
// official snow report publishes both "Report Updated" and an "Expected
// Lifts" count linked to this lift report. We fetch both official pages and
// require:
//   - the report-owned timestamp is <=24h old;
//   - the report carries a plausible positive operating-lift count;
//   - all lift rows, counts, and areas pass strict structural validation.
//
// The snow report is a morning plan while the lift report changes through the
// day, so their open counts legitimately diverge as lifts open or go on hold.
// The lift page's own summary must still agree exactly with every parsed row.

import type { LiveLift } from "./thredboLiftStatus.js";

export interface PerisherLiveLiftStatus {
  lifts: LiveLift[];
  updatedAt: string;
}

const FEED_URL = "https://www.perisher.com.au/reports-cams/reports/lift-report";
const REPORT_URL = "https://www.perisher.com.au/reports-cams/reports/snow-report";
const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const STALE_MAX_MS = 30 * 60 * 1000;
const MAX_SOURCE_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 10 * 60 * 1000;
const EXPECTED_AREAS = ["Perisher Valley", "Smiggin Holes", "Blue Cow", "Guthega"] as const;
const USER_AGENT =
  "feelzlike-weather-app/1.0 (+https://feelzlike.com; lift status attribution shown to users)";

function decodeHtml(raw: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => named[name.toLowerCase()] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(name: string): string {
  return (
    "perisher-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  );
}

function mapLiftType(name: string): LiveLift["type"] {
  if (/conveyor|carpet/i.test(name)) return "magic-carpet";
  if (/t-?bar/i.test(name)) return "t-bar";
  if (/\bpoma\b/i.test(name)) return "poma";
  if (/gondola/i.test(name)) return "gondola";
  if (/chair/i.test(name)) return "chairlift";
  if (/^Mt Perisher 6$/i.test(name)) return "chairlift";
  return "surface";
}

function mapStatus(raw: string): LiveLift["status"] | null {
  const status = raw.trim().toLowerCase();
  if (status === "open" || status === "busy") return "open";
  if (status === "closed") return "closed";
  if (status === "on hold" || status === "hold") return "on-hold";
  if (status === "on standby" || status === "standby") return "scheduled";
  return null;
}

function imageAlt(cell: string): string {
  const match = cell.match(/<img\b[^>]*\balt\s*=\s*(["'])(.*?)\1/i);
  return match ? decodeHtml(match[2]!) : "";
}

function sydneyWallTimeToUtc(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const wallAsUtc = Date.UTC(year, monthIndex, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(wallAsUtc));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const representedAsUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
  );
  return wallAsUtc - (representedAsUtc - wallAsUtc);
}

function parseReportProof(
  raw: string,
  nowMs: number,
): { updatedAt: string; expectedLifts: number } | null {
  const updated = decodeHtml(raw).match(
    /Report Updated:\s*(\d{1,2})\s+([A-Za-z]{3})\s+(\d{1,2}):(\d{2})(am|pm)/i,
  );
  const expectedLifts = raw.match(
    /(?:Lifts Open|Expected Lifts)[\s\S]{0,500}?tab-big[^>]*>\s*(\d+)/i,
  );
  if (!updated || !expectedLifts) return null;

  const monthIndex = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec",
  ].indexOf(updated[2]!.toLowerCase());
  if (monthIndex < 0) return null;
  let hour = Number(updated[3]);
  if (hour < 1 || hour > 12) return null;
  if (updated[5]!.toLowerCase() === "pm" && hour !== 12) hour += 12;
  if (updated[5]!.toLowerCase() === "am" && hour === 12) hour = 0;

  const currentSydneyYear = Number(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      year: "numeric",
    }).format(new Date(nowMs)),
  );
  let updatedMs = sydneyWallTimeToUtc(
    currentSydneyYear,
    monthIndex,
    Number(updated[1]),
    hour,
    Number(updated[4]),
  );
  if (updatedMs - nowMs > MAX_SOURCE_AGE_MS) {
    updatedMs = sydneyWallTimeToUtc(
      currentSydneyYear - 1,
      monthIndex,
      Number(updated[1]),
      hour,
      Number(updated[4]),
    );
  }
  if (
    nowMs - updatedMs > MAX_SOURCE_AGE_MS ||
    updatedMs - nowMs > MAX_FUTURE_SKEW_MS
  ) {
    return null;
  }
  return {
    updatedAt: new Date(updatedMs).toISOString(),
    expectedLifts: Number(expectedLifts[1]),
  };
}

/** Strict parser for Perisher's official server-rendered lift report pair. */
export function parsePerisherLiftHtml(
  liftHtml: string,
  snowReportHtml: string,
  nowMs = Date.now(),
): PerisherLiveLiftStatus | null {
  const hasOfficialReportHeading =
    /Current Lift Status/i.test(liftHtml) ||
    (
      /<h1[^>]*>\s*Lift Report\s*<\/h1>/i.test(liftHtml) &&
      /<h1[^>]*>\s*Lifts expected to open(?:&nbsp;|\s)*today\s*<\/h1>/i.test(liftHtml)
    );
  if (!hasOfficialReportHeading) return null;
  const proof = parseReportProof(snowReportHtml, nowMs);
  if (!proof) return null;
  if (!EXPECTED_AREAS.every((area) => liftHtml.includes(`>${area}<`))) return null;

  const summary = liftHtml.match(
    /Open:\s*(\d+)[\s\S]*?Closed:\s*(\d+)[\s\S]*?Busy:\s*(\d+)[\s\S]*?On Hold:\s*(\d+)[\s\S]*?On Standby:\s*(\d+)/i,
  );
  if (!summary) return null;
  const summaryCounts = summary.slice(1).map(Number);
  const expectedRows = summaryCounts.reduce((sum, value) => sum + value, 0);
  if (expectedRows <= 0) return null;

  const lifts: LiveLift[] = [];
  const seen = new Set<string>();
  for (const row of liftHtml.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? []) {
    if (!/\blift_image\b/i.test(row)) continue;
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]!);
    if (cells.length < 2) return null;
    const status = mapStatus(imageAlt(cells[0]!));
    const name = decodeHtml(cells[1]!);
    if (!status || !name) return null;

    let id = slugify(name);
    while (seen.has(id)) id = `${id}-2`;
    seen.add(id);
    const openingTime = cells[2] ? decodeHtml(cells[2]) || undefined : undefined;
    const closingTime = cells[3] ? decodeHtml(cells[3]) || undefined : undefined;
    lifts.push({
      id,
      name,
      type: mapLiftType(name),
      status,
      openingTime,
      closingTime,
    });
  }

  // Count agreement is the structural integrity check: reject empty, partial,
  // or layout-changed pages instead of claiming the missing lifts are closed.
  if (lifts.length === 0 || lifts.length !== expectedRows) return null;
  if (
    !Number.isInteger(proof.expectedLifts) ||
    proof.expectedLifts <= 0 ||
    proof.expectedLifts > lifts.length
  ) return null;
  return { lifts, updatedAt: proof.updatedAt };
}

let cache: { fetchedAt: number; value: PerisherLiveLiftStatus | null } | null = null;
let inflight: Promise<PerisherLiveLiftStatus | null> | null = null;

/** Freshness is source-owned, not cache-owned. Every cache read must re-check
 * this so a report fetched near the 24h boundary cannot outlive that boundary. */
export function isPerisherStatusFresh(
  value: PerisherLiveLiftStatus,
  nowMs = Date.now(),
): boolean {
  const updatedMs = Date.parse(value.updatedAt);
  return (
    !Number.isNaN(updatedMs) &&
    nowMs - updatedMs <= MAX_SOURCE_AGE_MS &&
    updatedMs - nowMs <= MAX_FUTURE_SKEW_MS
  );
}

async function fetchFeed(): Promise<PerisherLiveLiftStatus | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const options = {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    };
    const [liftRes, reportRes] = await Promise.all([
      fetch(FEED_URL, options),
      fetch(REPORT_URL, options),
    ]);
    if (!liftRes.ok || !reportRes.ok) return null;
    return parsePerisherLiftHtml(await liftRes.text(), await reportRes.text());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Fresh official Perisher lift rows, or null on outage/staleness/surprise. */
export async function getPerisherLiveLiftStatus(): Promise<PerisherLiveLiftStatus | null> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    if (!cache.value || isPerisherStatusFresh(cache.value, now)) return cache.value;
    cache = null;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const fresh = await fetchFeed();
    if (fresh) {
      cache = { fetchedAt: Date.now(), value: fresh };
      return fresh;
    }
    const fallbackNow = Date.now();
    if (
      cache?.value &&
      fallbackNow - cache.fetchedAt < STALE_MAX_MS &&
      isPerisherStatusFresh(cache.value, fallbackNow)
    ) {
      return cache.value;
    }
    cache = { fetchedAt: Date.now(), value: null };
    return null;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}