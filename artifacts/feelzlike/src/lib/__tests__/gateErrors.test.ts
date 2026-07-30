/**
 * Soft member gate · client-side classification of requireEntitlement errors
 * (task: confirm the sign-up gate still behaves after the free promo ends).
 *
 * Covers that a 402 PAYMENT_REQUIRED (signed-in after the promo ends) is
 * classified as "payment" so the form renders the "launch promo has ended"
 * upgrade copy, while a 401 AUTH_REQUIRED (anonymous) is classified "auth"
 * so it renders the free sign-up prompt · and that auth wins over payment.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  classifyGateError,
  isAuthRequired,
  isPaymentRequired,
  extractErrorMessage,
} from "../gateErrors";

// Error shapes as surfaced by the generated api client / fetch layers.
const auth401 = { status: 401, data: { error: "AUTH_REQUIRED", message: "Sign in with your free feelzlike account to use this feature." } };
const auth401Nested = { response: { status: 401, data: { error: "AUTH_REQUIRED" } } };
const authBodyOnly = { data: { error: "AUTH_REQUIRED" } };
const pay402 = { status: 402, data: { error: "PAYMENT_REQUIRED", message: 'This feature requires an active subscription with the "alerts.snow" entitlement.' } };
const pay402Nested = { response: { status: 402, data: { error: "PAYMENT_REQUIRED" } } };
const payBodyOnly = { data: { error: "PAYMENT_REQUIRED" } };

describe("anonymous visitor (401 AUTH_REQUIRED) → sign-up prompt", () => {
  test("all 401 shapes classify as auth", () => {
    for (const err of [auth401, auth401Nested, authBodyOnly]) {
      assert.equal(isAuthRequired(err), true);
      assert.equal(classifyGateError(err), "auth");
    }
  });
});

describe("signed-in after the promo (402 PAYMENT_REQUIRED) → promo-ended upgrade copy", () => {
  test("all 402 shapes classify as payment, NOT auth (no sign-up prompt)", () => {
    for (const err of [pay402, pay402Nested, payBodyOnly]) {
      assert.equal(isPaymentRequired(err), true);
      assert.equal(isAuthRequired(err), false);
      assert.equal(classifyGateError(err), "payment");
    }
  });

  test("payment errors never fall through to the raw error banner", () => {
    // The form only renders extractErrorMessage when classification is "other".
    assert.notEqual(classifyGateError(pay402), "other");
  });
});

describe("precedence and fall-through", () => {
  test("auth wins over payment when a malformed error carries both signals", () => {
    const both = { status: 401, data: { error: "PAYMENT_REQUIRED" } };
    assert.equal(classifyGateError(both), "auth");
  });

  test("no error → null (no gate UI)", () => {
    assert.equal(classifyGateError(null), null);
    assert.equal(classifyGateError(undefined), null);
  });

  test("unrelated errors → other, with a usable message", () => {
    const err = { status: 500, data: { message: "boom" } };
    assert.equal(classifyGateError(err), "other");
    assert.equal(extractErrorMessage(err), "boom");
    assert.equal(classifyGateError(new Error("network down")), "other");
    assert.equal(extractErrorMessage(new Error("network down")), "network down");
    assert.equal(extractErrorMessage("weird"), "Something went wrong. Try again.");
  });
});
