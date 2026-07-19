import { Router, type IRouter } from "express";
import { timingSafeEqual } from "node:crypto";
import { runSmokeTest, getLastSmokeReport, isSmokeRunning } from "../jobs/smokeTest.js";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Internal endpoints for the daily smoke test - same bearer-token auth as
 * /internal/alerts/run (ALERT_TOKEN_SECRET), so a Replit Scheduled
 * Deployment or curl can trigger a run and read the last result.
 *
 * POST /internal/smoke/run?skipExternal=1&noEmail=1  - run now (long: minutes)
 * GET  /internal/smoke/status                        - last run's report
 */
const router: IRouter = Router();

function authorised(req: { header(name: string): string | undefined }): boolean {
  const expected = process.env.ALERT_TOKEN_SECRET ?? "";
  const auth = req.header("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const unauthAllowed = process.env.ALLOW_UNAUTH_CRON === "1" && process.env.NODE_ENV !== "production";
  if (unauthAllowed) return true;
  return Boolean(expected && expected.length >= 16 && safeEqual(provided, expected));
}

router.post("/internal/smoke/run", async (req, res): Promise<void> => {
  if (!authorised(req)) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  const skipExternal = req.query["skipExternal"] === "1";
  const noEmail = req.query["noEmail"] === "1";
  try {
    const report = await runSmokeTest({ skipExternal, noEmail });
    res.json({ ok: true, report });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("already running")) {
      res.status(409).json({ error: "ALREADY_RUNNING" });
      return;
    }
    console.error("[/internal/smoke/run] error:", err);
    res.status(500).json({ error: "SMOKE_FAILED" });
  }
});

router.get("/internal/smoke/status", (req, res): void => {
  if (!authorised(req)) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  const report = getLastSmokeReport();
  if (!report) {
    res.json({ ok: true, running: isSmokeRunning(), report: null, note: isSmokeRunning() ? "run in progress" : "no run yet since boot" });
    return;
  }
  res.json({ ok: true, running: isSmokeRunning(), report });
});

export default router;
