---
name: feelzlike alert emails
description: branded email templates + Resend sender domain state for powder alert emails
---

## Templates
- Shared shell `brandedEmail` in api-server `src/lib/emailTemplates.ts`: white header with hosted wordmark img (`{PUBLIC_ORIGIN|https://feelzlike.com}/branding/wordmark-inline.png` — emails need absolute prod URLs even from dev), tagline "real conditions for mountain travel", 70/30 blue(#0c75df)/pink(#ec008c) accent bar, blue CTA, pink snow-cm figures, lowercase voice with middots, inline styles only (clients strip `<style>`).
- #0c75df IS the app `--primary: hsl(210 90% 46%)` — keep in sync if the app primary ever changes.
- No emojis in subjects (snowflake char was removed on purpose — brand voice).
- wordmark-inline.png is RGB with baked white background, so dark-mode inversion is a non-issue.

## Subscription product rule
Powder email alerts are a permanent standard feature. Anyone may start a
subscription without an account, but explicit consent and email verification
remain mandatory. Signup invitations and forms stay visible year-round.
**Why:** account/premium gates and seasonal hiding removed the retention path.
**How to apply:** preserve double opt-in and one-click unsubscribe, but never add
an auth or premium entitlement requirement to powder-alert signup.

## Sender — VERIFIED + LIVE (19 jul 2026)
- feelzlike.com is verified in Resend; `ALERT_FROM_EMAIL` is set (shared env) to `feelzlike <info@feelzlike.com>` (owner decision 27 jul 2026: info@ is THE address everywhere — sender, reply-to, legal pages, footer, API user-agents; old enquiries@navigatework.com.au and hello@/contact@/alerts@ variants were replaced). Production picks it up on next publish.
- FROM is env-driven with fallback `feelzlike alerts <onboarding@resend.dev>` (delivers to account owner only) — that fallback only matters if the env var is ever deleted.
- **Why env-checking is awkward:** the RESEND_API_KEY is a send-only restricted key — `GET /domains` returns 401. To check verification without dashboard access, test-send from the domain to Resend's sink `delivered@resend.dev`: 200 = verified, error = not yet.
- Exchange Online root MX/SPF untouched by Resend's records (they live on Resend's own subdomain); keep Resend "Enable Receiving" OFF or it would fight the Microsoft MX.
## Send-failure honesty (jul 2026)
- `sendEmail` returns `permanent` (Resend 4xx except 429 = retry won't help) and logs a per-address consecutive-failure counter; the magic-link request route returns 502 EMAIL_SEND_FAILED instead of a fake "check your email" when a real provider send fails. Console/dev mode still fakes "sent" + devVerifyUrl. Don't reintroduce always-200 on send failure.
- Sync-only: Resend can accept (200) then bounce async — those still look "sent" without bounce webhooks.

- alerts@feelzlike.com is send-only (no mailbox) — all sends set `reply_to` (env `ALERT_REPLY_TO_EMAIL`, default `info@feelzlike.com`, the owner's real Exchange mailbox; enquiries@ aliases to it). Owner's mailbox/alias setup lives in Webcentral/Microsoft, never in our DNS or code.

## Email link base URL (Aug 2026 incident)
All outbound email links (magic sign-in, alert verify/manage/unsubscribe) come from `getAppPublicUrl()` in api-server/src/lib/appUrl.ts.
**Why:** Replit deployments ALSO expose REPLIT_DEV_DOMAIN, so the old dev-domain fallback sent real production visitors sign-in links to a dead *.replit.dev page — silent zero-signup failure discovered only when the owner clicked his own ad.
**How to apply:** the helper now returns the canonical origin (PUBLIC_ORIGIN ?? feelzlike.com) whenever REPLIT_DEPLOYMENT is set; never reintroduce a dev-domain fallback that can run in a deployment, and verify a real emailed link after publishing auth/email changes.
