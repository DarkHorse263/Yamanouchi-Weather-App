/**
 * Bounded LRU cache with per-entry TTL and stale-while-revalidate semantics.
 *
 * Designed for per-town / per-mountain weather caches that will grow as we
 * onboard global regions. The existing `/api/regions` cache is bounded by
 * REGIONS.length (small, finite) so it doesn't need this — but any forthcoming
 * cache keyed by an unbounded set (towns, mountains, ad-hoc geocoded queries)
 * should use this helper to avoid memory exhaustion.
 *
 * Usage:
 *   const cache = new LruTtlCache<HeadlineReading>({ maxEntries: 5000, freshMs: 5*60_000, staleMs: 6*60*60_000 });
 *   const entry = cache.get("thredbo");
 *   if (entry?.fresh) return entry.value;
 *   const fresh = await fetchUpstream();
 *   cache.set("thredbo", fresh);
 */

export interface LruTtlEntry<V> {
  value: V;
  /** True if within freshMs window — safe to return without revalidation. */
  fresh: boolean;
  /** True if past freshMs but within staleMs — return + revalidate in background. */
  stale: boolean;
}

export interface LruTtlOptions {
  maxEntries: number;
  /** Time the entry is "fresh" — return without revalidation. */
  freshMs: number;
  /**
   * ADDITIONAL time after freshMs during which the entry is "stale"
   * (return + revalidate in background). Total lifetime = freshMs + staleMs.
   * Set to 0 for hard expiry the moment freshness ends.
   */
  staleMs: number;
}

interface InternalEntry<V> {
  value: V;
  freshUntil: number;
  staleUntil: number;
}

export class LruTtlCache<V> {
  private map = new Map<string, InternalEntry<V>>();
  constructor(private opts: LruTtlOptions) {}

  get(key: string): LruTtlEntry<V> | null {
    const e = this.map.get(key);
    if (!e) return null;
    const now = Date.now();
    if (e.staleUntil <= now) {
      this.map.delete(key);
      return null;
    }
    // Map preserves insertion order — re-insert to mark as recently used
    this.map.delete(key);
    this.map.set(key, e);
    return { value: e.value, fresh: e.freshUntil > now, stale: e.freshUntil <= now };
  }

  set(key: string, value: V): void {
    const now = Date.now();
    this.map.delete(key);
    this.map.set(key, {
      value,
      freshUntil: now + this.opts.freshMs,
      // Stale window is sequential: starts when fresh ends.
      staleUntil: now + this.opts.freshMs + this.opts.staleMs,
    });
    // Evict oldest entries until we're at the cap
    while (this.map.size > this.opts.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey === undefined) break;
      this.map.delete(oldestKey);
    }
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  size(): number {
    return this.map.size;
  }

  stats() {
    return { entries: this.map.size, maxEntries: this.opts.maxEntries };
  }
}
