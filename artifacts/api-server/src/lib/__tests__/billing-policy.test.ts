import { test } from "node:test";
import assert from "node:assert/strict";
import { assertCustomerOwner, billingConfig, paidSubscription, parseBillingPlan, validatePrice } from "../billing-policy";

const price = { id: "price_test", active: true, livemode: false, currency: "aud", unit_amount: 599,
  tax_behavior: "exclusive", type: "recurring", recurring: { interval: "month", interval_count: 1, usage_type: "licensed" } };
test("plan allowlist rejects injected price, customer, return URL and unknown plans", () => {
  assert.equal(parseBillingPlan({ plan: "annual" }), "annual");
  for (const body of [{ plan: "monthly", priceId: "price_other" }, { plan: "monthly", customer: "cus_victim" }, { plan: "free" }, { success: true }, null])
    assert.throws(() => parseBillingPlan(body), /INVALID_PLAN/);
});
test("missing configuration fails closed", () => {
  assert.throws(() => billingConfig({}), /BILLING_NOT_CONFIGURED/);
});
test("ownership is not established by email or supplied customer ID", () => {
  assertCustomerOwner({ livemode: false, metadata: { feelzlike_user_id: "owner" } }, "owner", false);
  assert.throws(() => assertCustomerOwner({ livemode: false, metadata: { feelzlike_user_id: "victim" } }, "attacker", false));
  assert.throws(() => assertCustomerOwner({ livemode: true, metadata: { feelzlike_user_id: "owner" } }, "owner", false));
});
test("prices must be approved AUD tax-exclusive recurring prices in the configured mode", () => {
  validatePrice(price, "monthly", false);
  for (const changed of [{ unit_amount: 1 }, { currency: "usd" }, { tax_behavior: "inclusive" }, { livemode: true }])
    assert.throws(() => validatePrice({ ...price, ...changed }, "monthly", false));
});
test("false checkout success, trial, overdue, canceled and expired subscriptions grant nothing", () => {
  assert.equal(paidSubscription({ checkout: "success", paid: true }, ["price_test"], false), false);
  const sub = { livemode: false, status: "active", items: { data: [{ quantity: 1, price, current_period_end: Date.now() / 1000 + 3600 }] } };
  assert.equal(paidSubscription(sub, ["price_test"], false), true);
  for (const status of ["trialing", "past_due", "unpaid", "canceled", "incomplete"])
    assert.equal(paidSubscription({ ...sub, status }, ["price_test"], false), false);
  assert.equal(paidSubscription(sub, ["price_other"], false), false);
});