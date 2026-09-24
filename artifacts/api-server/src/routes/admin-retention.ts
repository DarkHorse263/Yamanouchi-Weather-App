import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, subscriberSuppressionsTable, emailDeliveryIncidentsTable } from "@workspace/db";
import { runSubscriberRetention, suppressionKey } from "../lib/subscriberRetention.js";

// Mount ONLY within admin.ts, after its origin-pinning and requireAdminUser gates.
const router = Router();
router.get("/preview", async (_req, res) => {
  try { res.json(await runSubscriberRetention(true)); }
  catch { res.status(503).json({ error: "RETENTION_PREVIEW_FAILED" }); }
});
router.post("/suppression/clear", async (req, res) => {
  const { email, scope, confirm } = req.body ?? {};
  if (typeof email !== "string" || !email.includes("@") || !["alerts", "delivery"].includes(scope) || confirm !== true) {
    res.status(400).json({ error: "EMAIL_SCOPE_AND_EXPLICIT_CONFIRMATION_REQUIRED" }); return;
  }
  try {
    const normalized = email.trim().toLowerCase();
    const cleared = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('subscriber-retention'))`);
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${normalized}, 0))`);
      if (scope === "delivery") {
        // Detailed unresolved incidents must be resolved through the existing
        // audited incident route, not bypassed through this minimal-record route.
        const incident = await tx.select({ id: emailDeliveryIncidentsTable.id }).from(emailDeliveryIncidentsTable)
          .where(eq(emailDeliveryIncidentsTable.email, normalized)).limit(1);
        if (incident.length) return null;
      }
      return tx.delete(subscriberSuppressionsTable).where(and(
        eq(subscriberSuppressionsTable.emailKey, suppressionKey(normalized)),
        eq(subscriberSuppressionsTable.scope, scope),
      )).returning({ scope: subscriberSuppressionsTable.scope });
    });
    if (cleared === null) { res.status(409).json({ error: "USE_INCIDENT_RESOLUTION" }); return; }
    console.info("[retention] authorized suppression clearance", { scope, adminUserId: res.locals.adminUser?.userId, cleared: cleared.length });
    res.json({ cleared: cleared.length });
  } catch { res.status(503).json({ error: "SUPPRESSION_CLEAR_FAILED" }); }
});
export default router;