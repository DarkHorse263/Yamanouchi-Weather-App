import { Router, type IRouter } from "express";
import { db, alertSubscribersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { issueToken, verifyToken } from "../lib/alertTokens.js";
import { sendEmail } from "../lib/emailSender.js";
import { verificationEmail } from "../lib/emailTemplates.js";
import { getAppPublicUrl } from "../lib/appUrl.js";
import { REGION_IDS, type RegionId } from "../lib/regions.js";

const router: IRouter = Router();

const ALLOWED_DELIVERY = ["email", "push", "both"] as const;
const ALLOWED_HORIZON = [24, 48, 72] as const;
const MIN_THRESHOLD = 5;
const MAX_THRESHOLD = 50;
const MIN_HORIZON = 24;
const MAX_HORIZON = 72;

function isValidEmail(s: unknown): s is string {
  return typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function asRegions(value: unknown): RegionId[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is RegionId => typeof v === "string" && (REGION_IDS as readonly string[]).includes(v));
}
function asMountains(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && /^[a-z0-9-]{1,80}$/.test(v));
}
function asThreshold(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 15;
  return Math.max(MIN_THRESHOLD, Math.min(MAX_THRESHOLD, Math.round(n)));
}
function asHorizon(v: unknown): 24 | 48 | 72 {
  const n = Number(v);
  if (!Number.isFinite(n)) return 48;
  if (n <= 24) return 24;
  if (n <= 48) return 48;
  return 72;
}
function asDelivery(v: unknown): "email" | "push" | "both" {
  if (typeof v === "string" && (ALLOWED_DELIVERY as readonly string[]).includes(v)) {
    return v as "email" | "push" | "both";
  }
  return "email";
}
function asTimezone(v: unknown): string {
  if (typeof v !== "string" || v.length > 64) return "UTC";
  // Sanity: IANA timezones are letters/_/-/+/digits
  if (!/^[A-Za-z_+-]+(?:\/[A-Za-z_+\-0-9]+)*$/.test(v)) return "UTC";
  return v;
}
function normaliseEmail(s: string): string {
  return s.trim().toLowerCase();
}

function publicSubscriberShape(row: {
  email: string; regions: string[]; mountains: string[];
  snowfallThresholdCm: number; horizonHours: number;
  delivery: string; timezone: string;
  verifiedAt: Date | null; unsubscribedAt: Date | null;
}) {
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

// ─── POST /alerts/subscribe ───────────────────────────────────────────────
router.post("/alerts/subscribe", async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  if (!isValidEmail(body["email"])) {
    res.status(400).json({ error: "INVALID_EMAIL", message: "A valid email is required." });
    return;
  }
  const email = normaliseEmail(body["email"]);
  const regions = asRegions(body["regions"]);
  if (regions.length === 0) {
    res.status(400).json({ error: "MISSING_REGIONS", message: "Pick at least one region." });
    return;
  }
  if (body["consent"] !== true) {
    res.status(400).json({ error: "CONSENT_REQUIRED", message: "Tick the consent box to subscribe." });
    return;
  }

  const payload = {
    email,
    regions,
    mountains: asMountains(body["mountains"]),
    snowfallThresholdCm: asThreshold(body["snowfallThresholdCm"]),
    horizonHours: asHorizon(body["horizonHours"]),
    delivery: asDelivery(body["delivery"]),
    timezone: asTimezone(body["timezone"]),
  };

  try {
    // Upsert by email so re-subscribing updates preferences instead of failing.
    // If the row was previously unsubscribed, clear that flag (re-opt-in is
    // explicit and has just gone through double opt-in again).
    const existing = await db.select().from(alertSubscribersTable).where(eq(alertSubscribersTable.email, email)).limit(1);
    let id: string;
    let alreadyVerified = false;

    if (existing.length === 0) {
      const inserted = await db.insert(alertSubscribersTable).values(payload).returning({ id: alertSubscribersTable.id });
      id = inserted[0]!.id;
    } else {
      const row = existing[0]!;
      id = row.id;
      alreadyVerified = row.verifiedAt !== null && row.unsubscribedAt === null;
      await db.update(alertSubscribersTable).set({
        ...payload,
        unsubscribedAt: null,
        unsubscribeReason: null,
      }).where(eq(alertSubscribersTable.id, id));
    }

    if (alreadyVerified) {
      // Already opted-in — don't re-send a verification email; just confirm.
      res.json({
        ok: true,
        status: "already_verified",
        message: "Your preferences have been updated.",
      });
      return;
    }

    const verifyToken = issueToken(id, "verify");
    const verifyUrl = `${getAppPublicUrl()}/alerts/verify?token=${encodeURIComponent(verifyToken)}`;
    const tmpl = verificationEmail(verifyUrl);
    const send = await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text, tag: "alert_verify" });

    res.json({
      ok: true,
      status: "verification_sent",
      message: "Check your email to confirm your subscription.",
      emailDelivered: send.delivered,
      // Surface the verify URL in dev so the developer can click it without
      // a real inbox; production clients should ignore this field.
      ...(process.env.NODE_ENV !== "production" && !send.delivered ? { devVerifyUrl: verifyUrl } : {}),
    });
  } catch (err) {
    console.error("[/alerts/subscribe] error:", err);
    res.status(500).json({ error: "SUBSCRIBE_FAILED", message: "Could not save subscription. Try again shortly." });
  }
});

