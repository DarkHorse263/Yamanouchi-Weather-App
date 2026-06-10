---
name: feelzlike geolocation prompt funnel
description: How NearYou handles the "where you are now" location permission states and what analytics measure grant rate.
---

NearYou (`artifacts/feelzlike/src/components/home/NearYou.tsx`) never auto-prompts a returning visitor: it reads the live Permissions API state and only auto-resolves when already granted. First-time visitors get a one-tap entry instead of an on-mount prompt.

Decisions (keep consistent):
- Never re-request geolocation while the state is hard-`denied`. A `getCurrentPosition` retry re-fails silently (the browser does not re-show the native prompt once blocked). The `denied` state must give re-enable guidance + a reload button (reload re-checks permission), NOT a "try again" that quietly does nothing. A tap retry is only valid for `prompt` and `unavailable` (transient) states.
- **Why:** silent re-fails are the main reason the prompt was getting dismissed/abandoned.

Analytics funnel (Sentry breadcrumbs via `track`, category `weather`):
- denominator: `page_view` (path `/`, fired in App.tsx) and `welcome_nearyou_prompt` (one-tap entry impression, once per mount).
- success: `welcome_nearyou_located` with `data.initiated` = `tap` | `auto`.
- failure: `welcome_nearyou_denied` (`initiated` = `tap` | `auto` | `check`) and `welcome_nearyou_unavailable` (`tap` | `auto`). `check` = returning visitor already blocked at mount (no fresh request made).
- `welcome_nearyou_reload` = denied-state reload tapped.
Grant rate = located / prompt (tap funnel) or located / page_view (page funnel).
