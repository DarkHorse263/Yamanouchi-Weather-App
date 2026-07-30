import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { db, usersTable, alertSubscribersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { REGION_IDS, isRegionId } from "../lib/regions.js";

/**
 * Session-authorised account surface for signed-in members (magic-link email
 * or Replit OIDC · either way authMiddleware sets req.user). Backs /account:
 *
 *   GET /account            · email + profile basics + alert subscription
 *   PUT /account/profile    · home region + units on the users row
 *   PUT /account/alerts     · edit the alert subscription tied to the
 *                             member's email (no manage token needed · the
 *                             session IS the proof of email ownership)
 *
 * Returns 401 AUTH_REQUIRED when anonymous so the SPA can open the sign-up
 * sheet instead of showing an error.
 */

const router: IRouter = Router();

function requireUser(req: Request, res: Response): { id: string; email: string | null } | null {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "AUTH_REQUIRED", message: "Sign in to manage your account." });
    return null;
  }
  return { id: req.user.id, email: req.user.email ?? null };
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
router.get("/account", async (req, res): Promise<void> => {
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

router.put("/account/profile", async (req, res): Promise<void> => {
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
  if (body.units) update.units = body.units;
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
        displayName: row.displayName,
      },
    });
  } catch (err) {
    console.error("[/account/profile PUT] error:", err);
    res.status(500).json({ error: "PROFILE_UPDATE_FAILED" });
  }
});

// ─── PUT /account/alerts ──────────────────────────────────────────────────
// Same body + coercion rules as PUT /alerts/manage, but authorised by the
// session email instead of an HMAC manage token.
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

router.put("/account/alerts", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const parsed = AlertsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", message: "Request body is malformed." });
    return;
  }
  const body = parsed.data;
  const regions = (Array.isArray(body.regions) ? body.regions : []).filter(
    (v): v is string => typeof v === "string" && (REGION_IDS as readonly string[]).includes(v),
  );
  if (regions.length === 0) {
    res.status(400).json({ error: "MISSING_REGIONS", message: "Pick at least one region." });
    return;
  }
  const mountains = (Array.isArray(body.mountains) ? body.mountains : []).filter(
    (v): v is string => typeof v === "string" && /^[a-z0-9-]{1,80}$/.test(v),
  );
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

export default router;
