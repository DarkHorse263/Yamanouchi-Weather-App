---
name: feelzlike lift-panel honesty gate
description: Why/how the "Will the lifts spin?" wind panel must gate on season + snow + live feed before speaking as if lifts run.
---

# feelzlike lift-panel honesty gate

> CORRECTION (supersedes the "authoritative live lift feed (AU)" wording below):
> there is currently NO live AU lift open/closed feed. `api-server/src/routes/lifts.ts`
> HARDCODES every AU lift status:"closed" (so liftsOpen is always 0; totalLifts is
> just a count). Never treat that endpoint's liftsOpen as real open/closed truth.
> The operation-gate code below is real; AU just has no verified source to feed it.
>
> Phase 1 honesty (shipped): a per-resort "verified live status" flag gates ALL
> open/closed UI.
> - Frontend kill-switch: `LIVE_LIFT_STATUS_RESORTS` Set (empty today) +
>   `hasLiveLiftStatus` in snowy-mountains LocationDetail.tsx. Opt a resort in
>   (Phase 2) only once a REAL per-resort live source exists; a server-driven flag
>   would be sturdier long term.
> - When NOT live: the "On the snow" card shows the resort's own official report
>   link (`liftData.liftStatusUrl`) + a reference list of lift names/types ONLY -
>   no open/closed badges, no "0/N" counter, no status chip. Pass `undefined`
>   (NOT 0) into MountainSnapshot.liftsOpen and the wind panel's actualLiftsOpen.
> - The wind panel needs its OWN `liveStatusKnown` prop (default true = JP /
>   opted-in unchanged). REQUIRED on top of suppressing the lift count, because the
>   server defaults `snowDepth` to 0 when unknown - without the flag, snowDepth=0
>   trips a false "Not enough snow to run lifts" banner. `liveStatusKnown={false}`
>   forces the neutral "if lifts were running" framing + "No live status" chip +
>   UNKNOWN_LIVE_COPY banner regardless of the model season/snow read.

The "Will the lifts spin?" panel (LiftWindHoldPanel) computes a pure WIND-hold
prediction per lift. That wind model says nothing about whether lifts are
actually running, so the panel must NOT present wind output as "X/N likely open"
unless the resort is plausibly operating.

**Rule:** before showing any open/running language, pass the wind read through an
operation gate (`computeLiftOperationStatus` in `src/lib/skiSeason.ts`), priority:
1. `off_season` (season window closed) beats everything.
2. authoritative live lift feed (AU): 0 of N open -> `no_lifts_open`; any open ->
   `operating` (trusted OVER a near-zero model snow read).
3. no live feed + KNOWN snow depth < 2cm -> `no_snow`.
4. else `operating`.
When not operating, the panel reframes wind as a conditional "if lifts were
running" outlook (neutral chip, honest banner, wind-only per-lift labels, no
"Watch" alert) and never claims a closed lift is open.

**Why:** the original bug showed off-season JP resorts (season Dec-Apr) as lifts
"likely open" on a June date with 0cm snow, because the panel rendered the wind
model verbatim with no season/snow awareness.

**How to apply:**
- Season windows MUST mirror api-server road-chain windows
  (isAuSnowSeason/isJpSnowSeason/isNzSnowSeason) so the lift panel and road panel
  agree: AU/NZ Jun10-Oct10 inclusive, JP Dec-Apr (month===11||<=3).
- `snowDepthCm` null/undefined means UNKNOWN, never zero: an in-season resort
  with no snow report still shows the normal wind forecast (do not close on null).
- A live feed only overrides snow when BOTH total>0 AND open count is non-null.
- Keep `skiSeason.ts` free of any `@/regions` import: that pulls PNG assets and
  crashes `tsx --test`. Its `SkiCountry` union is structurally identical to
  `CountryCode`, so callers pass `REGION_COUNTRY[id]` directly.
- Operation-priority logic lives in the pure module (not inside the React
  useMemo) so it stays unit-testable; see skiSeason.test.ts op-status matrix.

# Second, separate panel · the live "On the snow" status chip

