/**
 * Daily production smoke test. Answers "is the site up, are all pages
 * healthy, and did any outbound link die?" without the owner having to
 * watch the app.
 *
 * What it checks (always against the LIVE site, never localhost):
 *  1. every URL in the production sitemap responds 200 AND serves its own
 *     canonical tag (a homepage canonical on a deep URL means the SPA
 *     catch-all rewrite swallowed a prerendered page - the exact regression
 *     class that caused the Google "alternative page" warnings)
 *  2. /api/healthz says ok, /api/regions returns the full region list,
 *     and one weather canary per country (AU/JP/NZ) returns data
 *  3. every user-facing external link in src/data + src/regions (from the
 *     generated manifest external-links.json) still resolves. Bot-blocked
 *     responses (403/429 etc.) count as reachable - only 404/410, hard 5xx
 *     and dead hosts fail, each retried once to filter transient blips.
 *
 * On failure it emails the owner (SMOKE_ALERT_EMAIL, falling back to the
 * first ADMIN_EMAILS entry) via the branded shell. All-clear runs only log.
 *
 * Scheduling is autoscale-safe. A plain in-process cron is NOT trustworthy
 * here: prod runs on autoscale, so at the scheduled minute the replica may be
 * asleep (silent miss - the worst failure mode for a watchdog) or several
 * replicas may be awake (duplicate emails). Instead `startSmokeCron()`
 * (gated RUN_SMOKE_CRON=1, kill switch SMOKE_CRON_DISABLED=1) runs a cheap
 * sweep - at 19:45 UTC via node-cron when awake, plus every few minutes as
 * catch-up - that asks "is today's run due and still unclaimed?" and claims
 * it atomically through the shared job_runs table (unique job_name+run_key
 * upsert, same claim-first pattern as alertEvaluator). Exactly one replica
 * wins; if the site is asleep at 19:45 the run fires on the next wake-up.
 * Manual trigger: POST /api/internal/smoke/run (bearer ALERT_TOKEN_SECRET).
 */

import cron, { type ScheduledTask } from "node-cron";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { db, jobRunsTable } from "@workspace/db";
import { sendEmail } from "../lib/emailSender.js";
import { brandedEmail } from "../lib/emailTemplates.js";
import externalLinks from "../data/external-links.json";
import { bandElevations } from "../lib/openMeteoElevation.js";

const ORIGIN = (process.env.SMOKE_TARGET_ORIGIN ?? process.env.PUBLIC_ORIGIN ?? "https://feelzlike.com").replace(/\/$/, "");

// A real browser UA gets far fewer bot walls than a curl-style one; the
// point is dead-link detection, not traffic disguise - blocked responses
// are still treated as "reachable" below, never as failures.
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const PAGE_TIMEOUT_MS = 20_000;
const LINK_TIMEOUT_MS = 15_000;
const PAGE_CONCURRENCY = 8;
const LINK_CONCURRENCY = 8;

// Reachable-but-gated: the server answered, so the link is not dead. 999 is
// LinkedIn's bot wall, 530 is a Cloudflare gate variant. 415 is a WAF
// rejecting our request shape (seen on WordPress hosts). 503 belongs here
// too: this check runs at 4:45am JST, inside the nightly maintenance window
// of big Japanese sites (jalan.net 503s every night then comes straight
// back), and Akamai bot walls also speak 503 - a genuinely dead provider
// ends up as 404/410 or a dead host, not an eternal 503.
const BLOCKED_STATUSES = new Set([401, 403, 405, 406, 409, 415, 418, 429, 451, 503, 530, 999]);

const WEATHER_CANARIES = [
  { id: "thredbo", country: "AU" },
  { id: "furano-ski-resort", country: "JP" },
  { id: "coronet-peak", country: "NZ" },
];

// Headline-vs-elevation snow consistency canaries. Guards the Whakapapa
// July 2026 class of bug: /api/weather's day-0 snowfallSum (freezing-level
// partitioned at mid-mountain, snowElevationM=midMountainElevation(summit),
// exactly what the resort pages request) silently disagreeing with the
// Elevation forecast's mid band for the same day. summitM mirrors each
// resort's registry elevationM on the client (the value the pages pass to
// both endpoints); lat/lng mirror the api-server LOCATIONS entries.
const SNOW_CONSISTENCY_CANARIES = [
  { id: "thredbo", name: "Thredbo", lat: -36.5054, lng: 148.3089, summitM: 2037 },
  { id: "whakapapa", name: "Whakapapa", lat: -39.2547, lng: 175.5619, summitM: 2020 },
  { id: "happo-one", name: "Hakuba Happo-One", lat: 36.6968, lng: 137.8380, summitM: 1831 },
];

