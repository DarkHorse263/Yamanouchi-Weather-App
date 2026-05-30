---
name: feelzlike radar stability
description: Why the feelzlike town-weather radar must stay in-repo and lead with the Interactive view, not a third-party iframe.
---

The radar must be self-hosted in the feelzlike monorepo. Do not reintroduce a primary radar that is an iframe to another Replit project or any single third-party SPA.

**Why:** A previous design embedded `global-snow-radar.replit.app` as an iframe with a 12s timeout fallback to the in-repo `RadarMap`. It broke repeatedly because (a) cross-origin iframes can't be introspected, so "iframe loaded but tiles inside are broken" never trips the fallback, and (b) the external dyno had its own sleep / regression / tile-provider failures that we couldn't see or fix. Users saw a black void with floating storm markers.

**How to apply:**
- Town weather page (`TownWeather.tsx`) must render `<RadarMap>` directly, never a wrapper that iframes another Replit deploy.
- `RadarMap.inner.tsx` defaults to the `interactive` view in both seasons. It was rebuilt to natively mirror the user's separate "Ski Radar" app: dark basemap (Esri WorldHillshade base + CARTO `dark_all` @0.86 on top), a "weather layers" panel with Precip Radar (RainViewer animated tiles, ON by default) plus four click-to-read point layers (Snowfall 24h / Wind Speed / Temperature / Rain Risk, OFF by default) that fetch Open-Meteo for the clicked lat/lng into a dark Leaflet popup. A METRIC toggle drives units. The old Overall/Clouds/Precip modes, satellite, and OpenSnowMap pistes/terrain were removed in this rebuild. Each layer still renders independently so any single upstream failure (RainViewer/Open-Meteo) degrades gracefully instead of nuking the map.
- `OfficialView` (BOM/JMA tab) must keep its `onError` → "open source" link-out fallback, and must be keyed on the source URL so switching regions resets the failure state.
- If a request comes in to add a "richer" external radar, fold its functionality into `RadarMap.inner.tsx` (or stand up a sub-artifact in this monorepo) — do not iframe a separate Replit project.
