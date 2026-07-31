---
name: feelzlike Japan area completeness
description: What "complete" means for the 11 published JP areas — lift seeds live everywhere, curated eat/stay deliberately NOT expanded beyond Yamanouchi.
---

# Japan area completeness (decided July 2026)

- All 11 published JP regions now have curated lift wind-hold seed data. Seeds are split into per-region files `src/data/lifts/<region>.ts` (hakuba-valley, myoko, yuzawa, niseko, furano, rusutsu-kiroro, zao-onsen, hakkoda-aomori-spring) imported and merged in `src/data/lifts.ts`; Yamanouchi + Iiyama arrays remain inline there. Generic MountainDetail auto-renders the panel when `getLiftsForMountain` returns data — no per-region UI wiring needed.
- Invariant test: `pnpm --filter @workspace/feelzlike test:lifts` (unique ids, enums, elevations, thresholds). It cannot check mountainId membership against region configs (would import `@/regions` PNGs) — verify that in review when adding seeds.
- **Curated eat/stay is GONE everywhere (owner reversed the Yamanouchi exception, late July 2026).** Yamanouchi's Stay route override was removed from `src/regions/yamanouchi/router.tsx` so ALL towns use generic RegionStay/Eat (affiliate platform links + Google Maps launch pad). Curated `regions/yamanouchi/pages/stay.tsx`/`eat.tsx` remain in the folder but are unrouted; do not re-wire them. **Why:** owner wants one consistent format across areas.
- **Sapporo region added (July 2026)** — 13th JP region: Sapporo Teine / Sapporo Kokusai / Sapporo Bankei, towns Sapporo + Jozankei. Owner is working through an expansion list (Tomamu-Sahoro, Asahikawa, Minakami, Kusatsu-Manza, Hachimantai, Bandai, western Japan) — proposed as project tasks; new areas follow the generic pattern, mirror `src/regions/sapporo.ts`.
