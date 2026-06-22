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
