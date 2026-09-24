---
name: Stripe live onboarding
description: Sandbox selection can make live installation fail even when the app is already installed.
---

For Replit live Stripe onboarding, select the live business account in the Stripe Marketplace account chooser, even if it says “Already installed”; do not select the app's sandbox.

**Why:** The sandbox installation returned an already-installed message followed by a failed live-connection callback. Selecting the live account succeeded and the user confirmed the healthy live-account section appeared.

**How to apply:** When diagnosing this loop, check the account name and sandbox banner before suggesting reconnection or uninstalling an existing app. Integration health alone does not prove payment checkout is configured or enabled.