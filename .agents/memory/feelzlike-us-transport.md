---
name: feelzlike US transport curation
description: How US town stay/eat/car-hire parity actually works and what remains
---

- Stay/Eat pages are GENERIC everywhere (live OTA search + Google Maps categories) since the owner reset; "give a town real content" = curate its transport dataset, not stays/eats JSON.
- US transport datasets default to an honest empty state. Curate high-traffic destinations first, and only replace the empty state after live official sources meet the same verification standard.
- **Why:** transport entries face the daily link smoke test; only ship operators verified against live official sites. Eagle County's "ECO Transit" rebranded to Core Transit — don't revert.
- Rideshare banner: suppress the categorical "no rideshare" notice by default for every US and Canadian town; broad Uber/Lyft coverage makes town allowlists stale immediately. AU, JP and NZ retain the explicit allowlist behavior.
- **Why:** a missing town entry previously produced a confident but often false claim, so adding any US/CA town silently created misinformation.
- **How to apply:** pass region country context into the rideshare policy on generic transport surfaces; do not restore US/CA to opt-in town allowlists.
