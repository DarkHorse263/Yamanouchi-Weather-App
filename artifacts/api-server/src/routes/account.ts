import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { db, usersTable, alertSubscribersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { isRegionId, normaliseAlertDestinations } from "../lib/regions.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { sendAccountDeletionReceipt } from "../lib/accountDeletionReceipt.js";
import { requestAccountDeletion, recoverAccountDeletion } from "../lib/accountDeletionRecovery.js";
import { accountUnitsExplicit } from "../lib/accountUnitsPreference.js";

/**
 * Clerk-authorised account surface for signed-in members. Backs /account:
 *
 *   GET /account            · email + profile basics + alert subscription
 *   PUT /account/profile    · home region + units on the users row
 *   PUT /account/alerts     · edit the alert subscription tied to the
 *                             member's email (no manage token needed · the
 *                             Clerk session IS the proof of email ownership)
 *
 * Returns 401 AUTH_REQUIRED when anonymous so the SPA can open the sign-up
 * sheet instead of showing an error.
 *
 * All routes go through `requireAuth` which runs JIT provisioning and sets
 * `req.dbUser` for the duration of the request.
 */

const router: IRouter = Router();

function requireUser(req: Request, res: Response): { id: string; email: string | null } | null {
  if (!req.dbUser) {
    res.status(401).json({ error: "AUTH_REQUIRED", message: "Sign in to manage your account." });
    return null;
  }
  return { id: req.dbUser.id, email: req.dbUser.email ?? null };
}

function publicSubscriberShape(row: typeof alertSubscribersTable.$inferSelect) {
  return {
    email: row.email,
    regions: row.regions,
    mountains: row.mountains,
    snowfallThresholdCm: row.snowfallThresholdCm,
    horizonHours: row.horizonHours,
    delivery: row.delivery,
    timezone: row.timezone,
    verified: row.verifiedAt !== null,
    unsubscribed: row.unsubscribedAt !== null,
  };
}


async function loadSubscriberByEmail(email: string | null) {
  if (!email) return null;
  const rows = await db
    .select()
    .from(alertSubscribersTable)
    .where(eq(alertSubscribersTable.email, email.trim().toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

// ─── GET /account ─────────────────────────────────────────────────────────
router.get("/account", requireAuth, async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
    const row = rows[0];
    if (!row) {
      res.status(401).json({ error: "AUTH_REQUIRED", message: "Session user no longer exists." });
      return;
    }
    const subscriber = await loadSubscriberByEmail(row.email);
    res.json({
      ok: true,
      email: row.email,
      profile: {
        homeRegionId: row.homeRegionId,
        units: row.units === "imperial" ? "imperial" : "metric",
        unitsExplicit: accountUnitsExplicit(row.units, row.metadata),
        displayName: row.displayName,
      },
      subscription: subscriber ? publicSubscriberShape(subscriber) : null,
    });
  } catch (err) {
    console.error("[/account GET] error:", err);
    res.status(500).json({ error: "ACCOUNT_LOAD_FAILED" });
  }
});

// ─── PUT /account/profile ─────────────────────────────────────────────────
const ProfileBody = z
  .object({
    homeRegionId: z.string().max(80).nullable().optional(),
    units: z.enum(["metric", "imperial"]).optional(),
  })
  .passthrough();

router.put("/account/profile", requireAuth, async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const parsed = ProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", message: "Request body is malformed." });
    return;
  }
  const body = parsed.data;
  const update: Partial<typeof usersTable.$inferInsert> = {};
  if ("homeRegionId" in body) {
    if (body.homeRegionId !== null && !isRegionId(body.homeRegionId)) {
      res.status(400).json({ error: "INVALID_REGION", message: "Unknown home region." });
      return;
    }
    update.homeRegionId = body.homeRegionId ?? null;
  }
  if (body.units) {
    update.units = body.units;
    // Merge one key instead of replacing other metadata or changing DB schema.
    update.metadata = sql`(CASE WHEN jsonb_typeof(${usersTable.metadata}) = 'object' THEN ${usersTable.metadata} ELSE '{}'::jsonb END) || '{"unitsPreferenceExplicit":true}'::jsonb`;
  }
  try {
    if (Object.keys(update).length > 0) {
      await db.update(usersTable).set(update).where(eq(usersTable.id, user.id));
    }
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
    const row = rows[0];
    if (!row) {
      res.status(401).json({ error: "AUTH_REQUIRED" });
      return;
    }
    res.json({
      ok: true,
      profile: {
        homeRegionId: row.homeRegionId,
        units: row.units === "imperial" ? "imperial" : "metric",
        unitsExplicit: accountUnitsExplicit(row.units, row.metadata),
        displayName: row.displayName,
      },
    });
  } catch (err) {
    console.error("[/account/profile PUT] error:", err);
    res.status(500).json({ error: "PROFILE_UPDATE_FAILED" });
  }
});

