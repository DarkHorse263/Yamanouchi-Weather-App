# Dependency remediation · 12 September 2026

## Result

Full `pnpm audit` fell from **67 findings** (11 critical, 34 high,
19 moderate, 3 low) to **zero**. Production-only audit and the Replit
dependency scanner also report zero. This is a point-in-time dependency
assessment, not a claim that the application has no security risks.

## Changes and exposure

| Dependency chain | Resolution | Actual exposure |
| --- | --- | --- |
| fast-xml-parser | 5.9.3 → 5.11.1 | Runtime: external Thredbo lift XML and resort snow-report XML. Existing feed fixtures pass; added repeated-DOCTYPE rejection test. |
| Supabase → ws | Supabase 2.99.1 → 2.116.0 | Runtime database/cache client. New graph no longer pulls in ws. Added mocked PostgREST read regression. |
| Puppeteer → ws / extract-zip | Puppeteer 24.43.0 → 25.10.0; ws 8.21.3; extract-zip removed | Installed under API production dependencies, but callers are owner PDF/image/export and smoke scripts, not request handlers. |
| Resend → Svix → uuid | Resend 6.12.2 → 6.27.0; old Svix/uuid chain removed | Installed production SDK, but current email sender uses direct HTTP and webhook verification is local HMAC code. Existing signature/timestamp tests pass. |
| Sentry / OpenTelemetry | Sentry node 10.74.0 | Runtime instrumentation. Updated parent removes the vulnerable telemetry chain. |
| Express / rate limiter | Kept Express 5.2.1; refreshed qs/body-parser; rate limiter 8.7.0 and patched ip-address | Runtime request parsing/rate-limit utilities. |
| Orval / parser / markdown | Orval 8.31.0 plus compatible transitive refresh | Development code generation, not public HTTP routes. Removed critical code-generation findings. |
| Vite / PostCSS / Babel / browserslist / esbuild | Vite 7.3.6, Sentry Vite plugin 4.9.1, esbuild 0.28.2 and patched transitives | Build/dev tools. Production frontend is static output. |
| Recharts → lodash | Retained Recharts 2 API; lodash 4.18.1 | Browser runtime despite the frontend manifest's devDependency placement. |

Overrides now live in `pnpm-workspace.yaml`, not a competing root package.json
block. Removed obsolete ineffective rules; kept platform exclusions and the
existing esbuild-kit-to-tsx substitution. Updated the global esbuild pin and
added a narrowly version-scoped lodash override because Recharts 2 has no newer
parent release. No firewall, release-age, or install-script policy was disabled.
Resend 6.28.0 was too recent for the existing one-day release-age rule; 6.27.0
already removes the affected chain and was accepted.

Puppeteer 25 is a deliberate major upgrade: the last 24.x release still uses
the unpatched extract-zip chain. Node 24 meets its Node >=22.12 requirement.
Updated unsupported network-idle setContent/navigation options to explicit
readiness waits, retaining font readiness. Actual Chromium PDF and PNG exports
pass. Chromium auto-download remains unapproved, as before; scripts use the
configured executable or system Chromium.

Orval compatibility is explicit: React Query 5 and Zod 3, DOM iterable types,
and no automatic Zod index barrel that would conflict with maintained exports.
Generation and compilation were tested in a scratch copy of both generated
libraries so this security change does not rewrite the entire checked-in API.

## Verification

- `pnpm install --frozen-lockfile`: passes; installed versions match lockfile.
- Full and production `pnpm audit --json`: zero findings.
- Replit dependency scanner: zero findings.
- API suite: 238/238 existing tests pass; 2/2 new SDK/XML tests pass.
- API and frontend standalone TypeScript checks: pass.
- API production build: passes.
- Frontend production build and 2,797 prerendered routes: pass.
- Scratch Orval generation and TypeScript build of both generated libraries: pass.
- Puppeteer campaign PDF and ad-kit PDF/PNG generation using system Chromium: pass.
- All three workflows start; `/api/healthz` returns 200; homepage screenshot renders.

### Existing limits, separate from dependency remediation

- Root `pnpm typecheck` remains blocked by a missing Node type definition in a
  shared library and an Anthropic integration cast error. Standalone affected
  artifact checks pass.
- Frontend build finishes but Sentry source-map upload reports an existing 401.
  Source-map publishing was not repaired and no credentials were changed.
- Existing Clerk peer warnings refer to the unchanged React 19.1.0 pin.
- SAST: 1 high and 3 medium results. Two concern the same embedded Supabase
  token, whose decoded role was verified as `anon` without printing the token.
  Public-token status is not proof of correct Supabase RLS.
  Two redirect warnings concern auth-email and alert unsubscribe routes:
  outer origins come from server configuration and variable query values are
  encoded. Broader auth/redirect and data-isolation review remains separate.
- Privacy/dataflow scanner: zero findings.

No deployment was performed. These patched dependencies take effect in the
published app only after the reviewed changes are merged and published.