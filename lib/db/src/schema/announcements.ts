import { pgTable, varchar, text, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Resort announcements / updates feed. Human-readable updates from ski
 * resorts — opening dates, snowmaking, lift status, events, conditions.
 *
 * This is the WRITE-authority store (Replit Postgres). It is populated two
 * ways, both idempotent via `dedupeKey`:
 *   1. A seed of curated, confirmed announcements (e.g. opening-weekend
 *      dates) so the feed has accurate content immediately.
 *   2. A best-effort ingestion job that polls resort news / snow-report
 *      pages and upserts a "latest update" card per source. Ingestion
 *      failures never touch existing rows, so the feed never breaks.
 *
 * `dedupeKey` is a stable string (e.g. `seed:snowy-mountains:thredbo-opening`
 * or `src:thredbo-snow-report`) so re-running the seed / ingest updates the
 * same row in place instead of creating duplicates.
 */
export const resortAnnouncementsTable = pgTable(
  "resort_announcements",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    region: text("region").notNull(),
    // Resort / mountain display name. Null = region-wide announcement.
    resort: text("resort"),
    // 'opening' | 'snowmaking' | 'lifts' | 'event' | 'conditions' | 'general'
    category: text("category").notNull().default("general"),
    title: text("title").notNull(),
    body: text("body"),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    // Pinned announcements sort to the top (used for opening-weekend seeds).
    pinned: boolean("pinned").notNull().default(false),
    // 'published' | 'draft' | 'archived'
    status: text("status").notNull().default("published"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    // Stable idempotency key for upsert (seed / ingest re-runs).
    dedupeKey: text("dedupe_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("resort_announcements_dedupe_uidx").on(t.dedupeKey),
    index("resort_announcements_feed_idx").on(t.region, t.status, t.pinned, t.publishedAt),
  ],
);

export const insertResortAnnouncementSchema = createInsertSchema(resortAnnouncementsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertResortAnnouncement = z.infer<typeof insertResortAnnouncementSchema>;
export type ResortAnnouncement = typeof resortAnnouncementsTable.$inferSelect;
