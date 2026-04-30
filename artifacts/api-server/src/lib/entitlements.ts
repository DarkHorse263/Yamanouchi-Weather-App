/**
 * Source-of-truth mapping from subscription tier → entitlements (capabilities).
 *
 * Entitlements are checked by route handlers and middleware. They are NOT
 * checked by the client — premium features must be guarded server-side because
 * a paywall enforced only in the UI is not a paywall.
 *
 * Add a new premium feature in three steps:
 *   1) Add a string literal to `Entitlement`
 *   2) Add it to the appropriate tier(s) in `TIER_ENTITLEMENTS`
 *   3) Guard the route with `requireEntitlement('your.new.feature')`
 */

export type Tier = "free" | "pro" | "team";

export type Entitlement =
  | "forecast.basic" // 6-day daily forecast (everyone)
  | "forecast.extended" // 14-day hourly + ensemble spread
  | "forecast.peak" // multi-elevation peak vs base profile
  | "alerts.snow" // push notifications when snowfall threshold crossed
  | "alerts.wind" // wind/storm warnings
  | "webcams.live" // live cam streams (free tier sees a cached snapshot)
  | "history.archive" // historical season data + comparisons
  | "ads.disabled" // remove third-party ad slots
  | "api.public"; // generated API access for power users

export const TIER_ENTITLEMENTS: Record<Tier, ReadonlyArray<Entitlement>> = {
  free: ["forecast.basic"],
  pro: [
    "forecast.basic",
    "forecast.extended",
    "forecast.peak",
    "alerts.snow",
    "alerts.wind",
    "webcams.live",
    "history.archive",
    "ads.disabled",
  ],
  team: [
    "forecast.basic",
    "forecast.extended",
    "forecast.peak",
    "alerts.snow",
    "alerts.wind",
    "webcams.live",
    "history.archive",
    "ads.disabled",
    "api.public",
  ],
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export interface SubscriptionLike {
  tier: string;
  status: string;
  currentPeriodEnd?: Date | null;
}

export function effectiveTier(sub: SubscriptionLike | null | undefined): Tier {
  if (!sub) return "free";
  if (!ACTIVE_STATUSES.has(sub.status)) return "free";
  if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < Date.now()) return "free";
  if (sub.tier === "pro" || sub.tier === "team") return sub.tier;
  return "free";
}

export function hasEntitlement(sub: SubscriptionLike | null | undefined, ent: Entitlement): boolean {
  const tier = effectiveTier(sub);
  return TIER_ENTITLEMENTS[tier].includes(ent);
}
