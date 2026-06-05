/**
 * Resort-announcements ingestion. Populates the `resort_announcements` table
 * two ways, both idempotent (upsert on `dedupeKey`):
 *
 *   1. SEED — curated, confirmed announcements (opening-weekend dates for
 *      every AU resort). These are pinned so they sit on top of the feed.
 *      They give the feed accurate content immediately, independent of any
 *      live scrape.
 *
 *   2. LIVE SOURCES — best-effort polls of resort feeds. Right now only
 *      Thredbo exposes a clean, machine-readable feed (a LivePass snow-report
 *      XML document); the other AU resorts publish their updates social-first
 *      (Instagram/Facebook) or as full HTML pages with no stable feed, so
 *      they're covered by the seed until a real feed appears. Each source is
 *      wrapped in its own try/catch — a failed or malformed fetch is logged
 *      and skipped, never thrown, so the feed (served straight from Postgres)
 *      never breaks.
 *
 * Run modes mirror the powder-alert evaluator:
 *   - `runAnnouncementsIngest()` runs once (called at boot + from the internal
 *     endpoint for ad-hoc refresh).
 *   - `startAnnouncementsCron()` schedules periodic refresh, gated behind
 *     RUN_ANNOUNCE_CRON=1 so only one replica owns the schedule.
 */
import cron, { type ScheduledTask } from "node-cron";
import { db, resortAnnouncementsTable, type InsertResortAnnouncement } from "@workspace/db";
import * as Sentry from "@sentry/node";

interface IngestReport {
  startedAt: string;
  finishedAt: string;
  seeded: number;
  sourcesOk: number;
  sourcesFailed: number;
}

// ── Curated seed (confirmed AU opening-weekend announcements) ────────────────
// Brand voice: lowercase, middot · as separator, no em/en dashes, no emojis.
// publishedAt is staggered within a region so the primary resort sorts first.
type Seed = Omit<InsertResortAnnouncement, "status"> & { pinned: boolean };

