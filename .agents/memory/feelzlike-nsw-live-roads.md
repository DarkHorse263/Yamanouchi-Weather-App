---
name: feelzlike NSW live roads (TfNSW Live Traffic)
description: Snowy Mountains live road wire - which TfNSW feeds work keyless, where the real text lives, and the honesty rules for merging into curated cards.
---

# NSW live road wire · Transport for NSW Live Traffic

**Rule:** the Snowy Mountains live overlay must use the PUBLIC keyless feeds
`data.livetraffic.com/traffic/hazards/{alpine-open,incident-open}.json`
(TfNSW open data licence - same system behind livetraffic.com and the RTMC
SMS alerts). Never revert to `api.transport.nsw.gov.au/v1/live/hazards/...`
- that host requires an API key we don't have, and the original code
silently swallowed the 4xx for months.

**Why:** the first implementation fetched the keyed host AND parsed
`properties.headline`, which is ALWAYS EMPTY in these feeds - so no live
data ever reached the page. The real message text lives in
`subCategoryA` / `adviceA` / `adviceB` / `otherAdvice` (HTML - strip tags,
decode entities).

**How to apply:**
- Filter features by `properties.roads[0].region === "Snowy Mountains"`.
- `subCategoryA` is sometimes the literal string `"null"` - guard it.
- Structured `subCategory` containing "closed" is the authoritative closure
  signal; the ONLY free-text closure phrase honoured is "is closed to
  (uphill|all) traffic" (TfNSW's carpark-overflow wording). "Closed lane"
  mentions must never paint a road CLOSED.
- Carpark alerts (peak-day Perisher, mirrors the RTMC SMS): detected via
  carpark/parking + capacity/full/closed keywords, prefixed
  "carpark alert · ", sorted first among appended cards. They land in the
  same feeds when TfNSW issues them - there is NO separate public carpark
  feed, and the SMS "75%" percentages may only appear once TfNSW writes
  them into the hazard text.
- Every alpine entry carries identical boilerplate ("Updates about the road
  condition throughout the Alpine Season...", "Motorists should: ...",
  generic advice "Plan your journey"/"Exercise caution") - strip it ALL, in
  both otherAdvice and advice; if nothing road-specific survives, the
  curated card copy must stand (don't overwrite it with boilerplate).
- Matching hazards→curated corridors: mainStreet inclusion + shared place
  tokens; streets with >1 concurrent hazard require a shared place token so
  the Perisher-Charlotte closure never lands on the Jindabyne-Perisher card.
  Description writes are guarded by the severity that set them.
- Outage: 3-min cache, serve-stale capped at 90 min; past that, return null
  and append "Live feed temporarily unavailable · check livetraffic.com" to
  curated cards. AU deliberately differs from NZ (which throws) because AU
  curated cards still carry honest standing info.
- Route path is `/api/road-conditions` (roads router is mounted unprefixed),
  NOT `/api/roads/road-conditions`.
- nswroads.work/snow (the link in TfNSW's SMS) resolves to a 403 rms.nsw.gov.au
  page - do not link it.
