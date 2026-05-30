---
name: feelzlike region readiness model
description: How feelzlike decides what content a region exposes, and why region-level subpage routes must redirect instead of stubbing.
---

# feelzlike region readiness model

A region's "readiness" is NOT all-or-nothing per region. Two independent layers:

1. **Town-level content** (`/:region/:town/*`) is data-gated by `townNavHasContent`
   (src/lib/navContent.ts). It reads the same static data the pages render from:
   `region.tourismLinks` (Explore), the transport REGISTRY (Transport),
   curated stays/eats, and a roads allow-list. A section with no data is hidden
   from the sidebar AND its town route redirects home (TownLayout `gate()` pattern).
   So a region with tourismLinks + transport providers has a real, polished town
   experience (Today, Weather, Transport, Explore) even with no custom router.

2. **Region-level subpage routes** (`/:region/explore`, `/eat`, `/mountains/lifts`,
   `/alerts`, catch-all) live in RegionLayout. The sidebar links **town-scoped**
   hrefs, so these region-level routes are reachable only by direct URL / old
   bookmarks (exception: the paywalled `/alerts` mountain-nav row in winter).

**Rule:** region-level fallbacks (no custom router page for that path) must
`<Redirect to="/" />` (the base-town picker), never render a "coming soon" stub.

**Why:** RegionStub always renders a "Coming together / we'll wire this page up
next" body regardless of title (even "Not found"), which reads as broken at launch.
Redirecting mirrors the existing TownLayout gate and removes the placeholder via
every access path while preserving real town content.

**How to apply:** when adding a region, just supply `tourismLinks` + transport
providers and town pages light up automatically. Only add a custom RegionRouter
when a region needs a richer region-level page (e.g. Alerts, region-wide Stay).
Open follow-up: the winter Alerts nav row still shows for regions lacking an
Alerts router and now bounces to home — gate that nav row by capability if the
dead-end feel matters.
