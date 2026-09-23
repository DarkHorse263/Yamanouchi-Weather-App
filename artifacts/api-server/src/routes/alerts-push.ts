import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, pushSubscriptionsTable, alertSubscribersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken, isTokenStillValid } from "../lib/alertTokens.js";

// Defence-in-depth body schemas. Express has already JSON-parsed the body
// (with a size limit); these reject non-object payloads and document the
// shape each handler expects.
const PushSubscribeBody = z
  .object({
    endpoint: z.string().min(1).max(2048),
    keys: z
      .object({
        p256dh: z.string().min(1).max(256),
        auth: z.string().min(1).max(256),
      })
      .passthrough(),
    userAgent: z.string().max(500).optional(),
  })
  .passthrough();

const PushUnsubscribeBody = z
  .object({
    endpoint: z.string().min(1).max(2048),
  })
  .passthrough();

async function checkTokenNotRevoked(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  subscriberId: string,
  payload: { iat: number },
): Promise<boolean> {
  const rows = await tx.select({
    tokensInvalidatedAt: alertSubscribersTable.tokensInvalidatedAt,
    unsubscribedAt: alertSubscribersTable.unsubscribedAt,
  })
    .from(alertSubscribersTable).where(eq(alertSubscribersTable.id, subscriberId)).limit(1).for("update");
  const row = rows[0];
  if (!row) return false;
  return row.unsubscribedAt === null && isTokenStillValid(payload, row.tokensInvalidatedAt);
}

/**
 * Push-subscription endpoints. Auth via the same management token used for
 * /alerts/manage - the token holder identifies the subscriber, so the server
 * always knows which `subscriberId` a push subscription belongs to (we never
 * trust a client-supplied subscriber id).
 */
const router: IRouter = Router();

function rejectInvalidToken(
  res: import("express").Response,
  reason: "malformed" | "bad_signature" | "expired" | "wrong_kind" | "unavailable",
): void {
  if (reason === "unavailable") {
    res.status(503).json({
      error: "ALERT_TOKEN_SERVICE_UNAVAILABLE",
      message: "Alert links are temporarily unavailable. Please try again shortly.",
    });
    return;
  }
  res.status(400).json({ error: "INVALID_TOKEN", reason });
}

router.post("/alerts/push/subscribe", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const result = verifyToken(token, "manage");
  if (!result.ok) {
    rejectInvalidToken(res, result.reason);
    return;
  }
  const parsed = PushSubscribeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_SUBSCRIPTION", message: "endpoint, keys.p256dh and keys.auth are required." });
    return;
  }
  const { endpoint, keys: { p256dh, auth } } = parsed.data;
  const userAgent = parsed.data.userAgent ? parsed.data.userAgent.slice(0, 200) : null;

  try {
    // Atomic upsert by endpoint - push services issue a single endpoint per
    // device, so re-subscribing with the same browser must update in place.
    // Read-then-write would race against the unique index and return 500 on
    // a fast double-subscribe (e.g. PWA reinstall).
    const updated = await db.transaction(async (tx) => {
      if (!(await checkTokenNotRevoked(tx, result.payload.sub, result.payload))) return false;
      await tx.insert(pushSubscriptionsTable)
        .values({ subscriberId: result.payload.sub, endpoint, p256dh, auth, userAgent })
        .onConflictDoUpdate({
          target: pushSubscriptionsTable.endpoint,
          set: { subscriberId: result.payload.sub, p256dh, auth, userAgent, failureCount: 0 },
        });
      return true;
    });
    if (!updated) {
      res.status(400).json({ error: "INVALID_TOKEN", reason: "revoked" });
      return;
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
    rejectInvalidToken(res, result.reason);
    return;
  }
  const parsed = PushUnsubscribeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "MISSING_ENDPOINT" });
    return;
  }
  const { endpoint } = parsed.data;
  try {
    const deleted = await db.transaction(async (tx) => {
      if (!(await checkTokenNotRevoked(tx, result.payload.sub, result.payload))) return false;
      await tx.delete(pushSubscriptionsTable).where(
        and(
          eq(pushSubscriptionsTable.subscriberId, result.payload.sub),
          eq(pushSubscriptionsTable.endpoint, endpoint),
        ),
      );
      return true;
    });
    if (!deleted) {
      res.status(400).json({ error: "INVALID_TOKEN", reason: "revoked" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[/alerts/push/subscribe DELETE] error:", err);
    res.status(500).json({ error: "PUSH_UNSUB_FAILED" });
  }
});

export default router;
