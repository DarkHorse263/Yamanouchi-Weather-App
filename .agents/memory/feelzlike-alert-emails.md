---
name: feelzlike alert emails
description: branded email templates + Resend sender domain state for powder alert emails
---

## Templates
- Shared shell `brandedEmail` in api-server `src/lib/emailTemplates.ts`: white header with hosted wordmark img (`{PUBLIC_ORIGIN|https://feelzlike.com}/branding/wordmark-inline.png` — emails need absolute prod URLs even from dev), tagline "real conditions for mountain travel", 70/30 blue(#0c75df)/pink(#ec008c) accent bar, blue CTA, pink snow-cm figures, lowercase voice with middots, inline styles only (clients strip `<style>`).
- #0c75df IS the app `--primary: hsl(210 90% 46%)` — keep in sync if the app primary ever changes.
- No emojis in subjects (snowflake char was removed on purpose — brand voice).
- wordmark-inline.png is RGB with baked white background, so dark-mode inversion is a non-issue.

## Sender — VERIFIED + LIVE (19 jul 2026)
- feelzlike.com is verified in Resend; `ALERT_FROM_EMAIL` is set (shared env) to `feelzlike alerts <alerts@feelzlike.com>`. Production picks it up on next publish.
- FROM is env-driven with fallback `feelzlike alerts <onboarding@resend.dev>` (delivers to account owner only) — that fallback only matters if the env var is ever deleted.
- **Why env-checking is awkward:** the RESEND_API_KEY is a send-only restricted key — `GET /domains` returns 401. To check verification without dashboard access, test-send from the domain to Resend's sink `delivered@resend.dev`: 200 = verified, error = not yet.
- Exchange Online root MX/SPF untouched by Resend's records (they live on Resend's own subdomain); keep Resend "Enable Receiving" OFF or it would fight the Microsoft MX.
- alerts@feelzlike.com is send-only (no mailbox) — all sends set `reply_to` (env `ALERT_REPLY_TO_EMAIL`, default `info@feelzlike.com`, the owner's real Exchange mailbox; enquiries@ aliases to it). Owner's mailbox/alias setup lives in Webcentral/Microsoft, never in our DNS or code.
