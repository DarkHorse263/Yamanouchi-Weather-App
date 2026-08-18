---
name: feelzlike text contrast
description: readability rules for blue/accent text on the light theme after a client complaint
---

## Rule
Two-sided rule since the Aug 2026 bluebird repaint:
1. INSIDE white `.glass` cards → dark text (700+ shades, as below).
2. DIRECTLY ON the blue page canvas (`bg-[#0055FF]` wrapper, aurora hero) → white idiom ONLY: `text-white`, `text-white/70-90` bylines, `bg-white/10 border-white/25` panels, `text-sky-100/200` accents. `text-foreground`, `text-muted-foreground`, `text-sky-700`, and the default `h2` colour are all near-black on blue (~3:1) = the owner's "black type" complaint (Aug 2026, Perisher lift-report panel). LiftWindHoldPanel's header is the reference pattern.

**Blur caveat:** PremiumGate's signed-out `blur-[6px]` smears any text into murky smudges — owner screenshots of blurred sections can LOOK like black type even when computed colour is white; verify with computed styles (puppeteer via api-server's dep + nix chromium) before repainting.

**Audit trick:** a puppeteer contrast sweep (walk text nodes, climb to first opaque bg, flag dark text without a light backdrop) catches these reliably; ~3:1 dark-navy-on-#0055FF slips past a naive `<3` cutoff.

The app is LIGHT-themed everywhere (no `.dark` is ever applied; `.glass` cards are white). Any Tailwind `*-300/400/500` TEXT on a card/page background is a contrast bug. Text on light surfaces must use the 700+ shades: sky-700 for standard accents/links, sky-800 for tiny (≤11px) uppercase labels, emerald-700/amber-700/rose-700 for status chips.

**Why:** July 2026 client feedback (Jindabyne user, mobile) that "light blue type is hard to read". Audit found sky-300/200 text on white glass cards at 1.4–2.8:1 contrast. The `text-*-300` chip pattern (`bg-*-500/15 text-*-300 border-*-500/30`) was a dark-theme idiom copied around; on light glass it is illegible.

**How to apply:**
- Elevation band label gradient is now sky-900 (upper) / sky-800 (mid) / sky-700 (base) — keep darker=higher; never reintroduce sky-500 base labels.
- Chip convention on light cards: `bg-<c>-500/15 text-<c>-700 border-<c>-500/30` (see LocationDetail line ~797 sky example).
- Light shades (sky-200/300/400) remain CORRECT on the genuinely dark surfaces: RadarMap slate-900 control panels, InstallPrompt slate-900 card. Don't darken those.
- Grey #808285 ("Navigate Work" grey) was offered by the owner and rejected for body/small text: 3.9:1 on white fails WCAG AA (4.5:1) and drops the brand blue. Fine for hairlines/disabled only.
- Decorative icons were left light on purpose; only type was darkened.
