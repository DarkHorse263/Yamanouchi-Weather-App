---
name: feelzlike daily smoke test
description: how the daily prod watchdog (pages+canonical, api, dead outbound links) is scheduled on autoscale and how to keep it honest
---

## The rule
Prod is an AUTOSCALE deployment: an in-process node-cron alone is untrustworthy (replica asleep at the scheduled minute = silent miss; multiple replicas = duplicate owner emails). Any scheduled job living inside the api-server must be DB-claimed: unique (job_name, run_key) row in the shared `job_runs` table, single atomic upsert claim (re-takes orphaned claims where finished_at is null and started_at is stale), plus a periodic catch-up sweep so the first replica a visitor wakes runs the missed slot.

**Why:** architect review failed the first version for exactly this; the repo's alertEvaluator documents the same constraint (prod leaves RUN_ALERT_CRON unset for this reason).

**How to apply:** reuse `job_runs` + the claim pattern in the smoke job for any future scheduled work; never gate a prod cron on "one replica owns it" env vars alone. Accepted limitation: zero traffic all day = no run (an in-app watchdog can't report its own host dead) — external uptime monitor is the complement for hard-down.

## Smoke test specifics worth keeping
- Link manifest is GENERATED (script in the web artifact scans src/data + src/regions by regex, no imports — PNG assets crash imports). Re-run it after adding outbound links or the smoke test checks a stale list.
- Never machine-visit affiliate links (registers fake clicks); also excluded: social (permanent bot walls), map-tile infra, own domain.
- Bot-gate statuses (403/405/429/999/530 etc), EAI_AGAIN, and UNABLE_TO_VERIFY_LEAF_SIGNATURE count as reachable — only 404/410, hard 5xx, and dead hosts fail, retried once. This keeps the owner email signal-only; loosening it floods him with false positives (verified: ~2 transient false positives per run even with retries).
- Sitemap canonical check (every loc URL must 200 and self-canonical) is the regression tripwire for the SPA catch-all rewrite swallowing prerendered pages.
- Prod schema changes ship via Replit's publish-time schema diff — never hand-migrate prod; new table + the env flag that needs it go live in the same publish.
- First publish after adding the scheduler fires a catch-up run ~90s after boot (yesterday's key unclaimed) — expected, tell the owner.
