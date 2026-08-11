---
name: feelzlike top-level route rename
description: Every place that must change when a top-level SPA route is renamed (learned from /plan → /compare).
---
Renaming a top-level route touches ~12 registries; missing any is silent:
client routes (App.tsx incl trailing-slash + client Redirect), shell nav defaultNav.ts + AppShell GLOBAL_MOUNTAIN_PATHS + sectionAccents.ts, in-app links (Welcome, Premium, About copy), PageMeta path, api-server KNOWN_TOP_LEVEL + SEO meta map + server-side 301 (301 lives in the PROD-ONLY SPA block — untestable in dev, client redirect covers dev), scripts (prerender.mjs, generate-sitemap.mjs, generate-rewrites.mjs), public/llms.txt (hand-maintained), and .replit-artifact/artifact.toml rewrites (generate-rewrites emits to STDOUT only — the toml must be edited to match; new route needs its per-route rewrite before the catch-all or prod serves homepage HTML).
**Why:** the /cams precedent set the 301 pattern; the edge rewrite miss reproduces the "Google saw 300+ duplicates" bug.
**How to apply:** grep the old path repo-wide (src, lib, scripts, public, api-server, artifact.toml) after any rename.
