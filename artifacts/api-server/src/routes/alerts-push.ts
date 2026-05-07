import { Router, type IRouter } from "express";
import { db, pushSubscriptionsTable, alertSubscribersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken, isTokenStillValid } from "../lib/alertTokens.js";

async function checkTokenNotRevoked(subscriberId: string, payload: { iat: number }): Promise<boolean> {
  const rows = await db.select({ tokensInvalidatedAt: alertSubscribersTable.tokensInvalidatedAt })
    .from(alertSubscribersTable).where(eq(alertSubscribersTable.id, subscriberId)).limit(1);
  const row = rows[0];
  if (!row) return false;
  return isTokenStillValid(payload, row.tokensInvalidatedAt);
}

/**
 * Push-subscription endpoints. Auth via the same management token used for
 * /alerts/manage — the token holder identifies the subscriber, so the server
 * always knows which `subscriberId` a push subscription belongs to (we never
 * trust a client-supplied subscriber id).
 */
const router: IRouter = Router();

router.post("/alerts/push/subscribe", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const result = verifyToken(token, "manage");
  if (!result.ok) {
    res.status(400).json({ error: "INVALID_TOKEN", reason: result.reason });
    return;
  }
  if (!(await checkTokenNotRevoked(result.payload.sub, result.payload))) {
    res.status(400).json({ error: "INVALID_TOKEN", reason: "revoked" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const endpoint = typeof body["endpoint"] === "string" ? body["endpoint"] : "";
  const keys = (body["keys"] ?? {}) as Record<string, unknown>;
  const p256dh = typeof keys["p256dh"] === "string" ? keys["p256dh"] : "";
  const auth = typeof keys["auth"] === "string" ? keys["auth"] : "";
  const userAgent = typeof body["userAgent"] === "string" ? body["userAgent"].slice(0, 200) : null;

  if (!endpoint || !p256dh || !auth) {
    res.status(400).json({ error: "INVALID_SUBSCRIPTION", message: "endpoint, keys.p256dh and keys.auth are required." });
    return;
  }

  try {
    // Atomic upsert by endpoint — push services issue a single endpoint per
    // device, so re-subscribing with the same browser must update in place.
    // Read-then-write would race against the unique index and return 500 on
    // a fast double-subscribe (e.g. PWA reinstall).
    await db.insert(pushSubscriptionsTable)
      .values({ subscriberId: result.payload.sub, endpoint, p256dh, auth, userAgent })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: { subscriberId: result.payload.sub, p256dh, auth, userAgent, failureCount: 0 },
      });
    res.json({ ok: true });
  } catch (err) {
    console.error("[/alerts/push/subscribe] error:", err);
    res.status(500).json({ error: "PUSH_SUBSCRIBE_FAILED" });
  }
});

router.delete("/alerts/push/subscribe", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const result = verifyToken(token, "manage");
  if (!result.ok) {
    res.status(400).json({ error: "INVALID_TOKEN", reason: result.reason });
    return;
  }
  if (!(await checkTokenNotRevoked(result.payload.sub, result.payload))) {
    res.status(400).json({ error: "INVALID_TOKEN", reason: "revoked" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const endpoint = typeof body["endpoint"] === "string" ? body["endpoint"] : "";
  if (!endpoint) {
    res.status(400).json({ error: "MISSING_ENDPOINT" });
    return;
  }
  try {
    await db.delete(pushSubscriptionsTable).where(
      and(
        eq(pushSubscriptionsTable.subscriberId, result.payload.sub),
        eq(pushSubscriptionsTable.endpoint, endpoint),
      ),
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[/alerts/push/subscribe DELETE] error:", err);
    res.status(500).json({ error: "PUSH_UNSUB_FAILED" });
  }
});

export default router;
