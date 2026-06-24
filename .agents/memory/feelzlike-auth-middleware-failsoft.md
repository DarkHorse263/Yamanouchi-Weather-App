---
name: auth middleware must fail-soft on session-store errors
description: why a DB hiccup in authMiddleware 500s every /api request for logged-in users, and the INTERNAL_ERROR signature
---

# authMiddleware must fail soft when the session store is down

`authMiddleware` runs before EVERY `/api` route. It resolves the session via
`getSession(sid)`, which is a **DB-backed Postgres query** (sessions table). If
that query (or the token refresh / clearSession) is left unguarded and the DB is
briefly unavailable, the error escapes to the global error handler and turns the
request into a 500.

**Rule:** the session-resolution block in `authMiddleware` MUST be wrapped in
try/catch and **fail soft** — on error, log and `next()` with `req.user` unset
(treat the request as anonymous). Never let a session-store error reach the
global handler.

**Why:** the live site is an autoscale deployment (`.replit` deploymentTarget
= autoscale) that scales to zero and cold-starts. During the cold-start /
just-restarted window the DB connection pool isn't ready yet. Only requests that
carry a session cookie/bearer `sid` hit `getSession`, so the failure is
**logged-in-only and intermittent** — a cookieless curl returns 200, which makes
it look like prod is fine. This bit a public endpoint (`/alerts/subscribe`) that
doesn't even need a session: the admin/owner was logged in, so their subscribe
POST carried the cookie and 500'd, while anonymous visitors were unaffected.

**How to apply:**
- Fail-soft is fail-CLOSED for protected routes (they see anonymous → deny, not
  grant) and fail-OPEN only for public routes that don't need auth. Safe.
- Diagnosis signature: the api-client (`custom-fetch.ts buildErrorMessage`)
  renders `HTTP <status> <statusText>: <body.message ?? body.error>`. Over HTTP/2
  `statusText` is empty and in production the global handler emits ONLY
  `{error:"INTERNAL_ERROR"}` (no `message`), so a screenshot reading
  **"HTTP 500 : INTERNAL_ERROR"** means the app's OWN global handler fired (an
  error escaped a route/middleware), NOT a platform/proxy cold-start page (which
  would be HTML). Use this to tell "app threw" from "platform was down".
- Separate latent issue spotted same investigation: `ALERT_TOKEN_SECRET` is
  absent from the **deployment** secrets (prod log warns it falls back to an
  ephemeral random key). Subscribe still succeeds, but verify/manage/unsubscribe
  email LINKS won't survive a restart until the secret is set in the deployment
  and the app is re-published.
