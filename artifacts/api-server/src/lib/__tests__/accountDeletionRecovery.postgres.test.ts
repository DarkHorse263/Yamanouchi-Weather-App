import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql, getTableName } from "drizzle-orm";
import { getTableConfig, PgDialect, type PgTable } from "drizzle-orm/pg-core";
import { pool } from "@workspace/db";
import * as schema from "@workspace/db/schema";
import { recoverAccountDeletion, requestAccountDeletion, runAccountDeletionRecovery, deletionRetryAt } from "../accountDeletionRecovery.js";
import { cancelBillingForDeletion } from "../accountDeletionBilling.js";

// Generate fixture DDL from the production Drizzle columns and FK actions.
// In particular billing_customers retains its actual RESTRICT FK.
function fixtureDdl(table: PgTable): string {
  const config = getTableConfig(table);
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const dialect = new PgDialect();
  const columns = config.columns.map((column) => `${quote(column.name)} ${column.getSQLType()}${
    column.primary ? " PRIMARY KEY" : ""}${column.notNull ? " NOT NULL" : ""}${
    column.isUnique ? " UNIQUE" : ""}${column.default === undefined ? "" :
      ` DEFAULT ${dialect.sqlToQuery(sql`${column.default}`.inlineParams()).sql}`}`);
  for (const fk of config.foreignKeys) {
    const ref = fk.reference();
    columns.push(`FOREIGN KEY (${ref.columns.map((c) => quote(c.name)).join(",")}) REFERENCES ${
      quote(getTableName(ref.foreignTable))} (${ref.foreignColumns.map((c) => quote(c.name)).join(",")}) ON DELETE ${fk.onDelete ?? "NO ACTION"}`);
  }
  return `CREATE TABLE ${quote(config.name)} (${columns.join(",")})`;
}

