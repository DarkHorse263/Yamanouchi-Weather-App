import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { powderAlertEmail } from "./emailTemplates.js";
import { sendEmail } from "./emailSender.js";

export interface AdminIdentity { userId: string; email: string; emailVerified: boolean }
type Send = typeof sendEmail;
const cooldown = new Map<string, number>();
const DAY = 86_400_000;

export class PowderTestError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}

function secret(env: NodeJS.ProcessEnv): string {
  const value = env.ALERT_TOKEN_SECRET?.trim();
  if (!value || value.length < 16) throw new PowderTestError("TEST_STATUS_SECRET_NOT_CONFIGURED", 503);
  return value;
}

function assertIdentity(admin: AdminIdentity): void {
  if (!admin.userId || !admin.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email)) {
    throw new PowderTestError("ADMIN_IDENTITY_MISSING", 403);
  }
  if (admin.emailVerified !== true) throw new PowderTestError("ADMIN_EMAIL_NOT_VERIFIED", 403);
}

function tokenFor(admin: AdminIdentity, providerId: string, expires: number, key: string): string {
  const payload = Buffer.from(JSON.stringify({ userId: admin.userId, email: admin.email, providerId, expires })).toString("base64url");
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}

export function verifyPowderTestToken(token: string, admin: AdminIdentity, env: NodeJS.ProcessEnv = process.env, now = Date.now()): string {
  assertIdentity(admin);
  const key = secret(env);
  if (token.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new PowderTestError("TEST_STATUS_NOT_FOUND", 404);
  const [payload, signature] = token.split(".");
  const expected = createHmac("sha256", key).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new PowderTestError("TEST_STATUS_NOT_FOUND", 404);
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as Record<string, unknown>;
    if (parsed.userId !== admin.userId || parsed.email !== admin.email ||
        typeof parsed.providerId !== "string" || !/^[a-zA-Z0-9_-]{8,100}$/.test(parsed.providerId) ||
        typeof parsed.expires !== "number" || parsed.expires <= now || parsed.expires > now + 2 * DAY) {
      throw new Error("invalid status ownership");
    }
    return parsed.providerId;
  } catch {
    throw new PowderTestError("TEST_STATUS_NOT_FOUND", 404);
  }
}

export async function sendAdminPowderTest(
  admin: AdminIdentity,
  options: { env?: NodeJS.ProcessEnv; now?: number; send?: Send } = {},
): Promise<{ recipient: string; accepted: true; statusToken: string; retryAfter: string }> {
  assertIdentity(admin);
  const env = options.env ?? process.env;
  const key = secret(env);
  if (!env.RESEND_API_KEY || env.RESEND_API_KEY.length < 10 || env.RESEND_API_KEY === "placeholder") {
    throw new PowderTestError("TEST_EMAIL_PROVIDER_NOT_CONFIGURED", 503);
  }
  const now = options.now ?? Date.now();
  const identity = `${admin.userId}:${admin.email}`;
  if ((cooldown.get(identity) ?? 0) > now) throw new PowderTestError("TEST_EMAIL_COOLDOWN", 429);
  // Local guard catches double clicks; deterministic Resend key deduplicates across replicas.
  cooldown.set(identity, now + 60_000);
  if (cooldown.size > 1000) for (const [id, until] of cooldown) if (until <= now) cooldown.delete(id);
  const day = Math.floor(now / DAY);
  const retryAfter = new Date((day + 1) * DAY).toISOString();
  const idempotencyKey = `admin-powder-test-${createHash("sha256").update(identity).digest("hex").slice(0, 32)}-${day}`;
  // Never include a timestamp or subscriber-specific link: retries in a provider
  // bucket must have byte-for-byte identical content across instances.
  const message = powderAlertEmail({
    testMode: true,
    topMountain: { name: "Sample Mountain", region: "synthetic", snowfallCm: 24, windKph: 12 },
    otherMountains: [{ name: "Sample Ridge", region: "synthetic", snowfallCm: 18 }],
    todaysCallUrl: "https://feelzlike.com/",
  });
  try {
    const result = await (options.send ?? sendEmail)({
      to: admin.email, ...message, tag: "admin-powder-test", idempotencyKey,
    });
    if (!result.delivered || result.provider !== "resend" || !result.providerId) {
      throw new PowderTestError(
        result.error ? `TEST_EMAIL_REJECTED: ${result.error}` : "TEST_EMAIL_NOT_ACCEPTED",
        result.permanent ? 422 : 502,
      );
    }
    return { recipient: admin.email, accepted: true, statusToken: tokenFor(admin, result.providerId, now + DAY, key), retryAfter };
  } catch (error) {
    cooldown.delete(identity);
    throw error;
  }
}

export async function getAdminPowderTestStatus(
  token: string,
  admin: AdminIdentity,
  options: { env?: NodeJS.ProcessEnv; now?: number; fetchStatus?: typeof fetch } = {},
): Promise<{ status: "delivered" | "bounced" | "complained" | "pending" | "failed"; providerEvent: string }> {
  const env = options.env ?? process.env;
  const providerId = verifyPowderTestToken(token, admin, env, options.now);
  if (!env.RESEND_API_KEY || env.RESEND_API_KEY.length < 10 || env.RESEND_API_KEY === "placeholder") {
    throw new PowderTestError("TEST_EMAIL_PROVIDER_NOT_CONFIGURED", 503);
  }
  let response: Response;
  try {
    response = await (options.fetchStatus ?? fetch)(`https://api.resend.com/emails/${encodeURIComponent(providerId)}`, {
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
      signal: AbortSignal.timeout(10_000),
    });
  } catch { throw new PowderTestError("TEST_STATUS_PROVIDER_UNAVAILABLE", 502); }
  if (response.status === 401 || response.status === 403) {
    throw new PowderTestError("Provider delivery lookup is not permitted by the email API key. Check your inbox or the Resend dashboard; this does not mean sending failed.", 502);
  }
  if (!response.ok) throw new PowderTestError("TEST_STATUS_PROVIDER_UNAVAILABLE", 502);
  const data = await response.json() as { id?: unknown; to?: unknown; last_event?: unknown };
  if (data.id !== providerId || !Array.isArray(data.to) || data.to.length !== 1 ||
      typeof data.to[0] !== "string" || data.to[0].trim().toLowerCase() !== admin.email) {
    throw new PowderTestError("TEST_STATUS_RECIPIENT_MISMATCH", 502);
  }
  // Resend's retrieve-email API returns unprefixed last_event values (e.g.
  // "delivered"). Accept webhook-style "email.delivered" too, without relying
  // on the webhook or mistaking provider acceptance for delivery.
  const event = typeof data.last_event === "string" ? data.last_event : "unknown";
  const normalized = event.startsWith("email.") ? event.slice(6) : event;
  const status = normalized === "delivered" || normalized === "opened" || normalized === "clicked" ? "delivered"
    : normalized === "bounced" ? "bounced"
    : normalized === "complained" ? "complained"
    : normalized === "failed" || normalized === "canceled" ? "failed" : "pending";
  return { status, providerEvent: event };
}