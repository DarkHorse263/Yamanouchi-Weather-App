---
name: feelzlike radar stability
description: Why the feelzlike town-weather radar must stay in-repo and lead with the Interactive view, not a third-party iframe.
---

The radar must be self-hosted in the feelzlike monorepo. Do not reintroduce a primary radar that is an iframe to another Replit project or any single third-party SPA.

**Why:** A previous design embedded `global-snow-radar.replit.app` as an iframe with a 12s timeout fallback to the in-repo `RadarMap`. It broke repeatedly because (a) cross-origin iframes can't be introspected, so "iframe loaded but tiles inside are broken" never trips the fallback, and (b) the external dyno had its own sleep / regression / tile-provider failures that we couldn't see or fix. Users saw a black void with floating storm markers.

**How to apply:**
- Town weather page (`TownWeather.tsx`) must render `<RadarMap>` directly, never a wrapper that iframes another Replit deploy.
- `RadarMap.inner.tsx` defaults to the `interactive` view in both seasons. Each layer (Carto basemap, RainViewer radar, OpenSnowMap pistes) renders independently so any single upstream failure degrades gracefully instead of nuking the whole map.
- `OfficialView` (BOM/JMA tab) must keep its `onError` → "open source" link-out fallback, and must be keyed on the source URL so switching regions resets the failure state.
- If a request comes in to add a "richer" external radar, fold its functionality into `RadarMap.inner.tsx` (or stand up a sub-artifact in this monorepo) — do not iframe a separate Replit project.
