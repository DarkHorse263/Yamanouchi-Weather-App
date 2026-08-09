import { pgTable, date, text, integer, primaryKey } from "drizzle-orm/pg-core";

/**
 * Daily aggregate counters for the snow-alert prompt funnel
 * (alert_promo_shown / clicked / dismissed).
 *
 * Why aggregates, not an event log: the admin Stats tab only needs the
 * counts, and a counter row per (day, event) means the table stays tiny
 * (3 rows/day) no matter how much traffic the banner gets.
 *
 * Privacy · the increment ping carries NO identifier of any kind (no IP
 * hash, no cookie, no profile token), so these first-party counts are not
 * consent-gated the way the GA mirror is. That also means they will read
 * HIGHER than GA (GA only counts analytics-consented visitors).
 */
export const promoFunnelDailyTable = pgTable(
  "promo_funnel_daily",
  {
    day: date("day").notNull(), // UTC calendar day, YYYY-MM-DD
    event: text("event").notNull(), // shown | clicked | dismissed
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.event] })],
);

export type PromoFunnelDaily = typeof promoFunnelDailyTable.$inferSelect;
