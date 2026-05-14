import type { Request, Response, NextFunction } from "express";

/**
 * Admin gate · runs AFTER authMiddleware. Requires:
 *   1. an authenticated session (req.user from Replit Auth), AND
 *   2. that the user's email is in the comma-separated `ADMIN_EMAILS` env var.
 *
 * `ADMIN_EMAILS` is the source of truth for who can access /admin and the
 * /api/admin/* surface. Comparison is lowercased and trimmed; an empty or
 * unset env var locks the entire admin surface (fail-closed).
 *
 * Returns 401 (not logged in) vs 403 (logged in but not on the allowlist)
 * so the frontend can decide whether to redirect to /api/login or show
 * a "not authorised" message.
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

export function requireAdminUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  const email = (req.user.email ?? "").toLowerCase().trim();
  const allow = getAdminEmails();
  if (!email || !allow.has(email)) {
    res.status(403).json({ error: "FORBIDDEN" });
    return;
  }

  next();
}
