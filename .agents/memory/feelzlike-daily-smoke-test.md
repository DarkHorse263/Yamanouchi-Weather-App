---
name: feelzlike daily smoke test
description: how the daily prod watchdog (pages+canonical, api, dead outbound links) is scheduled on autoscale and how to keep it honest
---

## The rule
Prod is an AUTOSCALE deployment: an in-process node-cron alone is untrustworthy (replica asleep at the scheduled minute = silent miss; multiple replicas = duplicate owner emails). Any scheduled job living inside the api-server must be DB-claimed: unique (job_name, run_key) row in the shared `job_runs` table, single atomic upsert claim (re-takes orphaned claims where finished_at is null and started_at is stale), plus a periodic catch-up sweep so the first replica a visitor wakes runs the missed slot.

**Why:** architect review failed the first version for exactly this; the repo's alertEvaluator documents the same constraint (prod leaves RUN_ALERT_CRON unset for this reason).

**How to apply:** reuse `job_runs` + the claim pattern in the smoke job for any future scheduled work; never gate a prod cron on "one replica owns it" env vars alone. Accepted limitation: zero traffic all day = no run (an in-app watchdog can't report its own host dead) — external uptime monitor is the complement for hard-down.

## Smoke test specifics worth keeping
- Link manifest is GENERATED (script in the web artifact scans src/data + src/regions by regex, no imports — PNG assets crash imports). Re-run it after adding outbound links or the smoke test checks a stale list. `source_urls` fields in curated JSON are stripped before the scan (research provenance, never rendered — checking them alarmed the owner about pages no visitor sees).
- Never machine-visit affiliate links (registers fake clicks); also excluded: social (permanent bot walls), map-tile infra, own domain.
- Bot-gate statuses (403/405/415/429/503/999/530 etc), EAI_AGAIN, UNABLE_TO_VERIFY_LEAF_SIGNATURE, and TIMEOUTS all count as reachable-but-unverifiable — only 404/410, remaining hard 5xx (502/504), and dead hosts (ENOTFOUND/ECONNREFUSED) fail, retried once. Rationale (July 2026 triage, 14 of 15 report items were false positives): the job runs 19:45 UTC = 4:45am JST, inside big Japanese sites' nightly maintenance window (jalan.net 503s every night, back by morning); Akamai-class bot walls silently drop or time out datacentre traffic (kfc.com.au, travel.rakuten.com load fine in browsers); a genuinely dead site ends as 404/410 or dead host, not eternal 503/timeout. Accepted trade: a permanently-parked 503/firewalled site never alerts again, and some walls (Imunify360, e.g. charlottepass.com.au) answer automation with fake 200+JSON — both undetectable server-side. Never hotlink images from Imunify360-walled hosts; their asset status can't be verified and even browser engines get bounced.
- Sitemap canonical check (every loc URL must 200 and self-canonical) is the regression tripwire for the SPA catch-all rewrite swallowing prerendered pages.
- Prod schema changes ship via Replit's publish-time schema diff — never hand-migrate prod; new table + the env flag that needs it go live in the same publish.
- First publish after adding the scheduler fires a catch-up run ~90s after boot (yesterday's key unclaimed) — expected, tell the owner.
