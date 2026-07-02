---
name: feelzlike places search scoping
description: How /api/places/search restricts results to AU/JP/NZ (per-country rectangle fan-out + country-code filter + place-like ranking) and why includedRegionCodes can't be used; client picked-place -> curated town reconciliation.
---

# Scoping the place-search to AU/JP/NZ

Google Places (New) `places:searchText` has **no multi-country restriction field**: `regionCode` is a single CLDR code, and `includedRegionCodes` is **autocomplete-only** (sending it to `searchText` risks a 400).

**Current design (per-country rectangle fan-out) in `places-google.ts`:** run ONE `searchText` per served country, each with its own `locationRestriction.rectangle` (from `SERVED_REGIONS`), fanned out via `Promise.allSettled` (one country failing still returns the others). This replaced an earlier single GLOBAL search + `maxResultCount:20` over-fetch + bbox post-filter, which returned **zero** results for ambiguous names ("Orange" -> France/California dominate the global top-20, so no AU/JP/NZ hit survived the post-filter). A single mega-rectangle over AU+JP+NZ does NOT fix it either: a populous neighbour (Asian "Orange" businesses) crowds out AU/JP/NZ. Per-country calls GUARANTEE each country contributes its own top hits.

**Why the two extra field-mask fields:**
- `places.addressComponents` -> resolve each result's country code (`countryCodeOf`). The JP rectangle unavoidably overlaps South Korea / eastern China / Russian far east, so a lat/lng box alone leaks foreign hits (real Korea leak on "Queenstown"); the country code drops them.
- `places.types` -> classify each result `placeLike` (locality / admin / political / natural_feature / ski_resort / etc. via `PLACE_LIKE_TYPES`) vs business. Merge concatenates place-like first, so a searched town outranks a same-named business.
Both stay in the **Text Search Pro** tier already used by `location` + `formattedAddress`, so no extra billing tier.

**`allowNullCountry` per region:** Google sometimes returns a mountain / ski field with NO country component. AU + NZ rectangles cover only their own country plus ocean, so a country-less hit inside them is kept (`allowNullCountry:true`) — this rescues legit natural_feature / ski_resort results (same "returns nothing" class of bug). The JP rectangle overlaps foreign land, so it stays strict (`allowNullCountry:false`).

**Merge:** round-robin across countries (AU first each round) into two buckets (placeLike vs other) during one interleaved traversal, dedupe by id (rectangles don't overlap so it's a safe no-op), keep the `inServedRegion` bbox check as a defensive net, then `[...placeLike, ...other].slice(0, max)`. Strip the internal `ScoredResult` (`country`, `placeLike`) back to the public `{id,name,address,lat,lng}` before `res.json`.

**Known residual:** generic-word town names still lead with a business (e.g. "Orange" -> "Orange tobacco") because Google's Text Search ranks businesses above the bare locality even within one country — but every hit resolves to the right town's coords, so the weather is correct. Fixing the LABEL would mean switching to the Autocomplete API (`(cities)`/`(regions)` + `includedRegionCodes`), which returns placeId-only (needs a Place Details call for coords + session tokens) and REVERSES the deliberate Text-Search-for-one-call-coords decision — do NOT do it without user sign-off.

**Cost:** 3x Text Search Pro per search vs the old 1 call; mitigated by client 350ms debounce + MIN_CHARS 3 + React Query 1h staleTime + `Cache-Control` 1h. If it ever matters, add a server-side LRU keyed by `q`.

**How to apply / adding a country:** add a `{country, box, allowNullCountry}` entry to `SERVED_REGIONS` (set `allowNullCountry:false` if its rectangle overlaps foreign land). Do NOT revert to a single global search or a single mega-rectangle.

# Picked-place -> curated town reconciliation (client)

`PlaceSearch.choose()` reconciles a picked result against `REGIONS.flatMap(baseTowns)` before navigating: a normalized name match (en or `nameJa`) accepts within 25km; proximity alone accepts only within 6km (tight, so it never grabs a neighbouring town when there is no name signal). On match it navigates `/:region/:town` (the rich town page, routes correctly under the root wouter base); otherwise it keeps the location-first `/near-you?lat&lng&name` fallback. The 6km floor matters where towns are very close (e.g. Yudanaka / Shibu Onsen ~1km) — the name match is what disambiguates them.
