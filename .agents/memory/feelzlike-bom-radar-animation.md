---
name: feelzlike BOM radar animation
description: that the official BOM radar is animated, the cadence insight that makes it possible, and the BOM rate-limit constraint any radar work must respect
---

The official BOM radar (the main / leftmost AU "Official" tab) IS animated, not a
static gif. It is a self-hosted composite: BOM's own static basemap layers
stacked under the recent radar frame PNGs, cross-faded by opacity. This corrects
an earlier wrong note that claimed BOM only kept 1 frame so animation was
impossible.

**The cadence insight (why animation is feasible):** BOM retains a full ~5-6
frame loop, but publishes frames on a **10-minute :X4 cadence** (minutes ending
:04/:14/:24/:34/:44/:54 UTC), NOT every 6 minutes. The old "only 1 frame"
conclusion was a discovery bug — probing at 6-min wall-clock marks mostly missed
the real frame minutes, and the heavy probing also tripped BOM's rate-limit.
Discovery probes the UNION of both cadences and HEAD-filters to whatever exists.

**The hard constraint — BOM rate-limits the whole Replit egress.** Under request
volume BOM starts 403ing EVERYTHING (gif, basemap layers, frames) for a while,
even from the code_execution sandbox, then recovers. This is THE thing every
radar change must respect. The defenses that keep the animation safe in
production, and must not be removed:
- server-side caching of both frame discovery AND the proxied images (frame +
  layer PNGs are immutable once published, so cache them hard; the loop gif is
  short-TTL), plus in-flight de-duping and serve-stale-on-failure;
- an allowlist of catalogued radar product ids on the frames endpoint, so a
  caller can't fan out arbitrary ids and trigger a HEAD-probe storm. The
  allowlist mirrors the client BOM radar catalogue; keep them in sync. Drift is
  graceful — a missing product just degrades that radar to the still/link-out.

**Honesty-first degradation ladder:** animated composite → single still gif →
"open source" link-out. The client must fall through this when frames are too
few, discovery fails, or every frame image fails to load — never leave an
empty-but-official-looking basemap. A dev 403 storm is usually self-inflicted
probing; stop hitting BOM and it clears.

**Where the radar lives:** folded into `/:town/weather` and `/near-you`, NOT the
`/mountain/:id` page (custom region router, no radar). The Official tab is the
default only for AU/covered points; JP/NZ lead with the Interactive (RainViewer)
tab since their official source is link-out only.

**UTC watermark misread + freshness honesty (July 2026):** BOM burns a UTC
timestamp into its imagery (e.g. "11/07/26 21:44UTC"), which users read as
local time — a CURRENT morning frame looks like "last night". The fix is an
explicit freshness readout in the animated view's source bar ("Updated HH:MM
local · X min ago", judged by the NEWEST frame, ticking every 30s), flipping
amber "Bureau feed delayed" past 45 min. Don't remove it — it's what makes the
radar's freshness verifiable against the confusing watermark.
**Stale-serving must be age-capped:** serve-stale-on-failure protections must
never replay hours-old radar as live. Server caps: stale frame-list fallback
≤90 min old, stale composite loop gif ≤30 min (frame/layer PNGs stay uncapped —
immutable). Past the cap, degrade down the honesty ladder instead.
**Still-view SW trap:** the constant loop-gif URL sits in the SW catch-all
stale-while-revalidate, so an installed PWA paints the PREVIOUS session's gif
on open; OfficialStillView must fire its cache-busted preload IMMEDIATELY on
mount (not just on the 4-min interval) to swap in the current picture.
