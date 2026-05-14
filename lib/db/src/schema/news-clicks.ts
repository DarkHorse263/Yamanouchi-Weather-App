import { pgTable, varchar, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Append-only log of news-card clicks. Drives the "top clicks" leaderboard
 * in the admin Stats tab and lets us prove sponsored CTR when negotiating
 * direct placements with resorts/brands.
 *
 * Privacy · we never store the user's IP. We hash it (sha256, server-side
 * salt) only to crudely de-dupe a single user double-clicking, then forget.
 * No PII makes it into this table.
 */
export const newsClicksTable = pgTable(
  "news_clicks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    newsId: text("news_id").notNull(),         // matches NewsItem.id from data/news.ts
    regionId: text("region_id"),               // null = global / "all"
    category: text("category"),                // resort / transport / passes / gear / deals / travel
    sponsored: boolean("sponsored").notNull().default(false),
    source: text("source"),                    // mirror of NewsItem.source for fast leaderboard
    referrerHost: text("referrer_host"),       // which page they clicked from (region landing vs /news)
    countryCode: text("country_code"),         // approx via Cloudflare/Replit headers if available
    ipHashShort: varchar("ip_hash_short", { length: 16 }), // first 16 chars of sha256, for soft dedup only
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("news_clicks_news_id_created_idx").on(t.newsId, t.createdAt),
    index("news_clicks_created_idx").on(t.createdAt),
  ],
);

export type NewsClick = typeof newsClicksTable.$inferSelect;
export type InsertNewsClick = typeof newsClicksTable.$inferInsert;
