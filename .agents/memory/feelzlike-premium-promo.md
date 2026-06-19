---
name: feelzlike premium promo window
description: How the launch-promo window and premium gating are wired in the feelzlike shell.
---

The launch-promo and premium-gating state lives in `lib/feelzlike-shell/src/usePremium.ts` and is consumed via the exported `usePremium()` hook. The shape is `{ isPremium, isPromoPeriod, isPromoUpcoming, daysLeftInPromo, promoStartsAt, promoEndsAt }`.

## Rule: date-only env vars must be parsed as LOCAL time, not UTC

`new Date("2026-08-01")` is parsed as UTC midnight by the JS spec, which silently rolls the boundary back hours for users east of UTC. For AU users the promo would end at 10am Sydney on Jul 31 instead of midnight Aug 1.

**How to apply:** any date-only "YYYY-MM-DD" boundary read from an env var must be parsed via the `parsePromoBoundary(raw, kind)` helper, which constructs a local `new Date(y, m-1, d, ...)` with `kind="start"` → 00:00:00 and `kind="end"` → 23:59:59.999. Full ISO timestamps with explicit offsets pass through `new Date()` unchanged.

## Rule: promo window has BOTH a start and an end, defaults baked in

The promo runs 1 June 2026 → end-of-day 1 August 2026 by default. Overridable via `VITE_PREMIUM_PROMO_STARTS_AT` and `VITE_PREMIUM_PROMO_ENDS_AT`. Setting either to an explicit empty string disables that boundary; leaving the var undefined falls back to the bundled default. This was an intentional choice so the build works in dev + prod without anyone having to remember to set the var.

**Why:** the user explicitly asked for promo to *start* on 1 June, not just end on 1 August. A single end-date is not enough · without a start, the banner would show before the promo opens. `isPromoUpcoming` is the dedicated state for "before-start".

## Rule: client-side gating is NOT a paywall

`usePremium()` is for UI only · it flips a localStorage flag for previewing. Real entitlements are enforced server-side via `requireEntitlement(...)` middleware in `artifacts/api-server/src/middlewares/require-entitlement.ts`. When Stripe lands, the resolver plugged into `setSubscriptionResolver(...)` is the one that gates routes for real. Any premium feature shipped without a server-side `requireEntitlement(...)` guard is functionally free.

**How to apply:** every premium-only API route must call `requireEntitlement('<entitlement>')`. New entitlements go in `artifacts/api-server/src/lib/entitlements.ts` and must be added to the appropriate tier(s) in `TIER_ENTITLEMENTS`.

## Decision: premium is HIDDEN UNTIL TRACTION (June 2026)

Premium is intentionally switched off in the UI while building an audience. Do NOT "fix" any of the below as if it were a bug.

- `PremiumGate` (lib/feelzlike-shell/src/PremiumGate.tsx) is deliberately a PASS-THROUGH · it renders `children` directly with no lock card / promo pill / upgrade CTA, so every gated section (MountainDetail, TownHome, yamanouchi resort, alerts pages) shows as a normal free feature. The full `PremiumGateProps` interface is kept so the many call sites compile unchanged.
- The "Premium" nav tab is removed from `DEFAULT_MOUNTAIN_NAV` (and its `Sparkles` import), the Alerts lock glyph is suppressed (`locked: false`) and the explicit `pushMountain("/premium")` is removed in `AppShell.tsx`.
- `TripPlanner` no longer locks · `PlannerLock` + the "free during launch" pill + the `!isPremium` gate were removed, so the planner always renders.
- The `/premium` (and `/plan`) routes stay MOUNTED in `App.tsx` (orphaned, direct-URL only), NOT deleted.

**Why:** user asked to hide premium until there is traction; chosen approach is fully reversible without touching the dozens of call sites. Note only `TripPlanner` and `Premium.tsx` consume `usePremium()` directly · region pages only go through `PremiumGate`.

**How to restore:** restore the `PremiumGate` gating body from git history; re-add the `/premium` nav item + `Sparkles` import in `defaultNav.ts`; restore `locked: it.path === "/alerts"` and `pushMountain("/premium")` in `AppShell.tsx`; restore TripPlanner's `!isPremium` gate, `PlannerLock`, promo pill and `usePremium` import.