// Both figures derive from Open-Meteo hourly precip + freezing level at the
// same elevation, but through two separate requests (the elevation forecast
// pins cell_selection=nearest at the upper band; /api/weather fetches its
// own hourly series), so small model-run/cell differences are normal. Only
// alert on a genuine two-stories divergence: more than 5cm apart AND the
// gap is over 40% of the larger figure (7cm vs 21cm → diff 14 > max(5, 8.4)
// → fails; 10cm vs 13cm → passes).
const SNOW_TOLERANCE_MIN_CM = 5;
const SNOW_TOLERANCE_FRACTION = 0.4;

export interface SmokeFailure {
  check: string;
  url: string;
  detail: string;
  sources?: string[];
}

export interface SmokeReport {
  startedAt: string;
  durationMs: number;
  ok: boolean;
  pagesChecked: number;
  apiChecksPassed: number;
  linksChecked: number;
  linksBlockedButReachable: number;
  failures: SmokeFailure[];
  emailed: boolean;
  skippedExternal: boolean;
}

let lastReport: SmokeReport | null = null;
let running = false;

export function getLastSmokeReport(): SmokeReport | null {
  return lastReport;
}

export function isSmokeRunning(): boolean {
  return running;
}

async function fetchRaw(url: string, timeoutMs: number): Promise<Response> {
  return fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "accept-language": "en-AU,en;q=0.9",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Normalise for canonical comparison: origin + path with one trailing slash. */
function normaliseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    let path = u.pathname;
    if (!path.endsWith("/")) path += "/";
    return `${u.origin}${path}`;
  } catch {
    return raw;
  }
}

// ---------------------------------------------------------------------------
// internal checks: sitemap pages + API
// ---------------------------------------------------------------------------

async function checkSitemapPages(failures: SmokeFailure[]): Promise<number> {
  let xml: string;
  try {
    const res = await fetchRaw(`${ORIGIN}/sitemap.xml`, PAGE_TIMEOUT_MS);
    if (!res.ok) {
      failures.push({ check: "sitemap", url: `${ORIGIN}/sitemap.xml`, detail: `HTTP ${res.status}` });
      return 0;
    }
    xml = await res.text();
  } catch (err) {
    failures.push({ check: "sitemap", url: `${ORIGIN}/sitemap.xml`, detail: errMessage(err) });
    return 0;
  }

  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]!);
  if (urls.length < 100) {
    // The live sitemap carries 300+ URLs; a sudden collapse is itself a bug.
    failures.push({ check: "sitemap", url: `${ORIGIN}/sitemap.xml`, detail: `only ${urls.length} URLs in sitemap (expected 300+)` });
  }

  await mapPool(urls, PAGE_CONCURRENCY, async (url) => {
    try {
      const res = await fetchRaw(url, PAGE_TIMEOUT_MS);
      if (!res.ok) {
        failures.push({ check: "page", url, detail: `HTTP ${res.status}` });
        return;
      }
      const html = await res.text();
      const m = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) ?? html.match(/<link[^>]+href="([^"]+)"[^>]+rel="canonical"/i);
      if (!m) {
        failures.push({ check: "canonical", url, detail: "no canonical tag in served HTML" });
        return;
      }
      const canonical = normaliseUrl(m[1]!);
      if (canonical !== normaliseUrl(url)) {
        failures.push({ check: "canonical", url, detail: `canonical points at ${m[1]} - page is being served the wrong snapshot (rewrite regression)` });
      }
    } catch (err) {
      failures.push({ check: "page", url, detail: errMessage(err) });
    }
  });

  return urls.length;
}

