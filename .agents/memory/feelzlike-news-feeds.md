---
name: feelzlike news feeds (announcements ingest)
description: How live snow-news RSS sources are aggregated, filtered, and self-healed in announcementsIngest; why Mountainwatch usually yields zero.
---

# feelzlike live news feeds

Live "news" announcements come from publisher RSS feeds (SnowsBest, Mountainwatch,
SnowAction) ingested in `announcementsIngest.ts`, fanned out across the AU region
feeds and served by `GET /api/announcements`. They render on the home strip, the
region Alerts page, AND the global `/news` page (all three off the same feed).

## Legal posture (do not regress)
Aggregate ONLY: headline + short excerpt + link-out + source attribution. Never
store/render full article body or source images. **Why:** copyright safety — this
was a deliberate decision, not an oversight.

## AU/NZ relevance filter
Items are kept only if an RSS `<category>` matches the AU/NZ allowlist regex.
**Why:** the public feeds also carry global resort-directory entries. SnowsBest
carries real AU/NZ articles; Mountainwatch's `/feed/` is mostly global resort
guide pages (Japan/Europe) and its `/features/feed/` + `/category/news/feed/` are
EMPTY — so Mountainwatch usually contributes 0 items. **That is expected, not a
bug.** It stays wired for when AU-tagged posts appear.

## Self-heal replace pattern (the subtle part)
News sources set `replacePrefix` ("src:<feedKey>:") and own that whole dedupeKey
namespace. On a successful+valid fetch the set is REPLACED (delete-by-prefix +
reinsert, in ONE `db.transaction`) so items that drop out of a feed don't linger
as stale rows. Three guards make this safe:
- The parser THROWS when a feed parses to zero `<item>`s (HTML error page,
  malformed, or non-RSS) → the throw skips the delete → last-known-good rows are
  preserved. **Why:** a 200-OK error page must never wipe good rows.
- A valid feed with 0 relevant items legitimately returns `[]` → rows cleared.
  This is counted as `sourcesEmpty` (NOT `sourcesFailed`) so Mountainwatch's
  normal 0 doesn't look like a broken ingest.
- Delete + reinsert run in a transaction so a mid-write failure can't leave a
  feed half-populated.

**How to apply:** any new replacePrefix source must throw on structurally-invalid
input before returning `[]`, or it will silently wipe its own rows on a publisher
outage. Positional `slot<i>` dedupeKeys + prefix replacement keep growth bounded.

## Per-source relevance policy (trustSource)
`buildNewsRows(..., { trustSource })`. Global aggregators (Mountainwatch,
SnowsBest) keep the AU/NZ `<category>` allowlist. AU-domain feeds (SnowAction)
pass `trustSource:true` and SKIP the allowlist. **Why:** AU-domain snow magazines
are already AU-focused but tag their feed sparsely, so the allowlist would wrongly
drop nearly every item; their content can still be JP/NZ snow-travel
(Hakuba/Queenstown) and that breadth is intentional. **How to apply:** new
AU-domain sources → trustSource on; new global aggregators → leave it off so the
allowlist protects the AU region feeds. trustSource does NOT bypass the
throw-on-zero-parsed guard, so it can't wrongly clear its replacePrefix rows.

## Surfaces (do not regress /news)
The feed must reach BOTH the home strip and the full `/news` page, mapped onto the
curated `NewsItem` shape via the shared module
`feelzlike/src/lib/news/announcements.ts` (`useAnnouncements` +
`announcementsToNewsItems`). **Why:** /news previously rendered ONLY the static
curated affiliate list (`data/news.ts`), so the automated feed never reached it
and the page looked stale/blank. The mapper COLLAPSES the AU region fan-out by
`sourceUrl||title` into one card (regions = union) so "all regions" never shows the
same story 3x; automated items are category "resort" + `sponsored:false` (only
curated items carry affiliate links/pills).

## /news presentation + deals moratorium (product decisions)
The global `/news` page is intentionally a flat, newest-first grid with NO
region/category filter controls (the list is short enough to scan). NewsCards are
TEXT-ONLY — the 16:9 thumbnail/placeholder header was removed; the sponsored pill
moved inline into the meta row so affiliate disclosure stays visible. **Why:** the
text-only card also aligns with the aggregate-only legal posture (no source images).
Content-less cards are dropped on `/news` via `blurb.trim().length > 0` (announcements
with `body: null` map to empty blurb → filtered).
Deals are HIDDEN app-wide (not deleted) until advertisers exist — the moratorium
lives in `getAllNews()` + `getNewsForRegion()` (shared `isVisibleNews` predicate,
`category !== "deals"`) so it covers `/news` AND the per-region NewsStrip. **Why:**
filtering only on `/news` left deals leaking onto region strips. **How to apply:**
don't delete the deal items from `data/news.ts` or "fix" missing deals by re-adding
a Deals filter without product sign-off — remove the `isVisibleNews` predicate to
restore them everywhere at once.
`/news` LEADS with daily resort snow reports (where available) in their own "daily
snow reports" section, then "latest news". Reports are identified by
`NewsItem.snowReport`: curated link-out cards set it explicitly (Perisher / Falls
Creek / Mt Hotham), and `announcementsToNewsItems` derives it from
`ann.category === "conditions"` (Thredbo's LivePass report ingests as "conditions").
**Caveat (do before adding live sources):** "conditions" is the ONLY current
live-report signal but is semantically broad — a future generic conditions/lifts
update would be mis-flagged as a snow report. When more live announcement sources
land, replace the `category === "conditions"` check with an explicit
`snowReport`/`kind` flag emitted from `announcementsIngest.ts`.

## Resort daily snow reports (link-out only)
Perisher, Falls Creek and Mt Hotham are Vail AU resorts on three DIFFERENT site
platforms (Perisher=Joomla, Falls Creek=WordPress, Hotham=DNN — note the
`/Portals/0/` path) with NO clean public snow-report feed; the snow numbers are
rendered client-side, so there's nothing stable to scrape or ingest. They live as
static link-out cards in `data/news.ts` (category "resort") pointing at each
resort's official report page, NOT via announcementsIngest. **Why:** these resorts
publish email-style daily reports; link-out cards were chosen over fragile scraping
and need zero maintenance. **How to apply:** don't add a LiveSource parser for these —
only Thredbo (EVT LivePass XML) exposes a machine-readable feed. Canonical paths
(re-derive from each homepage's nav, the guessed `/snow-report` URLs are soft-404s):
Perisher `/reports-cams/reports/snow-report`, Falls Creek `/snowreport/`,
Hotham `/mountain/conditions/snow-reports`.
