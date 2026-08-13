---
name: feelzlike prod sign-up verification
description: How to verify the production Clerk sign-up chain, and why automated e2e sign-up on prod is impossible.
---

# Production sign-up chain — verification playbook (Aug 2026)

Verified-good chain on feelzlike.com:
- Deployed bundle uses **pk_live** (decodes to clerk.www.feelzlike.com). The `pk_test_` strings in the bundle are Clerk SDK prefix constants, NOT a dev key. No "development keys" console warning in prod.
- Clerk frontend API DNS (clerk.www.feelzlike.com etc.) is intentionally ABSENT — the app proxies FAPI at `/api/__clerk` (api-server clerkProxyMiddleware, prod-only). `curl https://feelzlike.com/api/__clerk/v1/environment` is the health check; it must return `instance_environment_type: production`.
- Sign-up config: public mode, email+password, email_code verify at sign-up, smart captcha ON, no allowlist/blocklist.
- Workspace CLERK_SECRET_KEY is the DEV instance; production deployment holds a different prod secret you cannot read. Query prod state via the production DB (users table), not the Clerk API.

**Hard limit:** Clerk's smart captcha (Cloudflare Turnstile) reliably blocks Playwright/automated browsers on prod sign-up with error 600010 / "CAPTCHA failed to load … unsupported browser or extension". This is anti-automation, not a site bug — do NOT keep retrying or "fix" it in code; the only true e2e proof is a human doing a manual sign-up (owner asked to do this from a phone, Aug 2026).

**Why:** two full tester runs (mobile + desktop, human-like pacing, 3 checkbox retries) failed identically at Turnstile while every other leg (blurred gate → prompt → Clerk UI via proxy → captcha) worked.
