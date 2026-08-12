/**
 * Server-side launch-promo window.
 *
 * Mirrors the client promo logic in `lib/feelzlike-shell/src/usePremium.ts`
 * (default 1 June 2026 -> end of 31 December 2026, AU local time). During the
 * promo every premium feature is free for everyone, so the entitlement
 * resolver grants a synthetic "pro" subscription while the window is open and
 * falls back to the real subscription lookup (currently none -> free) after it
 * closes. Keeping the two windows aligned means the client badge ("free until
 * ...") and the server paywall flip on the same day.
 *
 * Overridable via PREMIUM_PROMO_STARTS_AT / PREMIUM_PROMO_ENDS_AT (note: NOT
 * the VITE_ prefixed client vars, which are build-time only). Set either to an
 * explicit empty string to disable that boundary.
 */
import { DEFAULT_PROMO_STARTS_AT, DEFAULT_PROMO_ENDS_AT } from "@workspace/promo-constants";

/**
 * Parse a promo boundary date.
 * - `kind="start"` -> date-only resolves to LOCAL midnight.
 * - `kind="end"`   -> date-only resolves to LOCAL end-of-day.
 *
 * Date-only "YYYY-MM-DD" is otherwise parsed by `new Date()` as UTC midnight,
 * which silently flips the boundary hours early for users east of UTC. Full ISO
 * timestamps (with explicit time + offset) are parsed as-is.
 */
function parsePromoBoundary(raw: string, kind: "start" | "end"): Date | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  if (dateOnly) {
    const [y, m, day] = trimmed.split("-").map(Number);
    return kind === "end"
      ? new Date(y!, m! - 1, day!, 23, 59, 59, 999)
      : new Date(y!, m! - 1, day!, 0, 0, 0, 0);
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function readBoundary(envKey: string, defaultVal: string, kind: "start" | "end"): Date | null {
  const envVal = process.env[envKey];
  const raw = envVal === undefined ? defaultVal : envVal;
  return parsePromoBoundary(raw, kind);
}

const PROMO_STARTS_AT = readBoundary("PREMIUM_PROMO_STARTS_AT", DEFAULT_PROMO_STARTS_AT, "start");
const PROMO_ENDS_AT = readBoundary("PREMIUM_PROMO_ENDS_AT", DEFAULT_PROMO_ENDS_AT, "end");

/**
 * Startup divergence guard: the client badge reads the BUILD-TIME
 * VITE_PREMIUM_PROMO_* vars while the paywall reads the runtime
 * PREMIUM_PROMO_* vars above. Both default to the shared
 * `@workspace/promo-constants` values, so they only diverge when someone
 * overrides one side and not the other — in which case the "free until ..."
 * badge and the real paywall flip on DIFFERENT days. The client build runs in
 * the same environment as this server, so compare the raw env pairs here and
 * warn loudly at startup. Warning only (never throw): a mismatch must not
 * take the API down.
 */
function warnIfPromoWindowsDiverge(): void {
  const pairs: Array<[string, string]> = [
    ["PREMIUM_PROMO_STARTS_AT", "VITE_PREMIUM_PROMO_STARTS_AT"],
    ["PREMIUM_PROMO_ENDS_AT", "VITE_PREMIUM_PROMO_ENDS_AT"],
  ];
  // Both readers are tri-state: unset -> shared default, explicit empty
  // string -> boundary DISABLED, anything else -> that value. Compare the
  // EFFECTIVE state, so "unset vs empty" (default vs disabled · a real
  // divergence) warns too.
  const effective = (raw: string | undefined, defaultVal: string): string =>
    raw === undefined ? defaultVal : raw.trim() === "" ? "<disabled>" : raw.trim();
  const defaults: Record<string, string> = {
    PREMIUM_PROMO_STARTS_AT: DEFAULT_PROMO_STARTS_AT,
    PREMIUM_PROMO_ENDS_AT: DEFAULT_PROMO_ENDS_AT,
  };
  for (const [serverKey, clientKey] of pairs) {
    const server = effective(process.env[serverKey], defaults[serverKey]!);
    const client = effective(process.env[clientKey], defaults[serverKey]!);
    if (server !== client) {
      console.warn(
        `[promo] WINDOW MISMATCH: ${serverKey}=${JSON.stringify(server)} but ` +
          `${clientKey}=${JSON.stringify(client)} · the "free until ..." badge and the ` +
          `server paywall will flip on different days. Set BOTH (or NEITHER) to the same value.`,
      );
    }
  }
}
warnIfPromoWindowsDiverge();

/**
 * Whether the launch promo is active at `now`. Returns false when the end
 * boundary is disabled (empty string), before the start boundary, or after the
 * end boundary.
 */
export function isPromoActive(now: Date = new Date()): boolean {
  if (!PROMO_ENDS_AT) return false;
  if (PROMO_STARTS_AT && now.getTime() < PROMO_STARTS_AT.getTime()) return false;
  return now.getTime() <= PROMO_ENDS_AT.getTime();
}

export { PROMO_STARTS_AT, PROMO_ENDS_AT };

/**
 * Soft-member-gate subscription resolver logic (plugged into
 * `setSubscriptionResolver` in app.ts). During the launch promo every
 * signed-in member gets a synthetic "pro" subscription; anonymous visitors
 * and everyone after the promo closes resolve to null (free tier), which
 * makes `requireEntitlement(...)` return 401 AUTH_REQUIRED (anonymous) or
 * 402 PAYMENT_REQUIRED (signed-in without a sub). Extracted as a pure
 * function so the promo-boundary behaviour is unit-testable with a fixed
 * `now`.
 */
export function resolvePromoSubscription(
  isAuthenticated: boolean,
  now: Date = new Date(),
): { tier: "pro"; status: "active" } | null {
  if (isPromoActive(now) && isAuthenticated) {
    return { tier: "pro", status: "active" };
  }
  return null;
}
