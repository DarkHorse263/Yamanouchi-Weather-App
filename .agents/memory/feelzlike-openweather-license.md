---
name: OpenWeather account and licence
description: Owner-confirmed free account; do not confuse OpenWeather with Open-Meteo.
---

The owner confirmed on 6 October 2026 that OpenWeather is on a free account. This is distinct from the paid Open-Meteo subscription.

**Why:** Free does not automatically mean non-commercial: OpenWeather's official FAQ permits commercial API use, while the supplied pricing document lists ODbL and required attribution for the Free plan. This does not prove feelzlike complies with all licence conditions.

**How to apply:** Check endpoint entitlements, request limits, visible attribution and any applicable database share-alike obligations before recommending an upgrade or claiming clearance. The FAQ requests attribution text, a website link and the OpenWeather logo. Recheck current terms at https://openweathermap.org/faq.

Use a conservative rolling 32 UTC-day request allowance rather than assume the provider resets on the first of the month. Reserve headroom for account activity outside feelzlike.

**Why:** The account's reset date and historical usage were not verified. App-side counting cannot cover requests before rollout or other apps sharing the account, so never describe it as a guarantee of account-wide compliance.
