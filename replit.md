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
- **Snow-forecast.com-style 6-day strip (Snowy Mountains LocationDetail):** Below the 24-hour trend, a horizontal dense grid (3 cols mobile / 6 cols desktop) shows weather icon, day name + date, condition word, max/min temperatures, vertical snowfall + rainfall bars with mm amounts, max wind speed, and sunrise/sunset times. The hero source byline includes a "UPDATED X ago" pill driven by `weatherData.lastUpdated` (ISO UTC, DST-safe).
- **Yamanouchi App:** Provides live snow data, accommodation/dining/attraction listings, and a season toggle influencing UI and API calls. Nav tabs include Town, Transport, Ski Areas/Things to Do, Weather, Cams, Guide.
- **Iiyama App:** Currently a "coming-soon" page with editorial copy, planned-coverage chips, and CTAs to other regions.
- **Snowy Mountains App:** Features primary navigation for Weather, Cams, Radar, Roads, Lifts, and secondary navigation for Bus Services. Includes a dashboard hero displaying live BOM Australia data.

## External Dependencies

- **Supabase:** Read-only connection for live snow, resort, and storm data.
  - URL: `https://rbeyhfotgpsigjpptcnl.supabase.co`
  - Tables: `yamanouchi_resorts_today`, `yamanouchi_storms_today`, `powder_alerts_today`, `app_home_focus_today`, `top_snowfall_today`.
- **PostgreSQL (Replit):** Local database for accommodation, dining, and attraction data.
  - Tables: `accommodation`, `dining`, `attractions`, `owners`, `restaurants`, `menu_items`.
- **Booking.com Affiliate Program:** Integrated for accommodation bookings.
  - Affiliate ID: `75fd40675e05769d549b60370a6455d3` (example: `75fd40675e05769d549b60370a6455d3` in original replit.md)
  - Integration points: Stay pages, resort cards, guide pages.
- **Wikimedia API:** Used for fetching region card images on the master landing page.
  - Endpoint: `https://en.wikipedia.org/api/rest_v1/page/summary/<TITLE>`
- **Unsplash:** Fallback image source if Wikimedia API fetch fails.
- **Anthropic AI:** Client integration for AI functionalities (via `lib/integrations-anthropic-ai`).