const SEEDS: Seed[] = [
  // Snowy Mountains
  {
    dedupeKey: "seed:snowy-mountains:thredbo-opening",
    region: "snowy-mountains", resort: "Thredbo", category: "opening", pinned: true,
    title: "thredbo opens saturday june 6",
    body: "the 2026 snow season kicks off this weekend. the kosciuszko express and friday flat beginner area spin first, snow permitting · check lifts & trails for the live morning report.",
    sourceName: "Thredbo", sourceUrl: "https://www.thredbo.com.au/",
    publishedAt: new Date("2026-06-05T07:00:00+10:00"),
  },
  {
    dedupeKey: "seed:snowy-mountains:perisher-opening",
    region: "snowy-mountains", resort: "Perisher", category: "opening", pinned: true,
    title: "perisher opens saturday june 6",
    body: "perisher targets opening day on saturday for the king's birthday long weekend · terrain is confirmed each morning based on snow cover.",
    sourceName: "Perisher", sourceUrl: "https://www.perisher.com.au/",
    publishedAt: new Date("2026-06-05T06:55:00+10:00"),
  },
  {
    dedupeKey: "seed:snowy-mountains:charlotte-pass-opening",
    region: "snowy-mountains", resort: "Charlotte Pass", category: "opening", pinned: true,
    title: "charlotte pass opens for the long weekend",
    body: "charlotte pass is targeting the king's birthday long weekend, snow permitting · access is by oversnow transport from perisher.",
    sourceName: "Charlotte Pass", sourceUrl: "https://www.charlottepass.com.au/",
    publishedAt: new Date("2026-06-05T06:50:00+10:00"),
  },
  {
    dedupeKey: "seed:snowy-mountains:selwyn-opening",
    region: "snowy-mountains", resort: "Selwyn", category: "opening", pinned: true,
    title: "selwyn targets the june long weekend",
    body: "selwyn snow resort is aiming to open for the king's birthday long weekend, with snowmaking running whenever temperatures allow.",
    sourceName: "Selwyn", sourceUrl: "https://selwynsnow.com.au/",
    publishedAt: new Date("2026-06-05T06:45:00+10:00"),
  },

  // Victoria's High Country
  {
    dedupeKey: "seed:victorias-high-country:buller-opening",
    region: "victorias-high-country", resort: "Mt Buller", category: "opening", pinned: true,
    title: "mt buller opens for the long weekend",
    body: "mt buller opens for the king's birthday long weekend · early-season terrain depends on snowmaking and natural falls, so check the morning lift report before driving up.",
    sourceName: "Mt Buller", sourceUrl: "https://www.mtbuller.com.au/",
    publishedAt: new Date("2026-06-05T07:00:00+10:00"),
  },
  {
    dedupeKey: "seed:victorias-high-country:hotham-opening",
    region: "victorias-high-country", resort: "Mt Hotham", category: "opening", pinned: true,
    title: "mt hotham opens for the long weekend",
    body: "mt hotham is targeting the king's birthday long weekend to start lifts, conditions permitting · snowmaking has been running on the cold nights.",
    sourceName: "Mt Hotham", sourceUrl: "https://www.hotham.com.au/",
    publishedAt: new Date("2026-06-05T06:55:00+10:00"),
  },
  {
    dedupeKey: "seed:victorias-high-country:falls-creek-opening",
    region: "victorias-high-country", resort: "Falls Creek", category: "opening", pinned: true,
    title: "falls creek opens for the long weekend",
    body: "falls creek opens for the king's birthday long weekend · opening terrain is confirmed each morning based on snow cover.",
    sourceName: "Falls Creek", sourceUrl: "https://www.fallscreek.com.au/",
    publishedAt: new Date("2026-06-05T06:50:00+10:00"),
  },
  {
    dedupeKey: "seed:victorias-high-country:lake-mountain-opening",
    region: "victorias-high-country", resort: "Lake Mountain", category: "opening", pinned: true,
    title: "lake mountain opens for snow play",
    body: "lake mountain opens for the long weekend for cross-country and toboggan runs when snow cover allows · check the resort before heading up.",
    sourceName: "Lake Mountain", sourceUrl: "https://www.lakemountainresort.com.au/",
    publishedAt: new Date("2026-06-05T06:45:00+10:00"),
  },

  // Tasmania
  {
    dedupeKey: "seed:tasmania:ben-lomond-opening",
    region: "tasmania", resort: "Ben Lomond", category: "opening", pinned: true,
    title: "ben lomond waits on snow",
    body: "ben lomond, tasmania's main alpine field and only commercial chairlift, opens once enough snow falls · the king's birthday long weekend is the usual early target. watch the forecast before making the drive.",
    sourceName: "Ben Lomond", sourceUrl: null,
    publishedAt: new Date("2026-06-05T07:00:00+10:00"),
  },
];

// ── Live sources (best-effort) ───────────────────────────────────────────────

async function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: ac.signal,
      headers: { "user-agent": "feelzlikebot/1.0 (+https://feelzlike.app)" },
      redirect: "follow",
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(to);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    // Strip en/em dashes per brand voice (no en/em dashes).
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, "-")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function xmlAmount(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*amount="([^"]*)"`, "i"));
  return m ? m[1]! : null;
}

/**
 * Thredbo publishes a LivePass snow-report XML feed (snow totals + plain-text
 * "snowMessage" lines covering lifts and today's weather). We turn that into a
 * single auto-refreshing "conditions" card.
 */
function parseThredbo(xml: string): InsertResortAnnouncement | null {
  if (!xml.includes("<snowReport")) return null;
  const updated = (xml.match(/<snowReport[^>]*updated="([^"]+)"/) || [])[1];
  const snow24 = xmlAmount(xml, "snow24Hours");
  const snow72 = xmlAmount(xml, "snow72Hours");
  const base = xmlAmount(xml, "base");
  const msgs = [...xml.matchAll(/<snowMessage[^>]*>([\s\S]*?)<\/snowMessage>/gi)]
    .map((m) => decodeEntities(m[1] ?? ""))
    .filter(Boolean);
  // msgs[1] is the BoM-style "today" forecast line; fall back to the lift note.
  const weather = msgs[1] || msgs[0] || "";

  const stats: string[] = [];
  if (snow24 && Number(snow24) > 0) stats.push(`${snow24}cm in 24h`);
  if (snow72 && Number(snow72) > 0) stats.push(`${snow72}cm in 72h`);
  if (base !== null) stats.push(`base ${base}cm`);

  const parts = [stats.join(" · "), weather].filter(Boolean);
  const body = parts.join(". ").toLowerCase().slice(0, 260) || "live snow report.";

  const published = updated ? new Date(updated) : new Date();

  return {
    dedupeKey: "src:thredbo-snow-report",
    region: "snowy-mountains",
    resort: "Thredbo",
    category: "conditions",
    title: "thredbo snow report",
    body,
    sourceName: "Thredbo",
    sourceUrl: "https://www.thredbo.com.au/lifts-trails/",
    pinned: false,
    status: "published",
    publishedAt: Number.isNaN(published.getTime()) ? new Date() : published,
  };
}

