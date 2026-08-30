import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, gte, lte, desc, isNotNull, isNull, count, sql } from "drizzle-orm";
import { db, alertSubscribersTable, newsletterSubscribersTable, promoFunnelDailyTable, emailDeliveryIncidentsTable, pageViewDailyTable, visitorDailyTable, engagementEventDailyTable, usersTable, thredboLiftTransitionsTable } from "@workspace/db";
import { getAuth, clerkClient } from "@clerk/express";
import { requireAdminUser } from "../middlewares/requireAdminUser.js";
import { loadPromoFunnel } from "../lib/adminPromoFunnel.js";
import { resolveEmailDeliveryIncident } from "../lib/emailDeliveryIncidents.js";

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
// /me: load the signed-in user's identity from the Clerk API so the email
// is server-authoritative (not from user-editable session claims).
router.get("/me", async (req: Request, res: Response) => {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  try {
    const clerkUser = await clerkClient.users.getUser(clerkUserId!);
    const email = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;
    res.json({ user: { id: clerkUserId, email } });
  } catch (err) {
    console.error("[/admin/me] Clerk API error:", err);
    res.status(500).json({ error: "ADMIN_ME_FAILED" });
  }
});

router.get("/thredbo-lift-history", async (req: Request, res: Response) => {
  const liftId = typeof req.query.liftId === "string" ? req.query.liftId.trim() : "";
  const from = typeof req.query.from === "string" ? new Date(req.query.from) : null;
  const to = typeof req.query.to === "string" ? new Date(req.query.to) : null;
  const requestedLimit = Number(req.query.limit ?? 200);
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
    res.status(400).json({ error: "INVALID_DATE" });
    return;
  }
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(1_000, Math.max(1, Math.trunc(requestedLimit)))
    : 200;
  const filters = [
    liftId ? eq(thredboLiftTransitionsTable.liftId, liftId) : undefined,
    from ? gte(thredboLiftTransitionsTable.observedAt, from) : undefined,
    to ? lte(thredboLiftTransitionsTable.observedAt, to) : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));
  try {
    const transitions = await db
      .select()
      .from(thredboLiftTransitionsTable)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(thredboLiftTransitionsTable.observedAt))
      .limit(limit);
    res.json({ transitions, limit });
  } catch (error) {
    console.error("[admin/thredbo-lift-history] failed", error);
    res.status(500).json({ error: "LIFT_HISTORY_FAILED" });
  }
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
    const [alertSubscriptions30dRow] = await db
      .select({ c: count() })
      .from(alertSubscribersTable)
      .where(gte(alertSubscribersTable.verifiedAt, since30d));
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

    // Promo-funnel counters (first-party shown/clicked/dismissed tallies
    // recorded by POST /api/promo/event). Keep this query fail-soft: these
    // vanity counters must not take down the rest of the admin stats page.
    const promoFunnel = await loadPromoFunnel({
      async loadRowsSince(sinceDay) {
        return db
          .select({
            event: promoFunnelDailyTable.event,
            day: promoFunnelDailyTable.day,
            count: promoFunnelDailyTable.count,
          })
          .from(promoFunnelDailyTable)
          .where(gte(promoFunnelDailyTable.day, sinceDay));
      },
      logError(err) {
        console.error("[admin] failed to load promo funnel counters", err);
      },
    });

    res.json({
      promoFunnel,
      alertSubscriptions30d: alertSubscriptions30dRow?.c ?? 0,
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

// ── Engagement (visitors · page views · installs) ────────────────────────
// First-party cookieless counts recorded by POST /api/engagement/ping.
// These are the truthful totals for partner conversations: every visitor is
// counted (no consent gate), obvious bots are excluded at record time.
router.get("/engagement", async (_req: Request, res: Response) => {
  try {
    const dayStr = (offsetDays: number) =>
      new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const today = dayStr(0);
    const since7d = dayStr(6); // inclusive · today + previous 6
    const since30d = dayStr(29);

    // Unique visitors · rows in visitor_daily are already deduped per day.
    const [vToday] = await db
      .select({ c: count() })
      .from(visitorDailyTable)
      .where(eq(visitorDailyTable.day, today));
    const [v7] = await db
      .select({ c: sql<number>`count(distinct ${visitorDailyTable.hash})` })
      .from(visitorDailyTable)
      .where(gte(visitorDailyTable.day, since7d));
    const [v30] = await db
      .select({ c: sql<number>`count(distinct ${visitorDailyTable.hash})` })
      .from(visitorDailyTable)
      .where(gte(visitorDailyTable.day, since30d));

    // Returning · same (monthly-rotating) hash seen on 2+ distinct days in
    // the last 30. Approximate across month boundaries, honest enough.
    const retRes = await db.execute(
      sql`select count(*)::int as c from (select ${visitorDailyTable.hash} from ${visitorDailyTable} where ${visitorDailyTable.day} >= ${since30d} group by ${visitorDailyTable.hash} having count(distinct ${visitorDailyTable.day}) >= 2) t`,
    );
    const ret30 = { c: Number((retRes.rows?.[0] as { c?: number } | undefined)?.c ?? 0) };

    // Page views
    const [pv7] = await db
      .select({ c: sql<number>`coalesce(sum(${pageViewDailyTable.count}), 0)` })
      .from(pageViewDailyTable)
      .where(gte(pageViewDailyTable.day, since7d));
    const [pv30] = await db
      .select({ c: sql<number>`coalesce(sum(${pageViewDailyTable.count}), 0)` })
      .from(pageViewDailyTable)
      .where(gte(pageViewDailyTable.day, since30d));

    // Top sections last 30 days
    const topPages = await db
      .select({
        page: pageViewDailyTable.page,
        c: sql<number>`sum(${pageViewDailyTable.count})`,
      })
      .from(pageViewDailyTable)
      .where(gte(pageViewDailyTable.day, since30d))
      .groupBy(pageViewDailyTable.page)
      .orderBy(desc(sql`sum(${pageViewDailyTable.count})`))
      .limit(12);

    // Daily visitors for the 30-day trend strip
    const visitorDaily = await db
      .select({ day: visitorDailyTable.day, c: count() })
      .from(visitorDailyTable)
      .where(gte(visitorDailyTable.day, since30d))
      .groupBy(visitorDailyTable.day);
    const byDay = new Map<string, number>();
    for (let i = 29; i >= 0; i--) byDay.set(dayStr(i), 0);
    for (const r of visitorDaily) {
      if (byDay.has(r.day)) byDay.set(r.day, Number(r.c));
    }

    // PWA installs / launches
    const evRows = await db
      .select({
        event: engagementEventDailyTable.event,
        total: sql<number>`sum(${engagementEventDailyTable.count})`,
        last7d: sql<number>`sum(${engagementEventDailyTable.count}) filter (where ${engagementEventDailyTable.day} >= ${since7d})`,
      })
      .from(engagementEventDailyTable)
      .groupBy(engagementEventDailyTable.event);
    const events: Record<string, { total: number; last7d: number }> = {};
    for (const r of evRows) {
      events[r.event] = { total: Number(r.total ?? 0), last7d: Number(r.last7d ?? 0) };
    }

    res.json({
      visitors: {
        today: Number(vToday?.c ?? 0),
        last7d: Number(v7?.c ?? 0),
        last30d: Number(v30?.c ?? 0),
        returning30d: Number(ret30?.c ?? 0),
      },
      pageViews: { last7d: Number(pv7?.c ?? 0), last30d: Number(pv30?.c ?? 0) },
      topPages: topPages.map((p) => ({ page: p.page, count: Number(p.c) })),
      dailyVisitors: Array.from(byDay.entries()).map(([day, visitors]) => ({ day, visitors })),
      events,
    });
  } catch (err) {
    console.error("[admin/engagement] failed", err);
    res.status(500).json({ error: "ENGAGEMENT_FAILED" });
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

    // Member accounts (the magic-link sign-up funnel). Separate from the
    // alert/newsletter subscriber lists on purpose · "joined feelzlike" and
    // "subscribed to alert emails" are different events, and the dash used to
    // show only the latter, which read as signups silently going missing.
    const members = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        displayName: usersTable.displayName,
        homeRegionId: usersTable.homeRegionId,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(20);

    res.json({ alerts, newsletter, members });
  } catch (err) {
    console.error("[admin/recent-signups] failed", err);
    res.status(500).json({ error: "RECENT_SIGNUPS_FAILED" });
  }
});

// ── Email deliverability incidents ────────────────────────────────────────
// GET /api/admin/email-incidents · the latest 50 bounces/complaints recorded
// by POST /api/webhooks/resend. Surfaces async Resend failures (accept-then-
// bounce) for mail sent directly by this API. Clerk owns authentication email,
// its bounce log, and its independent suppression list.
router.get("/email-incidents", async (_req: Request, res: Response) => {
  try {
    const incidents = await db
      .select({
        id: emailDeliveryIncidentsTable.id,
        email: emailDeliveryIncidentsTable.email,
        type: emailDeliveryIncidentsTable.type,
        reason: emailDeliveryIncidentsTable.reason,
        resolvedAt: emailDeliveryIncidentsTable.resolvedAt,
        resolvedByEmail: emailDeliveryIncidentsTable.resolvedByEmail,
        createdAt: emailDeliveryIncidentsTable.createdAt,
      })
      .from(emailDeliveryIncidentsTable)
      .orderBy(desc(emailDeliveryIncidentsTable.createdAt), desc(emailDeliveryIncidentsTable.id))
      .limit(50);
    res.json({ incidents });
  } catch (err) {
    console.error("[admin/email-incidents] failed", err);
    res.status(500).json({ error: "EMAIL_INCIDENTS_FAILED" });
  }
});

// PATCH /api/admin/email-incidents/:id/resolve · remove the send block while
// retaining the original incident and a server-authoritative admin audit trail.
// Only the latest incident for an address can be resolved; a newer provider
// event must remain authoritative. Complaints require an explicit extra flag.
router.patch("/email-incidents/:id/resolve", async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = typeof rawId === "string" ? rawId.trim() : "";
    if (!id) {
      res.status(400).json({ error: "INVALID_ID" });
      return;
    }

    const [target] = await db
      .select({
        id: emailDeliveryIncidentsTable.id,
        email: emailDeliveryIncidentsTable.email,
      })
      .from(emailDeliveryIncidentsTable)
      .where(eq(emailDeliveryIncidentsTable.id, id))
      .limit(1);

    if (!target) {
      res.status(404).json({ error: "EMAIL_INCIDENT_NOT_FOUND" });
      return;
    }

    const admin = res.locals.adminUser as { userId?: string; email?: string } | undefined;
    if (!admin?.userId || !admin.email) {
      res.status(500).json({ error: "ADMIN_IDENTITY_MISSING" });
      return;
    }

    const outcome = await resolveEmailDeliveryIncident({
      id,
      email: target.email,
      adminUserId: admin.userId,
      adminEmail: admin.email,
      confirmComplaint: req.body?.confirmComplaint === true,
    });

    if (outcome.kind === "not_found") {
      res.status(404).json({ error: "EMAIL_INCIDENT_NOT_FOUND" });
      return;
    }
    if (outcome.kind === "already_resolved") {
      res.status(409).json({ error: "EMAIL_INCIDENT_ALREADY_RESOLVED" });
      return;
    }
    if (outcome.kind === "confirmation_required") {
      res.status(400).json({ error: "COMPLAINT_CONFIRMATION_REQUIRED" });
      return;
    }
    if (outcome.kind === "newer_exists") {
      res.status(409).json({ error: "NEWER_EMAIL_INCIDENT_EXISTS" });
      return;
    }

    console.info("[admin/email-incidents] resolved", {
      incidentId: id,
      incidentType: outcome.incidentType,
      resolvedByUserId: admin.userId,
    });
    res.json({ incident: outcome.incident });
  } catch (err) {
    console.error("[admin/email-incidents] resolve failed", err);
    res.status(500).json({ error: "EMAIL_INCIDENT_RESOLVE_FAILED" });
  }
});

