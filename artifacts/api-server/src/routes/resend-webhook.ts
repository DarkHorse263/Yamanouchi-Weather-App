import { Router, type IRouter, type Request, type Response } from "express";
import express from "express";
import crypto from "crypto";
import { sql } from "drizzle-orm";
import { db, emailDeliveryIncidentsTable } from "@workspace/db";

/**
 * Resend delivery webhook · POST /api/webhooks/resend.
 *
 * Why this exists: `sendEmail` only surfaces SYNCHRONOUS Resend failures. A
 * send can be accepted (HTTP 200) and then hard-bounce or be marked as spam
 * minutes later — an async signal the send call never sees. Without this
 * webhook a magic-link/alert visitor with a dead address just waits forever
 * while the admin dashboard reports the mail as "sent". Resend delivers those
 * async signals via Svix-signed webhooks (email.bounced / email.complained),
 * which we record into `email_delivery_incidents` for the admin surface.
 *
 * Security:
 *   - Never process an unsigned event. If RESEND_WEBHOOK_SECRET is unset we
 *     respond 503 (and log ONCE) rather than accepting spoofed bounces.
 *   - Signature verification follows the Svix spec (headers svix-id /
 *     svix-timestamp / svix-signature) over the RAW request body, so this
 *     route mounts its own express.raw parser BEFORE the app-wide
 *     express.json() ever touches it.
 *   - We deliberately do NOT auto-unsubscribe a matching alert/newsletter
 *     subscriber — a single bounce/complaint suppresses future sends but does
 *     not silently change the person's subscription preferences.
 */

const router: IRouter = Router();

// Log the "not configured" warning only once per process so a webhook that
// keeps firing before the owner pastes the secret doesn't flood the logs.
let warnedUnconfigured = false;

/**
 * Verify a Svix signature per the spec:
 *   signedContent = `${id}.${timestamp}.${body}`
 *   secret        = base64-decode(RESEND_WEBHOOK_SECRET without `whsec_`)
 *   expected      = base64(HMAC_SHA256(secret, signedContent))
 * The `svix-signature` header is a space-delimited list of `v1,<sig>`
 * versioned signatures; a match on any one (constant-time) passes.
 */
export function verifySvixSignature(params: {
  secret: string;
  id: string;
  timestamp: string;
  body: Buffer;
  signatureHeader: string;
}): boolean {
  const { secret, id, timestamp, body, signatureHeader } = params;

  // Reject a stale/forward-dated timestamp (5 min tolerance) to blunt replay.
  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > 5 * 60) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${id}.${timestamp}.${body.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");
  const expectedBuf = Buffer.from(expected);

  // Header looks like "v1,<b64> v1a,<b64> ..." — compare against every v1 sig.
  for (const part of signatureHeader.split(" ")) {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) continue;
    const sigBuf = Buffer.from(sig);
    if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return true;
    }
  }
  return false;
}

interface ResendWebhookEvent {
  type?: string;
  data?: {
    to?: string | string[];
    // Bounce payloads carry a nested bounce object with the reason.
    bounce?: { message?: string; subType?: string; type?: string } | null;
    // Some payloads put a flat reason string here instead.
    reason?: string | null;
  };
}

function firstRecipient(to: string | string[] | undefined): string | null {
  if (!to) return null;
  const addr = Array.isArray(to) ? to[0] : to;
  return typeof addr === "string" && addr.length > 0 ? addr.trim().toLowerCase() : null;
}

// express.raw captures the unparsed body so the Svix HMAC can be computed over
// the exact bytes Resend signed. Limit mirrors the app-wide 100kb JSON cap.
router.post(
  "/webhooks/resend",
  express.raw({ type: "*/*", limit: "100kb" }),
  async (req: Request, res: Response): Promise<void> => {
    const secret = process.env["RESEND_WEBHOOK_SECRET"];
    if (!secret) {
      if (!warnedUnconfigured) {
        console.warn(
          "[webhooks/resend] RESEND_WEBHOOK_SECRET is unset · refusing to process unsigned events. " +
            "Create a webhook in Resend (endpoint https://feelzlike.com/api/webhooks/resend) and set its signing secret.",
        );
        warnedUnconfigured = true;
      }
      res.status(503).json({ error: "WEBHOOK_NOT_CONFIGURED" });
      return;
    }

    const svixId = req.header("svix-id");
    const svixTimestamp = req.header("svix-timestamp");
    const svixSignature = req.header("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      res.status(400).json({ error: "MISSING_SIGNATURE_HEADERS" });
      return;
    }

    // req.body is a Buffer here because of express.raw above.
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const ok = verifySvixSignature({
      secret,
      id: svixId,
      timestamp: svixTimestamp,
      body: rawBody,
      signatureHeader: svixSignature,
    });
    if (!ok) {
      res.status(401).json({ error: "INVALID_SIGNATURE" });
      return;
    }

    let event: ResendWebhookEvent;
    try {
      event = JSON.parse(rawBody.toString("utf8")) as ResendWebhookEvent;
    } catch {
      res.status(400).json({ error: "INVALID_JSON" });
      return;
    }

    const type = event.type;
    // Only bounce/complaint events are deliverability incidents. Everything
    // else (delivered, opened, clicked, …) is acknowledged and ignored.
    const incidentType =
      type === "email.bounced" ? "bounced" : type === "email.complained" ? "complained" : null;
    if (!incidentType) {
      res.json({ ok: true, ignored: type ?? "unknown" });
      return;
    }

    const email = firstRecipient(event.data?.to);
    if (!email) {
      // Signed but malformed · ack so Resend stops retrying, but log it.
      console.warn("[webhooks/resend] signed event without a recipient:", type);
      res.json({ ok: true, ignored: "no-recipient" });
      return;
    }

    const bounce = event.data?.bounce;
    const reason =
      (bounce && (bounce.message || [bounce.type, bounce.subType].filter(Boolean).join(" · "))) ||
      event.data?.reason ||
      null;

    try {
      const recorded = await db.transaction(async (tx) => {
        // Serialize incident insertion with admin resolution for this address.
        // This prevents a resolution from being committed against a stale
        // "latest" row while a newer provider event is arriving.
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${email}, 0))`);
        return tx
          .insert(emailDeliveryIncidentsTable)
          .values({
            providerEventId: svixId,
            email,
            type: incidentType,
            reason: reason || null,
          })
          .onConflictDoNothing({ target: emailDeliveryIncidentsTable.providerEventId })
          .returning({ id: emailDeliveryIncidentsTable.id });
      });
      if (recorded.length > 0) {
        console.warn(
          `[webhooks/resend] recorded ${incidentType} for ${email}${reason ? ` · ${reason}` : ""} (event ${svixId})`,
        );
      }
    } catch (err) {
      // A DB hiccup shouldn't make Resend retry forever, but we do want to
      // know · log and 500 so Resend redelivers a genuinely-lost event.
      console.error("[webhooks/resend] failed to record incident", err);
      res.status(500).json({ error: "RECORD_FAILED" });
      return;
    }

    res.json({ ok: true, recorded: incidentType });
  },
);

export default router;
