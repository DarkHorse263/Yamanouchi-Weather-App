import { brandedEmail } from "./emailTemplates.js";

// `brandedEmail` is still the canonical chrome for transactional emails
// (verification, alerts). The newsletter digest uses its own renderer
// because the wordmark + headline + palette differ from the older
// alerts chrome. Keep the import so existing call-sites elsewhere in
// this module (verification email) continue to compile.

// Brand palette pulled from the feelzlike wordmark + site nav.
const BRAND = {
  navy: "#0a2240",
  ink: "#1a3556",
  sky: "#3b82f6",
  skyDeep: "#1e5fc7",
  paper: "#f5f8fc",
  rule: "#dbe5f0",
  muted: "#5b6b80",
};

/**
 * Sample digest content used by the newsletter preview route. Real
 * digests will pull from the same Open-Meteo + radar + lifts data
 * the site uses, but this captures the structure + voice we're aiming
 * for: terse, plain-English, "feelzlike voice", country-relevant.
 */
export interface DigestSection {
  region: "snowy-mountains" | "yamanouchi";
  regionLabel: string;
  headline: string;
  feelzlikeRead: string;
  bullets: { label: string; value: string }[];
  thisWeek: string;
  ctaLabel: string;
  ctaUrl: string;
}

export function sampleDigest(baseUrl: string): DigestSection[] {
  return [
    {
      region: "snowy-mountains",
      regionLabel: "Snowy Mountains, AU",
      headline: "Cold front Friday. Worth the drive.",
      feelzlikeRead:
        "Feels like winter is finally showing up. A southerly front rolls in late Thursday and parks over the range Friday into Saturday. 20-30cm at Perisher and Thredbo by Sunday lunch is a fair bet, with lifts reopening higher up. Quiet again Monday.",
      bullets: [
        { label: "Perisher", value: "23cm forecast · -6°C · lifts open" },
        { label: "Thredbo", value: "27cm forecast · -7°C · most lifts spinning" },
        { label: "Selwyn", value: "12cm · base still thin, weekday only" },
        { label: "Charlotte's Pass", value: "21cm · road chains required Fri PM" },
      ],
      thisWeek:
        "Drive: black ice on the Alpine Way from 5am Friday. Stay: Jindabyne booked out Sat, Berridale still has rooms.",
      ctaLabel: "Open Snowy Mountains",
      ctaUrl: `${baseUrl}/snowy-mountains/`,
    },
    {
      region: "yamanouchi",
      regionLabel: "Yamanouchi, JP",
      headline: "Spring in Shibu Onsen. Snow monkeys still around.",
      feelzlikeRead:
        "Feels like the season turned overnight. Plum blossoms out in the village, monkeys still bathing daily at Jigokudani (less crowded now the snow's gone). Shiga Kogen closed for the season Sunday, but onsen-hopping weather is perfect.",
      bullets: [
        { label: "Yudanaka", value: "16°C · light drizzle · onsen weather" },
        { label: "Shibu Onsen", value: "All 9 outer baths open · book the stamp tour" },
        { label: "Jigokudani", value: "Monkey park open 8:30-17:00 daily" },
        { label: "Shiga Kogen", value: "Lifts closed · summer trails open mid-June" },
      ],
      thisWeek:
        "Eat: enzo soba pop-up at Yorozuya weekends only. Stay: kaiseki ryokan rates drop ~30% from next week.",
      ctaLabel: "Open Yamanouchi",
      ctaUrl: `${baseUrl}/yamanouchi/`,
    },
  ];
}

function renderDigestSection(s: DigestSection): string {
  const bullets = s.bullets
    .map(
      (b) =>
        `<tr>
          <td style="padding:7px 0;font-size:14px;color:${BRAND.navy};font-weight:600;width:40%;vertical-align:top;">${b.label}</td>
          <td style="padding:7px 0;font-size:14px;color:${BRAND.ink};vertical-align:top;">${b.value}</td>
        </tr>`,
    )
    .join("");
  return `
    <div style="margin:0 0 32px 0;padding:0 0 32px 0;border-bottom:1px solid ${BRAND.rule};">
      <div style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;margin-bottom:8px;">${s.regionLabel}</div>
      <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${BRAND.navy};margin:0 0 12px 0;line-height:1.25;">${s.headline}</h2>
      <p style="font-size:15px;line-height:1.65;color:${BRAND.ink};margin:0 0 18px 0;">${s.feelzlikeRead}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:14px 0 18px 0;background:${BRAND.paper};border-radius:10px;">
        <tr><td style="padding:10px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${bullets}
          </table>
        </td></tr>
      </table>
      <p style="font-size:13px;line-height:1.6;color:${BRAND.muted};margin:0 0 16px 0;">${s.thisWeek}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 0 0;">
        <tr><td style="border-radius:6px;background:${BRAND.sky};">
          <a href="${s.ctaUrl}" style="display:inline-block;padding:11px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.02em;">${s.ctaLabel} &rarr;</a>
        </td></tr>
      </table>
    </div>`;
}