async function checkApi(failures: SmokeFailure[]): Promise<number> {
  let passed = 0;

  try {
    const res = await fetchRaw(`${ORIGIN}/api/healthz`, PAGE_TIMEOUT_MS);
    const json = (await res.json().catch(() => ({}))) as { status?: string };
    if (res.ok && json.status === "ok") passed++;
    else failures.push({ check: "api", url: `${ORIGIN}/api/healthz`, detail: `HTTP ${res.status} status=${json.status ?? "?"}` });
  } catch (err) {
    failures.push({ check: "api", url: `${ORIGIN}/api/healthz`, detail: errMessage(err) });
  }

  try {
    const res = await fetchRaw(`${ORIGIN}/api/regions`, PAGE_TIMEOUT_MS);
    const json = (await res.json().catch(() => ({}))) as { regions?: unknown[] };
    const count = Array.isArray(json.regions) ? json.regions.length : 0;
    if (res.ok && count >= 15) passed++;
    else failures.push({ check: "api", url: `${ORIGIN}/api/regions`, detail: `HTTP ${res.status}, ${count} regions (expected 15+)` });
  } catch (err) {
    failures.push({ check: "api", url: `${ORIGIN}/api/regions`, detail: errMessage(err) });
  }

  for (const canary of WEATHER_CANARIES) {
    const url = `${ORIGIN}/api/weather/${canary.id}`;
    try {
      const res = await fetchRaw(url, PAGE_TIMEOUT_MS);
      const json = (await res.json().catch(() => ({}))) as { daily?: unknown; current?: unknown };
      if (res.ok && (json.daily || json.current)) passed++;
      else failures.push({ check: "api", url, detail: `HTTP ${res.status}, no weather data (${canary.country} canary)` });
    } catch (err) {
      failures.push({ check: "api", url, detail: `${errMessage(err)} (${canary.country} canary)` });
    }
  }

  return passed;
}

/**
 * Compare /api/weather day-0 snowfallSum (requested at mid-mountain, the way
 * the resort pages do) against the elevation forecast's mid band for the
 * same date. Missing data on either side is fail-soft (checkApi already
 * flags dead endpoints); only a confident two-stories divergence fails.
 */
async function checkSnowConsistency(failures: SmokeFailure[]): Promise<number> {
  let passed = 0;
  for (const c of SNOW_CONSISTENCY_CANARIES) {
    const mid = bandElevations(c.summitM).mid;
    const weatherUrl = `${ORIGIN}/api/weather/${c.id}?snowElevationM=${mid}`;
    const elevUrl = `${ORIGIN}/api/elevation-forecast?lat=${c.lat}&lng=${c.lng}&summitElevationM=${c.summitM}&name=${encodeURIComponent(c.name)}`;
    try {
      const [wRes, eRes] = await Promise.all([
        fetchRaw(weatherUrl, PAGE_TIMEOUT_MS),
        fetchRaw(elevUrl, PAGE_TIMEOUT_MS),
      ]);
      if (!wRes.ok || !eRes.ok) {
        failures.push({
          check: "snow consistency",
          url: weatherUrl,
          detail: `HTTP ${wRes.status} (weather) / ${eRes.status} (elevation-forecast) for ${c.name}`,
        });
        continue;
      }
      const weather = (await wRes.json()) as { daily?: { date?: string; snowfallSum?: number | null }[] };
      const elev = (await eRes.json()) as {
        forecast?: { days?: { date?: string; bands?: { mid?: { snowfallCm?: number | null } } }[] } | null;
      };
      const day0 = weather.daily?.[0];
      const headlineCm = typeof day0?.snowfallSum === "number" ? day0.snowfallSum : null;
      const elevDay = elev.forecast?.days?.find((d) => d.date === day0?.date);
      const midCm = typeof elevDay?.bands?.mid?.snowfallCm === "number" ? elevDay.bands.mid.snowfallCm : null;
      if (headlineCm == null || midCm == null || !day0?.date) {
        // One side has no confident figure (fallback path, no matching date):
        // nothing to compare, and checkApi covers outright endpoint failures.
        passed++;
        continue;
      }
      const diff = Math.abs(headlineCm - midCm);
      const tolerance = Math.max(SNOW_TOLERANCE_MIN_CM, SNOW_TOLERANCE_FRACTION * Math.max(headlineCm, midCm));
      if (diff > tolerance) {
        failures.push({
          check: "snow consistency",
          url: weatherUrl,
          detail: `${c.name} ${day0.date}: headline snow ${headlineCm}cm vs elevation mid band ${midCm}cm (diff ${Math.round(diff * 10) / 10}cm > tolerance ${Math.round(tolerance * 10) / 10}cm) - two snow stories on the same page`,
        });
      } else {
        passed++;
      }
    } catch (err) {
      failures.push({ check: "snow consistency", url: weatherUrl, detail: `${errMessage(err)} (${c.name})` });
    }
  }
  return passed;
}

