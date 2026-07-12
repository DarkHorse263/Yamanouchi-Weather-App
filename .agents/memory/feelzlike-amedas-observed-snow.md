---
name: feelzlike JP AMeDAS observed snow depth
description: Rules for the JP measured-snow block in town-weather (station selection, out-of-season key absence, fail-soft wiring).
---

# JP observed snow depth (AMeDAS) in town-weather

Japanese town pages show a "measured snow" card sourced from JMA AMeDAS
station observations — real measurement, distinct from model depth.

**Key rules:**
- **JMA drops the snow keys from AMeDAS observation maps OUT OF SEASON.**
  A missing snow field means "not reported", which must map to `null` —
  never 0. A summer build of this feature is necessarily blind; tests use
  synthetic winter fixtures, and the card renders only when the block is
  non-null (so July = card absent, correct).
- Station selection is a pure function: 25 km radius, elevation penalty
  (0.05 per metre of |station − town| elevation gap) so a valley town
  doesn't inherit a summit station's depth; depth must be >= 0; negative
  24h snowfall degrades to null.
- Fail-soft end to end: any AMeDAS fetch/parse failure yields
  `observedSnow: null` inside town-weather's Promise.all — it can never
  reject the whole payload. JP-only; AU/NZ always null.
- `/api/town-weather` does NOT share the `/api/weather` SW prefix — it is
  listed explicitly in sw.js network-first, and any shape change there
  needs a CACHE_VERSION bump.

**Why:** honesty-first — observed depth is the only thing that may be
labelled "measured"; model depth stays advisory. The elevation penalty and
radius mirror the JP dry→wet reconciliation conventions (see
feelzlike-observation-reconciliation.md).
