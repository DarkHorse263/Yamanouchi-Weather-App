import { pgTable, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Deliverability incidents reported by Resend webhooks (email.bounced /
 * email.complained). Resend can accept a send synchronously (HTTP 200) and
 * then hard-bounce or be marked as spam minutes later — those async signals
 * never surface in the send call, so a magic-link visitor would just wait
 * forever. We record every bounce/complaint here so the owner can see them
 * on the admin dashboard.
 *
 * This is an append-only ledger: we deliberately do NOT auto-unsubscribe a
 * matching alert/newsletter subscriber (a single transient bounce shouldn't
 * silently drop someone's opt-in) — we only record the incident. Cleanup is
 * a human decision made from the admin surface.
 */
export const emailDeliveryIncidentsTable = pgTable(
  "email_delivery_incidents",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    // 'bounced' | 'complained' — mirrors the Resend webhook event minus the
    // `email.` prefix.
    type: text("type").notNull(),
    // Human-readable reason from the webhook payload (bounce sub-type,
    // diagnostic text, etc). Nullable because complaints often carry none.
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("email_delivery_incidents_created_idx").on(t.createdAt),
    index("email_delivery_incidents_email_idx").on(t.email),
  ],
);

export type EmailDeliveryIncident = typeof emailDeliveryIncidentsTable.$inferSelect;
