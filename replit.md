# feelzlike — Weather Intelligence Platform

## Overview

**feelzlike** is a global, multi-region weather intelligence brand providing weather intelligence. Each region operates as a standalone application under the `feelzlike` umbrella. The project aims to offer detailed snow and green season intelligence for various global destinations, starting with Japan and Australia. The main `feelzlike` application serves as a landing page and region selector, while sub-applications like `yamanouchi` provide localized, bilingual intelligence.

## User Preferences

- **Communication style**: The project documentation should be clear and concise.
- **Coding style**: The project uses pnpm workspaces with TypeScript, React, Vite, and Tailwind CSS.
- **Workflow**: Iterative development is preferred, with a focus on delivering functional features for each region.
- **Interaction**: Prioritize architectural decisions over granular implementation details. Avoid making changes to areas not explicitly specified by the user.
- **General working preferences**: The user prefers a light and clean design aesthetic, inspired by snow-forecast.com, with a consistent typography across all applications. All applications should share a unified design system. The user wants to see a town-centric information architecture, where each region is anchored on a single base town.

## System Architecture

The project is a pnpm workspace monorepo using Node.js 24 and TypeScript 5.9.

**Core Technologies:**
- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, React Leaflet.
- **Backend:** Express 5.
- **Database:** PostgreSQL (via Replit) with Drizzle ORM for local data, and Supabase for live snow/resort/storm data.
- **Validation:** Zod (`zod/v4`), `drizzle-zod`.
- **API Codegen:** Orval (from OpenAPI spec).
- **Build:** esbuild.

**Monorepo Structure:**
- `artifacts/api-server`: Express API server exposing routes for snow data (Supabase) and local places data (PostgreSQL).
- `artifacts/yamanouchi`: Full-stack PWA for the Yamanouchi region, supporting bilingual (EN/JP) content and season-aware features (Winter/Green).
- `artifacts/iiyama`: Placeholder for the Iiyama region, planned for future development as a "coming-soon" page.
- `lib/api-spec`: Contains OpenAPI 3.1 specification and Orval configuration for API codegen.
- `lib/api-client-react`: Generated React Query hooks and fetch client.
- `lib/api-zod`: Generated Zod schemas for API validation.
- `lib/db`: Drizzle ORM layer for PostgreSQL.
- `lib/integrations-anthropic-ai`: Anthropic AI client.

**UI/UX Decisions:**
- **Design System:** Unified light and clean design across all applications, inspired by snow-forecast.com.
  - **Color Palette:** `--background: 210 25% 98%`, `--foreground: 220 30% 12%`, `--primary: 210 90% 46%` (sky blue), `--accent: 24 95% 48%` (alpine orange).
  - **Typography:** DIN Pro (400, 700) for all text. Noto Sans JP as a fallback for Japanese glyphs in Yamanouchi/Iiyama.
  - **Layout:** Desktop features a 264px white sidebar with trimmed color wordmark and navigation rail. Mobile uses a `glass-strong` top header and bottom navigation.
- **Town-centric IA:** Each region is anchored on a single base town (e.g., Yamanouchi Town for Yamanouchi, Jindabyne for Snowy Mountains). Navigation structures reflect this focus.
- **Season Toggle (Yamanouchi):** `useSeason` hook automatically detects seasons (Dec–Mar = Winter, Apr–Nov = Green) with localStorage persistence and manual override. UI elements like navigation tabs, color schemes, and home page content adapt to the detected season.

