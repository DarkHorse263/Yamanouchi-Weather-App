import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  engagementNeedsVisitorHash,
  isHumanEngagementRequest,
} from "../engagementRequestPolicy.js";

describe("engagement request policy", () => {
  test("only page views require a privacy-preserving visitor hash", () => {
    assert.equal(engagementNeedsVisitorHash("view"), true);
    assert.equal(engagementNeedsVisitorHash("alert_form_viewed"), false);
    assert.equal(engagementNeedsVisitorHash("alert_submit_attempted"), false);
    assert.equal(engagementNeedsVisitorHash("alert_validation_failed"), false);
  });

  test("accepts normal browsers without relying on visitor-hash configuration", () => {
    assert.equal(
      isHumanEngagementRequest(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      ),
      true,
    );
  });

  test("continues to exclude missing and automated user agents", () => {
    assert.equal(isHumanEngagementRequest(undefined), false);
    assert.equal(isHumanEngagementRequest(""), false);
    assert.equal(isHumanEngagementRequest("Googlebot/2.1"), false);
    assert.equal(isHumanEngagementRequest("curl/8.12.1"), false);
  });
});