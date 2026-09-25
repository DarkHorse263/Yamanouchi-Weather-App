import { createHash } from "node:crypto";
import Stripe from "stripe";
import { pool } from "@workspace/db";
import { BILLING_CURRENCIES, BILLING_PLANS, approvedPriceIds, billingConfig, currencyForCountry, entitlementBillingConfig, isBillingCountry, priceEnv, subscriptionMatchesRegionalPolicy, validatePrice, assertCustomerOwner, paidSubscription, type BillingCurrency, type BillingPlan } from "./billing-policy";
import { stripeRequest, getStripeSync } from "./stripeClient";

const params = (values: Record<string, string>) => new URLSearchParams(values);
const priceIds = () => approvedPriceIds();
const keyFor = (user: string) => createHash("sha256").update(user).digest("hex");
const READINESS_TTL_MS = 5 * 60_000;
const ENTITLEMENT_TTL_MS = 60_000;
type BillingConfig = ReturnType<typeof billingConfig>;
let readinessCache: { key: string; until: number; result: Promise<BillingConfig> } | undefined;
const entitlementCache = new Map<string, { until: number; result: Promise<Awaited<ReturnType<typeof lookupPaidEntitlement>>> }>();

export class InvalidWebhookSignatureError extends Error {
  constructor() { super("INVALID_WEBHOOK_SIGNATURE"); }
}

export async function billingReady() {
  if (process.env.BILLING_PURCHASES_ENABLED !== "true") throw new Error("BILLING_DISABLED");
  const config = billingConfig();
  if (process.env.BILLING_WEBHOOK_VERIFIED !== "true") throw new Error("BILLING_WEBHOOK_NOT_VERIFIED");
  const key = JSON.stringify([config.origin, config.live, priceIds(), process.env.BILLING_WEBHOOK_VERIFIED]);
  if (readinessCache?.key === key && readinessCache.until > Date.now()) return readinessCache.result;
  const result = checkBillingReadiness(config);
  readinessCache = { key, until: Date.now() + READINESS_TTL_MS, result };
  result.catch(() => {
    if (readinessCache?.result === result) readinessCache = undefined;
  });
  return result;
}

async function checkBillingReadiness(config: BillingConfig) {
  await getStripeSync(); // Proxy authorization alone cannot initialize native sync.
  await pool.query("SELECT event_id FROM billing_events LIMIT 0");
  await pool.query("SELECT id FROM stripe.subscriptions LIMIT 0");
  const [account, tax] = await Promise.all([stripeRequest("/v1/account"), stripeRequest("/v1/tax/settings")]);
  if (!account.charges_enabled || !account.details_submitted || tax.status !== "active" || tax.livemode !== config.live)
    throw new Error("BILLING_TAX_OR_ACCOUNT_NOT_READY");
  const endpoints = await stripeRequest("/v1/webhook_endpoints?limit=100");
  const webhook = endpoints.data?.find((endpoint: any) =>
    endpoint.url === `${config.origin}/api/stripe/webhook` &&
    endpoint.status === "enabled" && endpoint.livemode === config.live &&
    ["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].every(type =>
      endpoint.enabled_events?.includes("*") || endpoint.enabled_events?.includes(type)));
  if (!webhook) throw new Error("BILLING_WEBHOOK_NOT_READY");
  for (const currency of Object.keys(BILLING_CURRENCIES) as BillingCurrency[]) {
    for (const plan of Object.keys(BILLING_PLANS) as BillingPlan[]) {
      validatePrice(await stripeRequest(`/v1/prices/${process.env[priceEnv(currency, plan)]}`), plan, currency, config.live);
    }
  }
  return config;
}

