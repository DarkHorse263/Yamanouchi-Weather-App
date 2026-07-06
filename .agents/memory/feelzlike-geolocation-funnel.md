---
name: feelzlike geolocation prompt funnel
description: How NearYou handles the "where you are now" location permission states and what analytics measure grant rate.
---

NearYou (`artifacts/feelzlike/src/components/home/NearYou.tsx`) never auto-prompts a returning visitor: it reads the live Permissions API state and only auto-resolves when already granted. First-time visitors get a one-tap entry instead of an on-mount prompt. NearYouWeather (`/near-you` page) mirrors the same state machine.

Decisions (keep consistent):
- The `denied` state MUST offer a gesture-driven "try again" that calls `getCurrentPosition` directly (in addition to re-enable guidance + a reload).
- **Why (reversal of an earlier "never retry when denied" rule):** on iOS and installed/standalone PWAs the Permissions API `geolocation` state is frequently STALE — it keeps returning `"denied"` after the visitor re-enables location in OS settings, and `PermissionStatus.onchange` never fires for an OS-settings change. Reload alone re-reads the same stale value, so the visitor is stuck in a loop that no settings change can break (real owner hit this). A button tap is also the user gesture iOS needs to actually re-evaluate the permission. Desktop is unaffected: `onchange` already auto-recovers there, and a hard-denied retry just returns to `denied` via the error handler (honest, brief "locating" then back — not a button that silently does nothing).
- Denied-state copy leads with the always-visible PlaceSearch ("search your town in the box above"), then "already turned location back on? tap try again", then the settings + in-app-browser guidance (open feelzlike in safari or chrome). Never auto-prompt.
- "location is blocked" is NOT a header problem — prod HTML sends no Permissions-Policy (verified via curl of feelzlike.com). It is always per-device/browser permission, an in-app webview (settings can't fix — must open in a real browser), or a standalone PWA whose permission is separate from Safari.

Analytics funnel (Sentry breadcrumbs via `track`, category `weather`):
- denominator: `page_view` (path `/`, fired in App.tsx) and `welcome_nearyou_prompt` (one-tap entry impression, once per mount).
- success: `welcome_nearyou_located` with `data.initiated` = `tap` | `auto`.
- failure: `welcome_nearyou_denied` (`initiated` = `tap` | `auto` | `check`) and `welcome_nearyou_unavailable` (`tap` | `auto`). `check` = returning visitor already blocked at mount (no fresh request made).
- `welcome_nearyou_reload` = denied-state reload tapped; `welcome_nearyou_retry` = denied-state "try again" (gesture getCurrentPosition) tapped.
Grant rate = located / prompt (tap funnel) or located / page_view (page funnel).
