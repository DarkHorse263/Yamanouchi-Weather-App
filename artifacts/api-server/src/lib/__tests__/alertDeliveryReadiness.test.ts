import assert from "node:assert/strict";
import test from "node:test";
import {
  alertRunKey,
  getAlertDeliveryReadiness,
} from "../alertDeliveryReadiness.js";

test("alert scheduler keeps the existing UTC three-hour bucket semantics", () => {
  assert.equal(
    alertRunKey(new Date("2026-07-19T05:59:59.999Z")),
    "2026-07-19T03:00:00Z",
  );
  assert.equal(
    alertRunKey(new Date("2026-07-19T06:00:00.000Z")),
    "2026-07-19T06:00:00Z",
  );
  assert.equal(
    alertRunKey(new Date("2026-07-20T00:01:00.000Z")),
    "2026-07-20T00:00:00Z",
  );
});

test("alert readiness exposes missing sender, token, and scheduler config", () => {
  assert.deepEqual(getAlertDeliveryReadiness({}, false), {
    ready: false,
    schedulerConfigured: false,
    schedulerStarted: false,
    emailConnectionConfigured: false,
    senderIdentityConfigured: false,
    senderConfigured: false,
    tokenConfigured: false,
    liveInboxVerification: "not_checked",
    issues: [
      "alert_sender_not_configured",
      "alert_token_secret_not_configured",
      "alert_scheduler_not_configured",
    ],
  });
});

test("alert readiness requires the opted-in scheduler to have started", () => {
  const env = {
    RESEND_API_KEY: "re_valid_enough",
    ALERT_FROM_EMAIL: "feelzlike <info@feelzlike.com>",
    ALERT_TOKEN_SECRET: "a-long-alert-token-secret",
    RUN_ALERT_CRON: "1",
  };

  assert.deepEqual(getAlertDeliveryReadiness(env, false).issues, [
    "alert_scheduler_not_started",
  ]);
  assert.equal(getAlertDeliveryReadiness(env, true).ready, true);
});

test("alert readiness distinguishes sender configuration from a live inbox check", () => {
  const readiness = getAlertDeliveryReadiness(
    {
      ALERT_FROM_EMAIL: "feelzlike <info@feelzlike.com>",
      ALERT_TOKEN_SECRET: "a-long-alert-token-secret",
    },
    false,
  );

  assert.equal(readiness.senderIdentityConfigured, true);
  assert.equal(readiness.emailConnectionConfigured, false);
  assert.equal(readiness.senderConfigured, false);
  assert.equal(readiness.liveInboxVerification, "not_checked");
});