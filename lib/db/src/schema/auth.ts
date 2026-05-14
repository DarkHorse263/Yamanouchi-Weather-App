import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Sessions table for cookie-based browser auth and bearer-token mobile auth.
 *
 * (IMPORTANT) This table is mandatory for Replit Auth · don't drop it.
 *
 * Note · we deliberately do NOT redefine `usersTable` here. The project
 * already has a provider-agnostic users table in `users.ts` (with composite
 * (authProvider, externalAuthId) uniqueness, jsonb consent, marketing opt-in,
 * etc) which is the right long-term shape. The auth routes upsert into THAT
 * table, mapping OIDC claims onto its columns. See `routes/auth.ts` in
 * api-server for the upsert.
 */
export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
