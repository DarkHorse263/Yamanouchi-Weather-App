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
- Never generalize a clean scan into proof that no private secrets are committed; assess current findings without printing credential values.

## Other scanner noise
- html-in-template MEDIUMs in `emailTemplates.ts` / `newsletterEmailTemplates.ts` interpolate only **server-controlled** data (catalog mountain names, numbers, generated URLs) — no user free-text. Admin HTML uses `escapeHtml`.
- direct-response-write MEDIUMs in `radar.ts` / `places-google.ts` are binary image proxies (allowlist-validated, correct content-type) — not HTML XSS.
- Do not dismiss dependency findings as build-only or harmless because they are transitive. Trace the installed production graph and actual callers on every audit; externally sourced XML and runtime SDK dependencies require particular attention.

**Why:** a later audit found runtime-reachable vulnerable dependencies despite the older blanket “dev-only” assessment. Scanner results and dependency reachability change over time.

**How to apply:** revalidate classifications on each security pass. Public anon-key status does not prove database policies are safe; Supabase RLS and cross-user isolation require separate verification. A low finding count is not proof of absence of vulnerabilities.
