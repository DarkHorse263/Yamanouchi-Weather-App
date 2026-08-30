import { pgTable, varchar, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Deliverability incidents reported by Resend webhooks (email.bounced /
 * email.complained). Resend can accept a send synchronously (HTTP 200) and
 * then hard-bounce or be marked as spam minutes later — those async signals
 * never surface in the send call, so a magic-link visitor would just wait
 * forever. We record every bounce/complaint here so the owner can see them
 * on the admin dashboard.
 *
 * Incident facts are append-only: repeat sends are suppressed until an admin
 * records a resolution on the latest incident for the address. Resolution
 * metadata preserves who removed the block and when. We
 * deliberately do NOT auto-unsubscribe a matching alert/newsletter subscriber
 * (a delivery incident should not silently change someone's saved opt-in).
 * Cleanup is a human decision made from the admin surface.
 */
export const emailDeliveryIncidentsTable = pgTable(
  "email_delivery_incidents",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    // Nullable for production-safe rollout over existing incident rows. Every
    // new webhook record supplies the Svix event id, and the unique index makes
    // provider retries idempotent.
    providerEventId: text("provider_event_id"),
    email: text("email").notNull(),
    // 'bounced' | 'complained' — mirrors the Resend webhook event minus the
    // `email.` prefix.
    type: text("type").notNull(),
    // Human-readable reason from the webhook payload (bounce sub-type,
    // diagnostic text, etc). Nullable because complaints often carry none.
    reason: text("reason"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedByUserId: text("resolved_by_user_id"),
    resolvedByEmail: text("resolved_by_email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("email_delivery_incidents_created_idx").on(t.createdAt),
    index("email_delivery_incidents_email_idx").on(t.email),
    uniqueIndex("email_delivery_incidents_provider_event_idx").on(t.providerEventId),
  ],
);

export type EmailDeliveryIncident = typeof emailDeliveryIncidentsTable.$inferSelect;
