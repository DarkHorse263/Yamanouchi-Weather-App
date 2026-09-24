import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import { SQL } from "drizzle-orm";

// Explicit opt-in, dev only. A unique disposable schema is the ONLY search path
// besides pg_catalog. No public tables are copied, queried, or changed.
test("PostgreSQL retention boundaries, rollback, preservation and concurrent signup", {
  skip: process.env.RETENTION_PG_TEST !== "1",
  timeout: 30_000,
}, async (t) => {
  assert.notEqual(process.env.NODE_ENV, "production", "Never run fixture tests in production");
  const {
    pool, alertSubscribersTable, dispatchedAlertsTable, pushSubscriptionsTable,
    emailDeliveryIncidentsTable, subscriberSuppressionsTable, subscriberConsentEvidenceTable,
  } = await import("@workspace/db");
  const {
    runSubscriberRetention, insertUnsuppressedSubscriber, deleteAlertSubscriberForAccount, suppressionKey,
  } = await import("../subscriberRetention.js");
  const schema = `retention_test_${randomUUID().replaceAll("-", "")}`;
  const client = await pool.connect();
  const concurrent = await pool.connect();
  const priorSecret = process.env.ALERT_TOKEN_SECRET;
  process.env.ALERT_TOKEN_SECRET = "isolated-fixture-only-retention-hmac-secret";
  const dialect = new PgDialect();
  const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;
  const now = new Date("2028-09-23T12:00:00Z");
  const ago = (days: number, delta = 0) => new Date(now.getTime() - days * 86_400_000 + delta);
  try {
    await client.query(`create schema ${quote(schema)}`);
    for (const connection of [client, concurrent]) {
      await connection.query(`set search_path to ${quote(schema)}, pg_catalog`);
      assert.equal((await connection.query("select current_schema() as schema")).rows[0].schema, schema);
    }
    // Build fixture tables from the actual Drizzle definitions, never LIKE a
    // customer table. Only these fixture-specific FK/unique constraints are added.
    for (const table of [alertSubscribersTable, dispatchedAlertsTable, pushSubscriptionsTable,
      emailDeliveryIncidentsTable, subscriberSuppressionsTable, subscriberConsentEvidenceTable]) {
      const config = getTableConfig(table);
      const columns = config.columns.map((column) => {
        let value = "";
        if (column.default !== undefined) {
          const d = column.default;
          const rendered = d instanceof SQL ? dialect.sqlToQuery(d).sql :
            typeof d === "string" ? `'${d.replaceAll("'", "''")}'` : String(d);
          value = ` default ${rendered}`;
        }
        return `${quote(column.name)} ${column.getSQLType()}${value}${column.notNull ? " not null" : ""}${column.primary ? " primary key" : ""}`;
      });
      if (table === subscriberSuppressionsTable) columns.push("primary key (email_key, scope)");
      if (table === alertSubscribersTable) columns.push("unique(email)");
      if (table === dispatchedAlertsTable || table === pushSubscriptionsTable) {
        columns.push("foreign key(subscriber_id) references alert_subscribers(id) on delete cascade");
      }
      await client.query(`create table ${quote(config.name)} (${columns.join(",")})`);
    }
    const connection = drizzle(client);
    const otherConnection = drizzle(concurrent);
    // Services do not depend on relational query metadata; fixture connections
    // use the same production transaction/query methods with restricted search_path.
    type Connection = Parameters<typeof runSubscriberRetention>[2];
    const fixture = connection as unknown as Connection;
    const other = otherConnection as unknown as Connection;
    const reset = async () => {
      await client.query("truncate alert_subscribers, alert_dispatched, alert_push_subscriptions, email_delivery_incidents, subscriber_suppressions, subscriber_consent_evidence cascade");
    };
    const insert = (id: string, values: Partial<typeof alertSubscribersTable.$inferInsert> = {}) =>
      connection.insert(alertSubscribersTable).values({ id, email: `${id}@example.test`, createdAt: ago(400), ...values });

    await t.test("strict age cutoffs, genuine evidence and unresolved suppression survive purge", async () => {
      await insert("pending-old", { createdAt: ago(30, -1) });
      await insert("pending-boundary", { createdAt: ago(30) });
      await insert("active", { verifiedAt: ago(400) });
      await insert("unsub-old", { verifiedAt: ago(300), unsubscribedAt: ago(90, -1),
        consentCapturedAt: ago(350), consentPolicyVersion: "recorded-version", consentSurface: "recorded-surface" });
      await insert("unsub-legacy", { unsubscribedAt: ago(91) });
      await insert("unsub-boundary", { unsubscribedAt: ago(90) });
      for (const [id, sentAt] of [["dispatch-old", ago(90, -1)], ["dispatch-boundary", ago(90)]] as const) {
        await connection.insert(dispatchedAlertsTable).values({ id, subscriberId: "active", mountain: "fixture", region: "fixture",
          alertWindow: id, snowfallCm: 20, delivery: "email", sentAt });
      }
      const incidentCutoff = new Date("2027-09-23T12:00:00Z");
      await connection.insert(emailDeliveryIncidentsTable).values([
        { id: "unresolved-old", email: "complaint@example.test", type: "complained", createdAt: new Date(incidentCutoff.getTime() - 1) },
        { id: "resolved-old", email: "resolved@example.test", type: "bounced", createdAt: new Date(incidentCutoff.getTime() - 1), resolvedAt: ago(1) },
        { id: "boundary", email: "boundary@example.test", type: "bounced", createdAt: incidentCutoff },
      ]);
      await connection.insert(subscriberConsentEvidenceTable).values([
        { subscriberId: "expired-evidence", emailKey: "fixture", capturedAt: ago(900), endedAt: ago(800), expiresAt: now },
        { subscriberId: "future-evidence", emailKey: "fixture", capturedAt: ago(900), endedAt: ago(800), expiresAt: new Date(now.getTime() + 1) },
      ]);
      const preview = await runSubscriberRetention(true, now, fixture);
      assert.deepEqual(preview.counts, { pending: 1, unsubscribed: 2, dispatch: 1, incidents: 2, consent: 1 });
      assert.equal((await connection.select().from(alertSubscribersTable)).length, 6);
      await runSubscriberRetention(false, now, fixture);
      assert.deepEqual((await connection.select().from(alertSubscribersTable)).map(r => r.id).sort(), ["active", "pending-boundary", "unsub-boundary"]);
      assert.deepEqual((await connection.select().from(dispatchedAlertsTable)).map(r => r.id), ["dispatch-boundary"]);
      assert.deepEqual((await connection.select().from(emailDeliveryIncidentsTable)).map(r => r.id), ["boundary"]);
      const evidence = await connection.select().from(subscriberConsentEvidenceTable);
      assert.deepEqual(evidence.map(r => r.subscriberId).sort(), ["future-evidence", "unsub-old"]);
      assert.equal(evidence.find(r => r.subscriberId === "unsub-old")?.policyVersion, "recorded-version");
      const suppressions = await connection.select().from(subscriberSuppressionsTable);
      assert.equal(suppressions.length, 3);
      assert.ok(suppressions.some(r => r.emailKey === suppressionKey("complaint@example.test") && r.scope === "delivery"));
      assert.equal(await insertUnsuppressedSubscriber({ email: "unsub-old@example.test" }, fixture), null);
      await reset();
    });

    await t.test("forced mid-purge failure rolls back deletion AND evidence/suppression", async () => {
      await insert("rollback", { unsubscribedAt: ago(91), consentCapturedAt: ago(300) });
      await client.query(`create function refuse_dispatch_delete() returns trigger language plpgsql as $$
        begin raise exception 'fixture failure'; end $$`);
      await client.query("create trigger refuse_dispatch before delete on alert_dispatched for each statement execute function refuse_dispatch_delete()");
      await assert.rejects(runSubscriberRetention(false, now, fixture), (error: unknown) =>
        error instanceof Error && error.cause instanceof Error && /fixture failure/.test(error.cause.message));
      assert.equal((await connection.select().from(alertSubscribersTable)).length, 1);
      assert.equal((await connection.select().from(subscriberSuppressionsTable)).length, 0);
      assert.equal((await connection.select().from(subscriberConsentEvidenceTable)).length, 0);
      await client.query("drop trigger refuse_dispatch on alert_dispatched");
      await reset();
    });

    await t.test("signup waits for cleanup commit and then sees retained suppression", async () => {
      await insert("concurrent", { verifiedAt: ago(200), consentCapturedAt: ago(300) });
      let unlock!: () => void;
      let locked!: () => void;
      const holding = new Promise<void>(resolve => { locked = resolve; });
      const release = new Promise<void>(resolve => { unlock = resolve; });
      const cleanup = connection.transaction(async (tx) => {
        await deleteAlertSubscriberForAccount(tx as unknown as Parameters<typeof deleteAlertSubscriberForAccount>[0], "concurrent@example.test", now);
        locked();
        await release;
      });
      await holding;
      let completed = false;
      const signup = insertUnsuppressedSubscriber({ email: "concurrent@example.test" }, other).then(result => { completed = true; return result; });
      await new Promise(resolve => setTimeout(resolve, 50));
      assert.equal(completed, false, "signup must not race past uncommitted suppression");
      unlock();
      await cleanup;
      assert.equal(await signup, null);
      assert.equal((await connection.select().from(alertSubscribersTable)).length, 0);
      assert.equal((await connection.select().from(subscriberConsentEvidenceTable)).length, 1);
    });
  } finally {
    // Restrict drop to the unique fixture schema even after a failure.
    await client.query(`drop schema if exists ${quote(schema)} cascade`);
    await client.query("reset search_path");
    await concurrent.query("reset search_path");
    client.release();
    concurrent.release();
    await pool.end();
    if (priorSecret === undefined) delete process.env.ALERT_TOKEN_SECRET; else process.env.ALERT_TOKEN_SECRET = priorSecret;
  }
});