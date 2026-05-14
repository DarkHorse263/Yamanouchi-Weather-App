import { pgTable, varchar, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Newsletter campaigns · one row per drafted/sent broadcast. Created by an
 * admin from /admin/newsletter, optionally previewed, then sent. Once sent,
 * `sentAt` is stamped and the row becomes immutable history.
 *
 * Body is stored as markdown · rendered to HTML at send time so we can
 * tweak the email template without rewriting saved drafts.
 */
export const newsletterCampaignsTable = pgTable(
  "newsletter_campaigns",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    subject: text("subject").notNull(),
    bodyMd: text("body_md").notNull(),
    /** Region scope filter applied at send time; null = all verified subscribers */
    regionFilter: text("region_filter"),
    senderUserId: varchar("sender_user_id"),  // FK to users.id (no DB constraint, soft link)
    status: text("status").notNull().default("draft"), // draft | sending | sent | failed
    recipientCount: integer("recipient_count"),
    deliveredCount: integer("delivered_count"),
    failedCount: integer("failed_count"),
    error: text("error"),
    metadata: jsonb("metadata"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("newsletter_campaigns_status_idx").on(t.status),
    index("newsletter_campaigns_sent_at_idx").on(t.sentAt),
  ],
);

export type NewsletterCampaign = typeof newsletterCampaignsTable.$inferSelect;
export type InsertNewsletterCampaign = typeof newsletterCampaignsTable.$inferInsert;
