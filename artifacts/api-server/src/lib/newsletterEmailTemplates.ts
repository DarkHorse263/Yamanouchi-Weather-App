import { brandedEmail } from "./emailTemplates.js";

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
