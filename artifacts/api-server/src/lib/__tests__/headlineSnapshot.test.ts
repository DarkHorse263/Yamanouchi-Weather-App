import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeHeadlineEntries } from "../headlineSnapshot.js";

test("partial replicas preserve other regions and never replace newer readings", () => {
  const newer = { freshUntil: 100, staleUntil: 200 };
  const older = { freshUntil: 90, staleUntil: 190 };
  assert.deepEqual(new Map(mergeHeadlineEntries([["a", newer], ["b", newer]], [["a", older]], 110)),
    new Map([["a", newer], ["b", newer]]));
});

test("expired readings are removed without extending timestamps; latest wins in either order", () => {
  const old = { freshUntil: 20, staleUntil: 40 };
  const fresh = { freshUntil: 90, staleUntil: 150 };
  assert.deepEqual(mergeHeadlineEntries([["expired", old], ["a", old]], [["a", fresh]], 50), [["a", fresh]]);
  assert.deepEqual(mergeHeadlineEntries([["a", fresh]], [["a", old]], 50), [["a", fresh]]);
  assert.deepEqual(mergeHeadlineEntries([["a", fresh]], [], 150), []);
});
