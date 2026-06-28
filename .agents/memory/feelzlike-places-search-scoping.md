---
name: feelzlike places search scoping
description: How /api/places/search restricts results to AU/JP/NZ and why includedRegionCodes can't be used; client picked-place -> curated town reconciliation.
---

# Scoping the place-search to AU/JP/NZ

Google Places (New) `places:searchText` has **no multi-country restriction field**: `regionCode` is a single CLDR code, and `includedRegionCodes` is **autocomplete-only** (sending it to `searchText` risks a 400). So the three served countries are enforced by a **server-side bounding-box post-filter** on the returned `location` (AU incl. Tasmania, JP, NZ boxes = `SERVED_BBOXES` in `places-google.ts`), dropping same-named places on other continents.

**Why over-fetch:** the filter runs AFTER the upstream call, so the request asks for `maxResultCount: 20` and the route slices back to the client's `max` (1-5). An ambiguous name (e.g. "Bright", "Marysville", "Mansfield") can have all of its top few hits abroad; without over-fetching, the served-region filter would leave zero results.

**How to apply:** keep the upstream request at the max and slice after filtering. If a new country is added, add its bbox to `SERVED_BBOXES`. Do NOT reach for `includedRegionCodes` or a `locationRestriction` rectangle — one rectangle can't cover AU+JP+NZ without huge ocean / other-country noise.

# Picked-place -> curated town reconciliation (client)

`PlaceSearch.choose()` reconciles a picked result against `REGIONS.flatMap(baseTowns)` before navigating: a normalized name match (en or `nameJa`) accepts within 25km; proximity alone accepts only within 6km (tight, so it never grabs a neighbouring town when there is no name signal). On match it navigates `/:region/:town` (the rich town page, routes correctly under the root wouter base); otherwise it keeps the location-first `/near-you?lat&lng&name` fallback. The 6km floor matters where towns are very close (e.g. Yudanaka / Shibu Onsen ~1km) — the name match is what disambiguates them.
