---
name: feelzlike tsx test isolation
description: why pure logic that needs unit tests under `tsx --test` must not transitively import the region registry
---

# Pure logic under `tsx --test` must not pull in `@/regions`

Unit tests in feelzlike run via `tsx --test src/**/__tests__/*.ts`. If the
module under test transitively imports `@/regions`, the test fails at import
time with an opaque "test failed" / exit 1.

**Why:** the region registry imports PNG wordmark assets (`import x from
"...png"`). node/tsx can't load binary asset modules, so the whole import graph
throws before any test runs. Type-only imports are fine (esbuild strips them),
so a `import type { TownWeatherDaily } from "@/lib/town-weather"` is safe.

**How to apply:** keep pure, testable logic (scorers, formatters, validators)
in a module with NO value imports from `@/regions` or anything that pulls in
assets. If a feature needs both the pure logic and the region catalog, split
them: pure file (e.g. `tripDayScore.ts`) + catalog/persistence file (e.g.
`tripPlanner.ts`) that re-exports the pure bits for app convenience. Point the
test at the pure file directly.
