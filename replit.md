# feelzlike — Weather Intelligence Platform

## Overview

**feelzlike** is a global weather intelligence platform offering detailed snow and green season intelligence for various destinations. The project provides regional sub-applications under a unified `feelzlike` umbrella, starting with Japan and Australia. The main `feelzlike` application serves as a landing page and region selector, while sub-applications (e.g., `yamanouchi`) deliver localized, bilingual intelligence. The business vision is to provide a comprehensive weather intelligence solution, with market potential in tourism and outdoor sports industries.

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
- `artifacts/api-server`: Express API server for snow and local places data.
- `artifacts/feelzlike`: The unified application serving the region picker and all regional content. Regional content is organized under `src/regions/<region>/`.
  - **Information architecture is 3-tier**: `Regions → Base Towns → Mountains`.
    - `/:region` — Region overview (region weather + base-town cards + mountain cards).
    - `/:region/:town` and `/:region/:town/{roads,cams,transport,stay,eat,explore}` — town-life pages, scoped to the selected base town. Routed via a nested `TownLayout` (Wouter base prefix).
    - `/:region/mountains`, `/:region/mountain/:id` (legacy `/resort/:id` retained), `/:region/today`, `/:region/radar`, `/:region/alerts` — mountain/region-wide pages.
    - `/:region/today` — **Today's call**: composite-scorer comparison page that ranks every mountain in the region (winter weights: snow 40 / wind 25 / temp 20 / cloud 15; green-season variant flattens snow). Renders a winner card (ScoreDial + 4 stat tiles + journey pill) and a numbered ranked list with tone-coded badges (POWDER DAY / BLUEBIRD / FAIR / MARGINAL / NO-GO). Reads from `entry.current.*` on `/api/weather`. Surfaced via a CTA card on the region overview and a sidebar item.
  - Reserved town slugs (cannot collide with town ids): `mountain`, `mountains`, `radar`, `alerts`, `resort`.
- `lib/feelzlike-shell`: Shared components for region chrome (e.g., `AppShell`, `RegionProvider`, `SeasonProvider`, `LanguageProvider`, `BaseTownProvider`, `TownPicker`, `RegionConfig`). Implements a light "premium fintech" visual language. AppShell renders three sectioned nav blocks (Region / In Town / Mountains); `defaultNav.ts` exports `DEFAULT_TOWN_NAV`, `DEFAULT_MOUNTAIN_NAV`, `DEFAULT_REGION_NAV` which regions can override via `RegionConfig.navOverrides`. `TownPicker` is URL-driven and navigates between towns while preserving the current sub-route.
- `lib/feelzlike-dashboard`: Shared dashboard component package for consistent UI across regional resort detail pages.
- `lib/api-spec`: OpenAPI 3.1 specification and Orval configuration.
- `lib/api-client-react`: Generated React Query hooks and fetch client.
- `lib/api-zod`: Generated Zod schemas for API validation.
- `lib/db`: Drizzle ORM layer for PostgreSQL.
- `lib/integrations-anthropic-ai`: Anthropic AI client.

**UI/UX Decisions:**
- **Design System:** Unified light and clean aesthetic across all applications, inspired by snow-forecast.com.
  - **Color Palette:** Sky blue (`--primary`) and alpine orange (`--accent`).
  - **Typography:** DIN Pro for all text, with Noto Sans JP fallback for Japanese glyphs.
  - **Layout:** Desktop features a 264px white sidebar; mobile uses a `glass-strong` top header and bottom navigation.
- **Town-centric IA:** Each region is anchored on a base town, influencing navigation and content display.
- **Season Toggle:** Automatic season detection (Winter/Green) with manual override, adapting UI elements, navigation, and content.

