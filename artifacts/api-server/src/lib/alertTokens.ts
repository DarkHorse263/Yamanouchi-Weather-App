import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

/**
 * Stateless HMAC-signed tokens for the no-auth alert subscription flow.
 *
 * Format: `<base64url(payload)>.<base64url(hmacSha256(payload))>`
 *
 * Payload shape: `{ sub: subscriberId, kind: 'verify'|'manage'|'unsub', exp: epochSeconds }`
 *
 * - `verify` tokens expire in 7 days (gives a slow user a week to click the link)
 * - `manage` tokens expire in 90 days (every alert email re-mints a fresh one)
 * - `unsub` tokens never expire (one-click unsubscribe must always work)
 */

const SECRET = (() => {
  const s = process.env.ALERT_TOKEN_SECRET;
  if (s && s.length >= 16) return s;
  // Per-process random fallback. Used to throw in production to force the
  // operator to set a stable secret · but that hard-fails the entire app
  // boot (including the unrelated weather features) just because the alerts
  // subsystem isn't fully configured. We now warn loudly instead, so the
  // server still serves traffic while alert tokens issued by one instance
  // won't validate on another or after a restart. Set ALERT_TOKEN_SECRET
  // (>=16 chars, e.g. `openssl rand -base64 48`) before relying on alerts.
  const fallback = randomBytes(32).toString("base64url");
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[alertTokens] ALERT_TOKEN_SECRET is missing or <16 chars in production · using ephemeral random secret. " +
        "Alert/manage/unsubscribe links will NOT survive a restart and will NOT work across multiple instances. " +
        "Set ALERT_TOKEN_SECRET (e.g. `openssl rand -base64 48`) in your deployment secrets to enable durable tokens.",
    );
  } else {
    console.warn(
      "[alertTokens] ALERT_TOKEN_SECRET not set · using ephemeral dev secret. Tokens will not survive a server restart.",
    );
  }
  return fallback;
})();

export type TokenKind =
  | "verify"
  | "manage"
  | "unsub"
  // Newsletter (general digest) subscribers — separate kinds so an alert
  // token can never be misused to manage a newsletter subscription, and
  // vice-versa. Same HMAC secret + signing infra.
  | "nl_verify"
  | "nl_unsub";

interface TokenPayload {
  sub: string;
  kind: TokenKind;
  exp: number; // epoch seconds; 0 = never expires
  iat: number; // epoch seconds; lets us invalidate all tokens issued before a cutoff
}

const KIND_TTL: Record<TokenKind, number> = {
  verify: 7 * 24 * 60 * 60,
  manage: 90 * 24 * 60 * 60,
  unsub: 0,
  nl_verify: 7 * 24 * 60 * 60,
  nl_unsub: 0,
};

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

export function issueToken(subscriberId: string, kind: TokenKind): string {
  const ttl = KIND_TTL[kind];
  const now = Math.floor(Date.now() / 1000);
  const exp = ttl === 0 ? 0 : now + ttl;
  const payload: TokenPayload = { sub: subscriberId, kind, exp, iat: now };
  const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload)));
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export type TokenVerifyResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "wrong_kind" };

export function verifyToken(token: string, expectedKind?: TokenKind): TokenVerifyResult {
  if (typeof token !== "string" || token.length === 0) return { ok: false, reason: "malformed" };
  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1) return { ok: false, reason: "malformed" };

  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  const expected = sign(payloadB64);
  const expectedBuf = b64urlDecode(expected);
  const sigBuf = b64urlDecode(sigB64);
  if (sigBuf.length !== expectedBuf.length) return { ok: false, reason: "bad_signature" };
  if (!timingSafeEqual(sigBuf, expectedBuf)) return { ok: false, reason: "bad_signature" };

  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof payload.sub !== "string" || typeof payload.kind !== "string" || typeof payload.exp !== "number") {
    return { ok: false, reason: "malformed" };
  }
  // Tokens issued before this change won't have `iat`; treat missing as 0 so
  // an `invalidatedAt` set after this change still invalidates them.
  if (typeof payload.iat !== "number") payload.iat = 0;
  if (expectedKind && payload.kind !== expectedKind) return { ok: false, reason: "wrong_kind" };
  if (payload.exp !== 0 && payload.exp * 1000 < Date.now()) return { ok: false, reason: "expired" };

  return { ok: true, payload };
}

/**
 * Returns true if a token's issued-at timestamp is at or after the given
 * cutoff. Use to reject tokens that were issued before the subscriber
 * performed a destructive action (e.g. unsubscribe).
 */
export function isTokenStillValid(payload: { iat: number }, invalidatedAt: Date | null): boolean {
  if (!invalidatedAt) return true;
  // `iat` is in epoch seconds; floor the cutoff to seconds for comparison.
  const cutoffSec = Math.floor(invalidatedAt.getTime() / 1000);
  return payload.iat >= cutoffSec;
}