interface LiveSource {
  key: string;
  url: string;
  parse: (raw: string) => InsertResortAnnouncement | null;
}

const LIVE_SOURCES: LiveSource[] = [
  { key: "thredbo-snow-report", url: "https://www.thredbo.com.au/feeds/snow-report/", parse: parseThredbo },
];

// ── Upsert ───────────────────────────────────────────────────────────────────

async function upsert(row: InsertResortAnnouncement): Promise<void> {
  await db
    .insert(resortAnnouncementsTable)
    .values(row)
    .onConflictDoUpdate({
      target: resortAnnouncementsTable.dedupeKey,
      set: {
        region: row.region,
        resort: row.resort ?? null,
        category: row.category ?? "general",
        title: row.title,
        body: row.body ?? null,
        sourceName: row.sourceName ?? null,
        sourceUrl: row.sourceUrl ?? null,
        pinned: row.pinned ?? false,
        status: row.status ?? "published",
        publishedAt: row.publishedAt ?? new Date(),
        updatedAt: new Date(),
      },
    });
}

export async function runAnnouncementsIngest(): Promise<IngestReport> {
  const startedAt = new Date();
  const report: IngestReport = {
    startedAt: startedAt.toISOString(), finishedAt: "",
    seeded: 0, sourcesOk: 0, sourcesFailed: 0,
  };

  // 1. Seeds — confirmed announcements. A failure here is a real bug (DB
  //    down / schema drift), so let it surface.
  for (const seed of SEEDS) {
    await upsert({ ...seed, status: "published" });
    report.seeded++;
  }

  // 2. Live sources — best-effort. Never let one bad fetch break the run.
  for (const src of LIVE_SOURCES) {
    try {
      const raw = await fetchText(src.url);
      const row = src.parse(raw);
      if (row) {
        await upsert(row);
        report.sourcesOk++;
      } else {
        report.sourcesFailed++;
        console.warn(`[announcementsIngest] source ${src.key}: parser returned null`);
      }
    } catch (err) {
      report.sourcesFailed++;
      console.warn(`[announcementsIngest] source ${src.key} failed:`, err);
      Sentry.addBreadcrumb({
        category: "announcements-ingest", level: "warning",
        message: `source ${src.key} failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  report.finishedAt = new Date().toISOString();
  return report;
}

let cronTask: ScheduledTask | null = null;

/**
 * Start the announcements ingestion cron. OFF by default; only ticks when
 * RUN_ANNOUNCE_CRON=1 so scaling to multiple replicas doesn't double-poll.
 * Refreshes every 30 minutes (live snow reports change through the day).
 */
export function startAnnouncementsCron(): void {
  if (cronTask) return;
  if (process.env.RUN_ANNOUNCE_CRON !== "1") {
    console.log(
      "[announcementsIngest] RUN_ANNOUNCE_CRON not set · refresh cron not started on this replica.",
    );
    return;
  }
  cronTask = cron.schedule("*/30 * * * *", () => {
    runAnnouncementsIngest()
      .then((r) => console.log(`[announcementsIngest] run done: seeded=${r.seeded} sourcesOk=${r.sourcesOk} failed=${r.sourcesFailed}`))
      .catch((err) => {
        console.error("[announcementsIngest] run failed:", err);
        Sentry.captureException(err, { tags: { component: "announcements-ingest-cron" } });
      });
  });
  console.log("[announcementsIngest] cron scheduled (every 30 min, RUN_ANNOUNCE_CRON=1)");
}
