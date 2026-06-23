---
name: feelzlike prerender SEO-snapshot flash
description: Why the build-time SEO snapshot must stay hidden (#seo-prerender) or it flashes as unstyled text top-left before React mounts.
---

# feelzlike prerender SEO-snapshot flash

The prod build (`artifacts/feelzlike/scripts/prerender.mjs`) injects a static SEO
snapshot (plain `<main><h1><p><nav><ul>`, no Tailwind classes) into
`<div id="root">` for non-JS crawlers. Dev's root is empty, so this is a
PROD-ONLY symptom.

**Symptom (owner-reported):** "some type in the top left corner" flashes before
the homepage paints. The render-blocking CSS loads and paints the unstyled
snapshot (Tailwind preflight resets headings, so it looks like small black body
text top-left) BEFORE the JS module executes and `createRoot()` replaces #root.

**Fix / rule:** prerender wraps the snapshot in `<div id="seo-prerender">`, and
`index.html` hides it with an inline `<style>#seo-prerender{display:none}</style>`
in `<head>` (parsed before body, so the snapshot never paints), plus
`<noscript><style>#seo-prerender{display:block}</style></noscript>` to restore it
for no-JS visitors.

**Why this is SEO-safe (not cloaking):** text-only crawlers read the raw HTML and
still get the snapshot regardless of CSS; Googlebot renders JS and gets the real
app. Safe ONLY while the hidden snapshot stays faithful to the route's real
content (no keyword stuffing).

**How to apply / don't regress:**
- Keep the `#seo-prerender` id unique to the prerender wrapper. NEVER let a React
  component render a top-level element with that id, or the live app gets hidden.
  `createRoot().render()` replaces the whole #root subtree, so the wrapper is gone
  once the app mounts.
- The hide rule and the wrapper must change in lockstep (CSS in index.html ⇄
  injectBody in prerender.mjs). Optional regression check: built
  `dist/public/index.html` must contain BOTH `#seo-prerender{display:none}` and
  `<div id="seo-prerender">`.
- Verify by running the prod build (`pnpm --filter @workspace/feelzlike run build`)
  and inspecting the output; the Sentry sourcemap-upload error in the log is the
  known non-fatal decoy (build still exits 0).
