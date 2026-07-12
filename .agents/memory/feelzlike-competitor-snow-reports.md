---
name: feelzlike competitor snow reports (AU + Japan)
description: How SnowsBest (AU) and SnowJapan/360niseko/etc (JP) build daily snow reports, where feelzlike wins, and the gap lists (researched July 2026)
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

# Japan landscape (researched July 2026)

## Who matters
- **SnowJapan.com** — the JP benchmark. 100% independent HUMAN observers at
  ~10 base areas ("Now" reports: Niseko/Kutchan 250m, Hakuba/Happo 750m,
  Myoko 750m, Nozawa 560m, Madarao/Iiyama 900m, Furano, Geto...). Observed
  snowfall = first-hand AT BASE since last report; separate "official snow
  depth" section fed by ski areas; explicit honesty caveats (base≠upper,
  don't compare regions). Once/twice daily, no radar/bands/models.
- **360niseko** — hyper-local Niseko daily (only posts if it snowed); own
  station at 200m; 24h cm + 6am temp + narrative; leans on JMA 6h nowcast.
- **Resort officials** — JP resorts DO publish daily reports like AU (Niseko
  United, Hakuba Valley official, Zao: depth, new snow, lifts open %).
- Aggregators: OpenSnow (forecaster daily), snow-forecast (3 fixed
  elevations), OnTheSnow/skiresort.info (resort feeds), Mountainwatch.

## feelzlike JP standing
- Coverage is Nagano-centric (hakuba-valley, nozawa-onsen, iiyama incl
  Madarao, yamanouchi) — no Niseko/Hokkaido, no Myoko; SnowJapan covers both.
- Already unique: JMA AMeDAS obs reconciliation, elevation bands + FL
  partition (nobody in JP does bands on a per-town basis), minutes cadence,
  whole-trip layer (transport/stay/onsen).
- JP gaps mirror AU + extras: (1) no snowReportUrl links for JP (was "on
  purpose", revisit), (2) no JP resort-reported adapter (JP feeds exist),
  (3) AMeDAS stations also report SNOW DEPTH — could surface as automated
  "observed" numbers (our answer to SnowJapan's human observers), (4) no
  JP "Official" radar tab — JMA nowcast tiles are public and praised, the
  AU WillyWeather tab has no JP equivalent yet.
