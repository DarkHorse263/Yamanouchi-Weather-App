---
name: feelzlike regional headline resilience
description: Reliability rules for the country and regional overview weather headlines during provider throttling and autoscale cold starts.
---

Regional overview weather must not rely on an in-process cache alone. Keep a cross-replica snapshot of sourced readings, preserve their original observation time, and label expired-fresh readings as cached.

**Why:** Autoscale cold starts can coincide with primary-provider throttling. Per-request concurrency limits prevent a stampede but cannot preserve coverage by themselves, and serial upstream timeouts can outlive the UI deadline.

**How to apply:** Bound primary batch concurrency and every retry delay, cap the overall overview response wait, release failed batches promptly, and monitor the shared snapshot as the controlled “new replica plus primary outage” scenario.