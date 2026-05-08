import { brandedEmail } from "./emailTemplates.js";

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
          <td style="padding:6px 0;font-size:14px;color:#0a1628;font-weight:600;width:38%;vertical-align:top;">${b.label}</td>
          <td style="padding:6px 0;font-size:14px;color:#334155;vertical-align:top;">${b.value}</td>
        </tr>`,
    )
    .join("");
  return `
    <div style="margin:0 0 28px 0;padding:0 0 28px 0;border-bottom:1px solid #e2e8f0;">
      <div style="font-size:11px;color:#3b82f6;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;margin-bottom:6px;">${s.regionLabel}</div>
      <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#0a1628;margin:0 0 10px 0;line-height:1.3;">${s.headline}</h2>
      <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px 0;">${s.feelzlikeRead}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:12px 0 16px 0;background:#f8fafc;border-radius:8px;padding:10px 14px;">
        ${bullets}
      </table>
      <p style="font-size:13px;line-height:1.55;color:#64748b;margin:0 0 14px 0;font-style:italic;">${s.thisWeek}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 0 0;">
        <tr><td style="border-radius:6px;background:#3b82f6;">
          <a href="${s.ctaUrl}" style="display:inline-block;padding:10px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.02em;">${s.ctaLabel}</a>
        </td></tr>
      </table>
    </div>`;
}

/**
 * The fortnightly digest. Two regions, "feelzlike read" up top, then
 * the punchy bullets, then off-mountain notes (drive / stay / eat).
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
  const body =
    `<p style="font-size:13px;color:#64748b;margin:0 0 24px 0;text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">${dateLabel}</p>` +
    sections.map(renderDigestSection).join("");

  const footerHtml = `You're receiving this because you subscribed to the feelzlike newsletter.<br>
    <a href="${opts.unsubscribeUrl}" style="color:#3b82f6;text-decoration:underline;">Unsubscribe</a>${opts.manageUrl ? ` &middot; <a href="${opts.manageUrl}" style="color:#3b82f6;text-decoration:underline;">Manage preferences</a>` : ""}`;

  const html = brandedEmail({
    preheader: sections[0]?.headline ?? "Your fortnightly mountain read.",
    heading: "What the mountains are doing",
    bodyHtml: body,
    footerHtml,
  });

  const text =
    `feelzlike — ${dateLabel}\n\n` +
    sections
      .map(
        (s) =>
          `${s.regionLabel.toUpperCase()}\n${s.headline}\n\n${s.feelzlikeRead}\n\n` +
          s.bullets.map((b) => `  ${b.label}: ${b.value}`).join("\n") +
          `\n\n${s.thisWeek}\n\n${s.ctaLabel}: ${s.ctaUrl}\n`,
      )
      .join("\n---\n\n") +
    `\nUnsubscribe: ${opts.unsubscribeUrl}\n`;

  return { subject: "feelzlike: what the mountains are doing", html, text };
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
