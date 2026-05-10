import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

/**
 * Bearer-token gate for admin / write endpoints that have no user-auth model
 * (e.g. content seeding for accommodation / dining / attractions).
 *
 * Reuses `ALERT_TOKEN_SECRET` so we don't have to provision yet another
 * shared secret. Same constraints as the cron endpoint:
 *   - secret must be at least 16 chars
 *   - comparison is timing-safe
 *   - missing / wrong token → 401 with no detail
 *
 * Read endpoints in the same router stay public (they're cacheable content).
 * Apply this middleware only to mutating verbs.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function requireAdminToken(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.ALERT_TOKEN_SECRET ?? "";
  const auth = req.header("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!expected || expected.length < 16 || !safeEqual(provided, expected)) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  next();
}
