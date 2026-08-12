/**
 * Match a resort's OFFICIAL live per-lift status rows (api-server feed, e.g.
 * Thredbo's XML) onto our local wind-hold seed catalogue (data/lifts.ts).
 *
 * The two lists drift on purpose: the feed is the resort's real lineup
 * (16 rows at Thredbo, incl. beginner carpets), the seed list is the curated
 * subset we model wind holds for. Matching is by NORMALISED name - marketing
 * suffixes ("Chairlift", "Express", "Quad") are stripped so
 * "Kosciuszko Express" (seed) meets "Kosciuszko Chairlift" (feed).
 *
 * Honesty rules (task: no silent misses):
 *  - A seed with no live row is reported as unmatched - the UI labels it
 *    "not in today's report" instead of guessing a status.
 *  - Ambiguous normalised names (two feed rows collapsing to one key, e.g. a
 *    hypothetical duplicate) match NOTHING rather than the wrong lift.
 *    Parenthetical qualifiers are KEPT ("Merritts Gondola (Scenic)" stays
 *    distinct from "Merritts Gondola") precisely to avoid that collision.
 *  - Feed rows with no seed are surfaced separately so the panel can list
 *    the resort's full lineup instead of silently dropping lifts.
 *
 * Pure module - no React, no data-catalogue imports - so it stays
 * `tsx --test`-safe (see memory: tsx test isolation).
 */

export interface LiveLiftRow {
  id: string;
  name: string;
  /** Feed status vocabulary (api-server thredboLiftStatus.ts). */
  status: "open" | "closed" | "on-hold" | "wind-hold" | "scheduled";
}

/** Words that are marketing/type suffixes, not identity: stripped from the
 *  END of a name (repeatedly, so "… Express Chairlift" fully reduces). */
const GENERIC_TRAILING = new Set([
  "chairlift",
  "chair",
  "express",
  "quad",
  "double",
  "triple",
  "lift",
  "learners",
]);

/**
 * Normalise a lift name to a comparison key: lowercase, punctuation removed
 * (apostrophes vanish so "Karel's" == "Karels"), "t bar" fused to "tbar",
 * generic trailing type words stripped. Parentheses' CONTENT is kept so
 * qualified variants stay distinct.
 */
export function normaliseLiftName(name: string): string {
  const words = name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bt bar\b/g, "tbar")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  while (words.length > 1 && GENERIC_TRAILING.has(words[words.length - 1])) {
    words.pop();
  }
  return words.join(" ");
}

export interface LiveLiftMatchResult {
  /** seed id -> the single unambiguous live row for that lift. */
  liveBySeedId: Record<string, LiveLiftRow>;
  /** Feed rows no seed claimed - the resort's lifts we don't wind-model. */
  unmatchedLive: LiveLiftRow[];
}

export function matchLiveLiftsToSeeds(
  seeds: ReadonlyArray<{ id: string; name: string }>,
  live: ReadonlyArray<LiveLiftRow>,
): LiveLiftMatchResult {
  // Group feed rows by normalised key; a key with >1 rows is ambiguous and
  // matches nothing (never guess which physical lift a status belongs to).
  const byKey = new Map<string, LiveLiftRow[]>();
  for (const row of live) {
    const key = normaliseLiftName(row.name);
    if (!key) continue;
    const bucket = byKey.get(key);
    if (bucket) bucket.push(row);
    else byKey.set(key, [row]);
  }

  const liveBySeedId: Record<string, LiveLiftRow> = {};
  const claimed = new Set<string>();
  for (const seed of seeds) {
    const bucket = byKey.get(normaliseLiftName(seed.name));
    if (!bucket || bucket.length !== 1) continue; // missing or ambiguous
    const row = bucket[0];
    if (claimed.has(row.id)) continue; // two seeds collapsing to one row
    claimed.add(row.id);
    liveBySeedId[seed.id] = row;
  }

  return {
    liveBySeedId,
    unmatchedLive: live.filter((row) => !claimed.has(row.id)),
  };
}