// Real PostgreSQL, exclusively generated schema + synthetic identities. There is
// no public search_path fallback and no real Clerk call in any test.
test("PostgreSQL recovery: savepoints, rollback, concurrency and idempotence", async () => {
  const name = `deletion_test_${randomUUID().replaceAll("-", "")}`;
  assert.match(name, /^deletion_test_[a-f0-9]{32}$/);
  const a = await pool.connect();
  const b = await pool.connect();
  const identifier = `"${name}"`;
  try {
    await a.query(`CREATE SCHEMA ${identifier}`);
    await a.query(`SET search_path TO ${identifier}`);
    await b.query(`SET search_path TO ${identifier}`);
    for (const table of [schema.usersTable, schema.accountDeletionsTable, schema.billingCustomersTable, schema.subscriptionsTable]) {
      await a.query(fixtureDdl(table));
    }
    await a.query(`
      CREATE TABLE synthetic_subscribers (email text PRIMARY KEY);
      CREATE TABLE synthetic_evidence (email text PRIMARY KEY);
    `);
    const databaseA = drizzle(a, { schema });
    const databaseB = drizzle(b, { schema });
    const seed = async (suffix: string) => {
      await a.query("INSERT INTO users (id) VALUES ($1)", [`user-${suffix}`]);
      await a.query("INSERT INTO synthetic_subscribers VALUES ($1)", [`${suffix}@example.invalid`]);
      return requestAccountDeletion(`clerk-${suffix}`, `user-${suffix}`, `${suffix}@example.invalid`, databaseA);
    };
    const cleanup: NonNullable<Parameters<typeof recoverAccountDeletion>[1]>["deleteSubscriber"] = async (tx, email) => {
      await tx.execute(sql`insert into synthetic_evidence (email) values (${email}) on conflict do nothing`);
      await tx.execute(sql`delete from synthetic_subscribers where email = ${email}`);
    };

    const intent = await seed("failure");
    const duplicate = await requestAccountDeletion("clerk-failure", "replacement-user", "replacement@example.invalid", databaseA);
    assert.equal(duplicate.id, intent.id);
    assert.equal(duplicate.userId, "user-failure");
    assert.equal(duplicate.email, "failure@example.invalid", "retry cannot replace saved deletion identity");
    let clerkCalls = 0;
    const deleteIdentity = async () => { clerkCalls++; };
    const failed = await recoverAccountDeletion(intent.id, {
      database: databaseA, deleteIdentity,
      deleteSubscriber: async (tx, email, at) => {
        await cleanup!(tx, email, at);
        // A genuine PostgreSQL statement error aborts the savepoint.
        await tx.execute(sql`select 1 / 0`);
      },
    });
    assert.equal(failed.phase, "pending_local");
    const state = (await a.query("SELECT * FROM account_deletions WHERE id=$1", [intent.id])).rows[0];
    assert.equal(state.last_error, "LOCAL_CLEANUP_FAILED");
    assert.equal(state.attempts, 1);
    assert.equal((await a.query("SELECT count(*)::int n FROM synthetic_evidence")).rows[0].n, 0);
    assert.equal((await a.query("SELECT count(*)::int n FROM users")).rows[0].n, 1);
    assert.equal((await a.query("SELECT count(*)::int n FROM synthetic_subscribers")).rows[0].n, 1);
    assert.equal((await recoverAccountDeletion(intent.id, {
      database: databaseA, deleteIdentity, deleteSubscriber: cleanup,
    })).complete, true);
    assert.equal(clerkCalls, 1, "pending-local retry must not call Clerk again");
    await recoverAccountDeletion(intent.id, { database: databaseA, deleteIdentity, deleteSubscriber: cleanup });
    assert.equal(clerkCalls, 1);
    assert.equal((await a.query("SELECT count(*)::int n FROM users")).rows[0].n, 0);

    const crash = await seed("crash");
    // Fail the outer transaction after provider success by rejecting the phase
    // write. This simulates the durable state after losing the process/DB tx.
    await a.query(`ALTER TABLE account_deletions ADD CONSTRAINT simulate_crash CHECK (phase <> 'pending_local')`);
    await assert.rejects(recoverAccountDeletion(crash.id, {
      database: databaseA, deleteIdentity, deleteSubscriber: cleanup,
    }));
    assert.equal((await a.query("SELECT phase FROM account_deletions WHERE id=$1", [crash.id])).rows[0].phase, "pending_clerk");
    await a.query("ALTER TABLE account_deletions DROP CONSTRAINT simulate_crash");
    assert.equal((await recoverAccountDeletion(crash.id, {
      database: databaseA,
      deleteIdentity: async () => { throw { status: 404, errors: [{ code: "resource_not_found" }] }; },
      deleteSubscriber: cleanup,
    })).complete, true);

    const concurrent = await seed("concurrent");
    let release!: () => void;
    let entered!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const started = new Promise<void>((resolve) => { entered = resolve; });
    let concurrentClerkCalls = 0;
    const deleting = async () => { concurrentClerkCalls++; entered(); await gate; };
    const first = recoverAccountDeletion(concurrent.id, { database: databaseA, deleteIdentity: deleting, deleteSubscriber: cleanup });
    await started;
    const second = recoverAccountDeletion(concurrent.id, { database: databaseB, deleteIdentity: deleting, deleteSubscriber: cleanup });
    release();
    assert.deepEqual((await Promise.all([first, second])).map((result) => result.complete), [true, true]);
    assert.equal(concurrentClerkCalls, 1, "row lock permits only one provider call");
    assert.equal((await a.query("SELECT attempts FROM account_deletions WHERE id=$1", [concurrent.id])).rows[0].attempts, 1);

    // Started-checkout ownership rows (even without a subscription) and actual
    // subscription CASCADE + customer RESTRICT actions must both be handled.
    for (const suffix of ["checkout", "paid"]) {
      const billingIntent = await seed(suffix);
      await a.query("INSERT INTO billing_customers(user_id,customer_id,live) VALUES($1,$2,false)", [`user-${suffix}`, `cus_${suffix}`]);
      if (suffix === "paid") {
        await a.query("INSERT INTO subscriptions(user_id,tier,status,provider,provider_sub_id,provider_customer_id) VALUES($1,'pro','active','stripe',$2,$3)",
          [`user-${suffix}`, `sub_${suffix}`, `cus_${suffix}`]);
      }
      // Confirm the fixture really enforces the production blocking FK.
      await assert.rejects(a.query("DELETE FROM users WHERE id=$1", [`user-${suffix}`]));
      const calls: string[] = [];
      let providerCanceled = false;
      let rejectCancellation = suffix === "paid";
      const request: Parameters<typeof cancelBillingForDeletion>[2] = async (path, _body, _key, method) => {
        if (path.startsWith("/v1/customers/")) return { id: `cus_${suffix}`, livemode: false, metadata: { feelzlike_user_id: `user-${suffix}` } };
        if (path.startsWith("/v1/checkout/sessions?")) return { data: [{ id: `cs_${suffix}`, customer: `cus_${suffix}`, livemode: false }], has_more: false };
        if (path.endsWith("/expire")) { calls.push("expire"); return { status: "expired" }; }
        if (path.startsWith("/v1/subscriptions?")) return { data: suffix === "paid" ? [{
          id: `sub_${suffix}`, status: providerCanceled ? "canceled" : "active", customer: `cus_${suffix}`, livemode: false,
        }] : [], has_more: false };
        assert.equal(method, "DELETE");
        if (rejectCancellation) throw new Error("Stripe cancellation unavailable");
        calls.push("cancel"); providerCanceled = true;
        return { id: `sub_${suffix}`, status: "canceled", customer: `cus_${suffix}`, livemode: false };
      };
      const dependencies: NonNullable<Parameters<typeof recoverAccountDeletion>[1]> = {
        database: databaseA, deleteIdentity: async () => { calls.push("clerk"); },
        cancelBilling: (tx, id) => cancelBillingForDeletion(tx, id, request),
        deleteSubscriber: cleanup,
      };
      if (suffix === "paid") {
        assert.equal((await recoverAccountDeletion(billingIntent.id, dependencies)).complete, false);
        assert.deepEqual(calls, ["expire"]);
        assert.equal((await a.query("SELECT count(*)::int n FROM billing_customers WHERE user_id=$1", [`user-${suffix}`])).rows[0].n, 1);
        rejectCancellation = false;
        calls.length = 0;
      }
      const result = await recoverAccountDeletion(billingIntent.id, dependencies);
      assert.equal(result.complete, true);
      assert.deepEqual(calls, suffix === "paid" ? ["expire", "cancel", "clerk"] : ["expire", "clerk"]);
      assert.equal((await a.query("SELECT count(*)::int n FROM billing_customers WHERE user_id=$1", [`user-${suffix}`])).rows[0].n, 0);
      assert.equal((await a.query("SELECT count(*)::int n FROM subscriptions WHERE user_id=$1", [`user-${suffix}`])).rows[0].n, 0);
    }

    const blocked = await seed("billing-outage");
    let forbiddenClerkCall = false;
    const blockedResult = await recoverAccountDeletion(blocked.id, {
      database: databaseA,
      cancelBilling: async () => { throw new Error("provider unavailable"); },
      deleteIdentity: async () => { forbiddenClerkCall = true; },
    });
    assert.equal(blockedResult.complete, false);
    assert.equal(forbiddenClerkCall, false);
    assert.equal((await a.query("SELECT last_error FROM account_deletions WHERE id=$1", [blocked.id])).rows[0].last_error, "BILLING_CANCELLATION_FAILED");

    // More than a batch of permanent failures cannot starve newer requests.
    await a.query("DELETE FROM account_deletions");
    const now = new Date();
    await a.query(`INSERT INTO account_deletions(clerk_user_id,requested_at,next_attempt_at)
      SELECT 'fair-' || n, $1::timestamptz - interval '1 day', $1::timestamptz - interval '1 day'
      FROM generate_series(1,101) n`, [now]);
    const attempted = new Set<number>();
    const fail = async (id: number) => {
      attempted.add(id);
      return recoverAccountDeletion(id, { database: databaseA, now,
        deleteIdentity: async () => { throw new Error("permanent"); } });
    };
    assert.equal((await runAccountDeletionRecovery({ database: databaseA, now, recover: fail })).attempted, 100);
    assert.equal((await runAccountDeletionRecovery({ database: databaseA, now, recover: fail })).attempted, 1);
    assert.equal(attempted.size, 101);
    assert.equal((await runAccountDeletionRecovery({ database: databaseA, now, recover: fail })).attempted, 0);
    assert.equal(deletionRetryAt(1, now).getTime() - now.getTime(), 5 * 60_000);
    assert.equal(deletionRetryAt(999, now).getTime() - now.getTime(), 24 * 60 * 60_000);
  } finally {
    await a.query("RESET search_path");
    await b.query("RESET search_path");
    await a.query(`DROP SCHEMA IF EXISTS ${identifier} CASCADE`);
    a.release();
    b.release();
    await pool.end();
  }
});