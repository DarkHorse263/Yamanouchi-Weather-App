---
name: Paid Open-Meteo boundary
description: Commercial subscription decision and safeguards for provider requests.
---

The owner confirmed subscribing to Open-Meteo on 6 October 2026 after reviewing API Standard. The exact purchased tier was not independently verified.

**Why:** the public free API does not permit commercial promotional use. Do not silently fall back to it if paid credentials fail. Keep existing alternate-provider fallbacks subject to their own licensing review.

**How to apply:** all new Open-Meteo forecast consumers must use the server-side paid boundary, including map interactions. Never put the key in browser code. Preserve provider HTTP status and Retry-After for existing rate-limit handling; scrub credential-bearing URLs from telemetry. A paid Open-Meteo subscription does not clear other providers or advertising assets.
