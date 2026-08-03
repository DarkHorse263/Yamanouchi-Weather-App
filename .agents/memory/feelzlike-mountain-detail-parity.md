---
name: generic MountainDetail = Perisher-style
description: the region-agnostic mountain page mirrors the snowy-mountains bespoke page; keep the two in lockstep
---

The generic mountain page (pages/region/MountainDetail.tsx) is a deliberate mirror of the Snowy Mountains bespoke page (aurora hero, live pill, hero-cam thumbnail, dense glass "right now" stats, 5-day strip with snow/rain bars, same premium-gate sequence).

**Why:** owner wants Perisher as the model for every mountain; divergent layouts eroded the premium feel.

**How to apply:**
- Any layout/section change to the snowy-mountains LocationDetail should be mirrored in the generic page (and vice versa) unless it depends on AU-only data (lift-hours strip, BOM station pill, live lift card — generic mountains have none of these, they fail-soft to nothing).
- Hero cam on the generic page comes from the LOCAL curated catalogue (`getMountainWebcams`, first `embedType:"image"` cam), not the /webcams API the snowy page uses.
- The extended-outlook PremiumGate is skipped when `daily.length <= 5` (non-AU regions get shorter forecast windows) — never lock an empty panel.
- FIXED Aug 2026: AppShell `<main>` now uses `md:w-[calc(100%-16rem)]` alongside `md:ml-64`, so wide content no longer clips at ~1280px. Don't revert to plain `w-full` with the margin.

**Blue body background:** MountainDetail (and yamanouchi resort page) body sits on the blue #0055FF canvas. Any component rendered at top level there MUST supply its own white/glass card (or be wrapped in `glass rounded-3xl p-5 md:p-8`) or dark text goes illegible. AlertPromoBanner is bg-white for this reason; MountainWebcams is bare and needs the glass wrapper at each mount. Smoke tests must check FULL page scroll (tall mobile viewport), not just above the fold.
