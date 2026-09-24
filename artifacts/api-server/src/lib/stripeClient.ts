import { StripeSync } from "stripe-replit-sync";
import { ReplitConnectors } from "@replit/connectors-sdk";
import Stripe from "stripe";
let cachedSync: { key: string; sync: StripeSync } | undefined;

/** Use the connected proxy; never read or hard-code connector API credentials. */
export async function stripeRequest(path: string, body?: URLSearchParams, key?: string, method?: "DELETE"): Promise<any> {
  const response = await new ReplitConnectors().proxy("stripe", path, {
    method: method ?? (body ? "POST" : "GET"),
    ...(body ? { body: body.toString(), headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(key ? { "Idempotency-Key": key } : {}),
    } } : {}),
  });
  if (!response.ok) throw new Error("STRIPE_UNAVAILABLE");
  return response.json();
}

/** Native sync needs a different credential capability than the proxy.
 * Absence is a launch blocker, not permission to fake webhook sync.
 * No migrations, backfill, or provider mutations are run at startup.
 */
export async function getStripeSync() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const token = process.env.REPL_IDENTITY ? `repl ${process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL ? `depl ${process.env.WEB_REPL_RENEWAL}` : null;
  if (!hostname || !token) throw new Error("STRIPE_NATIVE_SYNC_UNAVAILABLE");
  const response = await fetch(`https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`, {
    headers: { Accept: "application/json", X_REPLIT_TOKEN: token }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("STRIPE_NATIVE_SYNC_UNAVAILABLE");
  const result = await response.json();
  const settings = result.items?.[0]?.settings;
  if (!settings?.secret_key || !process.env.DATABASE_URL) throw new Error("STRIPE_NATIVE_SYNC_UNAVAILABLE");
  const key = `${settings.secret_key}:${process.env.STRIPE_WEBHOOK_SECRET}`;
  if (cachedSync?.key === key) return cachedSync.sync;
  const [nativeAccount, proxyAccount] = await Promise.all([
    new Stripe(settings.secret_key).accounts.retrieve(null), stripeRequest("/v1/account"),
  ]);
  if (nativeAccount.id !== proxyAccount.id) throw new Error("STRIPE_NATIVE_ACCOUNT_MISMATCH");
  const sync = new StripeSync({
    poolConfig: { connectionString: process.env.DATABASE_URL },
    stripeSecretKey: settings.secret_key,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    revalidateObjectsViaStripeApi: ["subscription"],
  });
  cachedSync = { key, sync };
  return sync;
}