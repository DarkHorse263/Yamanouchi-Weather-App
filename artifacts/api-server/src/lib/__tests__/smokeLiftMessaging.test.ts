import assert from "node:assert/strict";
import { it } from "node:test";
import { failureEmail, unverifiedLiftFeedDetail, type SmokeReport } from "../../jobs/smokeTest.js";

it("warns on unverified in-season lift status without claiming a fresh operator report is down", () => {
  const detail = unverifiedLiftFeedDetail("Perisher", false, 11);
  assert.match(detail, /liveStatusVerified=false, totalLifts=11/);
  assert.match(detail, /live lift status unavailable\/unverified/);
  assert.match(detail, /fresh report with no operating lifts/);
  assert.doesNotMatch(detail, /feed down|silently off/);

  const report: SmokeReport = {
    startedAt: "2026-09-26T00:00:00Z",
    durationMs: 0,
    ok: false,
    pagesChecked: 0,
    apiChecksPassed: 0,
    linksChecked: 0,
    linksBlockedButReachable: 0,
    failures: [{ check: "live lift feed", url: "https://feelzlike.com/api/lift-status/perisher", detail }],
    emailed: false,
    skippedExternal: true,
  };
  const email = failureEmail(report);
  assert.match(email.text, /live lift status unavailable\/unverified \(1\)/);
  assert.match(email.text, /Perisher live lift status unavailable\/unverified/);
  assert.doesNotMatch(email.text, /silently off|feed down/);
});