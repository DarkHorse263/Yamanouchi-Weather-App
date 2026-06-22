---
name: feelzlike deploy topology + Sentry build-log noise
description: How feelzlike publishes (application router, config in .replit) and why a Sentry 401 in deploy build logs is a decoy, not the failure cause.
---

# feelzlike deployment topology

- This repl publishes via the **`.replit` `[deployment]`** block (router = `application`, target `autoscale`), NOT per-artifact `artifact.toml` — those files do not exist here. Don't go hunting for `.replit-artifact/artifact.toml`.
- Run command: `NODE_ENV=production PORT=80 node artifacts/api-server/dist/index.cjs`. The single api-server process serves the feelzlike static SPA at `/` AND the API under `/api`.
- Autoscale startup probe hits **`GET /`** (api-server returns the SPA index → 200). `/healthz` and `/readyz` exist but are mounted under `/api`, so they 404 at root — they are NOT the probe path.
- The build hook filters `@workspace/yamanouchi`, which is not a package (regions live inside feelzlike). It prints `No projects matched the filters` and **exits 0** — a harmless stale no-op. feelzlike + api-server are built by the deploy/artifact system, not that hook.

# Sentry 401 in build logs is a decoy

A failed feelzlike publish whose build log shows `[sentry-vite-plugin] ... Invalid token (http status: 401)` is **almost certainly NOT failing because of Sentry.**

**Why:** `vite.config.ts` enables `@sentry/vite-plugin` (v4.x) only when `SENTRY_AUTH_TOKEN` is present (a prod-only secret, currently invalid → 401). The plugin **logs** release-create / sourcemap-upload errors but does **not** fail the build. Proven by reproduction: building with a bogus token still exits 0, prerender runs after the `&&`, and `filesToDeleteAfterUpload: ["**/*.map"]` deletes the 8 MB maps even on failed upload, so no maps ship. Successful and failed-token builds produce equivalent deployable artifacts.

**How to apply:** When debugging a feelzlike publish failure, ignore the Sentry 401 and look at the **promote / health-check** phase. Reproduce locally: `pnpm --filter @workspace/feelzlike run build` (exits 0 even with a bad token), then `pnpm --filter @workspace/api-server run build`, boot `NODE_ENV=production PORT=<free> node artifacts/api-server/dist/index.cjs`, and `curl GET /` for 200. If build + boot + probe all pass, suspect a transient promote failure and re-publish. To silence the log noise / restore symbolication, refresh or remove the invalid `SENTRY_AUTH_TOKEN` production secret.

# Three distinct Sentry secrets — don't conflate them

Sentry uses THREE separate secrets (all currently set as global secrets):
- `VITE_SENTRY_DSN` — frontend runtime capture (embedded into the bundle at build time; gates `src/instrument.ts`).
- `SENTRY_DSN_API` — backend runtime capture (gates api-server `src/instrument.ts`, loaded via tsx `--import`).
- `SENTRY_AUTH_TOKEN` — **build-time only**: sourcemap upload + release creation. This is the one that goes stale/401.

**Why it matters:** runtime error capture is driven entirely by the two DSNs and keeps working even when the auth token is invalid. So "Sentry is broken in the build log" does NOT mean error monitoring is down — capture is live; only symbolication (readable stack traces) + clean build logs depend on a valid `SENTRY_AUTH_TOKEN`. The token's org/project are pinned in `vite.config.ts` (org `navigate-work-digital`, project `javascript-react`) — a refreshed token must belong to that org. Org-level auth tokens are pre-scoped for sourcemap upload.