export async function checkout(userId: string, plan: BillingPlan, billingCountry: string) {
  if (!isBillingCountry(billingCountry)) throw new Error("BILLING_COUNTRY_INVALID");
  const config = await billingReady();
  const currency = currencyForCountry(billingCountry);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serializes customer creation AND checkout creation across instances.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`billing:${userId}:${config.live}`]);
    if ((await client.query("SELECT 1 FROM account_deletions WHERE user_id=$1 LIMIT 1", [userId])).rowCount) {
      throw new Error("ACCOUNT_DELETION_REQUESTED");
    }
    let { rows: [owner] } = await client.query(
      "SELECT customer_id FROM billing_customers WHERE user_id=$1 AND live=$2", [userId, config.live]);
    if (!owner) {
      const customer = await stripeRequest("/v1/customers", params({ "metadata[feelzlike_user_id]": userId }),
        `feelzlike-customer-${config.live}-${keyFor(userId)}`);
      assertCustomerOwner(customer, userId, config.live);
      await client.query("INSERT INTO billing_customers(user_id,customer_id,live) VALUES($1,$2,$3)",
        [userId, customer.id, config.live]);
      owner = { customer_id: customer.id };
      // Persist ownership before a remotely-created checkout could complete.
      // A failed checkout must never roll back the customer-to-account link.
      await client.query("COMMIT");
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`billing:${userId}:${config.live}`]);
      if ((await client.query("SELECT 1 FROM account_deletions WHERE user_id=$1 LIMIT 1", [userId])).rowCount) {
        throw new Error("ACCOUNT_DELETION_REQUESTED");
      }
    }
    const customer = await stripeRequest(`/v1/customers/${owner.customer_id}`);
    assertCustomerOwner(customer, userId, config.live);
    const existing = await stripeRequest(`/v1/subscriptions?customer=${encodeURIComponent(owner.customer_id)}&status=all&limit=100`);
    if (existing.has_more || existing.data.some((s: any) => !["canceled", "incomplete_expired"].includes(s.status)))
      throw new Error("BILLING_SUBSCRIPTION_EXISTS");
    // Reuse open sessions; never allow concurrent monthly + annual purchases.
    const sessions = await stripeRequest(`/v1/checkout/sessions?customer=${encodeURIComponent(owner.customer_id)}&status=open&limit=100`);
    if (sessions.has_more) throw new Error("BILLING_CHECKOUT_PENDING");
    if (sessions.data.length) {
      throw new Error("BILLING_CHECKOUT_PENDING");
    }
    const session = await stripeRequest("/v1/checkout/sessions", params({
      customer: owner.customer_id, mode: "subscription",
      "line_items[0][price]": process.env[priceEnv(currency, plan)]!, "line_items[0][quantity]": "1",
      "automatic_tax[enabled]": "true", "billing_address_collection": "required",
      "customer_update[address]": "auto",
      "subscription_data[metadata][feelzlike_user_id]": userId,
      "subscription_data[metadata][feelzlike_billing_country]": billingCountry,
      "subscription_data[metadata][feelzlike_billing_currency]": currency,
      success_url: `${config.origin}/account?checkout=returned`,
      cancel_url: `${config.origin}/premium?checkout=cancelled`,
    }), `feelzlike-checkout-${config.live}-${keyFor(userId)}-${plan}-${billingCountry}-${Math.floor(Date.now() / 1800000)}`);
    if (session.livemode !== config.live || !session.url?.startsWith("https://checkout.stripe.com/"))
      throw new Error("BILLING_CHECKOUT_INVALID");
    await client.query("COMMIT");
    return session.url as string;
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function portal(userId: string) {
  const config = entitlementBillingConfig();
  const { rows: [owner] } = await pool.query(
    "SELECT customer_id FROM billing_customers WHERE user_id=$1 AND live=$2", [userId, config.live]);
  if (!owner) throw new Error("BILLING_NO_CUSTOMER");
  assertCustomerOwner(await stripeRequest(`/v1/customers/${owner.customer_id}`), userId, config.live);
  const session = await stripeRequest("/v1/billing_portal/sessions", params({
    customer: owner.customer_id, return_url: `${config.origin}/account`,
  }));
  if (!session.url?.startsWith("https://billing.stripe.com/")) throw new Error("BILLING_PORTAL_INVALID");
  return session.url as string;
}

/** Only a signed webhook can write the entitlement projection. Checkout returns
 * and checkout.session.completed never prove an active paid subscription.
 * Re-fetch under a DB lock instead of applying event snapshots: an old event
 * can never restore a subscription that is currently canceled at Stripe.
 */
