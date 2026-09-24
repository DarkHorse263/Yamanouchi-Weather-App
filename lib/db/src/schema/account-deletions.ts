import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// No FK: recovery must survive removal of the local user.
export const accountDeletionsTable = pgTable("account_deletions", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").unique(),
  userId: text("user_id"),
  email: text("email"),
  phase: text("phase").notNull().default("pending_clerk"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
export const insertAccountDeletionSchema = createInsertSchema(accountDeletionsTable).omit({ id: true });
export type InsertAccountDeletion = z.infer<typeof insertAccountDeletionSchema>;
export type AccountDeletion = typeof accountDeletionsTable.$inferSelect;