---
name: feelzlike alert emails
description: branded email templates + Resend sender domain state for powder alert emails
---

## Templates
- Shared shell `brandedEmail` in api-server `src/lib/emailTemplates.ts`: white header with hosted wordmark img (`{PUBLIC_ORIGIN|https://feelzlike.com}/branding/wordmark-inline.png` — emails need absolute prod URLs even from dev), tagline "real conditions for mountain travel", 70/30 blue(#0c75df)/pink(#ec008c) accent bar, blue CTA, pink snow-cm figures, lowercase voice with middots, inline styles only (clients strip `<style>`).
- #0c75df IS the app `--primary: hsl(210 90% 46%)` — keep in sync if the app primary ever changes.
- No emojis in subjects (snowflake char was removed on purpose — brand voice).
- wordmark-inline.png is RGB with baked white background, so dark-mode inversion is a non-issue.

## Sender (the real fix is external)
- FROM is env-driven: `ALERT_FROM_EMAIL`, fallback `feelzlike alerts <onboarding@resend.dev>` (delivers to account owner only).
- **Why:** Resend refuses to send from feelzlike.com until the domain is verified in the Resend dashboard (DKIM + return-path DNS records on Resend's own subdomain; Exchange Online root MX/SPF untouched, mailboxes unaffected).
- **How to apply:** once the owner confirms the domain shows "verified" in Resend, set `ALERT_FROM_EMAIL` to `feelzlike alerts <alerts@feelzlike.com>` via the environment-secrets flow (dev + deployment) and have the owner re-publish. Do NOT set it before verification — Resend 403s and alerts silently stop delivering.
