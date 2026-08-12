---
name: feelzlike premium promo window
description: How the launch-promo window and premium gating are wired in the feelzlike shell.
---

The launch-promo and premium-gating state lives in `lib/feelzlike-shell/src/usePremium.ts` and is consumed via the exported `usePremium()` hook. The shape is `{ isPremium, isPromoPeriod, isPromoUpcoming, daysLeftInPromo, promoStartsAt, promoEndsAt }`.

## Rule: date-only env vars must be parsed as LOCAL time, not UTC

`new Date("2026-08-01")` is parsed as UTC midnight by the JS spec, which silently rolls the boundary back hours for users east of UTC. For AU users the promo would end at 10am Sydney on Jul 31 instead of midnight Aug 1.

**How to apply:** any date-only "YYYY-MM-DD" boundary read from an env var must be parsed via the `parsePromoBoundary(raw, kind)` helper, which constructs a local `new Date(y, m-1, d, ...)` with `kind="start"` → 00:00:00 and `kind="end"` → 23:59:59.999. Full ISO timestamps with explicit offsets pass through `new Date()` unchanged.

## Rule: promo window has BOTH a start and an end, defaults baked in

The promo runs 1 June 2026 → end-of-day 31 December 2026 by default. Overridable via `VITE_PREMIUM_PROMO_STARTS_AT` and `VITE_PREMIUM_PROMO_ENDS_AT`. Setting either to an explicit empty string disables that boundary; leaving the var undefined falls back to the bundled default. No `.env` override is set, so the bundled default is authoritative. This was an intentional choice so the build works in dev + prod without anyone having to remember to set the var.

**Why:** the user explicitly asked for promo to *start* on 1 June, not just end on 1 August. A single end-date is not enough · without a start, the banner would show before the promo opens. `isPromoUpcoming` is the dedicated state for "before-start".

## Rule: client-side gating is NOT a paywall

`usePremium()` is for UI only · it flips a localStorage flag for previewing. Real entitlements are enforced server-side via `requireEntitlement(...)` middleware in `artifacts/api-server/src/middlewares/require-entitlement.ts`. When Stripe lands, the resolver plugged into `setSubscriptionResolver(...)` is the one that gates routes for real. Any premium feature shipped without a server-side `requireEntitlement(...)` guard is functionally free.

**How to apply:** every premium-only API route must call `requireEntitlement('<entitlement>')`. New entitlements go in `artifacts/api-server/src/lib/entitlements.ts` and must be added to the appropriate tier(s) in `TIER_ENTITLEMENTS`.

## Decision: SOFT MEMBER GATE (July 2026) supersedes the pass-through

The pure pass-through below was superseded ahead of the Japan season. `PremiumGate` (lib/feelzlike-shell/src/PremiumGate.tsx) now soft-gates: children stay fully visible, but for SIGNED-OUT visitors any tap inside opens the free sign-up sheet (passwordless email magic link · no password, no card). Signed-in members pass through. No prompt ever fires on page load · only on explicit tap.

- Auth = magic-link flow: POST `/api/auth/email/request` → branded email → GET `/api/auth/email/verify` (HMAC token via ALERT_TOKEN_SECRET, 30 min TTL) → find-or-create `users` row (authProvider "email") + `sid` session (`provider:"email"` in SessionData · logout must NOT run the OIDC end-session for these).
- Signing in also claims a pending alert subscription (marks `verifiedAt`) · same-inbox proof.
- Server resolver (app.ts) grants synthetic pro only when `isPromoActive() && req.isAuthenticated()`; `requireEntitlement` returns 401 AUTH_REQUIRED for anonymous (client shows sign-up prompt) vs 402 for signed-in-without-sub.
- Shell↔app wiring: shell `PremiumAccessProvider`/`usePremiumAccess` (defaults to pass-through when unmounted); feelzlike `SignUpProvider` (components/auth/) wires auth state + the single app-wide `SignUpSheet`.

**Why:** owner plan · turn on member sign-ups before the Japan season with a gentle gate ("free until 31 dec" promo), converting the audience built during the pass-through phase.

## Decision (SUPERSEDED, kept for history): premium is VISIBLE · free-until-promo, no hard lock (June 2026)

Premium was hidden-until-traction earlier in 2026; that is REVERSED. Owner's model: keep every feature usable by everyone, badge premium as "free until 31 december 2026", invite email subscribes (no login), and show planned prices for after. Do NOT re-hide it or add a lock as if the pass-through were a bug.

- Promo default end moved to 31 December 2026 (start stays 1 June 2026).
- `PremiumGate` stays a PASS-THROUGH (renders `children`, no lock card / no per-section promo pill). This is now permanent-until-billing, not a temporary hide: with no billing wired, a lock + "start free trial" would be dishonest, and there are dozens of call sites (MountainDetail/resort/LocationDetail each have ~7) so per-section pills would be spam.
- Badging lives ONLY on the `/premium` hub: a "premium · free until 31 december 2026" badge next to the premium feature list. Not in the inline gates.
- `/premium` route restored in `App.tsx` (real component route, not the old redirect-home). "Premium" nav tab + `Sparkles` import restored in `defaultNav.ts`; `pushMountain("/premium")` restored in `AppShell.tsx`. Alerts lock glyph stays suppressed (`locked: false`) — no lock glyphs anywhere.
- Subscribe = `<PremiumSubscribe source="premium">` (`artifacts/feelzlike/src/components/PremiumSubscribe.tsx`), reusing the newsletter double-opt-in backend (`useSubscribeToNewsletter`). No new backend; `source="premium"` makes signups attributable in AdminNewsletter. This is where a checkout entry point goes when billing lands. Brand-voice lowercase (the footer `NewsletterSignup` is sentence-case and would clash on the lowercase premium page, hence the separate component).
- Prices shown on the hub: $5.99/mo · $60/yr AUD, framed "available after 31 december 2026".

**Why:** owner chose the frictionless path (usable + badge + email invite) over login-gated access, and chose to show prices now.

**When billing lands:** add checkout at the subscribe CTA; only THEN consider restoring a real `PremiumGate` lock for non-entitled users after the promo. The server-side `requireEntitlement(...)` middleware is the real gate, not `usePremium()`.

**Blur for signed-out (Aug 2026, owner request):** PremiumGate renders gated children blurred (blur + aria-hidden + inert, layout keeps its shape) with a full-area invisible overlay button that opens the free sign-up prompt — inert children can't receive events, so the overlay carries the tap. `inert` must be passed as a boolean prop (empty string is treated as false and warns). Signed-in accounts still pass through un-blurred during the promo.

**Snowfall outlook placement (July 2026):** the 24/48/72h snowfall outlook bars were MOVED out of the premium-gated "Mountain dials" block into the FREE "Next 48 hours" hourly panel (shared SnowfallOutlook component, rendered via HourlyForecast snowfallOutlook prop on all 3 resort page types). Deliberate: if a real lock is restored post-promo, the outlook stays free. Mountain dials = rings only now; its blurb no longer mentions incoming snow.
