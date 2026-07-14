---
name: feelzlike text contrast
description: readability rules for blue/accent text on the light theme after a client complaint
---

## Rule
The app is LIGHT-themed everywhere (no `.dark` is ever applied; `.glass` cards are white). Any Tailwind `*-300/400/500` TEXT on a card/page background is a contrast bug. Text on light surfaces must use the 700+ shades: sky-700 for standard accents/links, sky-800 for tiny (≤11px) uppercase labels, emerald-700/amber-700/rose-700 for status chips.

**Why:** July 2026 client feedback (Jindabyne user, mobile) that "light blue type is hard to read". Audit found sky-300/200 text on white glass cards at 1.4–2.8:1 contrast. The `text-*-300` chip pattern (`bg-*-500/15 text-*-300 border-*-500/30`) was a dark-theme idiom copied around; on light glass it is illegible.

**How to apply:**
- Elevation band label gradient is now sky-900 (upper) / sky-800 (mid) / sky-700 (base) — keep darker=higher; never reintroduce sky-500 base labels.
- Chip convention on light cards: `bg-<c>-500/15 text-<c>-700 border-<c>-500/30` (see LocationDetail line ~797 sky example).
- Light shades (sky-200/300/400) remain CORRECT on the genuinely dark surfaces: RadarMap slate-900 control panels, InstallPrompt slate-900 card. Don't darken those.
- Grey #808285 ("Navigate Work" grey) was offered by the owner and rejected for body/small text: 3.9:1 on white fails WCAG AA (4.5:1) and drops the brand blue. Fine for hairlines/disabled only.
- Decorative icons were left light on purpose; only type was darkened.
