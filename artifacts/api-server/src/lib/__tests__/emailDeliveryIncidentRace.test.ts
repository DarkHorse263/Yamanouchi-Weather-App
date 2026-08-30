import assert from "node:assert/strict";
import test from "node:test";
import { asc, eq } from "drizzle-orm";
import { db, emailDeliveryIncidentsTable, pool } from "@workspace/db";
import {
  recordEmailDeliveryIncident,
  resolveEmailDeliveryIncident,
} from "../emailDeliveryIncidents.js";

const adminUserId = "race-test-admin";
const adminEmail = "race-test-admin@example.com";

async function waitUntilQueued(lockClientPid: number): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = await pool.query<{ waiting: string }>(
      `select count(*)::text as waiting
       from pg_locks waiting
       join pg_locks holder
         on holder.locktype = waiting.locktype
        and holder.database is not distinct from waiting.database
        and holder.classid is not distinct from waiting.classid
        and holder.objid is not distinct from waiting.objid
        and holder.objsubid is not distinct from waiting.objsubid
        and holder.pid <> waiting.pid
        and holder.granted
       where waiting.locktype = 'advisory'
         and not waiting.granted
         and holder.pid = $1`,
      [lockClientPid],
    );
    if (Number(result.rows[0]?.waiting ?? 0) > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Timed out waiting for an email incident operation to queue on the advisory lock");
}

async function seedComplaint(email: string, suffix: string): Promise<string> {
  const [incident] = await db
    .insert(emailDeliveryIncidentsTable)
    .values({
      providerEventId: `race-old-${suffix}`,
      email,
      type: "complained",
      reason: "marked as spam",
      createdAt: new Date("2026-08-30T00:00:00.000Z"),
    })
    .returning({ id: emailDeliveryIncidentsTable.id });
  assert.ok(incident);
  return incident.id;
}

async function readIncidents(email: string) {
  return db
    .select()
    .from(emailDeliveryIncidentsTable)
    .where(eq(emailDeliveryIncidentsTable.email, email))
    .orderBy(asc(emailDeliveryIncidentsTable.createdAt), asc(emailDeliveryIncidentsTable.id));
}

test("insert queued first keeps the stale complaint unresolved and authoritative", async (t) => {
  const suffix = `insert-first-${process.pid}-${Date.now()}`;
  const email = `${suffix}@example.com`;
  t.after(async () => {
    await db.delete(emailDeliveryIncidentsTable).where(eq(emailDeliveryIncidentsTable.email, email));
  });
  const oldId = await seedComplaint(email, suffix);
  const lockClient = await pool.connect();

  try {
    await lockClient.query("begin");
    const lock = await lockClient.query<{ pid: number }>(
      "select pg_backend_pid() as pid, pg_advisory_xact_lock(hashtextextended($1, 0))",
      [email],
    );
    const pid = lock.rows[0]?.pid;
    assert.ok(pid);

    const insertion = recordEmailDeliveryIncident({
      providerEventId: `race-new-${suffix}`,
      email,
      type: "bounced",
      reason: "mailbox unavailable",
    });
    await waitUntilQueued(pid);
    const resolution = resolveEmailDeliveryIncident({
      id: oldId,
      email,
      adminUserId,
      adminEmail,
      confirmComplaint: true,
    });
    await lockClient.query("commit");

    assert.equal((await insertion).length, 1);
    assert.deepEqual(await resolution, { kind: "newer_exists" });
    const [oldIncident, newestIncident] = await readIncidents(email);
    assert.equal(oldIncident?.id, oldId);
    assert.equal(oldIncident?.resolvedAt, null);
    assert.equal(oldIncident?.resolvedByUserId, null);
    assert.equal(oldIncident?.resolvedByEmail, null);
    assert.equal(newestIncident?.type, "bounced");
    assert.equal(newestIncident?.resolvedAt, null);
  } finally {
    await lockClient.query("rollback").catch(() => undefined);
    lockClient.release();
  }
});

test("resolution queued first audits the complaint, then the new bounce becomes authoritative", async (t) => {
  const suffix = `resolve-first-${process.pid}-${Date.now()}`;
  const email = `${suffix}@example.com`;
  t.after(async () => {
    await db.delete(emailDeliveryIncidentsTable).where(eq(emailDeliveryIncidentsTable.email, email));
  });
  const oldId = await seedComplaint(email, suffix);

  const confirmationRequired = await resolveEmailDeliveryIncident({
    id: oldId,
    email,
    adminUserId,
    adminEmail,
    confirmComplaint: false,
  });
  assert.deepEqual(confirmationRequired, { kind: "confirmation_required" });

  const lockClient = await pool.connect();
  try {
    await lockClient.query("begin");
    const lock = await lockClient.query<{ pid: number }>(
      "select pg_backend_pid() as pid, pg_advisory_xact_lock(hashtextextended($1, 0))",
      [email],
    );
    const pid = lock.rows[0]?.pid;
    assert.ok(pid);

    const resolution = resolveEmailDeliveryIncident({
      id: oldId,
      email,
      adminUserId,
      adminEmail,
      confirmComplaint: true,
    });
    await waitUntilQueued(pid);
    const insertion = recordEmailDeliveryIncident({
      providerEventId: `race-new-${suffix}`,
      email,
      type: "bounced",
      reason: "mailbox unavailable",
    });
    await lockClient.query("commit");

    const resolved = await resolution;
    assert.equal(resolved.kind, "resolved");
    if (resolved.kind !== "resolved") return;
    assert.equal(resolved.incidentType, "complained");
    assert.equal(resolved.incident.id, oldId);
    assert.ok(resolved.incident.resolvedAt instanceof Date);
    assert.equal(resolved.incident.resolvedByEmail, adminEmail);
    assert.equal((await insertion).length, 1);

    const [oldIncident, newestIncident] = await readIncidents(email);
    assert.ok(oldIncident?.resolvedAt instanceof Date);
    assert.equal(oldIncident?.resolvedByUserId, adminUserId);
    assert.equal(oldIncident?.resolvedByEmail, adminEmail);
    assert.equal(newestIncident?.type, "bounced");
    assert.equal(newestIncident?.resolvedAt, null);
    assert.equal(newestIncident?.resolvedByUserId, null);
    assert.equal(newestIncident?.resolvedByEmail, null);
  } finally {
    await lockClient.query("rollback").catch(() => undefined);
    lockClient.release();
  }
});