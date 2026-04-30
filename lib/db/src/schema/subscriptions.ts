import { pgTable, varchar, text, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * One row per active or historical subscription. The current entitlement for
 * a user is computed by looking up the most-recent row with status='active'
 * (or 'trialing') for that user. We keep historical rows for analytics,
 * dunning, and refund handling.
 */
export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tier: text("tier").notNull(), // 'free' | 'pro' | 'team'
    status: text("status").notNull(), // 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid'
    provider: text("provider"), // 'stripe' | 'apple_iap' | 'google_iap' | 'manual'
    providerSubId: varchar("provider_sub_id"), // e.g. Stripe sub_xxx
    providerCustomerId: varchar("provider_customer_id"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAt: timestamp("cancel_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("subscriptions_user_status_idx").on(t.userId, t.status),
    // Composite unique on (provider, providerSubId) makes Stripe/Apple/Google
    // webhook upserts idempotent — replays of the same event will UPSERT into
    // the same row instead of creating duplicates that would break the
    // "current subscription" lookup. NULL providerSubId is allowed for manual
    // grants and PostgreSQL treats each NULL as distinct.
    uniqueIndex("subscriptions_provider_sub_uidx").on(t.provider, t.providerSubId),
  ],
);

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
