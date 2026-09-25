import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import type { Request, Response } from "express";

// Local unit fixtures only: no provider calls, database writes or live charges.
process.env.DATABASE_URL ||= "postgresql://unused:unused@localhost/unused";
process.env.BILLING_ORIGIN = "https://billing.example.test";
process.env.STRIPE_MODE = "test";
process.env.STRIPE_MONTHLY_PRICE_ID = "price_month";
process.env.STRIPE_ANNUAL_PRICE_ID = "price_year";
process.env.STRIPE_EUR_MONTHLY_PRICE_ID = "price_EURmonth";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_unit_test_only";
const { processBillingWebhook } = await import("../billing");
const { billingWebhook } = await import("../../routes/billing");

async function webhookResponse(raw: Buffer, signature: string) {
  let status = 200;
  let body: any;
  const res = {
    status(code: number) { status = code; return this; },
    json(value: unknown) { body = value; return this; },
  } as unknown as Response;
  await billingWebhook({ body: raw, headers: { "stripe-signature": signature } } as unknown as Request, res);
  return { status, body };
}

test("bad webhook signature is a 400, while a valid but invalid-mode event is a processing 503", async () => {
  assert.deepEqual(await webhookResponse(Buffer.from("{}"), "invalid"), {
    status: 400, body: { error: "INVALID_WEBHOOK_SIGNATURE" },
  });
  const payload = JSON.stringify({ id: "evt_wrong_mode", type: "customer.subscription.updated", livemode: true,
    data: { object: { id: "sub_test", customer: "cus_test" } } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
  assert.deepEqual(await webhookResponse(Buffer.from(payload), signature), {
    status: 503, body: { error: "WEBHOOK_NOT_PROCESSED" },
  });
});

function harness() {
  const processed = new Set<string>();
  let state: any;
  let canonical: any = { id: "sub_test", customer: "cus_test", livemode: false, status: "active",
    items: { data: [{ quantity: 1, price: { id: "price_month" }, current_period_end: Date.now() / 1000 + 3600 }] } };
  let customer: any = { livemode: false, metadata: { feelzlike_user_id: "user_owner" } };
  const client = {
    release() {},
    async query(sql: string, values?: any[]) {
      if (sql.startsWith("INSERT INTO billing_events")) {
        if (processed.has(values![0])) return { rowCount: 0, rows: [] };
        processed.add(values![0]); return { rowCount: 1, rows: [{}] };
      }
      if (sql.includes("SELECT user_id")) return { rows: [{ user_id: "user_owner" }] };
      if (sql.startsWith("INSERT INTO subscriptions")) state = values;
      return { rows: [] };
    },
  };
  const deps: any = {
    pool: { connect: async () => client },
    getStripeSync: async () => ({ processWebhook: async () => {} }),
    stripeRequest: async (path: string) => path.startsWith("/v1/customers/")
      ? customer : canonical,
  };
  async function deliver(id: string, status: string, created: number) {
    const payload = JSON.stringify({ id, type: "customer.subscription.updated", livemode: false, created,
      data: { object: { id: "sub_test", customer: "cus_test", status } } });
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
    await processBillingWebhook(Buffer.from(payload), signature, deps);
  }
  return { deps, deliver, state: () => state, processed,
    cancel: () => { canonical = { ...canonical, status: "canceled" }; },
    regional: (selected: string, address: string) => {
      canonical = { ...canonical,
        metadata: { feelzlike_user_id: "user_owner", feelzlike_billing_country: selected, feelzlike_billing_currency: "EUR" },
        items: { data: [{ ...canonical.items.data[0], price: { id: "price_EURmonth" } }] } };
      customer = { ...customer, address: { country: address } };
    } };
}
test("duplicate signed deliveries cannot apply the projection twice", async () => {
  const h = harness();
  await h.deliver("evt_once", "active", 20);
  const first = h.state();
  await h.deliver("evt_once", "active", 20);
  assert.equal(h.processed.size, 1);
  assert.equal(h.state(), first);
});
test("out-of-order active snapshot cannot resurrect current cancellation", async () => {
  const h = harness();
  await h.deliver("evt_active", "active", 20);
  assert.equal(h.state()[1], "pro");
  h.cancel();
  await h.deliver("evt_cancel", "canceled", 30);
  await h.deliver("evt_older", "active", 10);
  assert.equal(h.state()[1], "free");
  assert.equal(h.state()[2], "canceled");
});
test("invalid signature never enters native sync or durable projection", async () => {
  const h = harness();
  await assert.rejects(processBillingWebhook(Buffer.from("{}"), "bad", h.deps));
  assert.equal(h.processed.size, 0);
  assert.equal(h.state(), undefined);
});
test("moving countries does not revoke a valid paid subscription", async () => {
  const h = harness();
  h.regional("DE", "FR");
  await h.deliver("evt_customer_moved", "active", 40);
  assert.equal(h.state()[1], "pro");
});