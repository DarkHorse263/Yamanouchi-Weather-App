import { createHmac } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, alertSubscribersTable, subscriberConsentEvidenceTable, subscriberSuppressionsTable, type AlertSubscriber } from "@workspace/db";

export type RetentionTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export const RETENTION_DAYS = { pending: 30, unsubscribed: 90, dispatch: 90 } as const;

export function suppressionKey(email: string): string {
  const secret = process.env.ALERT_TOKEN_SECRET;
  if (!secret || secret.length < 16) throw new Error("Persistent ALERT_TOKEN_SECRET is required; retention and suppression checks fail closed.");
  return createHmac("sha256", secret).update("subscriber-retention:v1\0").update(email.trim().toLowerCase()).digest("hex");
}

export function yearsAfter(date: Date, years: number): Date {
  const result = new Date(date);
  const month = result.getUTCMonth();
  result.setUTCFullYear(result.getUTCFullYear() + years);
  // PostgreSQL calendar intervals clamp leap-day to February's final day.
  if (result.getUTCMonth() !== month) result.setUTCDate(0);
  return result;
}

export async function preserveSubscriberEvidence(tx: RetentionTransaction, row: AlertSubscriber, endedAt: Date): Promise<void> {
  const emailKey = suppressionKey(row.email);
  // Existing consent dates only: no inferred or backfilled historical consent.
  if (row.consentCapturedAt) {
    await tx.insert(subscriberConsentEvidenceTable).values({
      subscriberId: row.id, emailKey, capturedAt: row.consentCapturedAt,
      policyVersion: row.consentPolicyVersion, surface: row.consentSurface,
      endedAt, expiresAt: yearsAfter(endedAt, 2),
    }).onConflictDoNothing();
  }
  await tx.insert(subscriberSuppressionsTable).values({
    emailKey, scope: "alerts", reason: row.unsubscribedAt ? "unsubscribed" : "account_deleted",
    createdAt: endedAt,
  }).onConflictDoNothing();
}

/** Invoke inside the SAME local account-cleanup transaction, before deleting users.
 * Locks matching subscriber rows; idempotent on retries. Does not touch Clerk.
 */
export async function deleteAlertSubscriberForAccount(tx: RetentionTransaction, email: string, requestedAt = new Date()): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('subscriber-retention'))`);
  const normalized = email.trim().toLowerCase();
  const rows = await tx.select().from(alertSubscribersTable)
    .where(eq(alertSubscribersTable.email, normalized)).for("update");
  for (const row of rows) {
    await preserveSubscriberEvidence(tx, row, row.unsubscribedAt ?? requestedAt);
    await tx.delete(alertSubscribersTable).where(eq(alertSubscribersTable.id, row.id));
  }
}

export async function isSuppressed(email: string, scope: "alerts" | "delivery", connection: RetentionTransaction | typeof db = db): Promise<boolean> {
  const [row] = await connection.select({ key: subscriberSuppressionsTable.emailKey })
    .from(subscriberSuppressionsTable).where(and(
      eq(subscriberSuppressionsTable.emailKey, suppressionKey(email)),
      eq(subscriberSuppressionsTable.scope, scope),
    )).limit(1);
  return !!row;
}

/** Shared by the public signup route and isolated database tests. */
export async function insertUnsuppressedSubscriber(
  payload: typeof alertSubscribersTable.$inferInsert,
  connection: RetentionTransaction | typeof db = db,
) {
  return connection.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('subscriber-retention'))`);
    if (await isSuppressed(payload.email, "alerts", tx)) return null;
    return tx.insert(alertSubscribersTable).values(payload)
      .onConflictDoNothing({ target: alertSubscribersTable.email }).returning();
  });
}

/** Serialized across replicas. A dry run performs no writes, including no backfill.
 * SQL timestamps are compared against a single captured instant.
 */
export async function runSubscriberRetention(dryRun = true, now = new Date(), connection: RetentionTransaction | typeof db = db) {
  suppressionKey("configuration-check");
  return connection.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('subscriber-retention'))`);
    const counts = await tx.execute(sql`
      select
        (select count(*)::int from alert_subscribers where verified_at is null and unsubscribed_at is null and created_at < ${now}::timestamptz - interval '30 days') as pending,
        (select count(*)::int from alert_subscribers where unsubscribed_at < ${now}::timestamptz - interval '90 days') as unsubscribed,
        (select count(*)::int from alert_dispatched where sent_at < ${now}::timestamptz - interval '90 days') as dispatch,
        (select count(*)::int from email_delivery_incidents where created_at < ${now}::timestamptz - interval '1 year') as incidents,
        (select count(*)::int from subscriber_consent_evidence where expires_at <= ${now}) as consent`);
    if (dryRun) return { dryRun, counts: counts.rows[0] };
    // Lock before copying genuine evidence/deleting; concurrent verify/manage waits.
    const expired = await tx.select().from(alertSubscribersTable).where(sql`
      (${alertSubscribersTable.verifiedAt} is null and ${alertSubscribersTable.unsubscribedAt} is null and ${alertSubscribersTable.createdAt} < ${now}::timestamptz - interval '30 days')
      or ${alertSubscribersTable.unsubscribedAt} < ${now}::timestamptz - interval '90 days'`).for("update");
    for (const row of expired) {
      if (row.unsubscribedAt) await preserveSubscriberEvidence(tx, row, row.unsubscribedAt);
      await tx.delete(alertSubscribersTable).where(eq(alertSubscribersTable.id, row.id));
    }
    // Preserve latest unresolved incident even if it is too old for detail retention.
    // Share the per-email lock used by record/resolve paths; re-read under lock.
    const emails = await tx.execute<{ email: string }>(sql`
      select distinct email from email_delivery_incidents
      where created_at < ${now}::timestamptz - interval '1 year' order by email`);
    for (const { email } of emails.rows) {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${email}, 0))`);
      const latest = await tx.execute<{ type: string; resolved_at: Date | null }>(sql`
        select type, resolved_at from email_delivery_incidents where email = ${email}
        order by created_at desc, id desc limit 1`);
      if (latest.rows[0] && !latest.rows[0].resolved_at) {
        await tx.insert(subscriberSuppressionsTable).values({
          emailKey: suppressionKey(email), scope: "delivery", reason: latest.rows[0].type,
        }).onConflictDoNothing();
      }
      await tx.execute(sql`delete from email_delivery_incidents where email = ${email} and created_at < ${now}::timestamptz - interval '1 year'`);
    }
    await tx.execute(sql`delete from alert_dispatched where sent_at < ${now}::timestamptz - interval '90 days'`);
    await tx.execute(sql`delete from subscriber_consent_evidence where expires_at <= ${now}`);
    return { dryRun, counts: counts.rows[0] };
  });
}