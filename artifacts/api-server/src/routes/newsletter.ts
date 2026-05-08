import { Router, type IRouter } from "express";
import { db, newsletterSubscribersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { issueToken, verifyToken, isTokenStillValid } from "../lib/alertTokens.js";
import { sendEmail } from "../lib/emailSender.js";
import { newsletterVerificationEmail, newsletterDigestEmail } from "../lib/newsletterEmailTemplates.js";
import { getAppPublicUrl } from "../lib/appUrl.js";
import { REGION_IDS, type RegionId } from "../lib/regions.js";

/**
 * Newsletter (general digest) subscription routes.
 *
 * Mirrors the powder-alerts subscription flow (double opt-in, HMAC tokens,
 * one-click GET unsubscribe for AU Spam Act / CAN-SPAM compliance) but
 * lives in its own table and uses its own token kinds (`nl_verify`,
 * `nl_unsub`) so the two lists can never cross-contaminate.
 */

const ALLOWED_CADENCE = ["weekly", "fortnightly", "monthly"] as const;
type Cadence = (typeof ALLOWED_CADENCE)[number];

const router: IRouter = Router();

function isValidEmail(s: unknown): s is string {
  return typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function asRegions(value: unknown): RegionId[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is RegionId => typeof v === "string" && (REGION_IDS as readonly string[]).includes(v),
  );
}
function asCadence(v: unknown): Cadence {
  if (typeof v === "string" && (ALLOWED_CADENCE as readonly string[]).includes(v)) {
    return v as Cadence;
  }
  return "fortnightly";
}
function asSource(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim().slice(0, 64);
  return trimmed.length > 0 ? trimmed : null;
}
function normaliseEmail(s: string): string {
  return s.trim().toLowerCase();
}

// ─── POST /newsletter/subscribe ───────────────────────────────────────────
router.post("/newsletter/subscribe", async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  if (!isValidEmail(body["email"])) {
    res.status(400).json({ error: "INVALID_EMAIL", message: "A valid email is required." });
    return;
  }
  if (body["consent"] !== true) {
    res
      .status(400)
      .json({ error: "CONSENT_REQUIRED", message: "Tick the consent box to subscribe." });
    return;
  }

  const email = normaliseEmail(body["email"]);
  const payload = {
    email,
    // Empty regions array means "all regions" — accepted; a user might
    // genuinely want both AU + JP coverage. Front-end defaults sensibly.
    regions: asRegions(body["regions"]),
    cadence: asCadence(body["cadence"]),
    source: asSource(body["source"]),
  };

  try {
    // Atomic upsert by email. If the address already exists, refresh
    // preferences and clear any prior soft-unsubscribe — the user is
    // re-opting in via a fresh double opt-in.
    const upserted = await db
      .insert(newsletterSubscribersTable)
      .values(payload)
      .onConflictDoUpdate({
        target: newsletterSubscribersTable.email,
        set: {
          ...payload,
          unsubscribedAt: null,
          unsubscribeReason: null,
        },
      })
      .returning({
        id: newsletterSubscribersTable.id,
        verifiedAt: newsletterSubscribersTable.verifiedAt,
      });
    const row = upserted[0]!;
    const id = row.id;
    const alreadyVerified = row.verifiedAt !== null;

    if (alreadyVerified) {
      res.json({
        ok: true,
        status: "already_verified",
        message: "You're already on the list — preferences updated.",
      });
      return;
    }

    const token = issueToken(id, "nl_verify");
    const verifyUrl = `${getAppPublicUrl()}/newsletter/verify?token=${encodeURIComponent(token)}`;
    const tmpl = newsletterVerificationEmail(verifyUrl);
    const send = await sendEmail({
      to: email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
      tag: "newsletter_verify",
    });

    res.json({
      ok: true,
      status: "verification_sent",
      message: "Check your email to confirm your subscription.",
      emailDelivered: send.delivered,
      // Surface the verify URL in dev so the developer can click without
      // a real inbox; production clients should ignore this field.
      ...(process.env.NODE_ENV !== "production" && !send.delivered
        ? { devVerifyUrl: verifyUrl }
        : {}),
    });
  } catch (err) {
    console.error("[/newsletter/subscribe] error:", err);
    res
      .status(500)
      .json({ error: "SUBSCRIBE_FAILED", message: "Could not save subscription. Try again shortly." });
  }
});

