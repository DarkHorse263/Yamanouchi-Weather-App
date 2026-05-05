/**
 * Branded HTML email templates. Inline styles only — most clients (Gmail,
 * Outlook desktop, Apple Mail) strip <style> blocks aggressively.
 *
 * Brand: navy (#0a1628) header, Lato/system body, sky-blue (#3b82f6) CTA.
 * Always include the unsubscribe footer on every alert email — both because
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
const BRAND_BLUE = "#3b82f6";

export function brandedEmail(opts: BrandedEmailOpts): string {
  const { preheader, heading, bodyHtml, ctaLabel, ctaUrl, footerHtml } = opts;
  const cta = ctaLabel && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
         <tr><td style="border-radius:8px;background:${BRAND_BLUE};">
           <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.02em;">${ctaLabel}</a>
         </td></tr>
       </table>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0a1628;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;">${preheader}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f6f8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(10,22,40,0.06);">
        <tr><td style="background:${BRAND_NAVY};padding:24px 32px;">
          <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.01em;">FeelZlike</div>
          <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.12em;margin-top:4px;">Mountain weather, told straight.</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:${BRAND_NAVY};margin:0 0 16px 0;line-height:1.25;">${heading}</h1>
          <div style="font-size:15px;line-height:1.6;color:#334155;">${bodyHtml}</div>
          ${cta}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.5;">
          ${footerHtml ?? "You're receiving this because you subscribed to FeelZlike powder alerts."}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function verificationEmail(verifyUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Confirm your FeelZlike powder alerts",
    html: brandedEmail({
      preheader: "One click to confirm your subscription. We won't email you until you do.",
      heading: "Confirm your subscription",
      bodyHtml: `<p>Thanks for signing up to powder alerts.</p>
        <p>Click the button below to confirm your email and activate your alerts. We won't send you anything until you do.</p>
        <p style="font-size:13px;color:#64748b;">If you didn't sign up, just ignore this email — nothing happens until you click.</p>`,
      ctaLabel: "Confirm subscription",
      ctaUrl: verifyUrl,
      footerHtml: `If the button doesn't work, paste this URL into your browser:<br><span style="word-break:break-all;color:#3b82f6;">${verifyUrl}</span>`,
    }),
    text: `Confirm your FeelZlike powder alerts\n\nClick to confirm your subscription:\n${verifyUrl}\n\nIf you didn't sign up, ignore this email.`,
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
  const subject = `❄ ${topMountain.name} powder alert: ${topMountain.snowfallCm}cm forecast`;
  const otherList = otherMountains.length > 0
    ? `<h3 style="font-family:Georgia,serif;font-size:16px;color:${BRAND_NAVY};margin:24px 0 8px 0;">Also worth a look</h3>
       <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#334155;line-height:1.8;">
         ${otherMountains.map((m) =>
            `<li><strong>${m.name}</strong> — ${m.snowfallCm}cm${m.windKph != null ? `, wind ${m.windKph} km/h` : ""}${m.driveMins != null ? `, ${m.driveMins} min drive` : ""}</li>`
          ).join("")}
       </ul>`
    : "";
  return {
    subject,
    html: brandedEmail({
      preheader: `${topMountain.snowfallCm}cm forecast at ${topMountain.name}. Open to see your full picture.`,
      heading: `Powder incoming at ${topMountain.name}`,
      bodyHtml: `
        <p style="font-size:18px;font-weight:600;color:${BRAND_NAVY};margin:0 0 8px 0;">${topMountain.snowfallCm}cm forecast in your alert window.</p>
        <p style="margin:0 0 16px 0;">${topMountain.windKph != null ? `Wind ${topMountain.windKph} km/h. ` : ""}${topMountain.driveMins != null ? `${topMountain.driveMins} min from your saved town.` : ""}</p>
        ${otherList}`,
      ctaLabel: "See Today's Call",
      ctaUrl: todaysCallUrl,
      footerHtml: `<a href="${manageUrl}" style="color:#3b82f6;text-decoration:none;">Manage your alert preferences</a> · <a href="${unsubscribeUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe in one click</a>`,
    }),
    text: `Powder incoming at ${topMountain.name}\n\n${topMountain.snowfallCm}cm forecast in your alert window.\n\nSee Today's Call: ${todaysCallUrl}\n\nManage preferences: ${manageUrl}\nUnsubscribe: ${unsubscribeUrl}`,
  };
}
