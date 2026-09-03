import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveWithinDeadline } from "../../routes/regions.js";

test("a cold process returns a shared snapshot within the deadline when primary loads hang", async () => {
  const persisted = Array.from({ length: 100 }, (_, index) => ({ id: index }));
  const never = new Promise<Array<{ id: number }>>(() => undefined);
  const started = Date.now();
  const result = await resolveWithinDeadline(persisted, never, 10);

  assert.equal(result.completed, false);
  assert.equal(result.value.length, persisted.length);
  assert.ok(Date.now() - started < 100, "deadline path waited too long");
});