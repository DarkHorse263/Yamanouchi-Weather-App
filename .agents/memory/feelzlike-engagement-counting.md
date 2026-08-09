---
name: feelzlike engagement counting
description: first-party cookieless visitor/page-view counting behind the admin engagement dashboard
---
# feelzlike engagement counting

- Owner-facing engagement numbers (visitors, page views, returning share, PWA installs) are FIRST-PARTY and cookieless: client pings a coarse section label on route change; server stores only daily aggregates plus a one-way monthly-rotating sha256(month|ip|ua|SESSION_SECRET) visitor hash. Never add identifiers, full URLs, or a client-side id — the design is deliberately consent-free.
- **Why:** GA only counts consented visitors; the owner needs truthful totals to sell partnership panels, without a privacy liability.
- **How to apply:** page labels must come from a FINITE server-side whitelist (static sections + region ids) with everything else collapsing to "other" — never store client-supplied labels raw (cardinality/pollution abuse). If SESSION_SECRET is unset, visitor hashing fails CLOSED (no counting), never a hardcoded fallback salt. Bots filtered by UA regex at record time. New regions are counted automatically via the exported region-id set in the regions route.
- Dev preview has no real traffic — the admin card explicitly says counts start from the first publish; don't "fix" zero numbers in dev.