// ─── PUT /account/alerts ──────────────────────────────────────────────────
const AlertsBody = z
  .object({
    regions: z.array(z.string()).optional(),
    mountains: z.array(z.string()).optional(),
    snowfallThresholdCm: z.union([z.number(), z.string()]).optional(),
    horizonHours: z.union([z.number(), z.string()]).optional(),
    delivery: z.string().optional(),
    timezone: z.string().max(64).optional(),
  })
  .passthrough();

router.put("/account/alerts", requireAuth, async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const parsed = AlertsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", message: "Request body is malformed." });
    return;
  }
  const body = parsed.data;
  const { regions, mountains } = normaliseAlertDestinations(body.regions, body.mountains);
  if (regions.length === 0 && mountains.length === 0) {
    res.status(400).json({ error: "MISSING_DESTINATIONS", message: "Pick at least one region or mountain." });
    return;
  }
  const thresholdRaw = Number(body.snowfallThresholdCm);
  const snowfallThresholdCm = Number.isFinite(thresholdRaw)
    ? Math.max(5, Math.min(50, Math.round(thresholdRaw)))
    : 15;
  const horizonRaw = Number(body.horizonHours);
  const horizonHours = !Number.isFinite(horizonRaw) ? 48 : horizonRaw <= 24 ? 24 : horizonRaw <= 48 ? 48 : 72;
  const delivery =
    typeof body.delivery === "string" && ["email", "push", "both"].includes(body.delivery)
      ? body.delivery
      : "email";
  const timezone =
    typeof body.timezone === "string" &&
    body.timezone.length <= 64 &&
    /^[A-Za-z_+-]+(?:\/[A-Za-z_+\-0-9]+)*$/.test(body.timezone)
      ? body.timezone
      : "UTC";

  try {
    const existing = await loadSubscriberByEmail(user.email);
    if (!existing) {
      res.status(404).json({ error: "SUBSCRIPTION_NOT_FOUND", message: "No alert subscription for this email yet." });
      return;
    }
    await db
      .update(alertSubscribersTable)
      .set({ regions, mountains, snowfallThresholdCm, horizonHours, delivery, timezone })
      .where(eq(alertSubscribersTable.id, existing.id));
    const rows = await db
      .select()
      .from(alertSubscribersTable)
      .where(eq(alertSubscribersTable.id, existing.id))
      .limit(1);
    const row = rows[0]!;
    res.json({ ok: true, subscriber: publicSubscriberShape(row) });
  } catch (err) {
    console.error("[/account/alerts PUT] error:", err);
    res.status(500).json({ error: "ALERTS_UPDATE_FAILED" });
  }
});

// ─── DELETE /account ──────────────────────────────────────────────────────
// Intent is durable BEFORE provider deletion. The recovery worker can resume
// after a crash even if the requester can no longer authenticate.
router.delete("/account", requireAuth, async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;

  const auth = getAuth(req);
  const clerkUserId = auth.userId; // Clerk's immutable principal

  if (!clerkUserId) {
    res.status(401).json({ error: "AUTH_REQUIRED" });
    return;
  }

  try {
    const intent = await requestAccountDeletion(clerkUserId, user.id, user.email);
    let result = await recoverAccountDeletion(intent.id);
    if (!result.complete) result = await recoverAccountDeletion(intent.id);
    if (!result.complete) {
      res.status(503).json({
        error: "ACCOUNT_DELETE_PENDING",
        message: "Your deletion request is saved. Cleanup is pending and will be retried automatically; support can track it.",
      });
      return;
    }

    // ── Step 4: deletion receipt (fire-and-forget) ────────────────────────
    // A durable "your account and data were deleted" record for the former
    // member. Deliberately AFTER the deletes and never awaited into the
    // response path · a send failure must not fail (or slow) the deletion.
    if (user.email) {
      sendAccountDeletionReceipt(user.email);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[/account DELETE] deletion could not finish");
    res.status(500).json({
      error: "ACCOUNT_DELETE_UNAVAILABLE",
      message: "Deletion could not finish. If your request was saved it will be retried automatically; contact support if needed.",
    });
  }
});

export default router;