// ---------------------------------------------------------------------------
// Live lift feed canaries
// ---------------------------------------------------------------------------

// Live lift feeds fail SOFT by design (feed down/stale -> the
// page honestly drops to "no live status"), which makes an outage invisible:
// nothing errors, the flagship live feature is just quietly off. In-season,
// /api/lift-status/thredbo answering liveStatusVerified:false means the feed
// has been unfetchable or its `updated` stamp is >24h old - by the time the
// daily run sees false, the outage is already sustained (the server keeps a
// 30-min serve-stale window, so a momentary blip still reads true).
// Out of season the resort legitimately stops updating the feed, so the
// check only runs during the AU season months (June-September, AEST).

/** AU season gate for the live-feed canaries (Jun-Sep, Sydney time). */
export function isThredboFeedSeason(now: Date = new Date()): boolean {
  const month = Number(
    new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", month: "numeric" }).format(now),
  );
  return month >= 6 && month <= 9;
}

const LIVE_LIFT_FEED_CANARIES = [
  { id: "thredbo", name: "Thredbo" },
  { id: "perisher", name: "Perisher" },
] as const;

async function checkLiveLiftFeeds(failures: SmokeFailure[]): Promise<number> {
  if (!isThredboFeedSeason()) return LIVE_LIFT_FEED_CANARIES.length; // out of season: nothing to assert
  let passed = 0;
  for (const canary of LIVE_LIFT_FEED_CANARIES) {
    const url = `${ORIGIN}/api/lift-status/${canary.id}`;
    const probe = async (): Promise<{ ok: boolean; detail: string }> => {
      const res = await fetchRaw(url, PAGE_TIMEOUT_MS);
      if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
      const json = (await res.json().catch(() => ({}))) as { liveStatusVerified?: boolean; totalLifts?: number };
      if (json.liveStatusVerified === true && Number(json.totalLifts) > 0) return { ok: true, detail: "live" };
      return {
        ok: false,
        detail: `liveStatusVerified=${String(json.liveStatusVerified)}, totalLifts=${String(json.totalLifts)} in-season - ${canary.name} feed down/stale, page is silently in no-live mode`,
      };
    };

    try {
      let result = await probe();
      if (!result.ok) {
        await new Promise((r) => setTimeout(r, 3000));
        result = await probe();
      }
      if (result.ok) passed++;
      else failures.push({ check: "live lift feed", url, detail: result.detail });
    } catch (err) {
      failures.push({ check: "live lift feed", url, detail: errMessage(err) });
    }
  }
  return passed;
}

// ---------------------------------------------------------------------------
// external outbound links
// ---------------------------------------------------------------------------

interface LinkEntry {
  url: string;
  sources: string[];
}

type LinkVerdict = "ok" | "blocked" | "broken" | "dead";

export async function probeLink(url: string): Promise<{ verdict: LinkVerdict; detail: string }> {
  try {
    const res = await fetchRaw(url, LINK_TIMEOUT_MS);
    // Drain a little of the body so keep-alive sockets recycle cleanly.
    await res.body?.cancel().catch(() => undefined);
    if (res.status < 400) return { verdict: "ok", detail: `HTTP ${res.status}` };
    if (BLOCKED_STATUSES.has(res.status)) return { verdict: "blocked", detail: `HTTP ${res.status} (bot-gated, reachable)` };
    return { verdict: "broken", detail: `HTTP ${res.status}` };
  } catch (err) {
    const msg = errMessage(err);
    // Not dead, just unverifiable from a server: transient resolver failures
    // (EAI_AGAIN), missing-intermediate cert chains that browsers repair
    // via AIA fetching but Node's TLS refuses, and plain timeouts. Timeouts
    // are dominated by bot walls that silently drop datacentre traffic
    // (kfc.com.au and travel.rakuten.com time out for any non-browser client
    // while loading fine for humans - verified July 2026). A genuinely dead
    // host shows up as ENOTFOUND/ECONNREFUSED instead. Treat as reachable-ish
    // so the owner's email only lists links genuinely worth his time.
    if (
      msg.includes("EAI_AGAIN") ||
      msg.includes("UNABLE_TO_VERIFY_LEAF_SIGNATURE") ||
      /timeout/i.test(msg)
    ) {
      return { verdict: "blocked", detail: `${msg} (unverifiable from server, likely fine in browsers)` };
    }
    return { verdict: "dead", detail: msg };
  }
}

