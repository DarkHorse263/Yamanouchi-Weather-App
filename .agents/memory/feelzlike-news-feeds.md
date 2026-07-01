---
name: feelzlike news + newsletter REMOVED (alerts now premium)
description: The on-site news feed and general email newsletter were removed by product decision; snow/powder email alerts were kept and made premium. Do not reintroduce without sign-off.
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

## 3. Snow/powder email alerts KEPT and made PREMIUM
Snow/powder alerts are the retained email product and are now premium-gated:
`requireEntitlement("alerts.snow")` guards `POST /alerts/subscribe` (promo-window
aware — see feelzlike-premium-promo.md). The premium hub showcases powder alerts
as THE premium weather offering.
**Why:** alerts are high-value and monetizable; the generic newsletter was not.
**How to apply:** keep the entitlement gate on alert subscription; don't un-gate
it or fold alerts back into a free general newsletter.

## If news is ever reintroduced (historical legal posture)
The old feed was aggregate-only (headline + short excerpt + link-out + source
attribution; never full body or source images) for copyright safety. If a news
surface is ever rebuilt, keep that posture.