There is a DIFFERENT lift panel from "Will the lifts spin?": the live lift-feed
card in `regions/snowy-mountains/pages/LocationDetail.tsx` (header "Lift status ·
On the snow"). Its top-right header chip must reflect whether lifts are ACTUALLY
running, NOT the ski-season window.

**Rule:** derive the chip from the live feed, not `seasonStatus`:
1. `liftData.liftsOpen > 0` -> green "open".
2. else any per-lift status wind-hold/on-hold -> amber "on hold".
3. else `seasonStatus === "open"` -> neutral "lifts closed" (in-season but
   nothing spinning: pre-opening hours, off-hours, weather hold, thin cover).
4. else -> amber `seasonStatus` label (pre-season / closed).
Keep the explanatory sky banner in sync: it also fires for
`seasonStatus === "open" && liftsOpen === 0` with "No lifts reported open right
now".

**Why:** the chip was bound to `seasonStatus` (the AU season WINDOW, "open"
Jun10-Oct10), so an in-season resort at ~5am with 0/10 lifts open showed a green
"OPEN" pill while every lift row read "Closed". "Season open" != "lifts open".

**How to apply:** `seasonStatus` lives ONLY in this file - no other region uses
it (yamanouchi's "Lift status" is just an external link, not a live chip), so the
fix is confined to snowy-mountains LocationDetail.

# Generic MountainDetail "On the snow" card (Aug 2026)

The generic mountain page now renders the same honest reference-only lift
card as the Snowy no-live-feed branch, but CLIENT-SIDE: it keys off the
local lift seeds (`src/data/lifts.ts` / `getLiftsForMountain`), never the
api-server /lift-status endpoint (which stays Snowy-only and 404s cleanly
elsewhere). No status chips/counters ever - seeds carry no status. Link
ladder: `MountainLink.liftStatusUrl` (new optional field in shell types) →
`snowReportUrl` → `websiteUrl`; no seeds = no card (no empty tease). NZ
seeds (Coronet, Remarkables, Cardrona, TC, Mt Hutt, Whakapapa, Turoa) were
added Aug 2026 from public trail maps - re-verify pre-season. VIC High
Country + Tasmania still have NO seeds, so their pages hide the card.
NOTE when testing: brand CSS lowercases/uppercases text, so puppeteer
innerText checks must be case-insensitive.

# Resort liftStatusUrl values rot · and Thredbo DOES publish a real feed

The per-resort `liftStatusUrl` strings in `api-server/src/routes/lifts.ts` point
at the resorts' own report pages and they break over time: resorts restructure
their sites and the old deep paths start 301/302-redirecting. Two confirmed
breakages (owner-reported): Thredbo `/the-mountain/lift-status/` redirected to a
RAW XML feed, and Perisher `/the-mountain/lift-status` 302'd to /file-not-found.

**Rule:** liftStatusUrl must resolve to a human-readable report page (curl with a
browser UA + follow redirects, confirm 200 text/html and that the resort's OWN
nav still links it). Prefer a stable anchor on a top-level page over a deep path.
Re-verify periodically. Current good targets: Thredbo
`/the-mountain/#lifts-trails`, Perisher `/reports-cams/reports/snow-report`.
Charlotte Pass returns 000 from this datacenter (IP-blocked, unverifiable) so
leave it unless owner-reported; Selwyn homepage is 200.

**Phase 2 SHIPPED (Aug 2026) — Thredbo live feed is wired in:** api-server
fetches `https://www.thredbo.com.au/feeds/lift-status-report/` (per-lift
open=true/false, status, openingTime) via a strict fail-soft adapter
(5min TTL, 30min serve-stale, 24h feed-age guard, empty lift list = parse
failure). Live rows REPLACE the static catalogue rows for Thredbo and the
response gains `liveStatusVerified:true`; runsOpen/totalRuns are DROPPED for
live Thredbo (feed has no runs data — never pair real lift counts with the
fake 0/50). Feed down/stale → flag false → client falls back to the honest
no-live mode automatically. Client gate is now two-factor: membership in
LIVE_LIFT_STATUS_RESORTS (Thredbo only) AND `liftData.liveStatusVerified===true`
— so the "On the snow" card can never render stale/fake open claims. Feed
attr values carry numeric HTML entities (`&#039;`) — parser needs
htmlEntities:true or names render literally. Feed statuses seen: open,
closed, standby (→ mapped "scheduled"); unknown words map to "closed",
never "open". /api/lift-status is network-first in sw.js (v23).
Other resorts (Perisher etc.) stay reference-only until each gets a real feed.

**Aug 2026 merge:** the free reference-only "On the snow" lift card was merged into LiftWindHoldPanel (single lift surface per page). Panel's `liveStatusKnown` now defaults FALSE (safe-by-default); only callers with a real opted-in feed pass true. The official-report link renders in the panel's honest banner (`liftReportUrl`/`resortName` props) AND as a slim FREE link outside the PremiumGate on MountainDetail + Snowy LocationDetail — don't drop that free link, the panel itself is premium-gated. Snowy's "On the snow" card now renders only when `hasLiveLiftStatus` is true.