async function checkExternalLinks(failures: SmokeFailure[]): Promise<{ checked: number; blocked: number }> {
  const links = (externalLinks as { links: LinkEntry[] }).links;
  let blocked = 0;

  const firstPass = await mapPool(links, LINK_CONCURRENCY, async (link) => {
    const result = await probeLink(link.url);
    return { link, ...result };
  });

  // Retry failures once, sequentially and gently - most transient DNS blips,
  // handshake resets and cold CDN caches clear on a second attempt.
  const suspect = firstPass.filter((r) => r.verdict === "broken" || r.verdict === "dead");
  for (const s of suspect) {
    await new Promise((r) => setTimeout(r, 1500));
    const retry = await probeLink(s.link.url);
    if (retry.verdict === "ok" || retry.verdict === "blocked") {
      s.verdict = retry.verdict;
      s.detail = retry.detail;
    } else {
      s.verdict = retry.verdict;
      s.detail = `${retry.detail} (failed twice)`;
    }
  }

  for (const r of firstPass) {
    if (r.verdict === "blocked") blocked++;
    if (r.verdict === "broken" || r.verdict === "dead") {
      failures.push({ check: r.verdict === "broken" ? "dead link" : "unreachable link", url: r.link.url, detail: r.detail, sources: r.link.sources });
    }
  }

  return { checked: links.length, blocked };
}

// ---------------------------------------------------------------------------
// orchestration + email
// ---------------------------------------------------------------------------

function errMessage(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as { cause?: { code?: string } }).cause;
    return cause?.code ? `${err.message} (${cause.code})` : err.message;
  }
  return String(err);
}

function ownerEmail(): string | null {
  const explicit = process.env.SMOKE_ALERT_EMAIL?.trim();
  if (explicit) return explicit;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return admins[0] ?? null;
}

function failureEmail(report: SmokeReport): { subject: string; html: string; text: string } {
  const n = report.failures.length;
  const subject = `feelzlike daily check · ${n} problem${n === 1 ? "" : "s"} found`;

  const grouped = new Map<string, SmokeFailure[]>();
  for (const f of report.failures) {
    const list = grouped.get(f.check) ?? [];
    list.push(f);
    grouped.set(f.check, list);
  }

  const CHECK_LABELS: Record<string, string> = {
    sitemap: "sitemap problems",
    page: "pages not loading",
    canonical: "pages serving the wrong content",
    api: "weather api problems",
    "snow consistency": "headline vs elevation snow disagreement",
    "live lift feed": "live lift feed silently off",
    "dead link": "dead outbound links",
    "unreachable link": "unreachable outbound links",
  };

  const MAX_PER_GROUP = 25;
  let bodyHtml = `<p>this morning's automated check of <strong>feelzlike.com</strong> found ${n} problem${n === 1 ? "" : "s"}. everything else passed (${report.pagesChecked} pages, ${report.linksChecked} outbound links checked).</p>`;
  let text = `this morning's automated check of feelzlike.com found ${n} problem${n === 1 ? "" : "s"}.\n\n`;

  for (const [check, list] of grouped) {
    const label = CHECK_LABELS[check] ?? check;
    bodyHtml += `<h3 style="font-size:14px;text-transform:lowercase;margin:20px 0 8px 0;">${label} (${list.length})</h3><ul style="margin:0;padding-left:18px;">`;
    text += `${label} (${list.length}):\n`;
    for (const f of list.slice(0, MAX_PER_GROUP)) {
      const src = f.sources?.length ? ` <span style="color:#64748b;">· used in ${f.sources[0]}</span>` : "";
      bodyHtml += `<li style="margin:4px 0;word-break:break-all;"><a href="${f.url}" style="color:#0c75df;">${f.url}</a> - ${f.detail}${src}</li>`;
      text += `  ${f.url} - ${f.detail}\n`;
    }
    if (list.length > MAX_PER_GROUP) {
      bodyHtml += `<li style="margin:4px 0;color:#64748b;">…and ${list.length - MAX_PER_GROUP} more</li>`;
      text += `  ...and ${list.length - MAX_PER_GROUP} more\n`;
    }
    bodyHtml += "</ul>";
    text += "\n";
  }

  bodyHtml += `<p style="margin-top:20px;color:#64748b;font-size:13px;">dead links usually mean a provider changed their website. fixing them is a data edit, not an outage - but pages not loading or api problems mean visitors are affected right now.</p>`;

  const html = brandedEmail({
    preheader: `${n} problem${n === 1 ? "" : "s"} found on feelzlike.com`,
    heading: "daily site check · problems found",
    bodyHtml,
    ctaLabel: "open feelzlike",
    ctaUrl: `${ORIGIN}/`,
    footerHtml: "automated daily smoke test · sent only when something needs attention · recipient is set by SMOKE_ALERT_EMAIL / ADMIN_EMAILS",
  });

  return { subject, html, text };
}

