---
name: feelzlike deploy topology + Sentry build-log noise
description: How feelzlike publishes (application router, config in .replit) and why a Sentry 401 in deploy build logs is a decoy, not the failure cause.
---

# feelzlike deployment topology

- This repl deploys in **ARTIFACT mode** (pnpm workspace, target `autoscale`): each artifact's `.replit-artifact/artifact.toml` `[services.*.production]` controls the REAL build/run. Those files DO exist and ARE committed (publish detection reads the committed git tree). The `.replit` `[deployment].run` is **ignored**; `.replit` `[deployment].build` is only a repo-root **pre-build hook**. (Earlier note saying "no artifact.toml here" was WRONG.)
- feelzlike artifact (`kind=web`): `serve = "static"`, `publicDir = artifacts/feelzlike/dist/public`, build = `pnpm --filter @workspace/feelzlike run build`, env `BASE_PATH=/`. The SPA ships as prebuilt static files (dist is gitignored but rebuilt at deploy by THIS build). api-server artifact (`kind=api`): build = `pnpm --filter @workspace/api-server run build`, run = `node artifacts/api-server/dist/index.cjs` (PORT 8080), startup probe **`path=/api/healthz`** (NOT `GET /`). The application router stitches them: static SPA at `/`, API at `/api`.
- The `.replit` pre-build hook is `BASE_PATH=/yamanouchi/ ... pnpm --filter @workspace/yamanouchi run build && pnpm --filter @workspace/api-server run build`. The yamanouchi filter matches NO package (renamed to `@workspace/feelzlike`) → prints `No projects matched the filters` and **exits 0** — harmless stale no-op; the api-server half is redundant with its artifact.toml build. Don't "fix" this to chase a publish failure (same-day successes prove it isn't the cause), and do NOT graft `BASE_PATH=/yamanouchi/` onto a real feelzlike build — the SPA is served at root, asset paths must be `/…`.

# A ~3s, ZERO-log deploy build failure = transient platform glitch, NOT your code

A failed deploy build whose `timeUpdated - timeCreated ≈ 3s` AND whose `getDeploymentBuild(id).logs.length === 0` died at the deployer's setup/validation stage before any build command ran. This is platform-side (cloud_run hiccup), not a code or config problem.

**Why:** Successful builds here take 3–4 min and emit logs; health-check/promote failures also emit logs. Zero log lines + ~3s means no build command executed at all. Proven once: the failed build sat between three same-day SUCCESS builds on the same commit, both artifact builds passed locally, deploy config was committed + unchanged, and the live site stayed healthy.

**How to apply:** `listDeploymentBuilds()` → find the failed id, compare its duration to neighboring successes. `getDeploymentBuild(id)` → check `logs.length` (0) and `suspendedReason` (absent = not billing/quota). Confirm `getDeploymentInfo().hasSuccessfulBuild` and curl the live `/` + `/api/healthz` for 200 (the last good build keeps serving, so merged code is usually already live). Then just have the owner re-publish — do NOT edit code/config for a zero-log 3s failure. (A `suspended` status or non-empty logs means it is NOT this; debug normally.)

# "works in dev, INTERNAL_ERROR on live" = STALE DEPLOY, not a code/DB bug

When a live form/endpoint returns `HTTP 500 : INTERNAL_ERROR` but the same request succeeds against the dev api-server (`POST localhost:8080/api/...` → 200), the live code is OLDER than current source. The fix is an owner **re-publish**, not a code change.

**Why:** `INTERNAL_ERROR` is emitted ONLY by app.ts's global error handler — i.e. an error escaped a route. Every hardened route returns its OWN code instead (e.g. `/alerts/subscribe` catches and returns `SUBSCRIBE_FAILED`). So seeing `INTERNAL_ERROR` from a route that has its own try/catch in source = the deployed build predates that hardening. (The generated api-client surfaces the body's `error` field as `mutation.error.message` → "HTTP 500 : INTERNAL_ERROR".)

**How to apply:** Don't assume a missing prod table/column first. (1) Reproduce against dev — if dev returns 200, the source is fine. (2) Sanity-check prod is reachable: `curl https://feelzlike.com/api/healthz` and `/readyz` (200 = API up; the early-timestamp healthcheck-500 spam in deploy logs is cold-start/redeploy noise, not the live instance). (3) Confirm prod schema read-only via the database skill (`environment:"production"`, e.g. information_schema for the table) — it has historically been CORRECT, so a green schema points back to stale code. (4) Reproduce directly against prod with a `curl POST` (use an `@example.com` address; it creates an inert unverified row you cannot delete via the read-only prod path). If prod now returns 200, the owner already re-published and it is fixed — verify, don't re-fix.

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