**Feature Specifications:**
- **Master Landing Page:** Features an editorial hero, region search, and town-first region cards with live headline data from `/api/regions`. Includes a trust line with real-time update information.
- **Aggregate `/api/regions` endpoint:** A new API route aggregating Open-Meteo headline and 6-day daily forecasts for key regional locations, with robust caching and error handling.
- **Production reliability layer (`/api/regions`):** Implements a stale-while-revalidate cache (5-min fresh, 6-hour stale) with request coalescing to ensure high availability and responsiveness.
- **Health probes:** `/api/healthz` for status and `/api/readyz` for readiness checks, ensuring traffic is routed only when the service is fully operational.
- **Rate limiting:** `express-rate-limit` middleware on all API routes, preventing abuse with configurable trust-proxy hops.
- **Reusable LRU+TTL cache helper:** Provides a generic caching mechanism for future per-town/per-mountain data.
- **Paywall scaffolding:** Database schema for users and subscriptions, and an entitlement system (`lib/entitlements.ts`) to manage feature access based on subscription tiers. Includes a `requireEntitlement` middleware for server-side access control.
- **Consent + ad-tracking framework:** Provider-agnostic GDPR/IAB-style consent with essential, analytics, and ads categories, persisted to localStorage. Features a customizable banner for user choice.
- **Sentry error monitoring:** Integrated across all artifacts (API server and SPAs) for comprehensive error tracking, performance monitoring, and session replay, with artifact-specific tagging and source map upload for production builds.
- **Snow-forecast.com-style 6-day strip:** Detailed 6-day forecast display with weather icons, temperatures, snowfall, rainfall, wind speed, and sunrise/sunset times.
- **Yamanouchi App:** Live snow data, accommodation/dining/attraction listings, and a season toggle influencing UI and API calls.
- **Iiyama App:** A "coming-soon" page with editorial content and CTAs to other regions.
- **Snowy Mountains App:** Primary navigation for Weather, Cams, Radar, Roads, Lifts, and secondary navigation for Bus Services, including a dashboard hero with live BOM Australia data.
- **Today's Call (fintech matrix):** Region overview hero shows top-3 mountains as score tiles with live mini-stats and drive time; full `/today` page renders a winner banner (score dial + Trophy + Resort website CTA) and a side-by-side comparison matrix with per-column ▲ winner markers (Snow / Wind / Temp / Cloud / Drive). Mountain coords are sourced from `region.mountains[].lat/lng` (single source of truth — no hardcoded coord maps).
- **Data-driven mountain detail routing:** `/[:region]/mountain/:id` is gated by `region.mountains.find()` (not a hardcoded `VALID_IDS` whitelist), so adding a mountain to a region config makes it routable, scoreable in Today's Call, and renderable on the detail page in one place. Resort lift-status / webcam URLs remain in a curated `PROFILES` override map; website URL is auto-sourced from `mountain.websiteUrl`. Link tiles render only when their URL exists — no fake placeholders.
- **Yamanouchi sub-resort split:** Shiga Kogen is split into 4 entries (parent + Yakebitaiyama, Okushiga Kogen, Ichinose Family) with `parentId="shiga-kogen"`; new mountain Yomase Onsen also added. Backend `weather.ts` registers all 4 new JP locations for live JMA data. Tighter town POI radii (Yudanaka 700m, Shibu 400m) plus a hard `radius * 1.05` cap in `places.ts` stop Eat/Stay duplication between adjacent towns. JP road-cam pages collapse to an honest "open the official road-camera map" tile when no genuine deep-links exist (Hokushin source has none).

## External Dependencies

- **Supabase:** Read-only connection for live snow, resort, and storm data (e.g., `yamanouchi_resorts_today`, `yamanouchi_storms_today`).
- **PostgreSQL (Replit):** Local database for `accommodation`, `dining`, `attractions`, `users`, and `subscriptions` data.
- **Open-Meteo (`api.open-meteo.com`):** Primary global forecast feed for `/api/regions` and per-town weather endpoints. Requires attribution and has a free-tier usage limit.
- **Booking.com Affiliate Program:** Integrated for accommodation bookings via affiliate ID `75fd40675e05769d549b60370a6455d3`.
- **Wikimedia API:** Used for fetching region card images on the master landing page.
- **Unsplash:** Fallback image source if Wikimedia API fails.
- **Anthropic AI:** Client integration for AI functionalities.