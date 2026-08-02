---
name: feelzlike Canada ski directory
description: The /ca/all-ski-areas static directory page — dataset rules, link-rot posture, and why its links are excluded from the nightly link check.
---
- /ca/all-ski-areas lists every Canadian ski area NOT covered live (264 of skiresort.info's 289), grouped by province with a curated "worth knowing" strip. Dataset = src/data/canadaDirectory.ts (name, province, website|null, infoUrl, notable, blurb).
- Official-site links were read from each skiresort.info detail page (never guessed — link-rot/hijack hazard); website:null entries link their skiresort.info page labelled "info".
- **Why excluded from link manifest:** generate-link-manifest.mjs has a SKIP_FILES set for canadaDirectory.ts so the nightly smoke test doesn't hammer ~225 small-town websites. Keep it excluded when regenerating.
- **How to apply:** if a directory resort gets full coverage later, remove it from the dataset; new static top-level routes must ALSO be added to api-server app.ts KNOWN_TOP_LEVEL or prod deep-links 404.
