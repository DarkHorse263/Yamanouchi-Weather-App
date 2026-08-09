---
name: feelzlike NZ live roads (Waka Kotahi / NZTA)
description: How NZ ski-region road pages get live data, the two-tier honesty model, and the anti-fabrication rules around a feed outage.
---

# NZ live roads · Waka Kotahi (NZTA)

NZ road pages show **two honest tiers**, and must keep them distinct:

1. **LIVE approach corridors** — Waka Kotahi (NZTA) keyless ArcGIS "Road Events"
   FeatureServer, queried `where status='Active'`. These are STATE-HIGHWAY events
   (closures/hazards/works/weather) on the driving corridors that feed a region.
   Matched per-region by `NZ_CORRIDORS` (island + `locationArea` keyword list) so a
   far-off SH event isn't mis-attributed. `affectedResorts` = the region's mountain
   ids so the client's per-town road filter passes. source = "Waka Kotahi (NZTA) · live".
2. **SEASONAL access-road chain rule** — the final ski-field access road is a
   council / ski-area road with **NO public live feed**. It stays in
   `buildChainStatuses()` labelled "SEASONAL RULE". Never fake it as live.

**Why:** conflating "the highway to the region is live" with "the ski-field access
road is live" would be dishonest — they're different roads with different data.

## Anti-fabrication rules (honesty-first brand)
- On a cold feed outage (fetch fails, **no cached snapshot yet**),
  `fetchNztaActiveEvents()` THROWS (→ Express 5 auto-500 → client's honest
  "couldn't load road conditions" state). Do NOT return `[]`: the UI renders an
  empty roads list as "All clear · that's good news", which would falsely read as
  positive during an outage. Once a snapshot exists, serve-stale from the 3-min cache.
- `mapNztaCondition` keys off NZTA's structured `impact` field only ("Road Closed"
  → closed, else caution). Never scrape free-text comments for "closed" — a
  "left lane is closed" advisory must not paint the whole road CLOSED.

## Region config gate
- `roadsSource.dataAvailable` in each region file: `true` = UI renders the live
  roads table + LIVE badge + UpdateStamp; `false` = "no live feed wired" state.
  Flipped `true` for queenstown/wanaka/mt-hutt/ruapehu when NZTA wiring landed.
- UI (`TownRoads.tsx`) already treats `roads.length === 0` (with dataAvailable) as
  an honest "All clear" — that's why an outage MUST throw, not return empty.

## Japan
- Japan has **NO clean live chain/road API** (JARTIC / NEXCO are not open data).
  JP stays on the honest seasonal rule. Do NOT fabricate a JP live feed.

## Scope note
- NO schema change was needed: reused the existing `RoadCondition` shape and enums.
  If you ever need to distinguish "feed unreachable" from "zero events" WITHOUT a
  hard 500 (e.g. to keep seasonal chainStatuses visible during an outage), that
  WOULD need a response-shape field + codegen + lib rebuild.

## Japan roads rollout (Aug 2026)
All 20 JP regions now render /roads: seasonal chain rules live in the data-driven JP_CHAIN_RULES table in api-server routes/roads.ts (yamanouchi/nozawa/iiyama keep bespoke blocks checked BEFORE it) + one honest official-camera-map tile per region in webcams.ts. Sources are prefectural/MLIT services, curl-verified — never resort pages (link rot). Notable winter gate closures (R292 Shiga-Kusatsu, Gold Line, Aspite Line, Zao Echo Line) are stated in the notes.
**Gotcha:** chain cards are client-filtered by town nearbyMountainIds (+parentId rollup) — a chain entry whose mountainId no town references is silently invisible (Sahoro bug). When adding a chain entry, confirm at least one town lists its mountainId.
