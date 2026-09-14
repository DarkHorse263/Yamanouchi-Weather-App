# Threat Model

## Project Overview

feelzlike is a publicly deployed weather-intelligence web application. A React/Vite SPA is served alongside an Express 5 API. Clerk provides user authentication; PostgreSQL/Drizzle stores users, subscriptions, alert subscribers, and related state. The server also consumes Supabase anonymous data and multiple public weather, mapping, resort, email, and push services.

## Assets

- **Accounts and sessions** · Clerk identities, server-side user mappings, emails, roles, and authenticated account actions.
- **Alert and subscriber data** · Email addresses, push subscriptions, alert preferences, management/unsubscribe tokens, and delivery history.
- **Administrative capabilities** · Newsletter administration, promotional funnel data, operational incidents, and privileged account actions.
- **Application credentials** · Clerk secret, database URL, Resend/web-push credentials, token-signing secrets, and third-party API keys.
- **Business state** · Subscription tiers and entitlements, promo eligibility, preferences, and analytics.
- **Service availability and integrity** · Public weather, roads, lifts, webcam, places, and forecast output.

## Trust Boundaries

- **Public browser to Express API** · All headers, parameters, bodies, cookies, and identifiers are attacker-controlled until validated. Sensitive routes must establish a Clerk subject and authorize the exact object/action.
- **Express to Clerk** · Session identity depends on correctly configured Clerk middleware and trusted host/proxy handling.
- **Express to PostgreSQL/Supabase** · Queries must be parameterized and scoped. Supabase's bundled anonymous key is public by design, so row-level security must be treated as the data authorization boundary.
- **Express to third parties** · Weather, places, resort, email, and push responses are untrusted; outbound URLs derived from requests require strict destination controls.
- **Member to administrator** · Admin routes require server-side authenticated role enforcement, not UI visibility or possession of a public identifier.
- **Email recipient to token-authenticated actions** · Alert management, verification, and unsubscribe links are bearer capabilities and must be signed, purpose-bound, scoped, revocable, and protected from leakage.

## Scan Anchors

- Production composition and middleware: `artifacts/api-server/src/app.ts`
- API entry points: `artifacts/api-server/src/routes/`
- Authentication/authorization: `artifacts/api-server/src/middlewares/`, token helpers in `src/lib/`
- High-risk state: alerts, newsletter/admin, account, push, subscription, and auth-email routes
- External fetch/proxy surfaces: radar, places, weather, webcams, resort reports, Clerk proxy
- Client public code: `artifacts/feelzlike/src/`
- `artifacts/mockup-sandbox` and test fixtures are development-only unless separately proven reachable.

## Threat Categories

### Spoofing
Clerk sessions and bearer links identify actors. Protected routes must reject absent or invalid Clerk context, and signed links/webhooks must verify signatures, purpose, expiry, and revocation before changing state.

### Tampering
Request-controlled IDs, region filters, preferences, subscription fields, and alert settings must be schema validated and updates scoped to the authenticated owner. Billing/entitlement state must never be accepted from the client.

### Repudiation
Administrative, role, subscription, account-deletion, and bulk messaging actions should record the acting subject and outcome without logging secrets or bearer tokens.

### Information Disclosure
Queries and API responses must be scoped to the current user or authorized admin. Errors and telemetry must not expose credentials, tokens, subscriber PII, or third-party response secrets. Public Supabase access must be constrained by RLS to intentionally public rows and columns.

### Denial of Service
Public aggregation, radar, places, email signup, and forecast routes must have bounded inputs, timeouts/caching, and effective rate limits. Upload/body limits and expensive external calls must remain constrained.

### Elevation of Privilege
Every admin or user-data action requires a server-side policy check for the exact subject, object, action, and scope. SQL, command, path, template, and SSRF sinks must not receive uncontrolled input. Entitlements must be enforced on the server when they gate valuable actions.