// ─── GET /newsletter/verify?token=… ──────────────────────────────────────
router.get("/newsletter/verify", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const result = verifyToken(token, "nl_verify");
  if (!result.ok) {
    res.status(400).json({ error: "INVALID_TOKEN", reason: result.reason });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.id, result.payload.sub))
      .limit(1);
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "SUBSCRIBER_NOT_FOUND" });
      return;
    }
    if (row.verifiedAt === null) {
      await db
        .update(newsletterSubscribersTable)
        .set({ verifiedAt: new Date() })
        .where(eq(newsletterSubscribersTable.id, row.id));
    }
    res.json({ ok: true, email: row.email });
  } catch (err) {
    console.error("[/newsletter/verify] error:", err);
    res.status(500).json({ error: "VERIFY_FAILED" });
  }
});

// Shared unsubscribe used by both GET (one-click email link) and POST.
async function performNewsletterUnsubscribe(
  token: string,
  reason: string | null,
): Promise<{ ok: true } | { ok: false; status: number; error: string; reason?: string }> {
  const result = verifyToken(token, "nl_unsub");
  if (!result.ok) return { ok: false, status: 400, error: "INVALID_TOKEN", reason: result.reason };

  const rows = await db
    .select({
      id: newsletterSubscribersTable.id,
      tokensInvalidatedAt: newsletterSubscribersTable.tokensInvalidatedAt,
    })
    .from(newsletterSubscribersTable)
    .where(eq(newsletterSubscribersTable.id, result.payload.sub))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, status: 404, error: "SUBSCRIBER_NOT_FOUND" };
  if (!isTokenStillValid(result.payload, row.tokensInvalidatedAt)) {
    return { ok: false, status: 400, error: "INVALID_TOKEN", reason: "revoked" };
  }

  await db
    .update(newsletterSubscribersTable)
    .set({
      unsubscribedAt: new Date(),
      unsubscribeReason: reason,
      tokensInvalidatedAt: new Date(),
    })
    .where(eq(newsletterSubscribersTable.id, result.payload.sub));
  return { ok: true };
}

// ─── GET /newsletter/unsubscribe?token=… ─────────────────────────────────
// One-click GET so an inbox link works without JavaScript. Required for
// AU Spam Act 2003 / CAN-SPAM compliance.
router.get("/newsletter/unsubscribe", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const base = getAppPublicUrl();
  try {
    const result = await performNewsletterUnsubscribe(token, "email_link");
    if (result.ok) {
      res.redirect(302, `${base}/newsletter/unsubscribed`);
      return;
    }
    res.redirect(302, `${base}/newsletter/unsubscribed?error=${encodeURIComponent(result.error)}`);
  } catch (err) {
    console.error("[/newsletter/unsubscribe GET] error:", err);
    res.redirect(302, `${base}/newsletter/unsubscribed?error=UNSUB_FAILED`);
  }
});

// ─── POST /newsletter/unsubscribe?token=… ────────────────────────────────
router.post("/newsletter/unsubscribe", async (req, res): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const reason =
    typeof (req.body ?? {})["reason"] === "string"
      ? String((req.body as Record<string, unknown>)["reason"]).slice(0, 200)
      : null;
  try {
    const result = await performNewsletterUnsubscribe(token, reason);
    if (result.ok) {
      res.json({ ok: true, message: "You're unsubscribed." });
      return;
    }
    res
      .status(result.status)
      .json({ error: result.error, ...(result.reason ? { reason: result.reason } : {}) });
  } catch (err) {
    console.error("[/newsletter/unsubscribe POST] error:", err);
    res.status(500).json({ error: "UNSUB_FAILED" });
  }
});

// ─── GET /newsletter/preview (dev-only) ──────────────────────────────────
// Renders a sample digest as HTML so we can review the template visually
// without sending real email. Disabled in production.
router.get("/newsletter/preview", (_req, res): void => {
  if (process.env["NODE_ENV"] === "production") {
    res.status(404).end();
    return;
  }
  const base = getAppPublicUrl();
  const tmpl = newsletterDigestEmail({
    baseUrl: base,
    unsubscribeUrl: `${base}/newsletter/unsubscribed`,
    manageUrl: `${base}/newsletter/manage`,
  });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(tmpl.html);
});

export default router;
