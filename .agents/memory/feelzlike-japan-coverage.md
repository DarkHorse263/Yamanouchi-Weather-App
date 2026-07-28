---
name: feelzlike Japan area completeness
description: What "complete" means for the 11 published JP areas — lift seeds live everywhere, curated eat/stay deliberately NOT expanded beyond Yamanouchi.
---

# Japan area completeness (decided July 2026)

- All 11 published JP regions now have curated lift wind-hold seed data. Seeds are split into per-region files `src/data/lifts/<region>.ts` (hakuba-valley, myoko, yuzawa, niseko, furano, rusutsu-kiroro, zao-onsen, hakkoda-aomori-spring) imported and merged in `src/data/lifts.ts`; Yamanouchi + Iiyama arrays remain inline there. Generic MountainDetail auto-renders the panel when `getLiftsForMountain` returns data — no per-region UI wiring needed.
- Invariant test: `pnpm --filter @workspace/feelzlike test:lifts` (unique ids, enums, elevations, thresholds). It cannot check mountainId membership against region configs (would import `@/regions` PNGs) — verify that in review when adding seeds.
- **Curated eat/stay stays Yamanouchi-only.** Owner explicitly chose (July 2026) to keep the April-2026 reset design for every other town: Stay = affiliate booking-platform links, Eat = Google Maps launch pad. **Why:** monetised, zero upkeep; hand-curating ~25 JP towns reverses the April reset and creates a large maintenance load. Do not add curated stays/eats JSON for new towns without owner sign-off.
