import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

// No real DB connection: the client is lazy and all write paths use fixture tx.
process.env.DATABASE_URL ??= "postgres://unused:unused@127.0.0.1:1/unused";
const { suppressionKey, preserveSubscriberEvidence, yearsAfter, runSubscriberRetention } = await import("../subscriberRetention.js");
const { db, subscriberConsentEvidenceTable, subscriberSuppressionsTable } = await import("@workspace/db");
type Subscriber = Parameters<typeof preserveSubscriberEvidence>[1];
type Tx = Parameters<typeof preserveSubscriberEvidence>[0];

test("stable domain-separated keys normalize addresses and fail closed without persistent secret", () => {
  const before = process.env.ALERT_TOKEN_SECRET;
  try {
    delete process.env.ALERT_TOKEN_SECRET;
    assert.throws(() => suppressionKey("a@example.test"), /Persistent/);
    process.env.ALERT_TOKEN_SECRET = "test-only-stable-secret-never-for-production";
    const key = suppressionKey(" Person@Example.Test ");
    assert.equal(key, suppressionKey("person@example.test"));
    assert.notEqual(key, suppressionKey("other@example.test"));
    assert.notEqual(key, createHmac("sha256", process.env.ALERT_TOKEN_SECRET).update("person@example.test").digest("hex"));
    assert.match(key, /^[a-f0-9]{64}$/);
  } finally {
    if (before === undefined) delete process.env.ALERT_TOKEN_SECRET; else process.env.ALERT_TOKEN_SECRET = before;
  }
});

test("genuine consent is preserved separately for two years; legacy evidence is never invented", async () => {
  const before = process.env.ALERT_TOKEN_SECRET;
  process.env.ALERT_TOKEN_SECRET = "test-only-stable-secret-never-for-production";
  try {
    const writes: { table: unknown; values: Record<string, unknown> }[] = [];
    const tx = {
      insert: (table: unknown) => ({
        values: (values: Record<string, unknown>) => ({
          onConflictDoNothing: async () => { writes.push({ table, values }); },
        }),
      }),
    } as unknown as Tx;
    const ended = new Date("2026-09-23T12:00:00Z");
    const row = { id: "fixture", email: "fixture@example.test", consentCapturedAt: new Date("2025-01-01T00:00:00Z"),
      consentPolicyVersion: "real-version", consentSurface: "real-surface", unsubscribedAt: ended } as Subscriber;
    await preserveSubscriberEvidence(tx, row, ended);
    assert.equal(writes[0].table, subscriberConsentEvidenceTable);
    assert.equal(writes[0].values.capturedAt, row.consentCapturedAt);
    assert.equal((writes[0].values.expiresAt as Date).toISOString(), "2028-09-23T12:00:00.000Z");
    assert.equal(writes[1].table, subscriberSuppressionsTable);
    assert.equal(writes[1].values.reason, "unsubscribed");
    assert.equal("email" in writes[0].values, false);
    assert.equal("email" in writes[1].values, false);
    writes.length = 0;
    await preserveSubscriberEvidence(tx, { ...row, consentCapturedAt: null }, ended);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].table, subscriberSuppressionsTable);
    assert.equal(yearsAfter(ended, 2).toISOString(), "2028-09-23T12:00:00.000Z");
    assert.equal(yearsAfter(new Date("2024-02-29T12:00:00Z"), 2).toISOString(), "2026-02-28T12:00:00.000Z");
  } finally {
    if (before === undefined) delete process.env.ALERT_TOKEN_SECRET; else process.env.ALERT_TOKEN_SECRET = before;
  }
});

test("dry-run counts only and never invokes delete or insert", async (t) => {
  const before = process.env.ALERT_TOKEN_SECRET;
  process.env.ALERT_TOKEN_SECRET = "test-only-stable-secret-never-for-production";
  try {
    let calls = 0;
    t.mock.method(db, "transaction", async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({ execute: async () => { calls++; return { rows: [{ pending: 2, unsubscribed: 3, dispatch: 4, incidents: 5, consent: 6 }] }; } }));
    const result = await runSubscriberRetention(true, new Date("2026-09-23T00:00:00Z"));
    assert.equal(result.dryRun, true);
    assert.equal(result.counts.pending, 2);
    assert.equal(calls, 2);
  } finally {
    if (before === undefined) delete process.env.ALERT_TOKEN_SECRET; else process.env.ALERT_TOKEN_SECRET = before;
  }
});