---
name: feelzlike bottom-anchored overlays vs mobile nav
description: How consent banner + install prompt avoid covering the mobile bottom nav
---

Rule: bottom-anchored overlays (cookie consent banner, PWA install prompt) must never cover the mobile bottom nav. They position with `bottom-[var(--mobile-bottom-nav,0px)]`; AppShell (feelzlike-shell) sets `--mobile-bottom-nav: calc(4rem + env(safe-area-inset-bottom))` on `documentElement` while mounted and removes it on unmount. Pages without AppShell (home) fall back to the plain bottom edge.

Product decisions (Aug 2026, reverses the earlier "impossible to miss" stance):
- Install prompt waits until cookie consent is decided (`useConsent().hasDecided`) so the two prompts never stack on first visit.
- Dismissing the install prompt persists for 14 days (localStorage `feelzlike:installDismissedAt`); it returns after the cooldown until installed.

**Why:** on a fresh phone visit both prompts stacked and fully hid the bottom nav; dismiss did not persist so it nagged every visit.
**How to apply:** any new bottom-fixed overlay should use the same CSS var; don't hardcode the nav height or reintroduce a non-persistent dismiss.
