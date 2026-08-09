import { pgTable, date, text, integer, primaryKey } from "drizzle-orm/pg-core";

/**
 * First-party engagement counting · the owner's "who is actually using this"
 * numbers for partner/advertiser conversations.
 *
 * Design mirrors promo_funnel_daily: tiny aggregate tables, no event log.
 *
 * Privacy (deliberate · keep it this way):
 *   - page_view_daily stores only (day, page, count). `page` is a coarse
 *     section label (region id or top-level section), never a full URL, so
 *     tokens/query strings can never leak in.
 *   - visitor_daily stores a one-way sha256 hash of (month + ip + user-agent
 *     + server secret). The salt rotates monthly, the hash is never sent to
 *     the client, and the raw IP/UA are never stored - so a "visitor" cannot
 *     be traced back to a person. This is cookieless counting: it needs no
 *     consent banner and counts EVERY visitor (reads HIGHER than GA, which
 *     only counts analytics-consented visitors).
 *   - Returning visitors = the same monthly hash seen on more than one
 *     calendar day (approximate across month boundaries · good enough for
 *     partner conversations, useless for tracking individuals).
 */
export const pageViewDailyTable = pgTable(
  "page_view_daily",
  {
    day: date("day").notNull(), // UTC calendar day, YYYY-MM-DD
    page: text("page").notNull(), // coarse section · region id or 'home'/'plan'/...
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.page] })],
);

export const visitorDailyTable = pgTable(
  "visitor_daily",
  {
    day: date("day").notNull(), // UTC calendar day, YYYY-MM-DD
    hash: text("hash").notNull(), // sha256(month|ip|ua|secret) · monthly rotating
  },
  (t) => [primaryKey({ columns: [t.day, t.hash] })],
);

/** pwa_install / pwa_launch and any future one-shot engagement events. */
export const engagementEventDailyTable = pgTable(
  "engagement_event_daily",
  {
    day: date("day").notNull(),
    event: text("event").notNull(), // pwa_install | pwa_launch
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.event] })],
);

export type PageViewDaily = typeof pageViewDailyTable.$inferSelect;
export type VisitorDaily = typeof visitorDailyTable.$inferSelect;
export type EngagementEventDaily = typeof engagementEventDailyTable.$inferSelect;
