import { test } from "node:test";
import assert from "node:assert/strict";
import { performDeletionSteps, clerkIdentityMissing, type DeletionSteps } from "../accountDeletionSteps.js";

function fixture(overrides: Partial<DeletionSteps> = {}) {
  const calls: string[] = [];
  const ops: DeletionSteps = {
    async deleteIdentity() { calls.push("clerk"); },
    async markLocalPending() { calls.push("persist-local"); },
    async cleanupLocal() { calls.push("cleanup"); },
    async recordFailure(code) { calls.push(code); },
    ...overrides,
  };
  return { calls, ops };
}
test("Clerk precedes saved local phase and atomic cleanup", async () => {
  const { calls, ops } = fixture();
  assert.deepEqual(await performDeletionSteps("pending_clerk", ops), { complete: true, phase: "completed" });
  assert.deepEqual(calls, ["clerk", "persist-local", "cleanup"]);
});
test("provider failure never removes local records", async () => {
  const { calls, ops } = fixture({ async deleteIdentity() { throw new Error("outage private details"); } });
  assert.deepEqual(await performDeletionSteps("pending_clerk", ops), { complete: false, phase: "pending_clerk" });
  assert.deepEqual(calls, ["CLERK_DELETE_FAILED"]);
});
test("crash after Clerk deletion recovers from genuine missing identity", async () => {
  const { calls, ops } = fixture({
    async deleteIdentity() { throw { status: 404, errors: [{ code: "resource_not_found" }] }; },
  });
  assert.equal((await performDeletionSteps("pending_clerk", ops)).complete, true);
  assert.deepEqual(calls, ["persist-local", "cleanup"]);
});
test("generic 404 is not accepted as deleted identity", () => {
  for (const error of [null, { status: 404 }, { status: 401, errors: [{ code: "resource_not_found" }] }]) {
    assert.equal(clerkIdentityMissing(error), false);
  }
});
test("local failure remains recoverable with a safe code", async () => {
  const { calls, ops } = fixture({ async cleanupLocal() { throw new Error("db PII"); } });
  assert.deepEqual(await performDeletionSteps("pending_clerk", ops), { complete: false, phase: "pending_local" });
  assert.deepEqual(calls, ["clerk", "persist-local", "LOCAL_CLEANUP_FAILED"]);
  const retry = fixture();
  assert.equal((await performDeletionSteps("pending_local", retry.ops)).complete, true);
  assert.deepEqual(retry.calls, ["cleanup"]);
});
test("completed deletion is idempotent and unknown phases fail closed", async () => {
  const { calls, ops } = fixture();
  assert.equal((await performDeletionSteps("completed", ops)).complete, true);
  await assert.rejects(performDeletionSteps("unknown", ops), /INVALID_DELETION_PHASE/);
  assert.deepEqual(calls, []);
});