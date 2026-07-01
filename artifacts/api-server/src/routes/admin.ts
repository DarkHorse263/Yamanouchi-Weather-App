import { Router, type IRouter, type Request, type Response } from "express";
import { and, gte, desc, isNotNull, isNull, count } from "drizzle-orm";
import { db, alertSubscribersTable } from "@workspace/db";
import { requireAdminUser } from "../middlewares/requireAdminUser.js";

/**
 * Admin router · mounted at /api/admin/*. Every route here goes through
 * `requireAdminUser` which checks for both an authenticated session AND that
 * the user's email is on the `ADMIN_EMAILS` allowlist. Returns 401 (logged
 * out) vs 403 (logged in but not admin).
 */
const router: IRouter = Router();

/**
 * Origin-pinning guard for the entire admin surface · protects BOTH:
 *   1. CSRF on cookie-authenticated mutations (POST/PUT/DELETE), and
 *   2. Confidentiality of read endpoints (GET /me, /stats, etc.) which
 *      would otherwise be readable cross-origin from any allowed Replit
 *      subdomain because credentialed CORS reflects those origins.
 *
 * We require Origin (or Referer for browsers that strip Origin on GET) to
 * match the request host. Same-origin fetches always satisfy this; any
 * cross-origin browser fetch with credentials is rejected. Server-to-server
 * traffic (no Origin/Referer) is also rejected · admin endpoints have no
 * legitimate non-browser caller.
 *
 * OPTIONS preflights are exempt so CORS negotiation can complete; the actual
 * follow-up request still has to pass this guard.
 */
router.use((req: Request, res: Response, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  // Modern browsers always send Sec-Fetch-Site on fetch/navigation. If it
  // says `same-origin` we know the request originated from the same site
  // even when Origin and Referer are absent (e.g. same-origin GETs under
  // some Referrer-Policy modes). `none` means user-typed URL/bookmark, so
  // for an XHR endpoint we still require an Origin/Referer signal there.
  const sfs = req.headers["sec-fetch-site"];
  if (sfs === "same-origin") {
    return next();
  }
  if (sfs && sfs !== "same-origin") {
    res.status(403).json({ error: "CROSS_SITE_BLOCKED" });
    return;
  }
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) {
    res.status(403).json({ error: "ORIGIN_REQUIRED" });
    return;
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    res.status(403).json({ error: "INVALID_ORIGIN" });
    return;
  }
  const reqHost = req.get("host") ?? "";
  if (originHost !== reqHost) {
    res.status(403).json({ error: "ORIGIN_MISMATCH" });
    return;
  }
  next();
});

// Auth + admin allowlist runs AFTER the origin guard so cross-site requests
// are rejected before the session cookie is even consulted (no auth oracle
// for cross-site probes).
router.use(requireAdminUser);

// ── Identity probe ────────────────────────────────────────────────────────
// Cheap GET so the admin SPA can detect "is the current user actually on the
// allowlist?" without doing a full /stats fetch. Returns the same 401 / 403
// surface as every other admin route, so the frontend gate is uniform.
router.get("/me", (req: Request, res: Response) => {
  const user = req.user!; // requireAdminUser already vouched
  res.json({ user });
});

// ── Stats tab ─────────────────────────────────────────────────────────────

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Powder-alert subscriber buckets
    const [alTotalRow] = await db
      .select({ c: count() })
      .from(alertSubscribersTable);
    const [alVerifiedRow] = await db
      .select({ c: count() })
      .from(alertSubscribersTable)
      .where(and(isNotNull(alertSubscribersTable.verifiedAt), isNull(alertSubscribersTable.unsubscribedAt)));
    const [alPendingRow] = await db
      .select({ c: count() })
      .from(alertSubscribersTable)
      .where(and(isNull(alertSubscribersTable.verifiedAt), isNull(alertSubscribersTable.unsubscribedAt)));
    const [alUnsubRow] = await db
      .select({ c: count() })
      .from(alertSubscribersTable)
      .where(isNotNull(alertSubscribersTable.unsubscribedAt));
    const [alNew7dRow] = await db
      .select({ c: count() })
      .from(alertSubscribersTable)
      .where(gte(alertSubscribersTable.createdAt, since7d));

    res.json({
      alerts: {
        total: alTotalRow?.c ?? 0,
        verified: alVerifiedRow?.c ?? 0,
        pending: alPendingRow?.c ?? 0,
        unsubscribed: alUnsubRow?.c ?? 0,
        new7d: alNew7dRow?.c ?? 0,
      },
    });
  } catch (err) {
    console.error("[admin/stats] failed", err);
    res.status(500).json({ error: "STATS_FAILED" });
  }
});

router.get("/recent-signups", async (_req: Request, res: Response) => {
  try {
    const alerts = await db
      .select({
        id: alertSubscribersTable.id,
        email: alertSubscribersTable.email,
        regions: alertSubscribersTable.regions,
        verifiedAt: alertSubscribersTable.verifiedAt,
        createdAt: alertSubscribersTable.createdAt,
      })
      .from(alertSubscribersTable)
      .orderBy(desc(alertSubscribersTable.createdAt))
      .limit(20);

    res.json({ alerts });
  } catch (err) {
    console.error("[admin/recent-signups] failed", err);
    res.status(500).json({ error: "RECENT_SIGNUPS_FAILED" });
  }
});

export default router;
