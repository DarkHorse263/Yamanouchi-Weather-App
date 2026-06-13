---
name: feelzlike news feeds (announcements ingest)
description: How live snow-news RSS sources are aggregated, filtered, and self-healed in announcementsIngest; why Mountainwatch usually yields zero.
---

# feelzlike live news feeds

Live "news" announcements come from publisher RSS feeds (SnowsBest, Mountainwatch)
ingested in `announcementsIngest.ts`, fanned out across the AU region feeds and
rendered in the region Alerts page.

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
