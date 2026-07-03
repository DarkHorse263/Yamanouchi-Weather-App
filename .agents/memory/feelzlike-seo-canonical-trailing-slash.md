---
name: feelzlike SEO canonical / trailing-slash
description: Why every sitemap+canonical source must emit trailing-slash URLs, which sources exist, and why app.ts buildPageMeta stays non-slash.
---

# feelzlike SEO canonical / trailing-slash

The prod host serves prerendered pages as directories (`<path>/index.html`) and
301-redirects every non-root path to its trailing-slash form (`/au` -> `/au/`).
Root `/` is the ONLY non-slash 200. If the sitemap or any canonical points at the
non-slash form, Google follows the 301 and files the page under **"Page with
redirect"** -> unindexed.

**Rule:** every URL feelzlike declares to crawlers must be the trailing-slash 200
form (root stays `/`). There are THREE canonical sources that must stay in sync,
all trailing-slash:
- `scripts/generate-sitemap.mjs` -> `<loc>` (via `canonicalLoc`)
- `scripts/prerender.mjs` -> injected `<link rel=canonical>` (via `withTrailingSlash`)
- `src/lib/seo/PageMeta.tsx` -> client/runtime canonical (via `canonicalPath`, also strips query/hash)

**Deliberate exception — do NOT "fix" it:** `artifacts/api-server/src/app.ts`
`buildPageMeta()` emits a NON-slash canonical, and that is correct. `express.static(staticDir)`
runs with default `index:true`, so it serves the prerendered `<path>/index.html`
directly for every sitemap/prerendered route; `buildPageMeta` only fires for
non-prerendered catch-all routes (`/premium`, `/alerts/*`, `/admin`). Those have no
directory, do NOT 301, and are not in the sitemap, so their non-slash canonical
already matches their 200 URL. Aligning app.ts to trailing-slash would CREATE a
mismatch. (In the artifact static-serve topology app.ts may never serve HTML at
all, making it doubly moot.)

**Why:** aligning to the 200 URL is the standard remedy for "Page with redirect";
the edge's directory->slash 301 is not controllable, so fighting it is fragile.

**Stale-deploy trap:** a code fix here does nothing until the owner RE-PUBLISHES.
Symptom seen: live prod served the root homepage snapshot (root title/h1/canonical)
for EVERY route because the deployed build predated correct per-route prerender.
After any SEO/prerender change: owner re-publishes, then curl-verify a sample route
(e.g. `/au/`) returns its own title + exactly one canonical = the trailing-slash URL,
then resubmit the sitemap + request indexing in GSC.

Related: `feelzlike-prerender-flash.md` (the `#seo-prerender` snapshot mechanism),
`feelzlike-deploy-sentry-noise.md` (deploy topology; Sentry sourcemap-upload error
during build is harmless noise).
