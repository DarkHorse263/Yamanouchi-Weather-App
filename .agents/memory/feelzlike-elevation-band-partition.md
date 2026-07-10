---
name: elevation-band forecast · pinned cell + FL phase partition
description: Why elevation bands must share one Open-Meteo grid cell and derive snow/rain per band from freezing level
---

**Rule:** the /api/elevation-forecast bands (upper/mid/lower) must all query Open-Meteo with `cell_selection: "nearest"` and derive precip phase per band from the upper request's hourly `freezing_level_height` + `precipitation` (`partitionPrecipByBand`: snow hour when bandElev >= FL − 300m, snowCm = mm × 0.7). Never let each band request pick its own grid cell.

**Why:** Open-Meteo's default `cell_selection=land` matches the grid cell to the *requested elevation's* terrain, so three band requests for the same mountain landed on three DIFFERENT physical grid cells with different precip totals — user-visible absurdity: mid-mountain 17.0cm vs summit 13.9cm on the same day. Pinning the cell alone is not enough: Open-Meteo does NOT re-partition precip phase per requested elevation, so all bands then report identical snowfall (base would claim summit snow).

**How to apply:**
- Keep 3 requests (per-band downscaled temps are correct and needed), but ONE precip story from the upper request's hourlies.
- Snow monotonicity (upper ≥ mid ≥ lower) is structurally guaranteed by the shared FL series — a violation means someone reintroduced per-band cells or model daily sums.
- Fail-soft: missing FL carries forward; precip before any FL ⇒ `reliable:false` ⇒ fall back to the pinned cell's model daily sums (identical across bands, degraded but never absurd across places).
- `dailyConditionLabel` for the panel must be fed the DERIVED upper totals so the label matches the numbers shown.
- Tests: `artifacts/api-server` → `npx tsx --test src/lib/__tests__/partitionPrecipByBand.test.ts`.

**Known deferred inconsistency:** weather.ts `fetchOpenMeteo` / `fetchSnowfallAtElevation` still use default `cell_selection=land`, so the town/resort daily strip can tell a slightly different story than the elevation panel on the same page. Standardizing is a deliberate follow-up — changing it shifts headline totals app-wide and needs its own verification pass.

**Honesty caveat:** fixed 0.7 cm/mm snow ratio understates dry powder (notably JP); acceptable simplification for now.
