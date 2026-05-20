/**
 * Response cache for the Supabase tables that back the snow/storm/alert
 * routes. The upstream Swift job only refreshes these tables hourly
 * (5am-6pm JST per snow.ts), so caching reads for 60s collapses
 * dozens of inbound requests into a single Supabase query without ever
 * serving meaningfully stale data.
 *
 * Why this exists: Supabase flagged the `Daily Snow Forecast` project
 * for high Disk IO. Every page view that touches the dashboard, map,
 * resorts list, storm outlook, or powder alerts was a separate
 * `SELECT * FROM ...` hit. With this layer in place the burst on any
 * one table collapses to one hit per minute regardless of inbound RPS.
 *
 * Behaviour:
 *   - On cache hit (within `freshMs`), returns the cached rows
 *     synchronously, no Supabase round-trip.
 *   - On miss or stale, fetches fresh rows. If the fetch throws, the
 *     last known good rows (even if past `freshMs`) are returned as a
 *     soft fallback so a transient Supabase blip doesn't fault the UI.
 *   - Inflight de-duplication: concurrent callers on a cold cache all
 *     share the same in-flight promise instead of stampeding the DB.
 */
import { getSupabase } from "./supabase.js";

type Row = Record<string, unknown>;

interface Slot {
  rows: Row[];
  fetchedAt: number;
}

const FRESH_MS = 60_000; // 1 minute
// Max age we'll keep serving from the soft-fallback slot if Supabase
// remains unreachable. Beyond this, we surface the error so the route's
// own fallback path runs instead of silently serving day-old rows.
// Picked at 4h so a multi-hour outage still serves stable cached data
// but a sustained dead source can't masquerade as healthy.
const MAX_STALE_MS = 4 * 60 * 60_000;

interface Source {
  table: string;
  /** Optional ORDER BY clause applied to every read. */
  order?: { column: string; ascending: boolean };
}

interface CachedFetcher {
  (): Promise<Row[]>;
}

function makeCachedFetcher(src: Source): CachedFetcher {
  let slot: Slot | null = null;
  let inflight: Promise<Row[]> | null = null;

  async function fetchFresh(): Promise<Row[]> {
    const supabase = getSupabase();
    if (!supabase) throw new Error(`supabase_not_configured:${src.table}`);
    let q = supabase.from(src.table).select("*");
    if (src.order) {
      q = q.order(src.order.column, { ascending: src.order.ascending });
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Row[];
  }

  return async function getRows(): Promise<Row[]> {
    const now = Date.now();
    if (slot && now - slot.fetchedAt < FRESH_MS) {
      return slot.rows;
    }
    if (inflight) return inflight;

    inflight = (async () => {
      try {
        const rows = await fetchFresh();
        slot = { rows, fetchedAt: Date.now() };
        return rows;
      } catch (err) {
        // Soft-fallback to last known good rows if we ever fetched
        // successfully before · prevents a Supabase blip from blanking
        // the dashboard. Bounded by MAX_STALE_MS so a sustained outage
        // can't quietly serve day-old data · past that we rethrow and
        // let the route's existing fallback handler run.
        if (slot && Date.now() - slot.fetchedAt < MAX_STALE_MS) {
          console.warn(
            `[snowCache] ${src.table} fetch failed, serving stale rows (age=${Date.now() - slot.fetchedAt}ms):`,
            err,
          );
          return slot.rows;
        }
        throw err;
      } finally {
        inflight = null;
      }
    })();

    return inflight;
  };
}

export const getResortsTodayRows = makeCachedFetcher({
  table: "yamanouchi_resorts_today",
});

export const getStormsTodayRows = makeCachedFetcher({
  table: "yamanouchi_storms_today",
  order: { column: "storm_rank", ascending: true },
});

export const getPowderAlertsTodayRows = makeCachedFetcher({
  table: "powder_alerts_today",
  order: { column: "created_at", ascending: false },
});
