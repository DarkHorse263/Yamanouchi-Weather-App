---
name: feelzlike artifact.toml env placement
description: PORT/BASE_PATH must live in [services.env]; appended at file end they get swallowed by the last rewrite table and the dev workflow dies.
---

The feelzlike web artifact's `.replit-artifact/artifact.toml` ends with thousands of `[[services.production.rewrites]]` tables. Any bare `PORT =` / `BASE_PATH =` lines appended at the end of the file parse as keys of the LAST rewrite table, not as service env — the managed workflow then injects nothing and `vite` dies at startup with "BASE_PATH environment variable is required".

**Why:** happened Aug 2026 — an earlier edit appended `PORT`/`BASE_PATH` to the tail; both `WorkflowsRestart` attempts failed identically.

**How to apply:** the env block must be `[services.env]` right after `localPort` (mirror mockup-sandbox's toml). When adding prerender rewrites, append them BEFORE nothing else — never let scripts append non-rewrite keys after the rewrite list. Fix via the validated `verifyAndReplaceArtifactToml` flow, never in-place.
