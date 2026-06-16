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
import { like, eq } from "drizzle-orm";
import * as Sentry from "@sentry/node";

interface IngestReport {
  startedAt: string;
  finishedAt: string;
  seeded: number;
  expired: number;
  sourcesOk: number;
  sourcesEmpty: number;
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
    expiresAt: new Date("2026-06-09T00:00:00+10:00"),
  },
  {
    dedupeKey: "seed:snowy-mountains:perisher-opening",
    region: "snowy-mountains", resort: "Perisher", category: "opening", pinned: true,
    title: "perisher opens saturday june 6",
    body: "perisher targets opening day on saturday for the king's birthday long weekend · terrain is confirmed each morning based on snow cover.",
    sourceName: "Perisher", sourceUrl: "https://www.perisher.com.au/",
    publishedAt: new Date("2026-06-05T06:55:00+10:00"),
    expiresAt: new Date("2026-06-09T00:00:00+10:00"),
  },
  {
    dedupeKey: "seed:snowy-mountains:charlotte-pass-opening",
    region: "snowy-mountains", resort: "Charlotte Pass", category: "opening", pinned: true,
    title: "charlotte pass opens for the long weekend",
    body: "charlotte pass is targeting the king's birthday long weekend, snow permitting · access is by oversnow transport from perisher.",
    sourceName: "Charlotte Pass", sourceUrl: "https://www.charlottepass.com.au/",
    publishedAt: new Date("2026-06-05T06:50:00+10:00"),
    expiresAt: new Date("2026-06-09T00:00:00+10:00"),
  },
  {
    dedupeKey: "seed:snowy-mountains:selwyn-opening",
    region: "snowy-mountains", resort: "Selwyn", category: "opening", pinned: true,
    title: "selwyn targets the june long weekend",
    body: "selwyn snow resort is aiming to open for the king's birthday long weekend, with snowmaking running whenever temperatures allow.",
    sourceName: "Selwyn", sourceUrl: "https://selwynsnow.com.au/",
    publishedAt: new Date("2026-06-05T06:45:00+10:00"),
    expiresAt: new Date("2026-06-09T00:00:00+10:00"),
  },

  // Victoria's High Country
  {
    dedupeKey: "seed:victorias-high-country:buller-opening",
    region: "victorias-high-country", resort: "Mt Buller", category: "opening", pinned: true,
    title: "mt buller opens for the long weekend",
    body: "mt buller opens for the king's birthday long weekend · early-season terrain depends on snowmaking and natural falls, so check the morning lift report before driving up.",
    sourceName: "Mt Buller", sourceUrl: "https://www.mtbuller.com.au/",
    publishedAt: new Date("2026-06-05T07:00:00+10:00"),
    expiresAt: new Date("2026-06-09T00:00:00+10:00"),
  },
  {
    dedupeKey: "seed:victorias-high-country:hotham-opening",
    region: "victorias-high-country", resort: "Mt Hotham", category: "opening", pinned: true,
    title: "mt hotham opens for the long weekend",
    body: "mt hotham is targeting the king's birthday long weekend to start lifts, conditions permitting · snowmaking has been running on the cold nights.",
    sourceName: "Mt Hotham", sourceUrl: "https://www.hotham.com.au/",
    publishedAt: new Date("2026-06-05T06:55:00+10:00"),
    expiresAt: new Date("2026-06-09T00:00:00+10:00"),
  },
  {
    dedupeKey: "seed:victorias-high-country:falls-creek-opening",
    region: "victorias-high-country", resort: "Falls Creek", category: "opening", pinned: true,
    title: "falls creek opens for the long weekend",
    body: "falls creek opens for the king's birthday long weekend · opening terrain is confirmed each morning based on snow cover.",
    sourceName: "Falls Creek", sourceUrl: "https://www.fallscreek.com.au/",
    publishedAt: new Date("2026-06-05T06:50:00+10:00"),
    expiresAt: new Date("2026-06-09T00:00:00+10:00"),
  },
  {
    dedupeKey: "seed:victorias-high-country:lake-mountain-opening",
    region: "victorias-high-country", resort: "Lake Mountain", category: "opening", pinned: true,
    title: "lake mountain opens for snow play",
    body: "lake mountain opens for the long weekend for cross-country and toboggan runs when snow cover allows · check the resort before heading up.",
    sourceName: "Lake Mountain", sourceUrl: "https://www.lakemountainresort.com.au/",
    publishedAt: new Date("2026-06-05T06:45:00+10:00"),
    expiresAt: new Date("2026-06-09T00:00:00+10:00"),
  },

  // Tasmania
  {
    dedupeKey: "seed:tasmania:ben-lomond-opening",
    region: "tasmania", resort: "Ben Lomond", category: "opening", pinned: true,
    title: "ben lomond waits on snow",
    body: "ben lomond, tasmania's main alpine field and only commercial chairlift, opens once enough snow falls · the king's birthday long weekend is the usual early target. watch the forecast before making the drive.",
    sourceName: "Ben Lomond", sourceUrl: null,
    publishedAt: new Date("2026-06-05T07:00:00+10:00"),
    expiresAt: new Date("2026-06-09T00:00:00+10:00"),
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

// ── Generic RSS news (Mountainwatch, SnowsBest) ──────────────────────────────
// We AGGREGATE, we do NOT republish: store only the headline, a short excerpt
// and a link back to the original, attributed to the source. No full article
// body, no source images. This mirrors how feed readers / news aggregators
// operate and keeps us on the safe side of copyright + each publisher's ToS.
//
// AU snow-industry news is national, so it's fanned out into every Australian
// region feed (the read endpoint is region-scoped). JP regions never get AU news.
const AU_NEWS_REGIONS = [
  "snowy-mountains",
  "victorias-high-country",
  "tasmania",
] as const;

// How many of the latest items to surface per feed. dedupeKeys are positional
// ("slotN" by recency) so each refresh OVERWRITES the same N rows in place
// instead of growing the table unbounded · no separate pruning job needed.
const NEWS_ITEMS_PER_FEED = 4;

// Only surface AU/NZ-relevant items. The source feeds also carry global
// resort-guide entries (Japan, Europe, Canada) that aren't useful in the AU
// region feeds, so we match on each item's <category> tags.
const AU_NZ_RELEVANT =
  /austral|au\/nz|new zealand|\bnz\b|\bnsw\b|victoria|tasmania|snowy|thredbo|perisher|charlotte pass|selwyn|falls creek|hotham|buller|kosciuszko/i;

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  categories: string[];
}

