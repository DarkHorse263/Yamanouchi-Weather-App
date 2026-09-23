import { pgTable, varchar, text, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// Application ownership and delivery ledger only; Stripe owns its catalogue.
export const billingCustomersTable = pgTable("billing_customers", {
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "restrict" }),
  customerId: text("customer_id").notNull(),
  live: boolean("live").notNull(),
}, (t) => [
  uniqueIndex("billing_customer_owner_uidx").on(t.userId, t.live),
  uniqueIndex("billing_customer_id_uidx").on(t.customerId, t.live),
]);
export const billingEventsTable = pgTable("billing_events", {
  eventId: text("event_id").primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});