---
name: feelzlike pull-to-refresh gesture ownership
description: Why horizontal scrollers (bottom nav, carousels) can silently stop scrolling near the top of the page, and how navigation scroll-to-top must coexist with the in-app Back bar.
---

# PullToRefresh owns top-of-page vertical gestures

The app-wide PullToRefresh mounts a document-level NON-passive `touchmove`
listener that calls `preventDefault()` on downward movement whenever
`window.scrollY === 0`. `preventDefault` on a document touchmove cancels the
browser's native handling of that entire touch sequence — including the
horizontal scroll of any `overflow-x:auto` container the gesture started in.

**Symptom:** a horizontally-scrollable strip (mobile bottom nav, hourly-forecast
strip, stay/eat carousels) feels "stuck" or "stops partway" and its off-screen
items are unreachable — but ONLY when the page is at the very top (scrollY 0).

**Rule:** any horizontal scroller must be excluded from the pull-to-refresh
gesture. PullToRefresh's `onTouchStart` bails when the touch starts inside a
horizontally-scrollable ancestor (`scrollWidth > clientWidth` and `overflowX`
auto/scroll). Do not remove that guard, and do not rely on CSS alone —
`overflow-x:auto` is necessary but NOT sufficient while the document touchmove
preventDefault is in play.

**Why:** the bottom nav reported as "stopping at Stay" was this interaction, not
a CSS overflow bug. First instinct (add overflow-x) was already present; the real
cause was a different component hijacking the touch.

# Official BOM radar is an img stack · gestures come from a wrapper, not the layers

The "Official" BOM tab is a stack of plain `<img>` layers (background +
range + cycled radar frames, or one still gif) rendered `pointer-events-none`
on purpose · the images themselves never pan/zoom. To make that view
movable, the layers are wrapped in a `PanZoomStage` that owns ALL gestures
(wheel/pinch/double-tap/one-finger-pan + on-screen +/-/reset) via a single
CSS `translate3d + scale` transform, clamped to scale 1..6 with translation
pinned to 0 at base scale (prevents the "lost image" failure).

**Rules that must not regress:**
- Keep the playback control + frame dots OUTSIDE the transformed child, and
  keep the zoom buttons inside the stage but outside the scaled layer, so they
  stay fixed while the radar moves.
- `touch-action: pan-y` at rest (so a one-finger drag still scrolls the page
  past the tall radar) flips to `none` only once zoomed; pointer-capture is
  taken only when zoomed/pinching for the same reason.
- The stage is tagged `[data-radar-gesture]` and PullToRefresh's `onTouchStart`
  bails inside it · otherwise a downward drag on the radar both pans AND arms
  pull-to-refresh.
- The zoom-control container stops `click`/`dblclick` propagation so a quick
  double-tap on +/- doesn't also fire the stage's double-tap zoom/reset.

**Why:** user reported the BOM radar rendered but "can't move around or zoom"
· the static img stack was working as designed (no interaction). The interactive
Leaflet tab already panned; the fix was making the raster Official view
interactive without breaking page scroll or the image fallback ladder.

# Navigation scroll-to-top must not fight the Back bar

`ScrollToTop` resets `window.scrollTo(0,0)` on wouter location change so forward
taps (pushState/Link, e.g. the bottom-nav Transport item) open at the top. It
MUST: skip on `popstate` (back/forward, including the in-app Back bar's
`history.back()`) so the browser can restore the prior scroll position; skip the
initial mount (reload / deep-link restoration); and ignore query/hash-only
changes (tokenised alert links carry `?token=`). Consume the popstate flag on
every location-effect run so a stale value can't leak into a later forward nav.
