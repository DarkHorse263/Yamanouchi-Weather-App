import assert from "node:assert/strict";
import test from "node:test";
import { getAdminPowderTestStatus, sendAdminPowderTest, verifyPowderTestToken, PowderTestError } from "../adminPowderTestEmail.js";
import { powderAlertEmail } from "../emailTemplates.js";
import type { sendEmail } from "../emailSender.js";

const env = { RESEND_API_KEY: "re_test_key_not_live", ALERT_TOKEN_SECRET: "test-secret-not-production-value" };
const alice = { userId: "clerk_alice", email: "alice@example.com", emailVerified: true };
const bob = { userId: "clerk_bob", email: "bob@example.com", emailVerified: true };
const now = Date.parse("2026-07-20T12:00:00Z");
const providerId = "d5eaac36-042a-4499-9fc9-25c7a1723ce5";

test("synthetic email uses the real template without fake subscriber links", () => {
  const sample = powderAlertEmail({
    testMode: true,
    topMountain: { name: "Sample Mountain", region: "synthetic", snowfallCm: 24 },
    otherMountains: [], todaysCallUrl: "https://feelzlike.com/",
  });
  assert.match(sample.subject, /^\[TEST SAMPLE\]/);
  assert.match(sample.html, /TEST SAMPLE ONLY/);
  assert.doesNotMatch(sample.html, /unsubscribe in one click|manage your alert preferences/);
  assert.doesNotMatch(sample.text, /unsubscribe:|manage preferences:/);
  assert.throws(() => powderAlertEmail({
    topMountain: { name: "Sample Mountain", region: "synthetic", snowfallCm: 24 },
    otherMountains: [], todaysCallUrl: "https://feelzlike.com/",
  }), /require manage and unsubscribe/);
});

test("send is admin-only, fixed-recipient, deterministic across replica retries and leaves subscriptions untouched", async () => {
  const sent: Array<Record<string, unknown>> = [];
  const send = async (args: Parameters<typeof sendEmail>[0]) => {
    sent.push({ ...args });
    return { provider: "resend" as const, delivered: true, providerId };
  };
  const result = await sendAdminPowderTest(alice, { env, now, send });
  assert.equal(result.recipient, alice.email);
  assert.equal(result.accepted, true);
  assert.equal(sent[0].to, alice.email);
  assert.equal(sent[0].tag, "admin-powder-test");
  assert.equal(verifyPowderTestToken(result.statusToken, alice, env, now), providerId);
  await assert.rejects(sendAdminPowderTest(alice, { env, now: now + 1, send }), (e: PowderTestError) => e.status === 429);
  // Simulate a second instance using the same identity after its local cooldown expires.
  await sendAdminPowderTest(alice, { env, now: now + 61_000, send });
  assert.equal(sent[0].idempotencyKey, sent[1].idempotencyKey);
  assert.deepEqual(sent[0], sent[1]);
  assert.equal(sent.length, 2); // only the injected sender was called; no DB writes or real provider calls
  assert.throws(() => verifyPowderTestToken(result.statusToken, bob, env, now), (e: PowderTestError) => e.status === 404);
  assert.throws(() => verifyPowderTestToken(result.statusToken, { ...alice, email: "new@example.com" }, env, now), (e: PowderTestError) => e.status === 404);
});

test("missing key, failed provider and missing identity fail explicitly", async () => {
  await assert.rejects(sendAdminPowderTest({ ...alice, email: "" }, { env, now }), (e: PowderTestError) => e.status === 403);
  await assert.rejects(sendAdminPowderTest({ ...alice, emailVerified: false }, { env, now }), (e: PowderTestError) => e.code === "ADMIN_EMAIL_NOT_VERIFIED");
  await assert.rejects(sendAdminPowderTest(alice, { env: { ALERT_TOKEN_SECRET: env.ALERT_TOKEN_SECRET }, now }), (e: PowderTestError) => e.status === 503);
  const failing = async () => ({ provider: "resend" as const, delivered: false, error: "rejected", permanent: true });
  await assert.rejects(sendAdminPowderTest(bob, { env, now, send: failing }), (e: PowderTestError) => e.status === 422);
  // Rejected attempts release local cooldown so an operator can retry after fixing provider configuration.
  await assert.rejects(sendAdminPowderTest(bob, { env, now, send: failing }), (e: PowderTestError) => e.status === 422);
});

test("status uses only signed provider ID and verifies provider recipient", async () => {
  const send = async () => ({ provider: "resend" as const, delivered: true, providerId });
  const { statusToken } = await sendAdminPowderTest({ userId: "clerk_status", email: alice.email, emailVerified: true }, { env, now, send });
  const owner = { userId: "clerk_status", email: alice.email, emailVerified: true };
  const fetchStatus = async (url: string) => {
    assert.equal(url, `https://api.resend.com/emails/${providerId}`);
    // Resend retrieve-email response uses unprefixed last_event, unlike webhooks.
    return new Response(JSON.stringify({ id: providerId, to: [alice.email], last_event: "delivered" }));
  };
  assert.deepEqual(await getAdminPowderTestStatus(statusToken, owner, { env, now, fetchStatus: fetchStatus as typeof fetch }), {
    status: "delivered", providerEvent: "delivered",
  });
  for (const [event, expected] of [
    ["opened", "delivered"], ["clicked", "delivered"], ["email.delivered", "delivered"],
    ["bounced", "bounced"], ["complained", "complained"], ["failed", "failed"],
    ["canceled", "failed"], ["queued", "pending"], ["delivery_delayed", "pending"],
  ]) {
    const result = await getAdminPowderTestStatus(statusToken, owner, {
      env, now,
      fetchStatus: (async () => new Response(JSON.stringify({
        id: providerId, to: [alice.email], last_event: event,
      }))) as typeof fetch,
    });
    assert.equal(result.status, expected, `Resend last_event=${event}`);
    assert.equal(result.providerEvent, event);
  }
  await assert.rejects(getAdminPowderTestStatus(statusToken, bob, { env, now, fetchStatus: fetchStatus as typeof fetch }), (e: PowderTestError) => e.status === 404);
  await assert.rejects(getAdminPowderTestStatus(statusToken, owner, {
    env, now, fetchStatus: (async () => new Response(JSON.stringify({ id: providerId, to: [bob.email], last_event: "email.delivered" }))) as typeof fetch,
  }), (e: PowderTestError) => e.code === "TEST_STATUS_RECIPIENT_MISMATCH");
  assert.throws(() => verifyPowderTestToken(statusToken, owner, env, now + 86_400_000), (e: PowderTestError) => e.status === 404);
});