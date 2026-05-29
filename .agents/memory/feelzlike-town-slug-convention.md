---
name: feelzlike town/region slug convention
description: kebab-case ids (URLs/RegionConfig) vs snake_case slugs (curated dataset keys) — convert, never cast
---

feelzlike keeps two deliberately separate slug conventions:
- **kebab-case** for `RegionConfig.id` / `BaseTown.id` / URL tokens (e.g. `shibu-onsen`, `snowy-mountains`).
- **snake_case** for curated-dataset keys and the Zod `TownSlug`/`RegionSlug` enums (e.g. `shibu_onsen`, `snowy_mountains`).

They are NOT always equal — `shibu-onsen` (town id) maps to `shibu_onsen` (data key). Most towns happen to match (jindabyne, yudanaka, yomase), which hides the bug in casual testing.

**Rule:** before passing a town/region id into `getStaysByTown`/`getEatsByTown`/`getStaysByRegion` etc., convert it with `townIdToSlug` / `regionIdToSlug` (mountains: `mountainIdToDriveKey`) from `src/lib/urlState.ts`. Never `as TownSlug` / `as RegionSlug` cast — the cast compiles but the lookup misses and silently returns `[]`.

**Why:** a content-gating predicate cast `townId as TownSlug`, so Shibu Onsen (which has curated stays/eats) was wrongly treated as empty and its nav hidden.

**How to apply:** any new code keying into the curated dataset by id goes through the urlState converters.
