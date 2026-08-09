---
name: feelzlike Clerk migration
description: Durable invariants from the Replit Auth → Clerk migration (Aug 2026).
---

# Clerk Auth Bridge — Durable Invariants

## The bridge decision
`users.externalAuthId` bridges old Replit OIDC subs to Clerk user IDs. Migrated users already have their OIDC sub stored there; the JIT provisioning in `requireAuth` finds them on first Clerk sign-in without any manual reconciliation step.

**Why this matters:** don't revert to email-only lookups or re-key on Clerk's native userId — the OIDC sub → externalAuthId mapping is the entire bridge.

## Two userId namespaces — never mix them
- `auth.userId` (Clerk native) → use ONLY for Clerk SDK calls (e.g. `clerkClient.users.deleteUser`)
- `auth.sessionClaims?.userId` (externalAuthId / OIDC sub) → use for local DB queries

## credentials: include is mandatory
`lib/api-client-react/src/custom-fetch.ts` defaults `credentials: "include"` so Clerk's session cookie crosses the SPA↔API origin gap (preview iframe, *.replit.dev, custom domain). Removing it silently breaks all signed-in API paths.

**Why:** browser fetch defaults to `same-origin`; any cross-origin deployment (the common case on Replit) drops the cookie without this default.

## Clerk req.auth mock in tests
`req.auth` must be a callable branded with `Symbol.for("@clerk/express.auth")`. The return object MUST include `tokenType: "session_token"` — `getAuthObjectForAcceptedToken` returns `signedOutAuthObject()` (userId: null) when tokenType is absent, silently breaking signed-in assertions.
