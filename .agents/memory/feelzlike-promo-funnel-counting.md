---
name: feelzlike promo funnel counting
description: Viewport-gated impression rule for below-the-fold shown→clicked funnels.
---

# Promo funnel impression counting

The rule: **"shown" must mean actually seen, not mounted.** Below-the-fold banners/cards must gate their impression ping on real viewport visibility — IntersectionObserver with BOTH `isIntersecting` AND `intersectionRatio >= 0.5` (threshold alone is insufficient: observers deliver an initial entry below the threshold), fired once per page view.

**Why:** an on-mount "shown" ping counts page loads, not viewers; for a banner deep below the fold that produces a funnel with impressions but zero clicks AND zero dismissals, which reads as a broken click counter when the pipeline is actually fine.

**How to apply:** any shown→clicked funnel for below-the-fold UI. Diagnostic heuristic: impressions with literally zero dismiss/close events → suspect impression over-counting before a broken click counter.
