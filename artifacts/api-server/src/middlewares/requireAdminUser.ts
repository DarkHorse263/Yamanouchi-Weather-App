import { getAuth, clerkClient } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

/**
 * Admin gate · runs after clerkMiddleware.
 *
 * SECURITY: email is loaded from the Clerk API (server-side, immutable) — NOT
 * from session claims, which are user-editable custom data. This ensures that
 * an attacker cannot forge admin access by setting a custom `email` claim.
 *
 * Requires:
 *   1. a valid Clerk session (`getAuth(req).userId` is set), AND
 *   2. that the user's Clerk primary email is in the `ADMIN_EMAILS` env var.
 *
 * `ADMIN_EMAILS` is the source of truth. Comparison is lowercased + trimmed.
 * An empty or unset env var locks the entire admin surface (fail-closed).
 *
 * Returns 401 (not logged in) or 403 (logged in but not on the allowlist).
 */
function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireAdminUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const clerkUserId = auth.userId; // Clerk's immutable, server-verified ID

  if (!clerkUserId) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  try {
    // Load the user from the Clerk API so the email is server-authoritative
    // and cannot be forged by a session-claim manipulation.
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const email = (
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? ""
    ).toLowerCase().trim();

    const allow = getAdminEmails();
    if (!email || !allow.has(email)) {
      res.status(403).json({ error: "FORBIDDEN" });
      return;
    }

    res.locals.adminUser = { userId: clerkUserId, email };
    next();
  } catch (err) {
    console.error("[requireAdminUser] Clerk API error:", err);
    res.status(500).json({ error: "ADMIN_CHECK_FAILED" });
  }
}