// ── Clear a pending (unverified) signup ───────────────────────────────────
// DELETE /api/admin/signups/:list/:id · list is 'alerts' or 'newsletter'.
// Deliberately restricted to rows that never verified: verified subscribers
// must go through the normal unsubscribe flow so the audit trail is honest.
router.delete("/signups/:list/:id", async (req: Request, res: Response) => {
  try {
    const list = req.params.list;
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      res.status(400).json({ error: "INVALID_ID" });
      return;
    }
    if (list !== "alerts" && list !== "newsletter") {
      res.status(400).json({ error: "UNKNOWN_LIST" });
      return;
    }
    // Branch per table · drizzle can't type a union of table objects.
    const deleted =
      list === "alerts"
        ? await db
            .delete(alertSubscribersTable)
            .where(
              and(
                eq(alertSubscribersTable.id, id),
                isNull(alertSubscribersTable.verifiedAt),
                isNull(alertSubscribersTable.unsubscribedAt),
              ),
            )
            .returning({ id: alertSubscribersTable.id })
        : await db
            .delete(newsletterSubscribersTable)
            .where(
              and(
                eq(newsletterSubscribersTable.id, id),
                isNull(newsletterSubscribersTable.verifiedAt),
                isNull(newsletterSubscribersTable.unsubscribedAt),
              ),
            )
            .returning({ id: newsletterSubscribersTable.id });
    if (deleted.length === 0) {
      res.status(404).json({ error: "NOT_FOUND_OR_NOT_PENDING" });
      return;
    }
    res.json({ deleted: deleted[0].id });
  } catch (err) {
    console.error("[admin/signups delete] failed", err);
    res.status(500).json({ error: "DELETE_FAILED" });
  }
});

export default router;
