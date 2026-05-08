import { pgTable, varchar, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Newsletter (general digest) subscribers.
 *
 * Distinct from `alertSubscribersTable` (powder alerts) on purpose:
 *   - Powder alerts are event-triggered: only sent when a verified
 *     storm is incoming, with a per-subscriber threshold.
 *   - Newsletter is a scheduled digest: season forecasts, off-mountain
 *     ideas, what's opening/closing, the punchy "feelzlike voice"
 *     read of the week ahead.
 *
 * A user can be on both lists, neither, or one - they're independent.
 *
 * Soft-delete via `unsubscribedAt`; we never hard-delete so a re-subscribe
 * doesn't bypass the user's earlier opt-out without a fresh double opt-in.
 */
export const newsletterSubscribersTable = pgTable(
  "newsletter_subscribers",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    // Which region(s) the digest should cover. Empty = both.
    regions: text("regions").array().notNull().default(sql`ARRAY[]::text[]`),
    // 'weekly' | 'fortnightly' | 'monthly'. Drives which sends include them.
    cadence: text("cadence").notNull().default("fortnightly"),
    // Free-text source attribution: 'footer', 'landing', 'alerts-page', etc.
    // Useful for measuring which CTAs convert without any third-party tracker.
    source: text("source"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    unsubscribeReason: text("unsubscribe_reason"),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
    // Bumped on destructive actions so leaked unsubscribe links can't be
    // replayed once already-used. Mirrors alertSubscribersTable.
    tokensInvalidatedAt: timestamp("tokens_invalidated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("newsletter_subscribers_email_uidx").on(t.email),
    index("newsletter_subscribers_active_idx").on(t.verifiedAt, t.unsubscribedAt),
  ],
);

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  unsubscribedAt: true,
  unsubscribeReason: true,
  lastSentAt: true,
  tokensInvalidatedAt: true,
});
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribersTable.$inferSelect;
