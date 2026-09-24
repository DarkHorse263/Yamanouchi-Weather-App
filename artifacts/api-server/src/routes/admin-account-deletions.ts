import { Router } from "express";
import { db, accountDeletionsTable } from "@workspace/db";
import { desc, isNull } from "drizzle-orm";
import { recoverAccountDeletion } from "../lib/accountDeletionRecovery.js";

// Mounted ONLY below the parent admin origin + allowlist guards.
const router = Router();
router.get("/account-deletions", async (_req, res) => {
  try {
    const records = await db.select({
      id: accountDeletionsTable.id,
      phase: accountDeletionsTable.phase,
      attempts: accountDeletionsTable.attempts,
      lastError: accountDeletionsTable.lastError,
      requestedAt: accountDeletionsTable.requestedAt,
      nextAttemptAt: accountDeletionsTable.nextAttemptAt,
    }).from(accountDeletionsTable).where(isNull(accountDeletionsTable.completedAt))
      .orderBy(desc(accountDeletionsTable.requestedAt)).limit(100);
    res.json({ records, limit: 100 });
  } catch { res.status(503).json({ error: "DELETION_RECOVERY_UNAVAILABLE" }); }
});
router.post("/account-deletions/:id/retry", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ error: "INVALID_DELETION_ID" });
    return;
  }
  try {
    const result = await recoverAccountDeletion(id);
    res.status(result.complete ? 200 : 503).json({
      ...result, ...(result.complete ? {} : { error: "DELETION_STILL_PENDING" }),
    });
  } catch (error) {
    const missing = error instanceof Error && error.message === "DELETION_NOT_FOUND";
    res.status(missing ? 404 : 503).json({
      error: missing ? "DELETION_NOT_FOUND" : "DELETION_RECOVERY_UNAVAILABLE",
    });
  }
});
export default router;