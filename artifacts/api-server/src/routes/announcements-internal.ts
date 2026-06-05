import { Router, type IRouter } from "express";
import { timingSafeEqual } from "node:crypto";
import { runAnnouncementsIngest } from "../jobs/announcementsIngest.js";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Internal admin endpoint to trigger announcements ingestion on demand (e.g.
 * a Replit Scheduled Deployment, or curl after publishing a new seed). Auth
 * via the same static Bearer token as the alert evaluator (ALERT_TOKEN_SECRET)
 * so we don't provision yet another secret.
 */
const router: IRouter = Router();

router.post("/internal/announcements/run", async (req, res): Promise<void> => {
  const expected = process.env.ALERT_TOKEN_SECRET ?? "";
  const auth = req.header("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  const unauthAllowed = process.env.ALLOW_UNAUTH_CRON === "1" && process.env.NODE_ENV !== "production";
  if (!unauthAllowed) {
    if (!expected || expected.length < 16 || !safeEqual(provided, expected)) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
  }

  try {
    const report = await runAnnouncementsIngest();
    res.json({ ok: true, report });
  } catch (err) {
    console.error("[/internal/announcements/run] error:", err);
    res.status(500).json({ error: "INGEST_FAILED" });
  }
});

export default router;
