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
- NZSki (Mt Hutt / Coronet Peak): per-mountain JSON blob at
  `webcams-…azurefd.net/{slug}-data.json`. Feed has last7Days only →
  lastSnowfallCm must stay null (a 7-day figure is not 24h). BLOBS ROT
  PER-RESORT: a slug's blob can go stale for weeks while the resort site
  shows fresh data. Before blaming the 36h guard, check for a slug variant -
  Coronet's own page JS (`_resolveOtherMountainSlug` in weather-app.iife.js)
  maps `coronet-peak` → `coronet-peak-winter`, and only the -winter blob is
  fresh (our adapter uses it; registry key stays `coronet-peak`).
- The Remarkables: its blob rotted with NO fresh variant (-winter/-summer
  404). Its site is the OLD server-rendered template - stats ship in page
  HTML (`w_weather-status__description`/`__data` label/value pairs), parsed
  directly. "Last Updated: Fri 24 Jul 16:28 PM" stamp has NO YEAR and a 24h
  clock with a redundant AM/PM suffix (16:28 PM = 16:28 - only apply
  meridiem when hour ≤ 12). Page accepts our identifying UA (only /webcams/
  is bot-walled).
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
