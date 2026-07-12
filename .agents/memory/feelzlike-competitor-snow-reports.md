---
name: feelzlike competitor snow reports (SnowsBest / Miss Snow It All)
description: How SnowsBest.com builds its daily AU snow reports, where feelzlike already beats it, and the agreed gap list (researched July 2026)
---

# SnowsBest / Miss Snow It All — how they do daily snow reports

They are ONE operation: misssnowitall.com.au is the old brand of Rachael
Oakes-Ash (journalist, ex-Fairfax "Snow It All" columnist); it redirects to
snowsbest.com. Both sit behind bot protection — research via web.archive.org.

## Their pipeline (two layers)
1. **7-day forecast tables** — licensed **MetraWeather** feed (MetService NZ's
   commercial arm), issued ONCE daily (~16:30 UTC), one fixed forecast
   elevation per resort (e.g. Thredbo 1830m). Columns: icon, high/low, snowfall
   cm, rainfall mm, min freezing level, one-line text. 9 AU resorts + NZ.
2. **Journalist editorial** — daily/weekly narrative articles in season
   (storm hype/deflation, season outlook) built on **resort-published morning
   snow reports** (stake depths, overnight cm, lifts/terrain open — ASAA
   members use consistent reporting definitions) + weekly Fairfax column
   syndication. No live radar, no obs, no elevation bands, no multi-model.

## Where feelzlike already wins (don't regress these)
- Refresh cadence (minutes vs once daily), multi-model ensemble + spread vs
  single feed, elevation BANDS w/ freezing-level phase partition vs one fixed
  elevation, licensed live radar + JP obs reconciliation, snowmaking wet-bulb
  windows, roads/transport, AU+JP+NZ coverage.

## Their real edges over us (gap list, owner-facing)
1. Resort-REPORTED morning numbers across all resorts (we pilot Thredbo only)
   — overnight cm, base, season-to-date from resort stakes.
2. Lifts/terrain-open counts (we deliberately show none without a live feed;
   Thredbo per-lift XML is the known Phase-2 source).
3. Human narrative layer ("what it means") — could be a data-driven daily
   digest in brand voice instead of hiring journalists.
4. Season context (season-to-date vs long-term average, e.g. Spencers Creek
   historical curve).
