import { Router, type IRouter, type Request, type Response } from "express";
import { sql } from "drizzle-orm";
import { db, promoFunnelDailyTable } from "@workspace/db";

/**
 * Promo-funnel counter · POST /api/promo/event
 *
 * First-party "shown / clicked / dismissed" counts for the snow-alert
 * prompt banner, so the admin Stats tab can show real numbers instead of
 * deep-linking Google Analytics.
 *
 * Privacy design (deliberate — do not add identifiers here):
 *   - the request body is just { event }, nothing else is read or stored
 *   - no cookie, IP hash or profile token is recorded, so the ping is an
 *     anonymous aggregate tally and is NOT consent-gated client-side
 *   - the response is 204 fire-and-forget; the client never awaits it
 *
 * Abuse posture: worst case someone inflates a vanity counter. The global
 * apiLimiter in app.ts already caps per-IP request rates; that's enough.
 */
const router: IRouter = Router();

const EVENTS = new Set(["shown", "clicked", "dismissed"]);

router.post("/promo/event", async (req: Request, res: Response) => {
  const event = typeof req.body?.event === "string" ? req.body.event : "";
  if (!EVENTS.has(event)) {
    res.status(400).json({ error: "BAD_EVENT" });
    return;
  }
  try {
    const day = new Date().toISOString().slice(0, 10); // UTC calendar day
    await db
      .insert(promoFunnelDailyTable)
      .values({ day, event, count: 1 })
      .onConflictDoUpdate({
        target: [promoFunnelDailyTable.day, promoFunnelDailyTable.event],
        set: { count: sql`${promoFunnelDailyTable.count} + 1` },
      });
    res.status(204).end();
  } catch (err) {
    // Counter loss is acceptable; never surface a 500 for a vanity ping.
    console.error("[promo] failed to record funnel event", err);
    res.status(204).end();
  }
});

export default router;
