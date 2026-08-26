---
name: feelzlike Japan source reconciliation
description: Durable rules for matching and deduplicating Japan resort discovery directories.
---

Use separate normalization rules for candidate matching and canonical identity deduplication. Fuzzy matching may ignore generic words such as “ski”, “park”, “kogen”, or “resort”; canonical identity keys must preserve them and prefer reviewed record or public-page identities.

**Why:** Generic-word removal can silently merge distinct nearby areas such as Yuzawa Park and Yuzawa Kogen. Repeated aliases can also make one record look like multiple matches unless matches are deduplicated by canonical record ID first.

**How to apply:** Keep fuzzy candidate matching separate from canonical deduplication. Treat a source that delegates to another list as derived provenance rather than independent evidence.