export async function runSmokeTest(opts: { skipExternal?: boolean; noEmail?: boolean } = {}): Promise<SmokeReport> {
  if (running) {
    throw new Error("smoke test already running");
  }
  running = true;
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const failures: SmokeFailure[] = [];

  try {
    console.log(`[smokeTest] starting against ${ORIGIN} (external links: ${opts.skipExternal ? "skipped" : "on"})`);

    const [pagesChecked, apiPassed, snowPassed, liftFeedPassed] = await Promise.all([
      checkSitemapPages(failures),
      checkApi(failures),
      checkSnowConsistency(failures),
      checkLiveLiftFeeds(failures),
    ]);
    const apiChecksPassed = apiPassed + snowPassed + liftFeedPassed;

    let linksChecked = 0;
    let blocked = 0;
    if (!opts.skipExternal) {
      const ext = await checkExternalLinks(failures);
      linksChecked = ext.checked;
      blocked = ext.blocked;
    }

    const report: SmokeReport = {
      startedAt,
      durationMs: Date.now() - t0,
      ok: failures.length === 0,
      pagesChecked,
      apiChecksPassed,
      linksChecked,
      linksBlockedButReachable: blocked,
      failures,
      emailed: false,
      skippedExternal: Boolean(opts.skipExternal),
    };

    if (!report.ok && !opts.noEmail) {
      const to = ownerEmail();
      if (!to) {
        console.warn("[smokeTest] failures found but no SMOKE_ALERT_EMAIL / ADMIN_EMAILS configured - cannot notify");
      } else {
        const mail = failureEmail(report);
        const sent = await sendEmail({ ...mail, to, tag: "smoke-test" });
        report.emailed = sent.delivered;
        console.log(`[smokeTest] failure email to ${to}: ${sent.delivered ? "delivered" : `NOT delivered (${sent.error ?? sent.provider})`}`);
      }
    }

    console.log(
      `[smokeTest] done in ${Math.round(report.durationMs / 1000)}s · ${report.ok ? "ALL CLEAR" : `${failures.length} FAILURES`} · ` +
      `${report.pagesChecked} pages, ${report.apiChecksPassed}/10 api checks, ${report.linksChecked} links (${blocked} bot-gated)`,
    );
    lastReport = report;
    return report;
  } finally {
    running = false;
  }
}

// ---------------------------------------------------------------------------
// autoscale-safe scheduling: DB-claimed daily run with wake-up catch-up
// ---------------------------------------------------------------------------

const JOB_NAME = "daily-smoke-test";
// 19:45 UTC = 5:45am AEST / 4:45am JST - report lands before the owner's
// morning, offset from the :00 alert evaluator runs.
const DUE_HOUR_UTC = 19;
const DUE_MINUTE_UTC = 45;
const SWEEP_INTERVAL_MS = 5 * 60_000;
// A claim whose run never finished after this long is presumed orphaned
// (replica scaled down mid-run; a full run takes ~3 minutes) and may be
// re-taken. Generous so slow external links never cause a double run.
const STALE_CLAIM_MINUTES = 45;

