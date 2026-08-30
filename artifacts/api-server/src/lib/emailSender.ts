import { db, emailDeliveryIncidentsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

/**
 * Email sender. Uses Resend if `RESEND_API_KEY` is set; otherwise logs to
 * console (dev-mode fallback) so the rest of the alert flow is testable
 * without provisioning a real email account.
 *
 * From address comes from `ALERT_FROM_EMAIL`. Default falls back to Resend's
 * `onboarding@resend.dev`, which only delivers to the account owner's email.
 * NOTE: Resend requires the from-domain to be verified (DNS records added in
 * the Resend dashboard) before it will send from feelzlike.com to arbitrary
 * addresses. Once verified, set ALERT_FROM_EMAIL to
 * `feelzlike alerts <alerts@feelzlike.com>`. Exchange Online keeps handling
 * inbound mail - Resend's records live on its own subdomain, so the root
 * MX/SPF for the mailbox are untouched.
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag?: string;
}

interface SendResult {
  delivered: boolean;
  provider: "resend" | "console";
  providerId?: string;
  error?: string;
  /**
   * True when the provider rejected the message outright (HTTP 4xx, e.g. an
   * invalid or suppressed recipient) - retrying the same address won't help,
   * so callers should surface it instead of pretending the email is coming.
   */
  permanent?: boolean;
}

// Repeated-failure visibility: count consecutive failed sends per address so
// server logs show "this address keeps failing" instead of isolated warnings.
// In-memory only (resets on restart) - it's a log signal, not a data store.
const failureCounts = new Map<string, { count: number; last: number }>();
const FAILURE_MAP_CAP = 500;

function noteSendFailure(to: string, detail: string): void {
  const key = to.trim().toLowerCase();
  const count = (failureCounts.get(key)?.count ?? 0) + 1;
  failureCounts.set(key, { count, last: Date.now() });
  if (failureCounts.size > FAILURE_MAP_CAP) {
    let oldestKey: string | null = null;
    let oldestLast = Infinity;
    for (const [k, v] of failureCounts) {
      if (v.last < oldestLast) {
        oldestLast = v.last;
        oldestKey = k;
      }
    }
    if (oldestKey) failureCounts.delete(oldestKey);
  }
  console.warn(`[emailSender] send to ${key} failed (${count} failure${count === 1 ? "" : "s"} so far): ${detail}`);
}

function clearSendFailures(to: string): void {
  failureCounts.delete(to.trim().toLowerCase());
}

const FROM = process.env.ALERT_FROM_EMAIL ?? "feelzlike alerts <onboarding@resend.dev>";
// alerts@feelzlike.com is a send-only identity, not a real mailbox - replies
// must land somewhere monitored. info@ is the owner's Exchange mailbox (the
// enquiries@ alias forwards there too).
const REPLY_TO = process.env.ALERT_REPLY_TO_EMAIL ?? "info@feelzlike.com";

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n[emailSender] (no RESEND_API_KEY) would send:\n  to: ${args.to}\n  subject: ${args.subject}\n  text:\n${args.text.split("\n").map((l) => "    " + l).join("\n")}\n`);
    return { delivered: false, provider: "console" };
  }

  // Reject obvious placeholder values to avoid silent failures in production
  if (apiKey.length < 10 || apiKey === "placeholder") {
    console.warn("[emailSender] RESEND_API_KEY looks like a placeholder - skipping send");
    return { delivered: false, provider: "console", error: "placeholder_api_key" };
  }

  const normalizedTo = args.to.trim().toLowerCase();
  try {
    const [incident] = await db
      .select({
        type: emailDeliveryIncidentsTable.type,
        createdAt: emailDeliveryIncidentsTable.createdAt,
        resolvedAt: emailDeliveryIncidentsTable.resolvedAt,
      })
      .from(emailDeliveryIncidentsTable)
      .where(eq(emailDeliveryIncidentsTable.email, normalizedTo))
      .orderBy(desc(emailDeliveryIncidentsTable.createdAt), desc(emailDeliveryIncidentsTable.id))
      .limit(1);
    if (incident && !incident.resolvedAt) {
      const detail = `known ${incident.type} recipient (${incident.createdAt.toISOString()})`;
      noteSendFailure(normalizedTo, detail);
      return {
        delivered: false,
        provider: "resend",
        error: `known_delivery_incident:${incident.type}`,
        permanent: true,
      };
    }
  } catch (err) {
    // Do not bypass complaint/bounce suppression when its durable record is
    // unavailable. Callers receive a transient failure and may retry once the
    // database recovers.
    console.error("[emailSender] could not check delivery incidents · send suppressed:", err);
    return {
      delivered: false,
      provider: "resend",
      error: "delivery_incident_check_failed",
      permanent: false,
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        reply_to: REPLY_TO,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        ...(args.tag ? { tags: [{ name: "category", value: args.tag }] } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // 4xx = the provider rejected this message (bad recipient, suppressed
      // address, validation error) - a retry with the same input won't help.
      // 5xx / network = transient provider trouble.
      const permanent = res.status >= 400 && res.status < 500 && res.status !== 429;
      noteSendFailure(args.to, `Resend ${res.status}: ${body.slice(0, 200)}`);
      return { delivered: false, provider: "resend", error: `${res.status}: ${body.slice(0, 200)}`, permanent };
    }
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    clearSendFailures(args.to);
    return { delivered: true, provider: "resend", providerId: json.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    noteSendFailure(args.to, message);
    return { delivered: false, provider: "resend", error: message, permanent: false };
  }
}
