/** Prices are server-owned, tax-exclusive AUD cents. No client-supplied price IDs. */
export const BILLING_PLANS = {
  monthly: { amount: 599, interval: "month", env: "STRIPE_MONTHLY_PRICE_ID" },
  annual: { amount: 6000, interval: "year", env: "STRIPE_ANNUAL_PRICE_ID" },
} as const;
export type BillingPlan = keyof typeof BILLING_PLANS;
export function parseBillingPlan(body: unknown): BillingPlan {
  if (!body || typeof body !== "object" || Object.keys(body).length !== 1 ||
      !("plan" in body) || (body.plan !== "monthly" && body.plan !== "annual")) {
    throw new Error("INVALID_PLAN");
  }
  return body.plan;
}
export function billingConfig(env: NodeJS.ProcessEnv = process.env) {
  const origin = env.BILLING_ORIGIN;
  if (!origin || !/^https:\/\/[^/]+$/.test(origin) ||
      !["test", "live"].includes(env.STRIPE_MODE ?? "") ||
      !env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_") ||
      !/^price_[a-zA-Z0-9]+$/.test(env.STRIPE_MONTHLY_PRICE_ID ?? "") ||
      !/^price_[a-zA-Z0-9]+$/.test(env.STRIPE_ANNUAL_PRICE_ID ?? "") ||
      env.STRIPE_MONTHLY_PRICE_ID === env.STRIPE_ANNUAL_PRICE_ID) {
    throw new Error("BILLING_NOT_CONFIGURED");
  }
  return { origin, live: env.STRIPE_MODE === "live", webhookSecret: env.STRIPE_WEBHOOK_SECRET };
}
export function validatePrice(price: any, plan: BillingPlan, live: boolean) {
  const expected = BILLING_PLANS[plan];
  if (!price?.active || price.livemode !== live || price.currency !== "aud" ||
      price.unit_amount !== expected.amount || price.tax_behavior !== "exclusive" ||
      price.type !== "recurring" || price.recurring?.interval !== expected.interval ||
      price.recurring.interval_count !== 1 || price.recurring.usage_type !== "licensed") {
    throw new Error("BILLING_PRICE_MISMATCH");
  }
}
export function assertCustomerOwner(customer: any, userId: string, live: boolean) {
  if (customer?.deleted || customer?.livemode !== live || customer?.metadata?.feelzlike_user_id !== userId)
    throw new Error("BILLING_CUSTOMER_OWNERSHIP");
}
export function paidSubscription(sub: any, priceIds: string[], live: boolean) {
  const items = sub?.items?.data;
  const end = items?.[0]?.current_period_end ?? sub?.current_period_end;
  return sub?.livemode === live && sub.status === "active" && items?.length === 1 &&
    items[0].quantity === 1 && priceIds.includes(items[0].price?.id) &&
    Number.isFinite(end) && end * 1000 > Date.now();
}