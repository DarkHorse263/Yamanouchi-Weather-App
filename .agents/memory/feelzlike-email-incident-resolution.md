---
name: feelzlike email incident resolution
description: Concurrency and audit invariants for manually removing email delivery suppression.
---

Webhook incident insertion and admin resolution must take the same transaction-scoped advisory lock derived from the normalized email address. Only the deterministically latest incident can be resolved, and a later incident must restore suppression automatically.

**Why:** Without coordination, a bounce or complaint can arrive between the admin route's latest-row check and update, leaving a stale incident audited as resolved even though a newer block exists.

**How to apply:** Any new writer of email delivery incidents or suppression resolution must participate in the same per-email lock. Keep latest ordering deterministic and preserve resolver identity and time on the original incident row.