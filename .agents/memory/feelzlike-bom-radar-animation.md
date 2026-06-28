---
name: feelzlike BOM radar animation / rate-limit
description: why the official BOM radar stays a static still (no animated loop), and how BOM IP-blocks the environment under request volume
---

The official BOM radar in feelzlike is the single composite `.gif` per product
(e.g. `IDR714.gif`), shown via the api-server `/api/bom-radar?type=loop` proxy.
It is a STILL snapshot. Requests to make it "animated" recur — here is why we do
NOT build a frame-stitched / layer-composited animated loop.

**Two hard blockers (verified Jun 2026):**

1. **BOM's per-frame archive now retains ~1 scan.** Probing
   `/radar/IDR<id>.T.<YYYYMMDDHHMM>.png` at 6-min wall-clock marks across a 2-3h
   window via GET (and HEAD — both behave the same) returns only the single
   latest frame. So even a "perfect" compositor would loop 1 frame = still. The
   api-server `/api/bom-radar/frames` discovery endpoint exists and is correct,
   but returns `[]`/1 frame in practice. The frontend does NOT call it (grep
   confirms) — leave it dormant.

2. **BOM IP-rate-limits the whole Replit environment under volume.** Base
   layers/frames return 200 when traffic is light, but after enough requests in
   a short span (e.g. the frames endpoint HEAD-checking 20-40 URLs per call, or
   bulk probing) BOM starts returning **403 to EVERYTHING** — the `.gif`, the
   transparency layers, individual frames — and even direct fetches from the
   code_execution sandbox 403 (not just the api-server). It recovers after
   backing off. A per-view layer compositor (background+topography+locations+
   range + N frames = many requests every render) would trigger this constantly
   in production.

**Why:** honesty-first + keep the official source dependable. A 1-frame "loop"
that also gets us IP-banned is strictly worse than a clean live still.

**How to apply:**
- Keep the official AU radar as the single `.gif` (one request, server-cached
  ~60s). It MAY auto-refresh gently (preload-and-swap every few minutes = 1 req)
  — that is fine and won't trigger blocks.
- Do NOT stitch `.T.` frames or composite `radar_transparencies/*.png` layers
  per view. The frames/transparency proxy endpoints are a latent footgun; never
  wire the frontend to them.
- The Official tab MUST degrade to the link-out ("open source") on a 403/onError
  — it already does, and that is the correct honest behavior while blocked.
- The genuinely ANIMATED radar in the app is the Interactive tab (RainViewer,
  play/scrubber) — point users there for movement; BOM stays the trusted still.
- A dev 403 storm is usually self-inflicted (probing); stop hitting BOM and it
  clears. Production has separate egress and is normally unaffected.