// ─── GET /alerts/verify?token=… ──────────────────────────────────────────
router.get("/alerts/verify", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const result = verifyToken(token, "verify");
  if (!result.ok) {
    res.status(400).json({ error: "INVALID_TOKEN", reason: result.reason });
    return;
  }

  try {
    const rows = await db.select().from(alertSubscribersTable).where(eq(alertSubscribersTable.id, result.payload.sub)).limit(1);
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "SUBSCRIBER_NOT_FOUND" });
      return;
    }
    if (row.verifiedAt === null) {
      await db.update(alertSubscribersTable).set({ verifiedAt: new Date() }).where(eq(alertSubscribersTable.id, row.id));
    }
    const manageToken = issueToken(row.id, "manage");
    res.json({
      ok: true,
      email: row.email,
      manageToken,
      manageUrl: `${getAppPublicUrl()}/alerts/manage?token=${encodeURIComponent(manageToken)}`,
    });
  } catch (err) {
    console.error("[/alerts/verify] error:", err);
    res.status(500).json({ error: "VERIFY_FAILED" });
  }
});

// ─── GET /alerts/manage?token=… ──────────────────────────────────────────
router.get("/alerts/manage", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const result = verifyToken(token, "manage");
  if (!result.ok) {
    res.status(400).json({ error: "INVALID_TOKEN", reason: result.reason });
    return;
  }
  try {
    const rows = await db.select().from(alertSubscribersTable).where(eq(alertSubscribersTable.id, result.payload.sub)).limit(1);
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "SUBSCRIBER_NOT_FOUND" });
      return;
    }
    res.json({ ok: true, subscriber: publicSubscriberShape(row) });
  } catch (err) {
    console.error("[/alerts/manage GET] error:", err);
    res.status(500).json({ error: "MANAGE_LOAD_FAILED" });
  }
});

// ─── PUT /alerts/manage?token=… ──────────────────────────────────────────
router.put("/alerts/manage", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const result = verifyToken(token, "manage");
  if (!result.ok) {
    res.status(400).json({ error: "INVALID_TOKEN", reason: result.reason });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const regions = asRegions(body["regions"]);
  if (regions.length === 0) {
    res.status(400).json({ error: "MISSING_REGIONS", message: "Pick at least one region." });
    return;
  }
  const update = {
    regions,
    mountains: asMountains(body["mountains"]),
    snowfallThresholdCm: asThreshold(body["snowfallThresholdCm"]),
    horizonHours: asHorizon(body["horizonHours"]),
    delivery: asDelivery(body["delivery"]),
    timezone: asTimezone(body["timezone"]),
  };
  try {
    await db.update(alertSubscribersTable).set(update).where(eq(alertSubscribersTable.id, result.payload.sub));
    const rows = await db.select().from(alertSubscribersTable).where(eq(alertSubscribersTable.id, result.payload.sub)).limit(1);
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "SUBSCRIBER_NOT_FOUND" });
      return;
    }
    res.json({ ok: true, subscriber: publicSubscriberShape(row) });
  } catch (err) {
    console.error("[/alerts/manage PUT] error:", err);
    res.status(500).json({ error: "MANAGE_UPDATE_FAILED" });
  }
});

// ─── POST /alerts/unsubscribe?token=… ────────────────────────────────────
router.post("/alerts/unsubscribe", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  // Accept either an unsub-kind token (forever-valid one-click links) or a
  // manage-kind token (so the management page can also unsubscribe without
  // needing a separate token).
  const r1 = verifyToken(token, "unsub");
  const result = r1.ok ? r1 : verifyToken(token, "manage");
  if (!result.ok) {
    res.status(400).json({ error: "INVALID_TOKEN", reason: result.reason });
    return;
  }
  const reason = typeof (req.body ?? {})["reason"] === "string"
    ? String((req.body as Record<string, unknown>)["reason"]).slice(0, 200)
    : null;

  try {
    await db.update(alertSubscribersTable).set({
      unsubscribedAt: new Date(),
      unsubscribeReason: reason,
    }).where(eq(alertSubscribersTable.id, result.payload.sub));
    res.json({ ok: true, message: "You're unsubscribed." });
  } catch (err) {
    console.error("[/alerts/unsubscribe] error:", err);
    res.status(500).json({ error: "UNSUB_FAILED" });
  }
});

export default router;
