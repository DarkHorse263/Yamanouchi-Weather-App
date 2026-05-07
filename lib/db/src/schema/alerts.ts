import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Powder-alert subscribers. Independent of the auth `users` table — anyone can
 * subscribe with just an email, no account required (the playbook is explicit
 * about this: one-click access from email links). If a subscriber later signs
 * in we link via `profileToken` so preferences can be merged.
 *
 * Soft-delete via `unsubscribedAt`. We never hard-delete because we want to
 * honour "do not re-subscribe with the same email after unsubscribe" without
 * letting that policy be bypassed by a trivial re-signup.
 */
export const alertSubscribersTable = pgTable(
  "alert_subscribers",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    regions: text("regions").array().notNull().default(sql`ARRAY[]::text[]`),
    mountains: text("mountains").array().notNull().default(sql`ARRAY[]::text[]`),
    snowfallThresholdCm: integer("snowfall_threshold_cm").notNull().default(15),
    horizonHours: integer("horizon_hours").notNull().default(48),
    delivery: text("delivery").notNull().default("email"), // 'email' | 'push' | 'both'
    timezone: text("timezone").notNull().default("UTC"),
    profileToken: text("profile_token"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    unsubscribeReason: text("unsubscribe_reason"),
    lastAlertedAt: timestamp("last_alerted_at", { withTimezone: true }),
    // Tokens issued before this cutoff (compared to their `iat` claim) are
    // rejected. Bumped on destructive actions like unsubscribe so a leaked
    // manage/unsub link can't be replayed afterwards.
    tokensInvalidatedAt: timestamp("tokens_invalidated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("alert_subscribers_email_uidx").on(t.email),
    index("alert_subscribers_active_idx").on(t.verifiedAt, t.unsubscribedAt),
  ],
);

/**
 * Web-push endpoints owned by a subscriber. A subscriber may have multiple
 * (one per browser/device). Stored as the raw PushSubscription JSON pieces
 * because that's what `web-push` needs to send a notification.
 */
export const pushSubscriptionsTable = pgTable(
  "alert_push_subscriptions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    subscriberId: varchar("subscriber_id")
      .notNull()
      .references(() => alertSubscribersTable.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
    failureCount: integer("failure_count").notNull().default(0),
  },
  (t) => [
    uniqueIndex("alert_push_endpoint_uidx").on(t.endpoint),
    index("alert_push_subscriber_idx").on(t.subscriberId),
  ],
);

/**
 * Dedupe log for the alert evaluator. Before dispatching an alert for
 * (subscriber, mountain, alertWindow) we check whether the same combo was
 * sent in the last 24h. `alertWindow` is a deterministic key like
 * `2026-05-05T12:00Z` — the start of the rolling forecast window the alert
 * is about, so different storms about the same mountain don't get dedupe'd
 * against each other.
 */
export const dispatchedAlertsTable = pgTable(
  "alert_dispatched",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    subscriberId: varchar("subscriber_id")
      .notNull()
      .references(() => alertSubscribersTable.id, { onDelete: "cascade" }),
    mountain: text("mountain").notNull(),
    region: text("region").notNull(),
    alertWindow: text("alert_window").notNull(),
    snowfallCm: integer("snowfall_cm").notNull(),
    delivery: text("delivery").notNull(), // 'email' | 'push'
    success: boolean("success").notNull().default(true),
    errorMessage: text("error_message"),
    payload: jsonb("payload"),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("alert_dispatched_dedupe_idx").on(t.subscriberId, t.mountain, t.alertWindow),
    index("alert_dispatched_subscriber_recent_idx").on(t.subscriberId, t.sentAt),
    // DB-level dedupe: at most one successful dispatch per
    // (subscriber, alertWindow, delivery channel). Prevents duplicate sends
    // when two evaluator runs overlap (e.g. cron + manual /internal/run).
    uniqueIndex("alert_dispatched_success_uidx")
      .on(t.subscriberId, t.alertWindow, t.delivery)
      .where(sql`success = true`),
  ],
);

export const insertAlertSubscriberSchema = createInsertSchema(alertSubscribersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  unsubscribedAt: true,
  unsubscribeReason: true,
  lastAlertedAt: true,
});
export type InsertAlertSubscriber = z.infer<typeof insertAlertSubscriberSchema>;
export type AlertSubscriber = typeof alertSubscribersTable.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptionsTable.$inferSelect;
export type DispatchedAlert = typeof dispatchedAlertsTable.$inferSelect;
