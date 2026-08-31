---
name: feelzlike news + newsletter REMOVED
description: The on-site news feed and general email newsletter were removed; powder email alerts remain as a permanent standard feature.
---

# feelzlike news + newsletter were removed

By user-approved product decision the product was refocused on real
mountain-travel conditions. Three durable outcomes:

## 1. On-site news feed REMOVED
The `/news` page, home news panel, region NewsStrip, News nav link, curated
`data/news.ts`, the `/api/announcements` route and its RSS ingest job were all
removed. **The DB table (`resort_announcements`) was left DORMANT, not dropped**
— non-destructive by design.
**Why:** news/announcements were not core to the "can i go, and when" mission.
**How to apply:** do NOT reintroduce a news feed, `/news` page, or announcements
ingest without explicit product sign-off. Any prior "never regress /news" or
RSS-aggregation guidance is HISTORICAL — the surfaces no longer exist.

## 2. General email newsletter REMOVED
`NewsletterSignup`, the `/newsletter/*` + `/admin/newsletter` routes, the api
newsletter router, admin campaigns, and newsletter email templates were removed.
Newsletter DB tables were left DORMANT. `PremiumSubscribe` was repointed off the
newsletter flow toward the alerts/premium capture.

## 3. Snow/powder email alerts KEPT as a STANDARD feature
Snow/powder alerts are the retained email product. They require explicit consent
and double opt-in, but do not require an account or premium entitlement. Signup
surfaces remain visible year-round so visitors can prepare before winter.
**Why:** powder alerts are the core retention loop; account and premium gates
produced no genuine public signups.
**How to apply:** keep alert subscription public, consent-based, and double-opt-in.
Do not fold alerts back into a general newsletter or premium/account gate.

## If news is ever reintroduced (historical legal posture)
The old feed was aggregate-only (headline + short excerpt + link-out + source
attribution; never full body or source images) for copyright safety. If a news
surface is ever rebuilt, keep that posture.
