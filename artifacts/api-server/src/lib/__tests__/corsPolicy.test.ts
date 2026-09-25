import { test } from "node:test";
import assert from "node:assert/strict";
import { isOriginAllowed } from "../corsPolicy";

test("production CORS accepts only exact owned or configured origins", () => {
  for (const origin of ["https://feelzlike.com", "https://www.feelzlike.com"])
    assert.equal(isOriginAllowed(origin, true), true);
  for (const origin of ["https://evil.replit.app", "https://evil.replit.dev", "http://localhost:1234", "https://feelzlike.com.evil.com"])
    assert.equal(isOriginAllowed(origin, true), false);
  assert.equal(isOriginAllowed("https://owned.replit.app", true, "https://owned.replit.app/"), true);
});
test("development permits valid preview origins, not malformed origin strings", () => {
  assert.equal(isOriginAllowed("https://preview.replit.dev", false), true);
  assert.equal(isOriginAllowed("http://localhost:1234", false), true);
  assert.equal(isOriginAllowed("https://evil.com/path.replit.dev", false), false);
});