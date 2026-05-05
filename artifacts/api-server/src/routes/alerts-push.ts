import { Router, type IRouter } from "express";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../lib/alertTokens.js";

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
    // Upsert by endpoint — push services issue a single endpoint per device,
    // so re-subscribing with the same browser updates the row instead of
    // creating duplicates.
    const existing = await db.select({ id: pushSubscriptionsTable.id })
      .from(pushSubscriptionsTable)
      .where(eq(pushSubscriptionsTable.endpoint, endpoint))
      .limit(1);
    if (existing.length > 0) {
      await db.update(pushSubscriptionsTable)
        .set({ subscriberId: result.payload.sub, p256dh, auth, userAgent, failureCount: 0 })
        .where(eq(pushSubscriptionsTable.id, existing[0]!.id));
    } else {
      await db.insert(pushSubscriptionsTable).values({
        subscriberId: result.payload.sub,
        endpoint, p256dh, auth, userAgent,
      });
    }
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