/**
 * Strip HTML/CDATA, decode entities, drop WordPress feed boilerplate, remove
 * emoji + en/em dashes, collapse whitespace and lowercase (brand voice).
 */
function cleanNewsText(raw: string): string {
  const noTags = raw
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(noTags)
    .replace(/the post .*?appeared first on.*$/i, "")
    .replace(/continue reading.*$/i, "")
    .replace(/\[(?:…|\.\.\.)\]/g, "")
    .replace(/[\u2012-\u2015\u2212]/g, "-")
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu,
      "",
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Parse up to `max` <item> blocks (newest first) with their categories. */
function parseRssItems(xml: string, max: number): RssItem[] {
  const items: RssItem[] = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const pick = (tag: string): string => {
      const m = block.match(
        new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
      );
      return m ? (m[1] ?? "") : "";
    };
    const title = cleanNewsText(pick("title"));
    let link = pick("link").trim();
    if (!link) {
      const lm = block.match(/<link[^>]*href="([^"]+)"/i);
      link = lm ? (lm[1] ?? "") : "";
    }
    link = decodeEntities(link).trim();
    const description = pick("description") || pick("summary");
    const pubDate = (pick("pubDate") || pick("published") || pick("updated")).trim();
    const categories = [...block.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map(
      (m) => decodeEntities(m[1] ?? ""),
    );
    if (title && /^https?:\/\//i.test(link)) {
      items.push({ title, link, description, pubDate, categories });
    }
    if (items.length >= max) break;
  }
  return items;
}

