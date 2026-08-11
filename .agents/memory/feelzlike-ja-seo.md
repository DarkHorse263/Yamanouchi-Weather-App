---
name: feelzlike Japanese SEO snapshots
description: How Japan pages get Japanese search snippets in the prerendered SEO output
---

# Japanese SEO snapshots

- JP routes (region/mountain/town + /jp) get a **Japanese-first bilingual meta description** (`ja | en`) plus a `<p lang="ja">` paragraph in the snapshot body; non-JP output stays byte-identical English.
- Japanese copy is NOT duplicated into `scripts/seo-regions.mjs`: `regionJapanese(region)` extracts `nameJa`/`blurbJa` from `src/regions/<slug>.ts` at build time (same pattern as `regionMountains`). Missing ja fields fall back to templated Japanese in `prerender.mjs` (`addJa`). Region-level `nameJa` IS hardcoded on the JP entries in seo-regions.mjs.
- **Why:** in-app ja copy already lives in the region registry; extraction keeps one source of truth and new JP mountains/towns pick up ja SEO automatically.
- No hreflang/ja URL variants exist — language is client-side state only; hreflang needs URL routing work first.

## Prerender re-run hazard
`scripts/prerender.mjs` uses `dist/public/index.html` as its template, but the "/" route OVERWRITES that same file with a body-injected snapshot. Re-running prerender without a fresh `vite build` silently bakes the home-page body into every route (head meta still updates, body goes stale — `injectBody`'s `<div id="root"></div>` match fails). Always verify via full `pnpm build`.
