import { Router, type IRouter, type Request, type Response } from "express";
import { and, gte, desc, isNotNull, isNull, count, sql } from "drizzle-orm";
import { db, alertSubscribersTable, newsletterSubscribersTable } from "@workspace/db";
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

    // Newsletter / premium-interest subscriber buckets
    const [nlTotalRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribersTable);
    const [nlVerifiedRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribersTable)
      .where(and(isNotNull(newsletterSubscribersTable.verifiedAt), isNull(newsletterSubscribersTable.unsubscribedAt)));
    const [nlPendingRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribersTable)
      .where(and(isNull(newsletterSubscribersTable.verifiedAt), isNull(newsletterSubscribersTable.unsubscribedAt)));
    const [nlUnsubRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribersTable)
      .where(isNotNull(newsletterSubscribersTable.unsubscribedAt));
    const [nlNew7dRow] = await db
      .select({ c: count() })
      .from(newsletterSubscribersTable)
      .where(gte(newsletterSubscribersTable.createdAt, since7d));

    // Where newsletter signups came from ('premium', 'footer', 'landing', …)
    const sources = await db
      .select({ source: newsletterSubscribersTable.source, c: count() })
      .from(newsletterSubscribersTable)
      .groupBy(newsletterSubscribersTable.source)
      .orderBy(desc(count()));

    // Daily signups for the trend strip · 30 UTC calendar days (today plus
    // the 29 before it). The SQL window starts at the UTC midnight of the
    // oldest day so every grouped row has a matching key in the JS day map.
    const since30d = new Date();
    since30d.setUTCHours(0, 0, 0, 0);
    since30d.setUTCDate(since30d.getUTCDate() - 29);
    const alertDayExpr = sql<string>`to_char(${alertSubscribersTable.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
    const alertDaily = await db
      .select({ day: alertDayExpr, c: count() })
      .from(alertSubscribersTable)
      .where(gte(alertSubscribersTable.createdAt, since30d))
      .groupBy(alertDayExpr);
    const nlDayExpr = sql<string>`to_char(${newsletterSubscribersTable.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
    const nlDaily = await db
      .select({ day: nlDayExpr, c: count() })
      .from(newsletterSubscribersTable)
      .where(gte(newsletterSubscribersTable.createdAt, since30d))
      .groupBy(nlDayExpr);

    const byDay = new Map<string, { alerts: number; newsletter: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      byDay.set(d.toISOString().slice(0, 10), { alerts: 0, newsletter: 0 });
    }
    for (const r of alertDaily) {
      const e = byDay.get(r.day);
      if (e) e.alerts = Number(r.c);
    }
    for (const r of nlDaily) {
      const e = byDay.get(r.day);
      if (e) e.newsletter = Number(r.c);
    }

    res.json({
      alerts: {
        total: alTotalRow?.c ?? 0,
        verified: alVerifiedRow?.c ?? 0,
        pending: alPendingRow?.c ?? 0,
        unsubscribed: alUnsubRow?.c ?? 0,
        new7d: alNew7dRow?.c ?? 0,
      },
      newsletter: {
        total: nlTotalRow?.c ?? 0,
        verified: nlVerifiedRow?.c ?? 0,
        pending: nlPendingRow?.c ?? 0,
        unsubscribed: nlUnsubRow?.c ?? 0,
        new7d: nlNew7dRow?.c ?? 0,
      },
      newsletterSources: sources.map((s) => ({
        source: s.source ?? "unknown",
        count: Number(s.c),
      })),
      daily: Array.from(byDay.entries()).map(([day, v]) => ({ day, ...v })),
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

    const newsletter = await db
      .select({
        id: newsletterSubscribersTable.id,
        email: newsletterSubscribersTable.email,
        regions: newsletterSubscribersTable.regions,
        source: newsletterSubscribersTable.source,
        verifiedAt: newsletterSubscribersTable.verifiedAt,
        createdAt: newsletterSubscribersTable.createdAt,
      })
      .from(newsletterSubscribersTable)
      .orderBy(desc(newsletterSubscribersTable.createdAt))
      .limit(20);

    res.json({ alerts, newsletter });
  } catch (err) {
    console.error("[admin/recent-signups] failed", err);
    res.status(500).json({ error: "RECENT_SIGNUPS_FAILED" });
  }
});

export default router;
