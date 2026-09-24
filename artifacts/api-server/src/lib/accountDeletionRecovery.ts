import { db, accountDeletionsTable, usersTable, billingCustomersTable } from "@workspace/db";
import { and, eq, isNull, lt, lte, sql } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { deleteAlertSubscriberForAccount } from "./subscriberRetention.js";
import { performDeletionSteps } from "./accountDeletionSteps.js";
import { cancelBillingForDeletion } from "./accountDeletionBilling.js";

export function deletionRetryAt(attempts: number, now = new Date()) {
  return new Date(now.getTime() + Math.min(24 * 60, 5 * 2 ** Math.min(Math.max(attempts - 1, 0), 9)) * 60_000);
}

export async function requestAccountDeletion(clerkUserId: string, userId: string, email: string | null, database: Pick<typeof db, "transaction"> = db) {
  return database.transaction(async (tx) => {
    // Same lock as the auth bridge: no JIT insertion can race this durable intent.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${clerkUserId}))`);
    const [record] = await tx.insert(accountDeletionsTable).values({
      clerkUserId, userId, email: email?.trim().toLowerCase() ?? null,
    }).onConflictDoUpdate({
      target: accountDeletionsTable.clerkUserId,
      set: { clerkUserId }, // never replace original identity/evidence on retry
    }).returning();
    return record!;
  });
}

/**
 * Row lock serializes operators and scheduler across processes. If the process
 * dies after the provider call, rollback leaves pending_clerk, and a subsequent
 * provider 404 completes recovery. Local cleanup and completion commit together.
 * No raw provider/DB error (possibly containing PII) is stored or returned.
 */
export async function recoverAccountDeletion(id: number, dependencies: {
  database?: Pick<typeof db, "transaction">;
  deleteIdentity?: (clerkUserId: string) => Promise<unknown>;
  deleteSubscriber?: typeof deleteAlertSubscriberForAccount;
  cancelBilling?: typeof cancelBillingForDeletion;
  now?: Date;
} = {}): Promise<{ complete: boolean; phase: string }> {
  const database = dependencies.database ?? db;
  const deleteIdentity = dependencies.deleteIdentity ?? ((id: string) => clerkClient.users.deleteUser(id));
  const deleteSubscriber = dependencies.deleteSubscriber ?? deleteAlertSubscriberForAccount;
  const cancelBilling = dependencies.cancelBilling ?? cancelBillingForDeletion;
  const now = dependencies.now ?? new Date();
  return database.transaction(async (tx) => {
    const [record] = await tx.select().from(accountDeletionsTable)
      .where(eq(accountDeletionsTable.id, id)).for("update");
    if (!record) throw new Error("DELETION_NOT_FOUND");
    if (record.completedAt) return { complete: true, phase: "completed" };
    await tx.update(accountDeletionsTable).set({
      attempts: record.attempts + 1, lastError: null, nextAttemptAt: deletionRetryAt(record.attempts + 1, now),
    })
      .where(eq(accountDeletionsTable.id, id));
    try {
      if (record.userId) await tx.transaction((billingTx) => cancelBilling(billingTx, record.userId!));
    } catch {
      await tx.update(accountDeletionsTable).set({ lastError: "BILLING_CANCELLATION_FAILED" })
        .where(eq(accountDeletionsTable.id, id));
      return { complete: false, phase: record.phase };
    }
    return performDeletionSteps(record.phase, {
      async deleteIdentity() {
        if (!record.clerkUserId) throw new Error("DELETION_IDENTITY_MISSING");
        return deleteIdentity(record.clerkUserId);
      },
      async markLocalPending() {
        await tx.update(accountDeletionsTable).set({ phase: "pending_local" })
          .where(eq(accountDeletionsTable.id, id));
      },
      async recordFailure(lastError) {
        await tx.update(accountDeletionsTable).set({ lastError })
          .where(eq(accountDeletionsTable.id, id));
      },
      async cleanupLocal() {
        // Savepoint preserves phase + error on failure, never partial cleanup.
        await tx.transaction(async (local) => {
          if (record.email) await deleteSubscriber(local, record.email, record.requestedAt);
          if (record.userId) {
            // Ownership projection is not a financial ledger. Stripe and its
            // native sync records are left intact; remove the restrictive FK.
            await local.delete(billingCustomersTable).where(eq(billingCustomersTable.userId, record.userId));
            await local.delete(usersTable).where(eq(usersTable.id, record.userId));
          }
          await local.update(accountDeletionsTable).set({
            phase: "completed", completedAt: new Date(), lastError: null,
          }).where(eq(accountDeletionsTable.id, id));
        });
      },
    });
  });
}

export async function runAccountDeletionRecovery(options: {
  database?: Pick<typeof db, "transaction" | "select" | "update">;
  now?: Date;
  recover?: (id: number) => Promise<{ complete: boolean }>;
} = {}) {
  const database = options.database ?? db;
  const now = options.now ?? new Date();
  const recover = options.recover ?? ((id: number) => recoverAccountDeletion(id, { database, now }));
  const pending = await database.select({ id: accountDeletionsTable.id }).from(accountDeletionsTable)
    .where(and(isNull(accountDeletionsTable.completedAt), lte(accountDeletionsTable.nextAttemptAt, now)))
    .orderBy(accountDeletionsTable.nextAttemptAt, accountDeletionsTable.requestedAt).limit(100);
  let completed = 0;
  let failed = 0;
  for (const record of pending) {
    try {
      if ((await recover(record.id)).complete) completed++;
      else failed++;
    } catch {
      failed++;
      // Outer transaction failure must not let an old request monopolize the
      // oldest-first queue. If DB is down this fails loudly, never drops intent.
      await database.update(accountDeletionsTable).set({
        lastError: "RECOVERY_TRANSACTION_FAILED",
        attempts: sql`${accountDeletionsTable.attempts} + 1`,
        nextAttemptAt: new Date(now.getTime() + 60 * 60_000),
      }).where(and(eq(accountDeletionsTable.id, record.id), isNull(accountDeletionsTable.completedAt)));
    }
  }
  const cutoff = new Date(now.getTime() - 30 * 86_400_000);
  await database.update(accountDeletionsTable).set({ clerkUserId: null, userId: null, email: null, lastError: null })
    .where(and(lt(accountDeletionsTable.completedAt, cutoff), eq(accountDeletionsTable.phase, "completed")));
  return { attempted: pending.length, completed, failed };
}