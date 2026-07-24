---
name: feelzlike NZ reported snow adapters
description: NZ resort snow-report source quirks + the two-value base range contract (baseCm/baseMinCm)
---

# NZ reported-snow adapters (all 7 NZ resorts, kind "resort")

## Two-value base contract
Several NZ resorts publish TWO base readings (upper/lower stations or an
unordered min/max). Contract: required `baseCm` = the HIGHER reading (all
skiability / no_base gating keys off it unchanged - "no base" only when the
best station is bare); optional `baseMinCm` = the lower, present only when
distinct. Sort numerically, NEVER label upper/lower (NZSki's min/max is
swapped in the wild). Client renders "81-140" with a plain hyphen (brand
forbids en dashes), only in generic MountainDetail; skiable-now chip stays
single-figure baseCm on purpose.

**Why:** picking one value either falsely asserts no_base (min) or
overstates (max); the higher-value rule keeps skiSeason.ts untouched.

## Source quirks (verified live July 2026)
- NZSki (Mt Hutt / Coronet Peak / The Remarkables): per-mountain JSON blob at
  `webcams-…azurefd.net/{slug}-data.json`, slug == our location id. Feed has
  last7Days only → lastSnowfallCm must stay null (a 7-day figure is not 24h).
  Their `updatedAt` stamps go STALE FOR WEEKS while the resort page still
  renders numbers - the 36h guard then honestly nulls the report. A
  persistently-null NZSki resort is designed behavior, not a parse bug.
- Cardrona + Treble Cone: ONE shared XML feed, two `<skiarea>` blocks.
  `<generated>` is stamped at REQUEST time (would always look fresh) - use
  `<date>` at 07:00 NZ as the freshness anchor. Base is a "40cm" string,
  strict cm-suffix parse only.
- Whakapapa: lit-SSR page - `<!--lit-part-->` comment nodes sit between
  label/value; "Last updated" stamp has NO YEAR (Hotham-style inference, NZ
  offset, Dec-read-in-Jan rolls back a year).
- Turoa: Webflow value-then-label h5 pairs; anchor on "Lower/Upper Snow
  Base" labels; explicit D/M/YYYY stamp (day-first, NZ) near "Updated on:".
- NZ offset helper: +13 Oct-Mar else +12; ±1h DST slip immaterial to a 36h
  guard.