export async function processBillingWebhook(raw: Buffer, signature: string, deps = {
  pool, stripeRequest, getStripeSync,
}) {
  const config = entitlementBillingConfig();
  let event: Stripe.Event;
  try { event = Stripe.webhooks.constructEvent(raw, signature, config.webhookSecret); }
  catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) throw new InvalidWebhookSignatureError();
    throw error;
  }
  if (event.livemode !== config.live || event.account) throw new Error("BILLING_EVENT_MODE");
  const sync = await deps.getStripeSync();
  await sync.processWebhook(raw, signature);
  if (!event.type.startsWith("customer.subscription.")) return;
  const object = event.data.object as Stripe.Subscription;
  const customerId = typeof object.customer === "string" ? object.customer : object.customer.id;
  const client = await deps.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`billing-event:${customerId}`]);
    const inserted = await client.query("INSERT INTO billing_events(event_id) VALUES($1) ON CONFLICT DO NOTHING RETURNING event_id", [event.id]);
    if (!inserted.rowCount) { await client.query("COMMIT"); return; }
    const { rows: [owner] } = await client.query(
      "SELECT user_id FROM billing_customers WHERE customer_id=$1 AND live=$2", [customerId, config.live]);
    if (owner) {
      const customer = await deps.stripeRequest(`/v1/customers/${customerId}`);
      assertCustomerOwner(customer, owner.user_id, config.live);
      const sub = await deps.stripeRequest(`/v1/subscriptions/${object.id}`);
      if (sub.customer !== customerId || sub.livemode !== config.live) throw new Error("BILLING_SUBSCRIPTION_OWNERSHIP");
      const entitled = paidSubscription(sub, priceIds(), config.live) &&
        subscriptionMatchesRegionalPolicy(sub, owner.user_id);
      const item = sub.items.data[0];
      const start = item?.current_period_start ?? sub.current_period_start;
      const end = item?.current_period_end ?? sub.current_period_end;
      await client.query(`INSERT INTO subscriptions
        (user_id,tier,status,provider,provider_sub_id,provider_customer_id,current_period_start,current_period_end,metadata)
        VALUES($1,$2,$3,'stripe',$4,$5,$6,$7,$8)
        ON CONFLICT(provider,provider_sub_id) DO UPDATE SET
          tier=EXCLUDED.tier,status=EXCLUDED.status,current_period_start=EXCLUDED.current_period_start,
          current_period_end=EXCLUDED.current_period_end,metadata=EXCLUDED.metadata,updated_at=NOW()
        WHERE subscriptions.user_id=EXCLUDED.user_id AND subscriptions.provider_customer_id=EXCLUDED.provider_customer_id`,
        [owner.user_id, entitled ? "pro" : "free", sub.status, sub.id, customerId,
          start ? new Date(start * 1000) : null, end ? new Date(end * 1000) : null,
          JSON.stringify({ live: config.live, verifiedWebhook: true, cancelAtPeriodEnd: !!sub.cancel_at_period_end })]);
    }
    await client.query("COMMIT");
    if (owner) entitlementCache.delete(`${config.live}:${owner.user_id}`);
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function paidEntitlement(userId: string) {
  const config = entitlementBillingConfig();
  const key = `${config.live}:${userId}`;
  const cached = entitlementCache.get(key);
  if (cached && cached.until > Date.now()) return cached.result;
  if (entitlementCache.size >= 1000) {
    for (const [id, entry] of entitlementCache) {
      if (entry.until <= Date.now()) entitlementCache.delete(id);
    }
    if (entitlementCache.size >= 1000) entitlementCache.delete(entitlementCache.keys().next().value!);
  }
  const result = lookupPaidEntitlement(userId, config);
  entitlementCache.set(key, { result, until: Date.now() + ENTITLEMENT_TTL_MS });
  result.then(entitlement => {
    const entry = entitlementCache.get(key);
    if (entry?.result === result && entitlement?.currentPeriodEnd)
      entry.until = Math.min(entry.until, entitlement.currentPeriodEnd.getTime());
  }).catch(() => { /* Rejection is handled by the eviction below. */ });
  result.catch(() => {
    if (entitlementCache.get(key)?.result === result) entitlementCache.delete(key);
  });
  return result;
}

async function lookupPaidEntitlement(userId: string, config: ReturnType<typeof entitlementBillingConfig>) {
  const { rows } = await pool.query(`SELECT s.provider_sub_id,s.provider_customer_id FROM subscriptions s
    JOIN billing_customers c ON c.user_id=s.user_id AND c.customer_id=s.provider_customer_id
    WHERE s.user_id=$1 AND c.live=$2 AND s.provider='stripe' AND s.tier='pro'
    AND s.status='active' AND s.current_period_end>NOW() AND s.metadata->>'verifiedWebhook'='true'`,
    [userId, config.live]);
  for (const row of rows) {
    const sub = await stripeRequest(`/v1/subscriptions/${row.provider_sub_id}`);
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    if (customerId !== row.provider_customer_id) throw new Error("BILLING_SUBSCRIPTION_OWNERSHIP");
    const customer = await stripeRequest(`/v1/customers/${customerId}`);
    assertCustomerOwner(customer, userId, config.live);
    if (paidSubscription(sub, priceIds(), config.live) &&
        subscriptionMatchesRegionalPolicy(sub, userId))
      return { tier: "pro" as const, status: "active", currentPeriodEnd: new Date((sub.items.data[0].current_period_end ?? sub.current_period_end) * 1000) };
  }
  return null;
}