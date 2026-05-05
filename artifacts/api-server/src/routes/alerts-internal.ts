import { Router, type IRouter } from "express";
import { timingSafeEqual } from "node:crypto";
import { runAlertEvaluator } from "../jobs/alertEvaluator.js";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Internal admin endpoint for triggering the evaluator from a cron service
 * (e.g. Replit Scheduled Deployment, GitHub Action, or curl in dev).
 *
 * Auth via static `Bearer` token in the `Authorization` header. The token
 * comes from the `ALERT_TOKEN_SECRET` env var so we don't need to provision
 * yet another secret.
 */
const router: IRouter = Router();

router.post("/internal/alerts/run", async (req, res): Promise<void> => {
  const expected = process.env.ALERT_TOKEN_SECRET ?? "";
  const auth = req.header("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  // In dev, allow without auth so devs can curl the endpoint freely. In any
  // other env, require a non-empty secret AND a matching bearer.
  if (process.env.NODE_ENV === "production") {
    if (!expected || expected.length < 16 || !safeEqual(provided, expected)) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
  }

  const dryRun = req.query["dryRun"] === "1";
  try {
    const report = await runAlertEvaluator({ dryRun });
    res.json({ ok: true, dryRun, report });
  } catch (err) {
    console.error("[/internal/alerts/run] error:", err);
    res.status(500).json({ error: "EVALUATOR_FAILED", message: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
