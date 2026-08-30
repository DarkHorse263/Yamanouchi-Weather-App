import {
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const thredboLiftTransitionsTable = pgTable(
  "thredbo_lift_transitions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
    feedUpdatedAt: timestamp("feed_updated_at", { withTimezone: true }).notNull(),
    liftId: text("lift_id").notNull(),
    liftName: text("lift_name").notNull(),
    previousStatus: text("previous_status"),
    status: text("status").notNull(),
    villageObservedAt: timestamp("village_observed_at", { withTimezone: true }),
    villageWindKmh: doublePrecision("village_wind_kmh"),
    villageGustKmh: doublePrecision("village_gust_kmh"),
    villageWindDirection: text("village_wind_direction"),
    topObservedAt: timestamp("top_observed_at", { withTimezone: true }),
    topWindKmh: doublePrecision("top_wind_kmh"),
    topGustKmh: doublePrecision("top_gust_kmh"),
    topWindDirection: text("top_wind_direction"),
  },
  (t) => [
    uniqueIndex("thredbo_lift_transitions_feed_lift_uidx").on(t.feedUpdatedAt, t.liftId),
    index("thredbo_lift_transitions_observed_idx").on(t.observedAt),
    index("thredbo_lift_transitions_lift_idx").on(t.liftId, t.observedAt),
  ],
);

export type ThredboLiftTransition = typeof thredboLiftTransitionsTable.$inferSelect;
