---
name: feelzlike mountain conditions summary
description: the "up there today" generated paragraph on mountain/resort pages — composition, honesty rules, and that it REPLACED DayNarrative on mountain pages only.
---

- Mountain/resort pages open with an "up there today" paragraph (`MountainConditionsSummary` → pure `lib/mountainSummary.ts`, tsx --test safe, no `@/regions` import). It EMBEDS `buildDayNarrative` as its first clause and REPLACED the bare `DayNarrative` block on the generic MountainDetail, snowy-mountains LocationDetail and yamanouchi resort page. Town pages still use plain `DayNarrative` — don't render both on one page.
- Clauses (each fail-soft, omitted when input missing): day narrative · snow next 24h ("models suggest ~X", elevation label ONLY when `snowfallOutlookLevel === "mid-mountain"`, using the RESOLVED elevation) · wind ≥50 km/h only, conditional wording via `windSoWhat` (never asserts lift status) · base (reported beats model; model speaks only off-season and ≥1cm; otherwise silent — never a confident 0).
- Units go through a `fmt` object supplied from `useUnits` at the component edge; the lib stays metric+pure. en/ja pair built together; MountainDetail + yamanouchi pass `lang`.

**Why:** honesty invariants (headline-snow elevation, lift honesty, reported-snow suppression) all apply to prose too — a wrong sentence erodes trust faster than a wrong tile.
**How to apply:** new bespoke mountain pages should render `MountainConditionsSummary` (not `DayNarrative`) and pass the resolved outlook fields off `current`, plus the same report/model-trust gating the page's stats use. Tests: `test:mountainSummary`.
