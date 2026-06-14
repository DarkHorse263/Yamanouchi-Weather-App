---
name: feelzlike security posture
description: What the security scanners flag on feelzlike and which findings are real vs public-by-design false positives.
---

# feelzlike security posture (pre-launch audit)

The Express api-server is well-hardened in `app.ts`: helmet (CSP/frameguard intentionally off for the SPA-in-iframe preview), strict CORS allowlist (no `*` reflection, credentials bounded by SameSite=Lax + admin allowlist), 100kb body limits, JSON-parse-error guard, global 120/min + places 30/min rate limits, and a catch-all error handler that suppresses stack traces in prod. Admin surface (`routes/admin.ts`) adds session + `ADMIN_EMAILS` allowlist + an origin-pinning CSRF guard, and applies an `escapeHtml` helper in its markdown/email renderers.

## SAST "HIGH secret" findings are false positives — do NOT treat as leaks
- `lib/supabase.ts` JWT = Supabase **anon** key (role:"anon"), public-by-design and genuinely used in `routes/snow.ts`. **Why:** anon keys are meant to be embedded; security depends on Supabase **RLS** being enabled (external infra, not checkable from code).
- `feelzlike/index.html` "generic-api-key" = NavigateWork client analytics key — public-by-design (like a GA id).
- `attached_assets/*.swift` JWT = same anon key in an uploaded iOS reference file (not shipped app code).
- No private secrets are committed (no service_role / sk_live / AKIA / PEM). Real secrets live in env vars.

## Other scanner noise
- html-in-template MEDIUMs in `emailTemplates.ts` / `newsletterEmailTemplates.ts` interpolate only **server-controlled** data (catalog mountain names, numbers, generated URLs) — no user free-text. Admin HTML uses `escapeHtml`.
- direct-response-write MEDIUMs in `radar.ts` / `places-google.ts` are binary image proxies (allowlist-validated, correct content-type) — not HTML XSS.
- Dependency highs/moderates are all dev/build/transitive (vite, esbuild, ws, lodash, qs, brace-expansion, uuid); vite/esbuild ones affect the dev server only, not the prod static build.

**How to apply:** on a future security pass, skip re-investigating the above; focus any real effort on (1) confirming Supabase RLS, (2) routine dependency bumps.