/**
 * Build news announcement rows from an RSS feed, fanned out across the AU
 * regions. Each row links back to the original article (aggregation only).
 */
function buildNewsRows(
  feedKey: string,
  sourceName: string,
  xml: string,
  opts: { trustSource?: boolean } = {},
): InsertResortAnnouncement[] {
  const parsed = parseRssItems(xml, 30);
  // A 200-OK HTML error page or a structurally-changed feed parses to zero
  // <item>s. THROW so the caller preserves last-known-good rows instead of
  // replacing them with an empty set. (A genuinely empty-but-valid feed is
  // indistinguishable here and is treated the same way · rows preserved, the
  // safe choice for an active publisher.)
  if (parsed.length === 0) {
    throw new Error(
      `${sourceName}: no parseable RSS items (feed empty, malformed, or not RSS)`,
    );
  }
  // Relevance gate. Global feeds (Mountainwatch, SnowsBest) also carry
  // Japan/Europe/Canada resort-guide entries, so we keep only items whose
  // <category> tags look AU/NZ · an empty result here is a legitimate "nothing
  // relevant right now" the caller may clear stale rows for. AU-domain feeds
  // (trustSource) are kept whole: they're already AU-focused and their feed
  // tags are sparse, so the allowlist would wrongly drop nearly everything.
  const items = (
    opts.trustSource
      ? parsed
      : parsed.filter((it) => it.categories.some((c) => AU_NZ_RELEVANT.test(c)))
  ).slice(0, NEWS_ITEMS_PER_FEED);
  if (items.length === 0) return [];
  const rows: InsertResortAnnouncement[] = [];
  for (const region of AU_NEWS_REGIONS) {
    items.forEach((it, i) => {
      const published = it.pubDate ? new Date(it.pubDate) : new Date();
      const excerpt = cleanNewsText(it.description).slice(0, 220).trim();
      rows.push({
        dedupeKey: `src:${feedKey}:${region}:slot${i}`,
        region,
        resort: null,
        category: "news",
        title: it.title.slice(0, 140).trim(),
        body: excerpt || null,
        sourceName,
        sourceUrl: it.link,
        pinned: false,
        status: "published",
        publishedAt: Number.isNaN(published.getTime()) ? new Date() : published,
      });
    });
  }
  return rows;
}

interface LiveSource {
  key: string;
  url: string;
  parse: (raw: string) => InsertResortAnnouncement | InsertResortAnnouncement[] | null;
  /**
   * When set, a successful fetch REPLACES every row whose dedupeKey starts with
   * this prefix · this self-heals when a feed drops items (or stops carrying
   * relevant ones). A fetch failure throws before the delete, so existing rows
   * stay put. Omit for single-card upsert sources like Thredbo.
   */
  replacePrefix?: string;
}

const LIVE_SOURCES: LiveSource[] = [
  { key: "thredbo-snow-report", url: "https://www.thredbo.com.au/feeds/snow-report/", parse: parseThredbo },
  // National AU snow news · aggregated (headline + excerpt + link), fanned out
  // across the AU region feeds. Both are WordPress sites exposing /feed/.
  { key: "mountainwatch", url: "https://www.mountainwatch.com/feed/", parse: (raw) => buildNewsRows("mountainwatch", "Mountainwatch", raw), replacePrefix: "src:mountainwatch:" },
  { key: "snowsbest", url: "https://www.snowsbest.com/feed/", parse: (raw) => buildNewsRows("snowsbest", "SnowsBest", raw), replacePrefix: "src:snowsbest:" },
  // AU-domain snow magazine · already AU-focused, so we trust the source and
  // skip the AU/NZ category allowlist (its feed tags are sparse). Lower cadence
  // than SnowsBest but adds genuinely local coverage the global filter misses.
  { key: "snowaction", url: "https://www.snowaction.com.au/feed/", parse: (raw) => buildNewsRows("snowaction", "SnowAction", raw, { trustSource: true }), replacePrefix: "src:snowaction:" },
];

