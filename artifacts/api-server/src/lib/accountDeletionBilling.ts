import { billingCustomersTable, subscriptionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { stripeRequest } from "./stripeClient.js";
import { assertCustomerOwner } from "./billing-policy.js";
import type { RetentionTransaction } from "./subscriberRetention.js";

type ProviderRequest = typeof stripeRequest;
const terminal = new Set(["canceled", "incomplete_expired"]);

async function allPages(request: ProviderRequest, path: string): Promise<any[]> {
  const records: any[] = [];
  let after = "";
  for (let page = 0; page < 100; page++) {
    const result = await request(`${path}&limit=100${after ? `&starting_after=${encodeURIComponent(after)}` : ""}`);
    if (!Array.isArray(result.data)) throw new Error("BILLING_RESPONSE_INVALID");
    records.push(...result.data);
    if (!result.has_more) return records;
    const next = result.data.at(-1)?.id;
    if (typeof next !== "string" || next === after) throw new Error("BILLING_PAGINATION_INVALID");
    after = next;
  }
  throw new Error("BILLING_PAGINATION_LIMIT");
}

/**
 * Does not enable purchases and does not depend on paywall launch flags.
 * Existing liabilities must be canceled even while new purchases are disabled.
 * Retains Stripe customer/invoices/financial records and native synced records;
 * only the app's ownership projection is removed during final local cleanup.
 */
export async function cancelBillingForDeletion(
  tx: RetentionTransaction, userId: string, request: ProviderRequest = stripeRequest,
) {
  for (const live of [false, true]) {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`billing:${userId}:${live}`}))`);
  }
  const owners = await tx.select().from(billingCustomersTable).where(eq(billingCustomersTable.userId, userId));
  const localSubscriptions = await tx.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId));
  if (localSubscriptions.some((sub) => sub.provider && sub.provider !== "manual" && sub.provider !== "stripe" && !terminal.has(sub.status))) {
    throw new Error("BILLING_PROVIDER_REQUIRES_OPERATOR");
  }
  if (localSubscriptions.some((sub) => sub.provider === "stripe" && !terminal.has(sub.status) &&
    !owners.some((owner) => owner.customerId === sub.providerCustomerId))) {
    throw new Error("BILLING_OWNERSHIP_MISSING");
  }
  for (const owner of owners) {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`billing-event:${owner.customerId}`}))`);
    const customer = await request(`/v1/customers/${encodeURIComponent(owner.customerId)}`);
    assertCustomerOwner(customer, userId, owner.live);
    const query = `customer=${encodeURIComponent(owner.customerId)}`;
    // Prevent a checkout opened before the deletion request from charging later.
    const sessions = await allPages(request, `/v1/checkout/sessions?${query}&status=open`);
    for (const session of sessions) {
      if (session.customer !== owner.customerId || session.livemode !== owner.live) throw new Error("BILLING_SESSION_OWNERSHIP");
      const expired = await request(`/v1/checkout/sessions/${encodeURIComponent(session.id)}/expire`, new URLSearchParams());
      if (expired.status !== "expired") throw new Error("BILLING_CHECKOUT_NOT_EXPIRED");
    }
    const subscriptions = await allPages(request, `/v1/subscriptions?${query}&status=all`);
    for (const subscription of subscriptions) {
      if (subscription.customer !== owner.customerId || subscription.livemode !== owner.live) throw new Error("BILLING_SUBSCRIPTION_OWNERSHIP");
      if (!terminal.has(subscription.status)) {
        const canceled = await request(`/v1/subscriptions/${encodeURIComponent(subscription.id)}`,
          new URLSearchParams({ invoice_now: "false", prorate: "false" }), undefined, "DELETE");
        if (canceled.status !== "canceled" || canceled.customer !== owner.customerId || canceled.livemode !== owner.live) {
          throw new Error("BILLING_CANCELLATION_UNCONFIRMED");
        }
      }
    }
  }
}