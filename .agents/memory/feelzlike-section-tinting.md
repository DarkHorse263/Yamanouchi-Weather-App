---
name: feelzlike section tinting (colour direction "03")
description: The per-section accent colour system — how sections own colours in nav + home tiles, and the invariants that must survive.
---

# feelzlike section tinting

Each app section owns a colour, surfaced as colour-coded navigation (desktop
sidebar + mobile bottom nav) and tinted home section tiles. Single source of
truth: `lib/feelzlike-shell/src/sectionAccents.ts` (`SECTION_ACCENTS` path->hex
map + `sectionAccentFor(path)` + `mixSection(hex,pct)` = `color-mix(in srgb,
hex pct%, white)`), exported from the shell barrel. Add/rename a section colour
there and nowhere else.

## Invariants (do not break)
- **Snow amounts stay pink** (`--color-snow-accent` #ec008c) — never a section
  colour. Section tinting is orthogonal to the snow-accent system.
- **Today ("/") and any unlisted path stay brand blue** (`--primary`). Today is
  the aggregator hub; it has NO entry in `SECTION_ACCENTS` on purpose and falls
  back to the existing `text-primary`/`bg-primary/8` classes. The Alerts home
  tile is also deliberately left on primary.
- Accents apply **only when a nav item is active**; inactive items stay muted.
- **Mobile bottom nav lightens the accent** — the raw hues are AA-on-white for
  the desktop sidebar; on the solid-blue glass-strong bar they sink into the
  blue, so `AppShell`'s bottom nav renders `mixSection(accent, 35)` (pale tint)
  instead of the raw hex. Don't "fix" it back to the raw accent.

**Why:** snow-pink and primary-blue are load-bearing brand signals; a section
accent bleeding into either would make the app read as arbitrary rainbow.

## Two non-obvious mechanics
- **Resolve accent from the nav item's PATH, not its rendered href.** Hrefs are
  rewritten per-region (`/:region/weather`, `~/premium`), so keying on href
  would miss. `AppShell` resolves in `pushTown`/`pushMountain` from `it.path`.
- **Home tiles use the `--sa` CSS-var trick.** Tile sets `style={{"--sa":accent,
  ...}}` and the arrow uses the STATIC literal class `group-hover:text-[var(--sa)]`
  so Tailwind's JIT actually emits the rule (a runtime-only class name would be
  purged). Verified: Tailwind v4.2.1 compiles that literal to
  `color: var(--sa)` under `.group:hover`.

**How to apply:** any new section route that should be colour-coded just needs a
`SECTION_ACCENTS` entry keyed by its region-relative path; nav + (if it appears
as a home tile) the tile pick it up automatically. Inline custom-property style
objects cast `as CSSProperties` per the codebase convention (see sidebar.tsx).