/**
 * Build the full branded digest as a self-contained HTML document. We
 * deliberately don't reuse `brandedEmail` here because the newsletter
 * needs the lowercase feelzlike wordmark logo, the new "What it
 * feelzlike in the mountains" headline, and the brand palette from
 * the site (not the older alerts-email navy chrome).
 *
 * `logoUrl` should be an absolute URL the recipient's mail client can
 * fetch. The feelzlike SPA serves the logo at /branding/logo-full.png,
 * which the api-server proxies in production and which Vite serves in
 * dev (same origin via the workspace proxy).
 */
export function newsletterDigestEmail(opts: {
  baseUrl: string;
  unsubscribeUrl: string;
  manageUrl?: string;
  sections?: DigestSection[];
  dateLabel?: string;
}): { subject: string; html: string; text: string } {
  const sections = opts.sections ?? sampleDigest(opts.baseUrl);
  const dateLabel = opts.dateLabel ?? "This fortnight";
  const logoUrl = `${opts.baseUrl}/branding/logo-full.png`;
  const headline = "What it feelzlike in the mountains";

  const body = sections.map(renderDigestSection).join("");

  const footerHtml = `You're getting this because you subscribed to the feelzlike newsletter.<br>
    <a href="${opts.unsubscribeUrl}" style="color:${BRAND.skyDeep};text-decoration:underline;">Unsubscribe</a>${opts.manageUrl ? ` &middot; <a href="${opts.manageUrl}" style="color:${BRAND.skyDeep};text-decoration:underline;">Manage preferences</a>` : ""}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${headline}</title></head>
<body style="margin:0;padding:0;background:${BRAND.paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.navy};">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;">${sections[0]?.headline ?? "Your mountain read."}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.paper};padding:28px 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(10,34,64,0.07);">

        <!-- Header: logo + tagline. White background so the colour wordmark reads naturally. -->
        <tr><td style="padding:28px 36px 20px 36px;text-align:center;border-bottom:1px solid ${BRAND.rule};">
          <img src="${logoUrl}" alt="feelzlike" width="180" style="display:block;margin:0 auto 6px auto;width:180px;max-width:60%;height:auto;border:0;outline:none;text-decoration:none;">
          <div style="font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.18em;margin-top:4px;">Mountain weather, told straight.</div>
        </td></tr>

        <!-- Hero -->
        <tr><td style="padding:32px 36px 8px 36px;">
          <div style="font-size:11px;color:${BRAND.skyDeep};text-transform:uppercase;letter-spacing:0.16em;font-weight:700;margin-bottom:10px;">${dateLabel}</div>
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;color:${BRAND.navy};margin:0 0 6px 0;line-height:1.2;letter-spacing:-0.005em;">${headline}</h1>
          <div style="height:3px;width:48px;background:${BRAND.sky};border-radius:2px;margin:14px 0 0 0;"></div>
        </td></tr>

        <!-- Sections -->
        <tr><td style="padding:28px 36px 8px 36px;">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 36px 24px 36px;font-size:12px;color:${BRAND.muted};line-height:1.55;background:${BRAND.paper};">
          ${footerHtml}
        </td></tr>
      </table>
      <div style="font-size:11px;color:${BRAND.muted};margin-top:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        feelzlike &middot; Snowy Mountains, AU &middot; Yamanouchi, JP
      </div>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `feelzlike. ${headline}.\n${dateLabel}.\n\n` +
    sections
      .map(
        (s) =>
          `${s.regionLabel.toUpperCase()}\n${s.headline}\n\n${s.feelzlikeRead}\n\n` +
          s.bullets.map((b) => `  ${b.label}: ${b.value}`).join("\n") +
          `\n\n${s.thisWeek}\n\n${s.ctaLabel}: ${s.ctaUrl}\n`,
      )
      .join("\n---\n\n") +
    `\nUnsubscribe: ${opts.unsubscribeUrl}\n`;

  return { subject: `feelzlike: ${headline.toLowerCase()}`, html, text };
}

/**
 * Newsletter email templates. Re-uses the shared `brandedEmail` chrome
 * (navy header, sky-blue CTA, inline styles) so newsletter emails look
 * the same as alert emails — same brand, different cadence and content.
 */

export function newsletterVerificationEmail(verifyUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: "Confirm your feelzlike newsletter",
    html: brandedEmail({
      preheader: "One click to confirm. We won't email you until you do.",
      heading: "Confirm your subscription",
      bodyHtml: `<p>Thanks for signing up to the feelzlike newsletter.</p>
        <p>Click below to confirm. You'll get a short, plain-English read on what the next stretch of mountain weather will actually feel like — no hype, no daily noise.</p>
        <p style="font-size:13px;color:#64748b;">If you didn't sign up, just ignore this email — nothing happens until you click.</p>`,
      ctaLabel: "Confirm subscription",
      ctaUrl: verifyUrl,
      footerHtml: `If the button doesn't work, paste this URL into your browser:<br><span style="word-break:break-all;color:#3b82f6;">${verifyUrl}</span>`,
    }),
    text: `Confirm your feelzlike newsletter\n\nClick to confirm:\n${verifyUrl}\n\nIf you didn't sign up, ignore this email.`,
  };
}
