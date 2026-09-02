// Charlotte Pass's OFFICIAL on-mountain report, exposed through its own
// public report page. The same HTML document contains the five lift tabs,
// source-owned `article:modified_time`, and an "As at" report date.
//
// Honesty rules:
// - exactly the five known lift tabs must be present, once each;
// - every tab must contain a recognised explicit status;
// - the report date must match the source modification date in Sydney;
// - the source modification time must be no more than 24 hours old.

import type { LiveLift } from "./thredboLiftStatus.js";

export interface CharlottePassLiveLiftStatus {
  lifts: LiveLift[];
  updatedAt: string;
}

export const CHARLOTTE_PASS_LIFT_REPORT_URL = "https://charlottepass.com.au/on-mountain/";
const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const STALE_MAX_MS = 30 * 60 * 1000;
const MAX_SOURCE_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 10 * 60 * 1000;
const USER_AGENT =
  "feelzlike-weather-app/1.0 (+https://feelzlike.com; lift status attribution shown to users)";

const EXPECTED_LIFTS = [
  { name: "Kosciuszko Triple Chair", type: "chairlift" },
  { name: "Kosi Carpet", type: "magic-carpet" },
  { name: "Guthries Double Chair", type: "chairlift" },
  { name: "Pulpit T-Bar", type: "t-bar" },
  { name: "Basin Poma", type: "poma" },
] as const satisfies readonly { name: string; type: LiveLift["type"] }[];

function decodeHtml(raw: string): string {
  const named: Record<string, string> = {
    amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"',
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
  return `charlottes-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function mapStatus(raw: string): LiveLift["status"] | null {
  const status = raw.replace(/^lift status:\s*/i, "").trim().toLowerCase();
  if (
    status === "open" ||
    status === "open to mid station" ||
    status === "open to the top for the better skiers and boarders"
  ) return "open";
  if (status === "closed") return "closed";
  if (status === "on hold" || status === "hold") return "on-hold";
  if (status === "wind hold" || status === "wind-hold") return "wind-hold";
  if (status === "scheduled" || status === "standby" || status === "opening") return "scheduled";
  return null;
}

function sydneyDate(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

function reportDate(raw: string): string | null {
  const match = decodeHtml(raw).match(/As at\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (!match) return null;
  const month = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ].indexOf(match[2]!.toLowerCase());
  if (month < 0) return null;
  const date = new Date(Date.UTC(Number(match[3]), month, Number(match[1]), 12));
  if (
    date.getUTCFullYear() !== Number(match[3]) ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== Number(match[1])
  ) return null;
  return `${match[3]}-${String(month + 1).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
}

/** Strict parser for the resort's single, version-coupled official page. */
export function parseCharlottePassLiftHtml(
  html: string,
  nowMs = Date.now(),
): CharlottePassLiveLiftStatus | null {
  const modified = html.match(
    /<meta\s+property=["']article:modified_time["']\s+content=["']([^"']+)["']\s*\/?>/i,
  )?.[1];
  if (!modified) return null;
  const updatedMs = Date.parse(modified);
  if (
    Number.isNaN(updatedMs) ||
    nowMs - updatedMs > MAX_SOURCE_AGE_MS ||
    updatedMs - nowMs > MAX_FUTURE_SKEW_MS
  ) return null;
  if (reportDate(html) !== sydneyDate(updatedMs)) return null;

  const controls = html.match(/<ul class="et_pb_tabs_controls clearfix">([\s\S]*?)<\/ul>/i)?.[1];
  if (!controls) return null;
  const controlRows = [
    ...controls.matchAll(/<li class="et_pb_tab_(\d+)[^"]*"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/li>/gi),
  ];
  const tabNames = controlRows.map((match) => decodeHtml(match[2]!));
  if (
    tabNames.length !== EXPECTED_LIFTS.length ||
    tabNames.some((name, index) => (
      Number(controlRows[index]![1]) !== index ||
      name !== EXPECTED_LIFTS[index]!.name
    ))
  ) return null;

  const contentStart = html.indexOf('<div class="et_pb_all_tabs">', html.indexOf(controls));
  if (contentStart < 0) return null;
  const content = html.slice(contentStart);
  const tabStarts = [...content.matchAll(/<div class="et_pb_tab et_pb_tab_(\d+)[^"]*"[^>]*>/gi)];
  if (tabStarts.length !== EXPECTED_LIFTS.length) return null;

  const lifts: LiveLift[] = [];
  for (let index = 0; index < EXPECTED_LIFTS.length; index++) {
    const start = tabStarts[index]!;
    if (Number(start[1]) !== index || start.index == null) return null;
    const end = tabStarts[index + 1]?.index ?? content.length;
    const tab = content.slice(start.index, end);
    // The fifth tab currently includes this exact harmless preface. Keep the
    // heading adjacent to the opening tab-content tag so a closed/empty
    // wrapper cannot borrow an unrelated heading later in the tab.
    const statusHeading = tab.match(
      /<div class="et_pb_tab_content">\s*(?:<p>OPEN<\/p>\s*)?<h4>([\s\S]*?)<\/h4>/i,
    )?.[1];
    if (!statusHeading) return null;
    const status = mapStatus(decodeHtml(statusHeading));
    if (!status) return null;
    const expected = EXPECTED_LIFTS[index]!;
    lifts.push({
      id: slugify(expected.name),
      name: expected.name,
      type: expected.type,
      status,
    });
  }
  return { lifts, updatedAt: new Date(updatedMs).toISOString() };
}

export function isCharlottePassStatusFresh(
  value: CharlottePassLiveLiftStatus,
  nowMs = Date.now(),
): boolean {
  const updatedMs = Date.parse(value.updatedAt);
  return !Number.isNaN(updatedMs) &&
    nowMs - updatedMs <= MAX_SOURCE_AGE_MS &&
    updatedMs - nowMs <= MAX_FUTURE_SKEW_MS;
}

let cache: { fetchedAt: number; value: CharlottePassLiveLiftStatus | null } | null = null;
let inflight: Promise<CharlottePassLiveLiftStatus | null> | null = null;

async function fetchFeed(): Promise<CharlottePassLiveLiftStatus | null> {
  try {
    const res = await fetch(CHARLOTTE_PASS_LIFT_REPORT_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) return null;
    return parseCharlottePassLiftHtml(await res.text());
  } catch {
    return null;
  }
}

export async function getCharlottePassLiveLiftStatus(): Promise<CharlottePassLiveLiftStatus | null> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    if (!cache.value || isCharlottePassStatusFresh(cache.value, now)) return cache.value;
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
      isCharlottePassStatusFresh(cache.value, fallbackNow)
    ) return cache.value;
    cache = { fetchedAt: Date.now(), value: null };
    return null;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}