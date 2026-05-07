import { Router, type IRouter } from "express";
import { db, alertSubscribersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { issueToken, verifyToken, isTokenStillValid } from "../lib/alertTokens.js";
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
    // Atomic upsert by email. Two concurrent subscribe requests for the same
    // address would race on a read-then-write and either duplicate-insert
    // (violating the unique index) or both think they're the "first". The
    // unique index on `email` plus ON CONFLICT DO UPDATE makes this single-shot.
    // Re-opting-in clears the soft-unsubscribe flag because the user has just
    // gone through double opt-in again.
    const upserted = await db
      .insert(alertSubscribersTable)
      .values(payload)
      .onConflictDoUpdate({
        target: alertSubscribersTable.email,
        set: {
          ...payload,
          unsubscribedAt: null,
          unsubscribeReason: null,
        },
      })
      .returning({
        id: alertSubscribersTable.id,
        verifiedAt: alertSubscribersTable.verifiedAt,
        unsubscribedAt: alertSubscribersTable.unsubscribedAt,
      });
    const row = upserted[0]!;
    const id = row.id;
    // `unsubscribedAt` is always null here because the upsert just cleared it.
    // For the "already verified" short-circuit we look at the pre-upsert state
    // — i.e. `verifiedAt` being non-null on the returned row.
    const alreadyVerified = row.verifiedAt !== null;

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

// Helper: load a subscriber and check the manage token hasn't been invalidated
// by a previous destructive action. Returns null on failure (response sent).
async function loadSubscriberForManageToken(
  res: import("express").Response,
  payload: { sub: string; iat: number },
): Promise<typeof alertSubscribersTable.$inferSelect | null> {
  const rows = await db.select().from(alertSubscribersTable).where(eq(alertSubscribersTable.id, payload.sub)).limit(1);
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "SUBSCRIBER_NOT_FOUND" });
    return null;
  }
  if (!isTokenStillValid(payload, row.tokensInvalidatedAt)) {
    res.status(400).json({ error: "INVALID_TOKEN", reason: "revoked" });
    return null;
  }
  return row;
}

// ─── GET /alerts/manage?token=… ──────────────────────────────────────────
router.get("/alerts/manage", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const result = verifyToken(token, "manage");
  if (!result.ok) {
    res.status(400).json({ error: "INVALID_TOKEN", reason: result.reason });
    return;
  }
  try {
    const row = await loadSubscriberForManageToken(res, result.payload);
    if (!row) return;
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
    const existing = await loadSubscriberForManageToken(res, result.payload);
    if (!existing) return;
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

// Shared logic for both GET (one-click email link) and POST (programmatic)
// unsubscribe. Accepts either an unsub-kind token (forever-valid) or a
// manage-kind token (so the management UI can unsubscribe without needing a
// second token). Bumps `tokensInvalidatedAt` so previously-issued manage/unsub
// tokens for this subscriber can no longer be replayed.
async function performUnsubscribe(
  token: string,
  reason: string | null,
): Promise<{ ok: true } | { ok: false; status: number; error: string; reason?: string }> {
  const r1 = verifyToken(token, "unsub");
  const result = r1.ok ? r1 : verifyToken(token, "manage");
  if (!result.ok) return { ok: false, status: 400, error: "INVALID_TOKEN", reason: result.reason };

  // Replay protection: reject if the token was issued before a previous
  // tokensInvalidatedAt cutoff (e.g. user already clicked unsubscribe before).
  const rows = await db.select({
    id: alertSubscribersTable.id,
    tokensInvalidatedAt: alertSubscribersTable.tokensInvalidatedAt,
  }).from(alertSubscribersTable).where(eq(alertSubscribersTable.id, result.payload.sub)).limit(1);
  const row = rows[0];
  if (!row) return { ok: false, status: 404, error: "SUBSCRIBER_NOT_FOUND" };
  if (!isTokenStillValid(result.payload, row.tokensInvalidatedAt)) {
    return { ok: false, status: 400, error: "INVALID_TOKEN", reason: "revoked" };
  }

  await db.update(alertSubscribersTable).set({
    unsubscribedAt: new Date(),
    unsubscribeReason: reason,
    tokensInvalidatedAt: new Date(),
  }).where(eq(alertSubscribersTable.id, result.payload.sub));
  return { ok: true };
}

// ─── GET /alerts/unsubscribe?token=… ─────────────────────────────────────
// Exists so the "Unsubscribe" link in alert emails (a plain GET click from an
// inbox) actually works. Required for AU Spam Act 2003 / CAN-SPAM compliance.
// On success we redirect to the SPA confirmation page; on failure we redirect
// to the same page with an `?error=` querystring so the user always sees
// something rather than a raw JSON 400.
router.get("/alerts/unsubscribe", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const base = getAppPublicUrl();
  try {
    const result = await performUnsubscribe(token, "email_link");
    if (result.ok) {
      res.redirect(302, `${base}/alerts/unsubscribed`);
      return;
    }
    res.redirect(302, `${base}/alerts/unsubscribed?error=${encodeURIComponent(result.error)}`);
  } catch (err) {
    console.error("[/alerts/unsubscribe GET] error:", err);
    res.redirect(302, `${base}/alerts/unsubscribed?error=UNSUB_FAILED`);
  }
});

// ─── POST /alerts/unsubscribe?token=… ────────────────────────────────────
router.post("/alerts/unsubscribe", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const reason = typeof (req.body ?? {})["reason"] === "string"
    ? String((req.body as Record<string, unknown>)["reason"]).slice(0, 200)
    : null;
  try {
    const result = await performUnsubscribe(token, reason);
    if (result.ok) {
      res.json({ ok: true, message: "You're unsubscribed." });
      return;
    }
    res.status(result.status).json({ error: result.error, ...(result.reason ? { reason: result.reason } : {}) });
  } catch (err) {
    console.error("[/alerts/unsubscribe POST] error:", err);
    res.status(500).json({ error: "UNSUB_FAILED" });
  }
});

export default router;