**Feature Specifications:**
- **Master Landing Page:** Light background, editorial hero headline, region search, town-first region cards. Each region card pulls live headline data (peak temperature, weather icon, conditions, wind, 24h snowfall) from `GET /api/regions` via TanStack Query (15-min refetch). A trust line near the hero shows live count, source count, refresh interval, and a `formatAgo` "updated X ago" indicator that reticks every 30s. Iiyama displays as `status: "soon"` with a launch-message card.
- **Aggregate `/api/regions` endpoint:** New route in `artifacts/api-server/src/routes/regions.ts` aggregating Open-Meteo headline + 6-day daily forecast for Snowy Mountains (Thredbo Top, 1957m) and Yamanouchi (Shiga Kogen, 1800m). Constructs proper ISO UTC `observedAt` from Open-Meteo's `utc_offset_seconds`. NaN/missing data is null-guarded; if upstream returns no temperature, the cache is skipped.
- **Production reliability layer (`/api/regions`):** Stale-while-revalidate cache (5-min fresh, 6-hour stale) with request coalescing (concurrent cold-cache requests fan out to one upstream call, others ride the same in-flight promise OR get served stale data). Upstream errors fall back to last good cached data instead of returning null. Response sets `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=3600` so CDN/edge can absorb load. `GET /api/regions/_stats` exposes hit/coalesce/upstream counters for monitoring.
- **Health probes:** `/api/healthz` returns schema-validated `{status: "ok"}` plus uptime, env, and cache stats (always `Cache-Control: no-store`). `/api/readyz` returns 503 `warming` until the regions cache has been populated, then 200 `ready` — wire this to load-balancer readiness probes so traffic only flows after upstream is reachable.
- **Rate limiting:** `express-rate-limit` middleware on `/api/*` (120 req/min per IP, returns 429 with retry-after, exempts health/ready probes). Trust-proxy hop count is configurable via `TRUST_PROXY_HOPS` env var (default 1) — set this per deployment topology to avoid throttling NAT-shared users or letting attackers spoof X-Forwarded-For.
- **Reusable LRU+TTL cache helper** at `artifacts/api-server/src/lib/lru-cache.ts`. Use this for any future per-town / per-mountain cache that grows with the global region catalogue (the `/api/regions` cache itself is already bounded by `REGIONS.length` so doesn't use it). Bounded entry count + per-entry fresh/stale tracking; oldest entries evicted when the cap is hit.
- **Paywall scaffolding (provider-agnostic):**
  - **DB schema:** `users` table (provider-agnostic — `externalAuthId` + `authProvider` columns let it work with Clerk, Replit Auth, Google, Apple, or email/password without ever changing internal IDs that other tables FK against). `subscriptions` table records tier (`free`/`pro`/`team`), status, provider, and Stripe-style billing cycle fields. One historical row per subscription event.
  - **Entitlements:** `artifacts/api-server/src/lib/entitlements.ts` is the single source of truth mapping tier → capability list (`forecast.basic`, `forecast.extended`, `forecast.peak`, `alerts.snow`, `alerts.wind`, `webcams.live`, `history.archive`, `ads.disabled`, `api.public`). `hasEntitlement(sub, ent)` is the only check function — call it server-side; never trust the client.
  - **Middleware:** `requireEntitlement('feature.name')` in `artifacts/api-server/src/middlewares/require-entitlement.ts` returns 402 Payment Required for users without the entitlement. The subscription resolver is a no-op stub by default (everyone is `free`), so guarded routes are safe even before billing is wired. Auth integration plugs in via `setSubscriptionResolver(req => ...)`.
- **Consent + ad-tracking framework (`artifacts/feelzlike/src/lib/consent.tsx` + `components/ConsentBanner.tsx`):** Provider-agnostic GDPR/IAB-style consent context with three categories (essential / analytics / ads), persisted to localStorage with schema versioning. Bottom-anchored banner shown until the user decides; supports Accept all, Reject non-essential, or Customise per category. `useConsent()` and helpers `canUseAnalytics(choices)`, `canUseAds(choices)` let any future analytics/ad integration check before firing. Wired into `feelzlike/src/App.tsx` via `<ConsentProvider>` + `<ConsentBanner>`.
- **Sentry error monitoring** (two projects, one per platform — Node + React):
  - **API server** (`artifacts/api-server/src/instrument.ts` + `index.ts` + `app.ts`): `@sentry/node` initialised before any other import so http/express auto-instrumentation patches everything. `Sentry.setupExpressErrorHandler(app)` registered after routes captures unhandled exceptions with full request context. Reads `SENTRY_DSN_API` secret; no-ops cleanly if unset (logs "[sentry] disabled"). 100% trace sampling in dev, 10% in prod.
  - **All four SPAs** (`artifacts/<spa>/src/instrument.ts` + `main.tsx`): `@sentry/react` with browser tracing, session replay (5% baseline / 100% on error), and React 19's `reactErrorHandler()` plumbed into all three `createRoot` callbacks (`onUncaughtError`/`onCaughtError`/`onRecoverableError`). Each SPA sets a different `artifact` tag (`feelzlike`, `snowy-mountains`, `yamanouchi`, `iiyama`) so per-region error budgets can be filtered inside the shared Sentry React project. Reads `VITE_SENTRY_DSN`; no-ops cleanly if unset. `tracePropagationTargets` includes `/api/*`, `*.replit.dev`, and `feelzlike.app` so browser transactions link to API transactions in Sentry.
  - **Source maps:** not yet uploaded automatically — to add, install `@sentry/vite-plugin` per SPA and set `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` env vars at build time. Until then production stack traces will be minified.
- **Snow-forecast.com-style 6-day strip (Snowy Mountains LocationDetail):** Below the 24-hour trend, a horizontal dense grid (3 cols mobile / 6 cols desktop) shows weather icon, day name + date, condition word, max/min temperatures, vertical snowfall + rainfall bars with mm amounts, max wind speed, and sunrise/sunset times. The hero source byline includes a "UPDATED X ago" pill driven by `weatherData.lastUpdated` (ISO UTC, DST-safe).
- **Yamanouchi App:** Provides live snow data, accommodation/dining/attraction listings, and a season toggle influencing UI and API calls. Nav tabs include Town, Transport, Ski Areas/Things to Do, Weather, Cams, Guide.
- **Iiyama App:** Currently a "coming-soon" page with editorial copy, planned-coverage chips, and CTAs to other regions.
- **Snowy Mountains App:** Features primary navigation for Weather, Cams, Radar, Roads, Lifts, and secondary navigation for Bus Services. Includes a dashboard hero displaying live BOM Australia data.

## External Dependencies

- **Supabase:** Read-only connection for live snow, resort, and storm data.
  - URL: `https://rbeyhfotgpsigjpptcnl.supabase.co`
  - Tables: `yamanouchi_resorts_today`, `yamanouchi_storms_today`, `powder_alerts_today`, `app_home_focus_today`, `top_snowfall_today`.
- **PostgreSQL (Replit):** Local database for accommodation, dining, attraction, user, and subscription data.
  - Tables: `accommodation`, `dining`, `attractions`, `users`, `subscriptions`.
- **Open-Meteo (`api.open-meteo.com`):** Primary global forecast feed used by `/api/regions` and the per-town weather endpoints. CC-BY 4.0 — attribution required (rendered as "Open-Meteo · ECMWF + GFS + ICON" on each card). Requests carry a `User-Agent: feelzlike/1.0` header so the upstream maintainers can contact us before throttling. **Important commercial-use note:** the free tier is for non-commercial use up to ~10k requests/day. Once feelzlike monetises (paywall and/or third-party ads), we must move to their commercial tier ([open-meteo.com/en/pricing](https://open-meteo.com/en/pricing)) or switch to a commercial provider (e.g. WeatherAPI.com, Tomorrow.io, Visual Crossing) before launch. Plan for this in the same sprint as billing integration.
- **Booking.com Affiliate Program:** Integrated for accommodation bookings.
  - Affiliate ID: `75fd40675e05769d549b60370a6455d3` (example: `75fd40675e05769d549b60370a6455d3` in original replit.md)
  - Integration points: Stay pages, resort cards, guide pages.
- **Wikimedia API:** Used for fetching region card images on the master landing page.
  - Endpoint: `https://en.wikipedia.org/api/rest_v1/page/summary/<TITLE>`
- **Unsplash:** Fallback image source if Wikimedia API fetch fails.
- **Anthropic AI:** Client integration for AI functionalities (via `lib/integrations-anthropic-ai`).