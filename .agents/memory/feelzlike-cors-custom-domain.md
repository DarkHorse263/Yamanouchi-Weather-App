---
name: feelzlike CORS custom-domain mutations
description: Why prod mutations 500'd (INTERNAL_ERROR) while GETs worked, and the CORS allowlist rule
---

# CORS allowlist must include the custom production domain

**Rule:** the api-server CORS origin allowlist (app.ts) must include `https://(www.)?feelzlike.com`, not just Replit domains.

**Why:** browsers send an `Origin` header on same-origin POST/PUT/DELETE but NOT on same-origin GET. So with only `*.replit.app/dev` allowed, every read on feelzlike.com worked while every mutation (admin dashboard delete, any authenticated write) threw `CORS: origin not allowed` → global handler → `{"error":"INTERNAL_ERROR"}` 500. July 2026 incident; took two publish cycles because the global error handler used to swallow errors without logging (now it console.errors method+path+stack).

**How to apply:**
- Symptom signature: prod-only, mutation-only 500 INTERNAL_ERROR with reads fine → check CORS allowlist vs the live domain first.
- If the site ever moves domains, update `ALLOWED_ORIGIN_PATTERNS` (or set `APP_PUBLIC_URL`).
- The admin router's origin-pinning guard is separate and fine · it compares Origin to Host, which matches on the custom domain.
