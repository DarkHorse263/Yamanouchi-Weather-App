---
name: feelzlike Japan area completeness
description: What "complete" means for the published JP areas — lift seeds live everywhere, curated eat/stay deliberately NOT expanded beyond Yamanouchi.
---

# Japan area completeness (decided July 2026)

## National completeness gate (decided 24 August 2026)

**Rule:** Do not advertise Japan until every currently operating Japanese ski area has a verified catalogue record. Closed, defunct and suspended areas stay excluded from public coverage.

**Why:** The prefecture audit identified at least roughly 276 gaps beyond the current destination coverage, but it also contains unnamed long-tail totals, duplicate/conflicting entries and ambiguous operating statuses. Bulk-importing the PDF as truth would create false coverage.

**How to apply:** Reconcile the audit against the existing 558-resort workbook and current official/operator or municipal sources. Maintain `draft | verified | published` status, aliases, prefecture, coordinates, defensible forecast elevation, official URL, operating status, source and verification date. Advertising waits until the named national list and automated completeness checks pass; richer lifts/webcams/transport can remain evidence-gated.

## Exhausted authoritative searches

**Rule:** If repeated operator, municipal and government searches still cannot establish operation, closure or succession, keep the record `unclear` with `not_verifiable_pending_authoritative_evidence`. Never infer closure from silence or operation from directory/tourism material.

**Why:** Five nationwide evidence passes found that many long-tail entries have only stale, generic or third-party references. Treating those as proof would make the catalogue look complete by weakening the honesty standard.

**How to apply:** Keep these records unpublished and keep the Japan marketing gate closed. Revisit them only when a current operator/municipal source appears; a newly published season calendar, ticket sale, facility notice, closure ordinance or successor notice can change the status.

- All 11 published JP regions now have curated lift wind-hold seed data. Seeds are split into per-region files `src/data/lifts/<region>.ts` (hakuba-valley, myoko, yuzawa, niseko, furano, rusutsu-kiroro, zao-onsen, hakkoda-aomori-spring) imported and merged in `src/data/lifts.ts`; Yamanouchi + Iiyama arrays remain inline there. Generic MountainDetail auto-renders the panel when `getLiftsForMountain` returns data — no per-region UI wiring needed.
- Invariant test: `pnpm --filter @workspace/feelzlike test:lifts` (unique ids, enums, elevations, thresholds). It cannot check mountainId membership against region configs (would import `@/regions` PNGs) — verify that in review when adding seeds.
- **Curated eat/stay is GONE everywhere (owner reversed the Yamanouchi exception, late July 2026).** Yamanouchi's Stay route override was removed from `src/regions/yamanouchi/router.tsx` so ALL towns use generic RegionStay/Eat (affiliate platform links + Google Maps launch pad). Curated `regions/yamanouchi/pages/stay.tsx`/`eat.tsx` remain in the folder but are unrouted; do not re-wire them. **Why:** owner wants one consistent format across areas.
- **Sapporo region added (July 2026)** — 13th JP region: Sapporo Teine / Sapporo Kokusai / Sapporo Bankei, towns Sapporo + Jozankei. New areas follow the generic pattern, mirror `src/regions/sapporo.ts`. The owner's expansion list (Tomamu-Sahoro, Asahikawa, Minakami, Kusatsu-Manza, Hachimantai, Bandai, western Japan) is now fully landed.
- **Tomamu & Sahoro + Asahikawa added (July 2026)** — 14th/15th JP regions. Tomamu and Kamui deliberately EXIST TWICE: furano keeps its day-trip mountains (`tomamu`, `kamui-ski-links`) untouched, while the new regions use distinct ids (`tomamu-resort`+`sahoro`, towns `tomamu-village`+`shimukappu`; `kamui`+`asahidake`, towns `asahikawa`+`higashikawa`). Duplicate ids would collide in the flat LOCATION_TO_REGION map and in the global lift-id test (furano already owns `kamui-gondola`). On the JP-wide interactive map the duplicate pins are nudged slightly (display only, Mitsumata precedent) so they don't stack.
- **Bandai + Daisen added (July 2026)** — Bandai (Fukushima): Nekoma Mountain (the former Alts Bandai south + Nekoma north are ONE lift-linked Hoshino resort since 23-24, id `nekoma-mountain`, Ikon Pass) + Grandeco (EN RESORT branding since 2023, official site grandecoresort.co.jp), towns Inawashiro + Urabandai. Daisen (Tottori, western Japan): single Daisen White Resort, towns Daisenji + Yonago — copy stays honest that it's a regional day hill AND that the operator changed after 2025-26 (Nihon Kotsu out, designated manager "Advance" in for 26-27); re-verify lifts/timetables before next season. Kansai day hills deliberately skipped (optional in plan, tiny scale).
