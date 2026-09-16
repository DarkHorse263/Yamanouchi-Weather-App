import { isAuSeasonClosureActive } from "@workspace/promo-constants";

export interface LiveLiftCanary {
  id: string;
  liveFeed: boolean;
}

/**
 * The official live feeds are only expected to update during the normal
 * June-September Sydney season. A dated policy closure is different: it must
 * still be probed through the end of its policy year so stale/open snapshots
 * cannot hide behind the ordinary out-of-season skip.
 */
export function isSydneyLiftFeedSeason(now: Date = new Date()): boolean {
  const month = Number(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      month: "numeric",
    }).format(now),
  );
  return month >= 6 && month <= 9;
}

export function shouldCheckLiveLiftCanary(
  canary: LiveLiftCanary,
  now: Date = new Date(),
): boolean {
  const closedForSeason = isAuSeasonClosureActive({
    countryCode: "AU",
    locationId: canary.id,
    now,
  });
  if (closedForSeason) return true;
  if (!canary.liveFeed) return false;
  return isSydneyLiftFeedSeason(now);
}

export interface ClosedLiftProbe {
  seasonStatus?: unknown;
  liveStatusVerified?: unknown;
  liftsOpen?: unknown;
  totalLifts?: unknown;
  lifts?: Array<{ status?: unknown }>;
}

export function validateClosedLiftProbe(
  json: ClosedLiftProbe,
): { ok: boolean; detail: string } {
  const totalLifts = Number(json.totalLifts);
  const liftsOpen = Number(json.liftsOpen);
  const rows = Array.isArray(json.lifts) ? json.lifts : [];
  const allRowsClosed =
    rows.length > 0 &&
    rows.length === totalLifts &&
    rows.every((lift) => lift.status === "closed");
  const ok =
    json.seasonStatus === "closed" &&
    json.liveStatusVerified !== true &&
    totalLifts > 0 &&
    liftsOpen === 0 &&
    allRowsClosed;

  if (ok) return { ok: true, detail: "closed for season" };
  return {
    ok: false,
    detail:
      `expected closed-for-season state, got seasonStatus=${String(json.seasonStatus)}, ` +
      `liveStatusVerified=${String(json.liveStatusVerified)}, liftsOpen=${String(json.liftsOpen)}, ` +
      `totalLifts=${String(json.totalLifts)}, returnedRows=${rows.length}, ` +
      `allRowsClosed=${String(allRowsClosed)}`,
  };
}