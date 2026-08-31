import assert from "node:assert/strict";
import test from "node:test";
import { checkExternalLinkContent } from "../externalLinkIntegrity.js";

test("accepts a normal operator page with its stable identity", () => {
  assert.deepEqual(
    checkExternalLinkContent("<title>Gunnison Valley RTA | Free Bus</title>", {
      expectedAny: ["Gunnison Valley RTA"],
    }),
    { ok: true },
  );
});

test("flags strong domain-parking language", () => {
  const result = checkExternalLinkContent("<main>Buy this domain today</main>");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.detail, /domain-parked/);
});

test("flags off-screen replica-shopping injection", () => {
  const result = checkExternalLinkContent(
    '<span style="position:absolute;left:-15869px"><a href="https://spam.example/">best replica watch</a> and cheap rolex</span>',
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.detail, /content hijack/);
});

test("does not flag an ordinary visible mention of a shop or sale", () => {
  assert.deepEqual(
    checkExternalLinkContent("<p>Tickets are for sale in the visitor centre shop.</p>"),
    { ok: true },
  );
});

test("flags a missing opt-in operator identity", () => {
  const result = checkExternalLinkContent("<title>Unrelated website</title>", {
    expectedAny: ["Gunnison Valley RTA"],
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.detail, /missing expected operator identity/);
});