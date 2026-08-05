import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

/**
 * Stateless HMAC-signed magic-link tokens for the passwordless email
 * sign-in flow (soft member gate). Mirrors the alertTokens format so the
 * same operational posture applies:
 *
 * Format: `<base64url(payload)>.<base64url(hmacSha256(payload))>`
 * Payload: `{ email, rt: returnToPath, exp: epochSeconds }`
 *
 * Tokens are single-purpose (sign-in only) and short-lived (30 minutes) ·
 * clicking one proves control of the inbox, which is the entire identity
 * check for an email-based account.
 */

const SECRET = (() => {
  const s = process.env.ALERT_TOKEN_SECRET;
  if (s && s.length >= 16) return s;
  const fallback = randomBytes(32).toString("base64url");
  if (process.env.REPLIT_DEPLOYMENT || process.env.NODE_ENV === "production") {
    // Fail closed: an ephemeral per-process secret means sign-in links die on
    // every restart and never work across autoscale instances · that is a
    // silently broken sign-up funnel, not a degraded one. Refuse to boot.
    throw new Error(
      "[authEmailTokens] ALERT_TOKEN_SECRET is missing or <16 chars in production. " +
        "Set it in the deployment secrets · refusing to start with an ephemeral secret.",
    );
  } else {
    console.warn(
      "[authEmailTokens] ALERT_TOKEN_SECRET not set · using ephemeral dev secret. Sign-in links will not survive a server restart.",
    );
  }
  return fallback;
})();

const TTL_SECONDS = 30 * 60;

interface AuthEmailPayload {
  email: string;
  rt: string;
  exp: number;
  kind: "auth_email";
}

function sign(payloadB64: string): string {
  return createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

export function issueAuthEmailToken(email: string, returnTo: string): string {
  const payload: AuthEmailPayload = {
    email,
    rt: returnTo,
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
    kind: "auth_email",
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

export type VerifyAuthEmailResult =
  | { ok: true; email: string; returnTo: string }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyAuthEmailToken(token: string): VerifyAuthEmailResult {
  if (typeof token !== "string" || token.length > 2048) return { ok: false, reason: "malformed" };
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: "malformed" };
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };
  let payload: AuthEmailPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (payload?.kind !== "auth_email" || typeof payload.email !== "string") {
    return { ok: false, reason: "malformed" };
  }
  if (!Number.isFinite(payload.exp) || payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "expired" };
  }
  const returnTo = typeof payload.rt === "string" && payload.rt.startsWith("/") && !payload.rt.startsWith("//")
    ? payload.rt
    : "/";
  return { ok: true, email: payload.email, returnTo };
}
