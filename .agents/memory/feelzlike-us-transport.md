---
name: feelzlike US transport curation
description: How US town stay/eat/car-hire parity actually works and what remains
---

- Stay/Eat pages are GENERIC everywhere (live OTA search + Google Maps categories) since the owner reset; "give a town real content" = curate its transport dataset, not stays/eats JSON.
- US transport datasets default to an honest empty state. Curate high-traffic destinations first, and only replace the empty state after live official sources meet the same verification standard.
- **Why:** transport entries face the daily link smoke test; only ship operators verified against live official sites. Eagle County's "ECO Transit" rebranded to Core Transit — don't revert.
- Rideshare banner: `RIDESHARE_AVAILABLE_TOWNS` in RideshareUnavailableNotice.tsx suppresses the "no Uber here" notice. Uber/Lyft DO operate in major US resort towns — new US towns likely belong on the allowlist or the banner lies.
