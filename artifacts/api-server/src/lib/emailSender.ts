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
}

const FROM = process.env.ALERT_FROM_EMAIL ?? "feelzlike alerts <onboarding@resend.dev>";

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

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
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
      console.warn(`[emailSender] Resend ${res.status}: ${body}`);
      return { delivered: false, provider: "resend", error: `${res.status}: ${body.slice(0, 200)}` };
    }
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { delivered: true, provider: "resend", providerId: json.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[emailSender] send failed:`, message);
    return { delivered: false, provider: "resend", error: message };
  }
}
