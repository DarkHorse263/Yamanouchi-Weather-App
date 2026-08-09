---
name: feelzlike social launch ads
description: How the Lonely-Planet-style "meet the app" social ad images are generated and the traps hit while building them.
---

# feelzlike social launch ads (build-social-ads.ts)

`artifacts/api-server/src/scripts/build-social-ads.ts` renders 4 versions (overall / japan / australia / nz) x 2 formats (1080x1920 story + 1080x1080 square) into `exports/social-ads/`. Owner assets only, never public downloads. Run: `pnpm --filter @workspace/api-server exec tsx ./src/scripts/build-social-ads.ts` (`AD_VERSION=<id>` limits to one).

**Format** (owner-approved, copied from a Lonely Planet story ad he liked): kicker + pink (#EC008C) boxed headline, a REAL live-site phone screenshot in a device frame, three icon callouts with connector lines, white pill CTA "free until 31 december · feelzlike.com". Dark navy ad-kit background, DIN Pro, brand voice rules apply.

**Screenshots are live prod pages via puppeteer** (390x800 dpr2, isMobile):
- Pre-seed `feelzlike.consent.v1` in localStorage via evaluateOnNewDocument so the consent banner never renders.
- JP pages sit in GREEN season all summer — pre-seed `feelzlike:<regionId>:season = "winter"` to flip the season pill for the shot (SeasonProvider storage key).
- Hide leftover fixed bottom overlays post-load; NO fake notch overlay (it clips the app header logo).

**Traps:**
- Region slugs must come from the SITEMAP, not guessed — a curl 200 means nothing (SPA catch-all serves every path; wrong region slug silently client-redirects to home). Real slugs: `hakuba-valley`, `queenstown` (not hakuba / queenstown-lakes).
- Standalone scripts using `page.evaluate` DOM globals need `/// <reference lib="dom" />` or api-server typecheck fails.
- Honesty rails vetted: AU never claims live lifts; NZ live-highway claim OK (Waka Kotahi); JP radar claim is "official jma radar built in", NOT "every region"; screenshots show real (possibly summer) temps — regenerate near campaign launch.

**Why:** owner's ads all land on the home page; these images replace generic tiles with product-proof creative.
