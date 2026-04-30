import { pgTable, varchar, text, timestamp, jsonb, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Provider-agnostic user table. The same row works for Clerk, Replit Auth,
 * email/password, Google sign-in, etc. — they all populate `externalAuthId`
 * and `authProvider`. The internal `id` is what every other table FKs against
 * so the user record outlives any auth-provider migration.
 *
 * `(authProvider, externalAuthId)` is composite-unique so e.g. a Clerk user_abc
 * can coexist with a Replit user_abc without colliding (the providers' ID
 * spaces are independent). Email is also globally unique because we treat it
 * as the human-recognisable identifier across providers.
 */
export const usersTable = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    externalAuthId: varchar("external_auth_id"),
    authProvider: text("auth_provider"), // 'clerk' | 'replit' | 'manual' | 'google' | 'apple'
    email: text("email").unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    locale: text("locale").default("en"),
    units: text("units").notNull().default("metric"), // 'metric' | 'imperial'
    homeRegionId: text("home_region_id"), // matches REGIONS[].id, e.g. 'snowy-mountains'
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    consent: jsonb("consent"), // { analytics: bool, ads: bool, ts: ISO }
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("users_provider_external_auth_idx").on(t.authProvider, t.externalAuthId),
  ],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