/** run_key (UTC date) of the most recent due moment, looking back to yesterday's slot before 19:45 UTC. */
export function currentRunKey(now: Date = new Date()): string {
  const due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), DUE_HOUR_UTC, DUE_MINUTE_UTC));
  if (now >= due) return due.toISOString().slice(0, 10);
  const prev = new Date(due.getTime() - 24 * 3600_000);
  return prev.toISOString().slice(0, 10);
}

/**
 * Atomically claim `runKey` for this replica. A single upsert both takes a
 * fresh claim and re-takes an orphaned one (started long ago, never
 * finished); the WHERE guard makes losing replicas get zero rows back.
 */
export async function claimDailyRun(runKey: string, staleMinutes: number = STALE_CLAIM_MINUTES): Promise<boolean> {
  const staleBefore = new Date(Date.now() - staleMinutes * 60_000);
  const rows = await db
    .insert(jobRunsTable)
    .values({ jobName: JOB_NAME, runKey })
    .onConflictDoUpdate({
      target: [jobRunsTable.jobName, jobRunsTable.runKey],
      set: { startedAt: sql`now()` },
      setWhere: and(isNull(jobRunsTable.finishedAt), lt(jobRunsTable.startedAt, staleBefore)),
    })
    .returning({ id: jobRunsTable.id });
  return rows.length > 0;
}

async function finishDailyRun(runKey: string, report: SmokeReport): Promise<void> {
  const summary = report.ok
    ? `all clear · ${report.pagesChecked} pages, ${report.linksChecked} links`
    : `${report.failures.length} failures · emailed=${report.emailed}`;
  await db
    .update(jobRunsTable)
    .set({ finishedAt: sql`now()`, ok: report.ok, summary })
    .where(and(eq(jobRunsTable.jobName, JOB_NAME), eq(jobRunsTable.runKey, runKey)));
}

/**
 * "Is the current period's run still outstanding? If so, claim and run it."
 * Cheap when there is nothing to do (one indexed upsert at most once per
 * sweep). Never throws: a DB hiccup logs and waits for the next sweep
 * rather than crashing the serving process or running unlocked.
 */
async function sweepDueRun(): Promise<void> {
  if (running) return;
  const runKey = currentRunKey();
  if (!runKey) return;
  let claimed = false;
  try {
    claimed = await claimDailyRun(runKey);
  } catch (err) {
    console.error("[smokeTest] claim check failed (will retry next sweep):", errMessage(err));
    return;
  }
  if (!claimed) return;
  console.log(`[smokeTest] claimed daily run ${runKey}`);
  try {
    const report = await runSmokeTest();
    await finishDailyRun(runKey, report);
  } catch (err) {
    console.error("[smokeTest] claimed run failed:", errMessage(err));
    // Leave finished_at null: after the staleness window another sweep may
    // re-take the claim and try again.
  }
}

let cronTask: ScheduledTask | null = null;
let sweepTimer: NodeJS.Timeout | null = null;

export function startSmokeCron(): void {
  if (process.env.SMOKE_CRON_DISABLED === "1") {
    console.log("[smokeTest] SMOKE_CRON_DISABLED=1 · cron not started");
    return;
  }
  if (process.env.RUN_SMOKE_CRON !== "1") {
    console.log(
      "[smokeTest] scheduler off on this replica (RUN_SMOKE_CRON != 1). " +
      "Manual trigger: POST /api/internal/smoke/run.",
    );
    return;
  }
  if (cronTask || sweepTimer) return;

  cronTask = cron.schedule(`${DUE_MINUTE_UTC} ${DUE_HOUR_UTC} * * *`, () => {
    sweepDueRun().catch((err) => console.error("[smokeTest] scheduled sweep failed:", err));
  });
  // Catch-up for autoscale: if no replica was awake at 19:45 UTC, whichever
  // replica wakes first (any visitor) claims and runs the missed test. The
  // initial delay keeps the sweep out of the boot/health-check window.
  sweepTimer = setInterval(() => {
    sweepDueRun().catch((err) => console.error("[smokeTest] catch-up sweep failed:", err));
  }, SWEEP_INTERVAL_MS);
  sweepTimer.unref?.();
  setTimeout(() => {
    sweepDueRun().catch((err) => console.error("[smokeTest] wake-up sweep failed:", err));
  }, 90_000).unref?.();
  console.log("[smokeTest] scheduler on: daily 19:45 UTC + wake-up catch-up, DB-claimed (job_runs)");
}
