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

# Navigation scroll-to-top must not fight the Back bar

`ScrollToTop` resets `window.scrollTo(0,0)` on wouter location change so forward
taps (pushState/Link, e.g. the bottom-nav Transport item) open at the top. It
MUST: skip on `popstate` (back/forward, including the in-app Back bar's
`history.back()`) so the browser can restore the prior scroll position; skip the
initial mount (reload / deep-link restoration); and ignore query/hash-only
changes (tokenised alert links carry `?token=`). Consume the popstate flag on
every location-effect run so a stale value can't leak into a later forward nav.
