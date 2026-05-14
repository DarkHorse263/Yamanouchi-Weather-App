import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "node:crypto";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db, newsClicksTable } from "@workspace/db";

/**
 * Public POST /news/click endpoint · invoked from NewsCard onClick (sendBeacon).
 *
 * Append-only, fire-and-forget. We don't store IPs · only a short hash for
 * crude dedup. Failures are swallowed so a bad write never blocks a user
 * navigating to the linked article.
 *
 * Rate limiting is inherited from the global apiLimiter mount.
 */
const router: IRouter = Router();

const ClickBody = z.object({
  newsId: z.string().min(1).max(120),
  regionId: z.string().min(1).max(80).optional().nullable(),
  category: z.string().min(1).max(40).optional().nullable(),
  sponsored: z.boolean().optional().default(false),
  source: z.string().min(1).max(120).optional().nullable(),
  referrerHost: z.string().max(255).optional().nullable(),
});

function hashIp(req: Request): string | null {
  // Take the first IP from x-forwarded-for if present, else req.ip.
  const xff = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  const raw = xff || req.ip || "";
  if (!raw) return null;
  // Production refuses to hash with a static dev salt (which would let anyone
  // reverse the IP). Without a real secret we still record the click for
  // analytics but with `ipHashShort = null` · we lose dedup but never leak.
  const secret = process.env.ALERT_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") return null;
    return crypto.createHash("sha256").update(`${raw}:feelzlike-dev-salt`).digest("hex").slice(0, 16);
  }
  return crypto.createHash("sha256").update(`${raw}:${secret}`).digest("hex").slice(0, 16);
}

// Tight per-IP limiter on top of the global one. A real user clicks a few news
// cards per session; 30/min is generous for them and crushes click-stuffing.
const clickLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Always 204 so the public endpoint never reveals limiter internals.
  handler: (_req, res) => res.status(204).end(),
});

router.post("/news/click", clickLimiter, async (req: Request, res: Response) => {
  const parsed = ClickBody.safeParse(req.body);
  if (!parsed.success) {
    // Don't leak validation detail to the public; just acknowledge.
    res.status(204).end();
    return;
  }
  const { newsId, regionId, category, sponsored, source, referrerHost } = parsed.data;

  // Approximate country from common edge-proxy headers (Cloudflare, Replit edge).
  const cf = (req.headers["cf-ipcountry"] as string | undefined) ?? null;
  const country = cf && cf !== "XX" ? cf : null;

  try {
    await db.insert(newsClicksTable).values({
      newsId,
      regionId: regionId ?? null,
      category: category ?? null,
      sponsored,
      source: source ?? null,
      referrerHost: referrerHost ?? null,
      countryCode: country,
      ipHashShort: hashIp(req),
    });
  } catch (err) {
    console.error("[news/click] insert failed", err);
    // fall through · still 204
  }
  res.status(204).end();
});

export default router;
