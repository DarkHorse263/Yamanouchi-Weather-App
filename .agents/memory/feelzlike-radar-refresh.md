---
name: feelzlike radar "not refreshing"
description: Why the AU radar looked frozen and the two-part fix (SW staleness + backgrounded timers).
---

# feelzlike radar refresh

"Radar isn't refreshing" (recurring AU abandonment complaint) has TWO stacked
causes, not one. Fixing only one leaves it looking frozen.

1. **Service-worker / HTTP-cache staleness.** `/api/bom-radar/frames` (the
   frame-discovery JSON) matched no explicit sw.js rule and fell into the
   catch-all stale-while-revalidate, so an installed PWA served the previous
   session's frame list. Fix: an explicit sw.js rule routing exactly
   `/api/bom-radar/frames` to network-first with `cacheMode:"reload"` (bypasses
   both SW SWR and the browser HTTP cache; server sends max-age=60), + a
   `cache:"no-store"` on the client frames fetch, + the mandatory CACHE_VERSION
   bump. Frame/layer PNGs (`/api/bom-radar?type=image...`) stay on the catch-all
   on purpose: immutable, unique-URL, never stale, and forcing reload would
   re-download ~10 images per poll for zero freshness gain.

2. **Frozen `setInterval` timers.** Mobile browsers freeze (iOS throttles even
   after resume) the polling intervals while the tab/PWA is backgrounded. A user
   reopening the app hours later sits on old frames until the next tick. This
   reproduces "not refreshing" even with a perfect SW.

**Why:** the SW fix alone is invisible to a returning-user because the timer
never fires to trigger the (now-fresh) fetch.

**How to apply:** any polling radar loader needs a throttled foreground refetch.
The `useForegroundRefresh(cb, minGapMs=90000)` hook in RadarMap.inner.tsx
(visibilitychange + window focus, skips when `document.hidden`, throttled) is
wired to ALL THREE loaders: BOM animated frames, the RainViewer manifest (cross
-origin, so the SW can never help it — foreground refetch is its ONLY un-freeze),
and the OfficialStillView cache-busted preload. Each loader exposes its current
effect closure via a ref so the hook always calls the live loader after
radarId/baseSrc changes. Server-side TTL cache + in-flight de-dupe on
/api/bom-radar absorb any double-fetch, so client bypass never hits BOM directly.

Geolocation "location is blocked": NOT a header problem (prod HTML has no
Permissions-Policy). It is per-user denial (or OS location-off / in-app
webviews). Both /near-you surfaces already render PlaceSearch unconditionally
above the panel, so the denied state should LEAD with "search your town in the
box above" as the primary CTA, re-enable/reload guidance secondary. Never
auto-prompt.
