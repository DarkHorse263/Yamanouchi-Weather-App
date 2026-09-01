---
name: feelzlike funnel counting
description: Privacy and reliability boundary between anonymous funnel counters and hashed visitor analytics.
---

Anonymous aggregate funnel events must not depend on visitor hashing or the visitor-hash secret. Continue filtering obvious bots and missing user agents, but require the privacy-preserving hash only for page views and returning-visitor calculations.

**Why:** Funnel events contain only a finite stage and coarse surface, with no visitor identifier. Coupling them to hash availability can silently erase every signup stage and leave the admin dashboard unable to diagnose conversion.

**How to apply:** When adding or changing engagement events, keep visitor identity requirements inside page-view/visitor counting. Regression tests should prove normal-browser funnel events remain countable independently of hash configuration while automated user agents remain excluded.