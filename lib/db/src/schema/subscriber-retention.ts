import { pgTable, text, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// HMAC identifiers are pseudonymous, not anonymous. No email or preferences here.
export const subscriberSuppressionsTable = pgTable("subscriber_suppressions", {
  emailKey: text("email_key").notNull(),
  scope: text("scope").notNull(), // alerts | delivery
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.emailKey, t.scope] })]);

export const subscriberConsentEvidenceTable = pgTable("subscriber_consent_evidence", {
  subscriberId: text("subscriber_id").primaryKey(),
  emailKey: text("email_key").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
  policyVersion: text("policy_version"),
  surface: text("surface"),
  endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (t) => [index("subscriber_consent_expiry_idx").on(t.expiresAt)]);

export const insertSubscriberSuppressionSchema = createInsertSchema(subscriberSuppressionsTable);
export const insertSubscriberConsentEvidenceSchema = createInsertSchema(subscriberConsentEvidenceTable);
export type SubscriberSuppression = typeof subscriberSuppressionsTable.$inferSelect;
export type SubscriberConsentEvidence = typeof subscriberConsentEvidenceTable.$inferSelect;