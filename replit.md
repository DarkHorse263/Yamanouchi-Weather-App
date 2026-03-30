# Yamanouchi Snow Intelligence Platform

## Overview

Bilingual (EN/JP) full-stack web application for Yamanouchi Town, Japan — a snow intelligence platform targeting international tourists on mobile browsers. Live snow data from Supabase, accommodation/dining/attractions from local PostgreSQL.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion + React Leaflet
- **API framework**: Express 5
- **Database**: PostgreSQL (Replit) + Drizzle ORM — for local places data
- **External data**: Supabase (read-only) — for live snow/resort/storm data
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Supabase Connection

- URL: `https://rbeyhfotgpsigjpptcnl.supabase.co`
- Key: Anon/publishable key embedded in `artifacts/api-server/src/lib/supabase.ts`
- Override with env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Tables used: `yamanouchi_resorts_today`, `yamanouchi_storms_today`, `powder_alerts_today`, `app_home_focus_today`, `top_snowfall_today`
- Column names (snake_case): `resort_id`, `name`, `cluster`, `snow_24h_cm`, `snow_depth_cm`, `temp_now_c`, `wind_kmh`, `expected_snow_tomorrow_cm`, `latitude`, `longitude`, `elevation_m`, `station_name`, `last_updated_at`
- Storm tracker columns: `storm_rank`, `snow_24h_cm`, `snow_48h_cm`, `snow_72h_cm`, `storm_level`, `headline`, `cluster`
- Alert columns: `id`, `name`, `cluster`, `alert_type`, `headline`, `message`, `powder_probability`, `expected_snow_cm`, `created_at`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   │   └── src/
│   │       ├── routes/snow.ts      # Snow data (dashboard, resorts, map, outlook, alerts) → Supabase
│   │       ├── routes/places.ts    # Accommodation, dining, attractions → local DB
│   │       └── lib/supabase.ts     # Supabase client
│   ├── eigomenyu/          # Eigomenyu bilingual QR menu app (React+Vite, preview: /eigomenyu/)
│   │   └── src/
│   │       ├── pages/      # guest-menu, login, dashboard, not-found
│   │       ├── lib/auth.tsx # localStorage-based auth (placeholder for future API auth)
│   │       ├── lib/store.ts # localStorage data store with seed data & mock AI translation
│   │       └── index.css   # Warm Japanese palette (earth tones, akane red, matcha green)
│   ├── nagano/             # Nagano Snow Intelligence (React+Vite, preview: /nagano/)
│   │   └── src/
│   │       ├── pages/      # Home, Resorts, Map, Outlook, Alerts, Cams, Stay, Eat, Explore
│   │       ├── components/ # Layout, UI elements, hourly timeline
│   │       ├── data/       # Static seed data (80 resorts, alerts, weather, accommodation, dining, attractions)
│   │       └── hooks/      # useLanguage (EN/JP toggle)
│   └── yamanouchi/         # React+Vite frontend (port 20651)
│       └── src/
│           ├── pages/      # Home, Resorts (+ resort map), Map (weather map), Alerts, Stay, Eat, Explore, Activities
│           ├── components/ # Layout (season-aware nav), UI elements
│           └── hooks/      # useLanguage (EN/JP), useSeason (Winter/Green toggle)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM — accommodation, dining, attractions, eigomenyu tables
│   └── integrations-anthropic-ai/ # Anthropic AI client (Replit AI Integrations proxy)
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Booking.com Affiliate Integration

- **Affiliate ID**: `75fd40675e05769d549b60370a6455d5`
- **Helper module**: `artifacts/yamanouchi/src/lib/booking.ts` — exports `bookingSearchUrl()`, `bookingRegionUrl()`, `bookingGeneralUrl()`
- **Placements**:
  1. **Stay page** (`/stay`) — Blue search banner at top + "Book" buttons on each accommodation card + region-level Booking.com links
  2. **Resorts page** (`/resorts`) — "Stay Nearby" link in each resort card footer
  3. **Guide page** (`/guide`) — "Book a Stay" link in the header bar
- **URL format**: `https://www.booking.com/searchresults.html?aid=AFFILIATE_ID&ss=QUERY`
- **Revenue**: Commission on completed bookings (25-40% of Booking.com's cut), paid monthly via bank transfer

## Local Database Tables (Replit PostgreSQL)

- `accommodation` — 6 rows (hotels, ryokan, guesthouses)
- `dining` — 7 rows (restaurants, bars, cafes)
- `attractions` — 8 rows (nature, onsen, culture, activity)
- `owners` — Eigomenyu restaurant owners (email + bcrypt password auth)
- `restaurants` — Eigomenyu restaurants (slug-based, linked to owners)
- `menu_items` — Eigomenyu menu items (Japanese names, English translations, approval workflow)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Eigomenyu routes: `src/routes/eigomenyu/` — auth (register/login/logout/me), restaurants CRUD, menu items CRUD, AI translate
- Session: `express-session` with HTTP-only cookie for owner auth
- Depends on: `@workspace/db`, `@workspace/api-zod`, `@workspace/integrations-anthropic-ai`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

## Season Toggle (Winter/Green)

The Yamanouchi app supports a Winter/Green season toggle for year-round tourism:

- **Hook**: `artifacts/yamanouchi/src/hooks/use-season.tsx` — React context with auto-detection (Dec–Mar = Winter, Apr–Nov = Green), localStorage persistence (`yamanouchi-season`), manual override
- **Layout**: Season-aware navigation — Winter shows "Resorts" tab, Green shows "Activities" tab. Color scheme adapts (blue accent for winter, emerald for green)
- **Nav tabs (7)**: Home, Resorts/Activities, Weather, Cams, Stay, Transport, Guide
- **Weather tab** (`/map`): Full-screen weather map of Japan (Radar, Clouds, Temp, Snow overlays). Temp tab zooms to Yamanouchi with 5 station markers
- **Resorts tab** (`/resorts`): Resort map (snow markers by region) + resort cards below. In green season shows POI markers instead
- **Home page**: Winter mode shows live snow dashboard with API data. Green mode shows a dedicated green season hero with activity highlights grid
- **Activities page**: `artifacts/yamanouchi/src/pages/activities.tsx` — 8 green season activities (hiking, Snow Monkey Park, SORA Terrace, cycling, onsen tours, etc.)
- **API optimization**: Winter dashboard queries (`useGetDashboard`, `useGetPowderAlerts`) are disabled during green season via `enabled: isWinter`

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