// ── Upsert ───────────────────────────────────────────────────────────────────

// Either the root db handle or a transaction handle · both expose .insert.
type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

async function upsert(
  row: InsertResortAnnouncement,
  exec: DbExecutor = db,
): Promise<void> {
  await exec
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
        expiresAt: row.expiresAt ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function runAnnouncementsIngest(): Promise<IngestReport> {
  const startedAt = new Date();
  const report: IngestReport = {
    startedAt: startedAt.toISOString(), finishedAt: "",
    seeded: 0, expired: 0, sourcesOk: 0, sourcesEmpty: 0, sourcesFailed: 0,
  };

  // 1. Seeds — confirmed announcements. A failure here is a real bug (DB
  //    down / schema drift), so let it surface. Time-sensitive seeds carry an
  //    `expiresAt`; once that has passed we delete the row (if present) and skip
  //    re-seeding so the card drops out of the feed automatically.
  const now = new Date();
  for (const seed of SEEDS) {
    if (seed.expiresAt && seed.expiresAt.getTime() <= now.getTime()) {
      await db
        .delete(resortAnnouncementsTable)
        .where(eq(resortAnnouncementsTable.dedupeKey, seed.dedupeKey));
      report.expired++;
      continue;
    }
    await upsert({ ...seed, status: "published" });
    report.seeded++;
  }

  // 2. Live sources — best-effort. Never let one bad fetch break the run.
  for (const src of LIVE_SOURCES) {
    try {
      const raw = await fetchText(src.url);
      const parsed = src.parse(raw);
      const rows = parsed == null ? [] : Array.isArray(parsed) ? parsed : [parsed];

      if (src.replacePrefix) {
        // Namespaced feeds own their whole dedupeKey prefix. Replace the set
        // atomically (delete + reinsert in one tx) so a mid-write failure can't
        // leave the feed half-populated. We only get here when parse SUCCEEDED
        // (news parsers throw on malformed/empty feeds), so an empty `rows`
        // legitimately means "no relevant items" and clearing stale rows is
        // correct · a fetch/parse failure throws above, preserving rows.
        const prefix = src.replacePrefix;
        await db.transaction(async (tx) => {
          await tx
            .delete(resortAnnouncementsTable)
            .where(like(resortAnnouncementsTable.dedupeKey, `${prefix}%`));
          for (const row of rows) await upsert(row, tx);
        });
      } else {
        for (const row of rows) await upsert(row);
      }

      if (rows.length > 0) {
        report.sourcesOk++;
      } else if (src.replacePrefix) {
        // Valid feed with no relevant items · not an ingestion failure.
        report.sourcesEmpty++;
        console.info(
          `[announcementsIngest] source ${src.key}: feed valid, no relevant items (cleared stale rows)`,
        );
      } else {
        report.sourcesFailed++;
        console.warn(`[announcementsIngest] source ${src.key}: parser returned no rows`);
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
      .then((r) => console.log(`[announcementsIngest] run done: seeded=${r.seeded} sourcesOk=${r.sourcesOk} empty=${r.sourcesEmpty} failed=${r.sourcesFailed}`))
      .catch((err) => {
        console.error("[announcementsIngest] run failed:", err);
        Sentry.captureException(err, { tags: { component: "announcements-ingest-cron" } });
      });
  });
  console.log("[announcementsIngest] cron scheduled (every 30 min, RUN_ANNOUNCE_CRON=1)");
}
