import { Router, type IRouter, type Request, type Response } from "express";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { REGION_IDS } from "./regions.js";
import {
  db,
  pageViewDailyTable,
  visitorDailyTable,
  engagementEventDailyTable,
} from "@workspace/db";

/**
 * Engagement ping · POST /api/engagement/ping
 *
 * First-party, cookieless visitor + page-view counting so the owner's admin
 * dashboard shows TRUTHFUL totals (GA only counts consented visitors).
 *
 * Privacy design (deliberate — see lib/db schema/engagement.ts):
 *   - body carries only { kind, page? }; no id, token or URL is stored
 *   - the visitor "identity" is sha256(month | ip | user-agent | secret),
 *     computed here, never stored raw, never returned - a one-way monthly
 *     rotating hash usable only to say "same device this month", so this
 *     stays a consent-free anonymous aggregate tally
 *   - obvious bots/crawlers are skipped so partner numbers stay honest
 *
 * Abuse posture: same as promo.ts - worst case someone inflates counters;
 * the global apiLimiter caps per-IP rates.
 */
const router: IRouter = Router();

const ALERT_KINDS = new Set([
  "alert_banner_shown",
  "alert_banner_clicked",
  "alert_banner_dismissed",
  "alert_form_viewed",
  "alert_submit_attempted",
  "alert_validation_failed",
  "alert_api_failed",
  "alert_verification_pending",
  "alert_already_verified",
  "alert_verification_email_sent",
]);
const KINDS = new Set([
  "view",
  "pwa_install",
  "pwa_launch",
  "partner_shown",
  "partner_clicked",
  ...ALERT_KINDS,
]);
const ALERT_SURFACES = new Set(["banner", "alert_form", "premium_subscribe", "verification"]);

// FINITE partner-label whitelist for partner_shown / partner_clicked events.
// Mirrors the affiliate providers rendered by the client (StayCard PROVIDERS
// + Europcar car hire). Anything else collapses into "other" so
// engagement_event_daily cardinality can't explode from garbage bodies.
const PARTNERS = new Set([
  "booking_com", "agoda", "expedia", "hotels_com", "trip_com", "airbnb",
  "jalan", "rakuten", "tripadvisor", "official", "europcar", "gowithguide",
]);

// FINITE page-label whitelist · known top-level sections + live region ids.
// Anything else collapses into "other" so page_view_daily cardinality can't
// explode from garbage/abusive bodies (worst case rows/day = this set + 1).
const STATIC_PAGES = new Set([
  "home", "countries", "near-you", "plan", "premium", "account",
  "alerts", "legal", "au", "jp", "nz", "ca",
]);

const BOT_RE =
  /bot|crawl|spider|slurp|headless|lighthouse|pingdom|monitor|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python-requests|axios|node-fetch/i;

function visitorHash(req: Request): string | null {
  const ua = req.headers["user-agent"] ?? "";
  if (!ua || BOT_RE.test(String(ua))) return null;
  // No secret → no visitor hashing at all (fail closed rather than salt
  // with a public fallback string, which would weaken the privacy design).
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error("[engagement] SESSION_SECRET missing · visitor counting disabled");
    return null;
  }
  // Behind the Replit proxy req.ip is already the client IP (trust proxy is
  // set in app.ts). Month-scoped salt → hash is useless across months.
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  return createHash("sha256").update(`${month}|${req.ip}|${ua}|${secret}`).digest("hex");
}

router.post("/engagement/ping", async (req: Request, res: Response) => {
  const kind = typeof req.body?.kind === "string" ? req.body.kind : "";
  if (!KINDS.has(kind)) {
    res.status(400).json({ error: "BAD_KIND" });
    return;
  }
  // Fire-and-forget · reply immediately, never block the client.
  res.status(204).end();

  try {
    const day = new Date().toISOString().slice(0, 10);
    const hash = visitorHash(req);
    if (!hash) return; // bot or missing UA · don't count anything

    if (kind === "view") {
      const rawPage = typeof req.body?.page === "string" ? req.body.page.toLowerCase() : "";
      const page = STATIC_PAGES.has(rawPage) || REGION_IDS.has(rawPage) ? rawPage : "other";
      await Promise.all([
        db
          .insert(pageViewDailyTable)
          .values({ day, page, count: 1 })
          .onConflictDoUpdate({
            target: [pageViewDailyTable.day, pageViewDailyTable.page],
            set: { count: sql`${pageViewDailyTable.count} + 1` },
          }),
        db
          .insert(visitorDailyTable)
          .values({ day, hash })
          .onConflictDoNothing(),
      ]);
    } else {
      let event = kind;
      if (kind === "partner_shown" || kind === "partner_clicked") {
        const rawPartner =
          typeof req.body?.partner === "string" ? req.body.partner.toLowerCase() : "";
        const partner = PARTNERS.has(rawPartner) ? rawPartner : "other";
        event = `${kind}:${partner}`;
      } else if (ALERT_KINDS.has(kind)) {
        const rawSurface =
          typeof req.body?.surface === "string" ? req.body.surface.toLowerCase() : "";
        const surface = ALERT_SURFACES.has(rawSurface) ? rawSurface : "other";
        event = `${kind}:${surface}`;
      }
      await db
        .insert(engagementEventDailyTable)
        .values({ day, event, count: 1 })
        .onConflictDoUpdate({
          target: [engagementEventDailyTable.day, engagementEventDailyTable.event],
          set: { count: sql`${engagementEventDailyTable.count} + 1` },
        });
    }
  } catch (err) {
    // Counter loss is acceptable; the 204 already went out.
    console.error("[engagement] failed to record ping", err);
  }
});

export default router;
