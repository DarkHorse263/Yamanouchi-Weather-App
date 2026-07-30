/**
 * Branded HTML email templates. Inline styles only - most clients (Gmail,
 * Outlook desktop, Apple Mail) strip <style> blocks aggressively.
 *
 * Brand (mirrors the app):
 *  - white header with the real wordmark image (hosted on the prod site -
 *    email clients need an absolute URL, so dev emails also point at prod)
 *    over the tagline "real conditions for mountain travel"
 *  - blue + pink scheme: primary blue (#0c75df) CTA, snow-accent pink
 *    (#ec008c) for snow figures and the header accent bar - same convention
 *    as the app, where snow amounts render pink
 *  - lowercase voice with middots, no em/en dashes, no emojis
 *
 * Always include the unsubscribe footer on every alert email - both because
 * the playbook insists and because it's the law in AU (Spam Act 2003) + JP
 * (Act on Specified Commercial Transactions).
 */

interface BrandedEmailOpts {
  preheader: string; // hidden inbox preview
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerHtml?: string;
}

const BRAND_NAVY = "#0a1628";
const BRAND_BLUE = "#0c75df"; // app --primary: hsl(210 90% 46%)
const BRAND_PINK = "#ec008c"; // app --color-snow-accent
const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// feelzlike.app does not exist - always .com. Emails must use an absolute
// image URL, so even dev-sent mail loads the wordmark from production.
const LOGO_URL = `${(process.env.PUBLIC_ORIGIN ?? "https://feelzlike.com").replace(/\/$/, "")}/branding/wordmark-inline.png`;

export function brandedEmail(opts: BrandedEmailOpts): string {
  const { preheader, heading, bodyHtml, ctaLabel, ctaUrl, footerHtml } = opts;
  const cta = ctaLabel && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
         <tr><td style="border-radius:8px;background:${BRAND_BLUE};">
           <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};font-size:15px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.02em;">${ctaLabel}</a>
         </td></tr>
       </table>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:#f0f6fc;font-family:${FONT_STACK};color:${BRAND_NAVY};">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;">${preheader}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f0f6fc;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(10,22,40,0.06);">
        <tr><td align="center" style="background:#ffffff;padding:28px 32px 20px 32px;">
          <img src="${LOGO_URL}" width="190" height="46" alt="feelzlike" style="display:block;width:190px;height:auto;border:0;">
          <div style="font-family:${FONT_STACK};font-size:11px;color:#64748b;text-transform:lowercase;letter-spacing:0.14em;margin-top:10px;">real conditions for mountain travel</div>
        </td></tr>
        <tr><td style="padding:0;font-size:0;line-height:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td width="70%" style="height:4px;background:${BRAND_BLUE};font-size:0;line-height:0;">&nbsp;</td>
            <td width="30%" style="height:4px;background:${BRAND_PINK};font-size:0;line-height:0;">&nbsp;</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="font-family:${FONT_STACK};font-size:22px;font-weight:800;color:${BRAND_NAVY};margin:0 0 16px 0;line-height:1.25;text-transform:lowercase;">${heading}</h1>
          <div style="font-size:15px;line-height:1.6;color:#334155;">${bodyHtml}</div>
          ${cta}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.5;">
          ${footerHtml ?? "you're receiving this because you subscribed to feelzlike powder alerts."}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function verificationEmail(verifyUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "confirm your feelzlike powder alerts",
    html: brandedEmail({
      preheader: "one click to confirm your subscription · we won't email you until you do.",
      heading: "confirm your subscription",
      bodyHtml: `<p style="margin:0 0 16px 0;">thanks for signing up to powder alerts.</p>
        <p style="margin:0 0 16px 0;">click the button below to confirm your email and activate your alerts · we won't send you anything until you do.</p>
        <p style="font-size:13px;color:#64748b;margin:0;">if you didn't sign up, just ignore this email · nothing happens until you click.</p>`,
      ctaLabel: "confirm subscription",
      ctaUrl: verifyUrl,
      footerHtml: `if the button doesn't work, paste this URL into your browser:<br><span style="word-break:break-all;color:${BRAND_BLUE};">${verifyUrl}</span>`,
    }),
    text: `confirm your feelzlike powder alerts\n\nclick to confirm your subscription:\n${verifyUrl}\n\nif you didn't sign up, ignore this email.`,
  };
}

