---
name: feelzlike transition pollers
description: autoscale concurrency rule for jobs that derive ordered state transitions from periodic upstream snapshots
---

For state-history pollers, a unique `job_runs` claim per time bucket is necessary but not sufficient. Hold a job-wide PostgreSQL session advisory lock across claim, upstream fetch, prior-state read, transition write, and job completion.

**Why:** Adjacent time buckets can overlap on different autoscale replicas. Without job-wide serialization, an older poll can write after a newer poll and lose or reverse a return transition even though each bucket was claimed exactly once.

**How to apply:** Use the bucket claim for catch-up and idempotency, and an advisory lock for ordering. Keep upstream requests bounded so the lock cannot hang indefinitely; session locks release automatically if a worker dies.