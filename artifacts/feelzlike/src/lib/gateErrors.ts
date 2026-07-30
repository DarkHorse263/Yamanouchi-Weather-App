/**
 * Classification of errors coming back from `requireEntitlement(...)`-gated
 * API routes (the soft member gate).
 *
 * The server returns:
 *   - 401 { error: "AUTH_REQUIRED" }    · anonymous visitor → the client must
 *     show the FREE SIGN-UP prompt (never a paywall).
 *   - 402 { error: "PAYMENT_REQUIRED" } · signed-in without an entitlement
 *     (i.e. after the launch promo ends) → the client must show the
 *     "promo has ended" upgrade copy, NOT the sign-up prompt.
 *
 * `classifyGateError` encodes the precedence: auth wins over payment, so a
 * signed-out user is always invited to sign up first. Shared by
 * AlertSubscribeForm and PremiumSubscribe so the two surfaces can't drift.
 */

interface GateErrorShape {
  status?: number;
  response?: { status?: number; data?: { error?: string; message?: string } };
  data?: { error?: string; message?: string };
  message?: string;
}

export function isAuthRequired(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const anyErr = err as GateErrorShape;
  if (anyErr.response?.status === 401 || anyErr.status === 401) return true;
  return (
    anyErr.response?.data?.error === "AUTH_REQUIRED" ||
    anyErr.data?.error === "AUTH_REQUIRED"
  );
}

export function isPaymentRequired(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const anyErr = err as GateErrorShape;
  if (anyErr.response?.status === 402 || anyErr.status === 402) return true;
  return (
    anyErr.response?.data?.error === "PAYMENT_REQUIRED" ||
    anyErr.data?.error === "PAYMENT_REQUIRED"
  );
}

export type GateErrorKind = "auth" | "payment" | "other" | null;

/** Single decision point for which gate UI to render. Auth wins over payment. */
export function classifyGateError(err: unknown): GateErrorKind {
  if (err === null || err === undefined) return null;
  if (isAuthRequired(err)) return "auth";
  if (isPaymentRequired(err)) return "payment";
  return "other";
}

export function extractErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const anyErr = err as GateErrorShape;
    return anyErr.response?.data?.message
      ?? anyErr.data?.message
      ?? anyErr.message
      ?? "Something went wrong. Try again.";
  }
  return "Something went wrong. Try again.";
}