export function signInEmail(signInUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "your feelzlike sign-in link",
    html: brandedEmail({
      preheader: "one click to sign in to your free feelzlike account · link expires in 30 minutes.",
      heading: "sign in to feelzlike",
      bodyHtml: `<p style="margin:0 0 16px 0;">click the button below to sign in · no password needed.</p>
        <p style="margin:0 0 16px 0;">this creates your free feelzlike account if you don't have one yet · every premium feature is free for members until 31 december 2026.</p>
        <p style="font-size:13px;color:#64748b;margin:0;">the link expires in 30 minutes. if you didn't request it, just ignore this email · nothing happens until you click.</p>`,
      ctaLabel: "sign in",
      ctaUrl: signInUrl,
      footerHtml: `if the button doesn't work, paste this URL into your browser:<br><span style="word-break:break-all;color:${BRAND_BLUE};">${signInUrl}</span>`,
    }),
    text: `sign in to feelzlike\n\nclick to sign in (link expires in 30 minutes):\n${signInUrl}\n\nif you didn't request this, ignore this email.`,
  };
}

export interface AlertEmailMountain {
  name: string;
  region: string;
  snowfallCm: number;
  windKph?: number | null;
  driveMins?: number | null;
}

export function powderAlertEmail(opts: {
  topMountain: AlertEmailMountain;
  otherMountains: AlertEmailMountain[];
  todaysCallUrl: string;
  manageUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } {
  const { topMountain, otherMountains, todaysCallUrl, manageUrl, unsubscribeUrl } = opts;
  const subject = `${topMountain.name} powder alert · ${topMountain.snowfallCm}cm forecast`;
  const otherList = otherMountains.length > 0
    ? `<h3 style="font-family:${FONT_STACK};font-size:15px;font-weight:800;color:${BRAND_NAVY};margin:24px 0 8px 0;text-transform:lowercase;">also worth a look</h3>
       <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#334155;line-height:1.8;">
         ${otherMountains.map((m) =>
            `<li><strong>${m.name}</strong> · <span style="color:${BRAND_PINK};font-weight:700;">${m.snowfallCm}cm</span>${m.windKph != null ? ` · wind ${m.windKph} km/h` : ""}${m.driveMins != null ? ` · ${m.driveMins} min drive` : ""}</li>`
          ).join("")}
       </ul>`
    : "";
  return {
    subject,
    html: brandedEmail({
      preheader: `${topMountain.snowfallCm}cm forecast at ${topMountain.name} · open to see your full picture.`,
      heading: `powder incoming at ${topMountain.name}`,
      bodyHtml: `
        <p style="font-size:18px;font-weight:700;color:${BRAND_NAVY};margin:0 0 8px 0;"><span style="color:${BRAND_PINK};">${topMountain.snowfallCm}cm</span> forecast in your alert window.</p>
        <p style="margin:0 0 16px 0;">${topMountain.windKph != null ? `wind ${topMountain.windKph} km/h. ` : ""}${topMountain.driveMins != null ? `${topMountain.driveMins} min from your saved town.` : ""}</p>
        ${otherList}`,
      ctaLabel: "see today's call",
      ctaUrl: todaysCallUrl,
      footerHtml: `<a href="${manageUrl}" style="color:${BRAND_BLUE};text-decoration:none;">manage your alert preferences</a> · <a href="${unsubscribeUrl}" style="color:#64748b;text-decoration:underline;">unsubscribe in one click</a>`,
    }),
    text: `powder incoming at ${topMountain.name}\n\n${topMountain.snowfallCm}cm forecast in your alert window.\n\nsee today's call: ${todaysCallUrl}\n\nmanage preferences: ${manageUrl}\nunsubscribe: ${unsubscribeUrl}`,
  };
}
