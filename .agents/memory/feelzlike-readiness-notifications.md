---
name: feelzlike readiness notifications
description: Delivery and deduplication rule for one-time evidence-readiness emails.
---

Persist an immutable snapshot of the evidence and notification payload when a readiness milestone is first claimed. Every retry must reuse that snapshot and a stable provider idempotency key. Automatic retries must stop before the provider's idempotency retention expires; mark the milestone as a visible durable failure instead of risking a duplicate.

**Why:** A timeout can be ambiguous: the provider may have accepted the email even when the worker did not receive the response. Retrying after the provider forgets the idempotency key can send the same milestone twice, while silently abandoning an expired claim hides a missed review.

**How to apply:** Use this rule for scheduled one-time review/readiness notifications. Keep evidence changes under human review, make claims cross-replica-safe and reclaimable within the safe window, and preserve terminal sent, permanent-failure, or expired state.