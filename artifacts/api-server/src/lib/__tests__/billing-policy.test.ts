import { test } from "node:test";
import assert from "node:assert/strict";
import {
  approvedPriceIds,
  assertCustomerOwner,
  billingConfig,
  currencyForCountry,
  paidSubscription,
  parseBillingSelection,
  subscriptionMatchesRegionalPolicy,
  validatePrice,
} from "../billing-policy";

const env = {
  BILLING_ORIGIN: "https://billing.example.test",
  STRIPE_MODE: "test",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
  STRIPE_AUD_MONTHLY_PRICE_ID: "price_AUDmonth",
  STRIPE_AUD_ANNUAL_PRICE_ID: "price_AUDyear",
  STRIPE_USD_MONTHLY_PRICE_ID: "price_USDmonth",
  STRIPE_USD_ANNUAL_PRICE_ID: "price_USDyear",
  STRIPE_EUR_MONTHLY_PRICE_ID: "price_EURmonth",
  STRIPE_EUR_ANNUAL_PRICE_ID: "price_EURyear",
  STRIPE_MONTHLY_PRICE_ID: "price_LEGACYmonth",
  STRIPE_ANNUAL_PRICE_ID: "price_LEGACYyear",
} as NodeJS.ProcessEnv;
const price = { id: "price_AUDmonth", active: true, livemode: false, currency: "aud", unit_amount: 599,
  tax_behavior: "inclusive", type: "recurring", recurring: { interval: "month", interval_count: 1, usage_type: "licensed" } };

test("selection allowlist rejects injected currency, price, customer, return URL and invalid countries", () => {
  assert.deepEqual(parseBillingSelection({ plan: "annual", billingCountry: "DE" }), { plan: "annual", billingCountry: "DE" });
  for (const body of [
    { plan: "monthly", billingCountry: "US", priceId: "price_other" },
    { plan: "monthly", billingCountry: "US", currency: "EUR" },
    { plan: "monthly", billingCountry: "ZZ" },
    { plan: "free", billingCountry: "AU" },
    null,
  ]) assert.throws(() => parseBillingSelection(body), /INVALID_BILLING_SELECTION/);
});

test("country policy selects USD, EUR, and AUD fallback", () => {
  assert.equal(currencyForCountry("US"), "USD");
  assert.equal(currencyForCountry("FR"), "EUR");
  assert.equal(currencyForCountry("BG"), "EUR");
  assert.equal(currencyForCountry("CA"), "AUD");
});

test("missing, duplicate, legacy-reused, or partial regional price configuration fails closed", () => {
  billingConfig(env);
  assert.throws(() => billingConfig({}), /BILLING_NOT_CONFIGURED/);
  assert.throws(() => billingConfig({ ...env, STRIPE_EUR_ANNUAL_PRICE_ID: undefined }), /BILLING_NOT_CONFIGURED/);
  assert.throws(() => billingConfig({ ...env, STRIPE_EUR_ANNUAL_PRICE_ID: env.STRIPE_USD_ANNUAL_PRICE_ID }), /BILLING_NOT_CONFIGURED/);
  assert.throws(() => billingConfig({ ...env, STRIPE_AUD_MONTHLY_PRICE_ID: env.STRIPE_MONTHLY_PRICE_ID }), /BILLING_NOT_CONFIGURED/);
});

test("ownership is not established by email or supplied customer ID", () => {
  assertCustomerOwner({ livemode: false, metadata: { feelzlike_user_id: "owner" } }, "owner", false);
  assert.throws(() => assertCustomerOwner({ livemode: false, metadata: { feelzlike_user_id: "victim" } }, "attacker", false));
  assert.throws(() => assertCustomerOwner({ livemode: true, metadata: { feelzlike_user_id: "owner" } }, "owner", false));
});

test("prices enforce regional currency, tax treatment, amount and recurrence", () => {
  validatePrice(price, "monthly", "AUD", false);
  validatePrice({ ...price, currency: "usd", tax_behavior: "exclusive" }, "monthly", "USD", false);
  for (const changed of [{ unit_amount: 1 }, { currency: "usd" }, { tax_behavior: "exclusive" }, { livemode: true }])
    assert.throws(() => validatePrice({ ...price, ...changed }, "monthly", "AUD", false));
});

test("new prices require internally consistent server-created country and currency metadata", () => {
  const sub = { metadata: { feelzlike_user_id: "owner", feelzlike_billing_country: "DE", feelzlike_billing_currency: "EUR" },
    items: { data: [{ price: { id: "price_EURmonth" } }] } };
  assert.equal(subscriptionMatchesRegionalPolicy(sub, "owner", env), true);
  assert.equal(subscriptionMatchesRegionalPolicy(sub, "other-user", env), false);
  assert.equal(subscriptionMatchesRegionalPolicy({ ...sub, metadata: { ...sub.metadata, feelzlike_billing_currency: "AUD" } }, "owner", env), false);
});

test("legacy AUD subscriptions remain approved without new regional metadata", () => {
  assert.equal(subscriptionMatchesRegionalPolicy(
    { items: { data: [{ price: { id: "price_LEGACYmonth" } }] } },
    "owner", env), true);
  assert.ok(approvedPriceIds(env).includes("price_LEGACYmonth"));
});

test("false checkout success, trial, overdue, canceled and expired subscriptions grant nothing", () => {
  assert.equal(paidSubscription({ checkout: "success", paid: true }, ["price_AUDmonth"], false), false);
  const sub = { livemode: false, status: "active", items: { data: [{ quantity: 1, price, current_period_end: Date.now() / 1000 + 3600 }] } };
  assert.equal(paidSubscription(sub, ["price_AUDmonth"], false), true);
  for (const status of ["trialing", "past_due", "unpaid", "canceled", "incomplete"])
    assert.equal(paidSubscription({ ...sub, status }, ["price_AUDmonth"], false), false);
  assert.equal(paidSubscription(sub, ["price_other"], false), false);
});