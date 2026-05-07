import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getCacheStats } from "./regions";

const router: IRouter = Router();
const startedAt = Date.now();

router.get("/healthz", (_req, res) => {
  // Schema-validated minimal payload (kept compatible with API spec)
  const data = HealthCheckResponse.parse({ status: "ok" });
  // Set no-store so probes always see real liveness, never a cached 200
  res.set("Cache-Control", "no-store");
  res.json({
    ...data,
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    regionsCache: getCacheStats(),
    timestamp: new Date().toISOString(),
  });
});

// /readyz: stricter - only OK if at least one region cache is warm.
// Useful for load balancers that should hold traffic until upstream has been hit at least once.
router.get("/readyz", (_req, res) => {
  const stats = getCacheStats();
  const ready = stats.entries > 0 || stats.upstreamCalls > 0;
  res.set("Cache-Control", "no-store");
  if (!ready) {
    res.status(503).json({ status: "warming", regionsCache: stats });
    return;
  }
  res.json({ status: "ready", regionsCache: stats });
});

export default router;
