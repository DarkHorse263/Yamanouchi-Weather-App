# Austria national coverage inventory: first pass

Research date: 4 October 2026. Austria only. No new public coverage added.

## Deliverables

- `austria-candidate-inventory.json`: 265 secondary-source discovery records.
  These are not 265 verified resorts and are not safe to import into runtime.
- `austria-official-directory-leads.json`: 63 entries extracted from official
  directories, retained separately pending identity reconciliation.
- `austria-evidence/`: fetched source snapshots, with URLs, retrieval date and
  truncation warnings. Wikipedia's first chunk and continuation cover its
  entire extracted article; other dynamic/paginated directories do not yet
  constitute exhaustive inventories.
- `arlberg-reconciliation.md`: current app coverage versus official network
  structure, and the first implementation evidence gate.

## Geographic ledger

| State | Secondary discovery records | Primary-source work | Remaining completeness check |
|---|---:|---|---|
| Carinthia | 24 | Official tourism directory fetched; 23 named entries extracted | Directory advertises 24; resolve missing/changed listing and smaller areas |
| Lower Austria | 22 | Official tourism page fetched; six featured areas plus additional links | Featured destinations are not an exhaustive inventory |
| Upper Austria | 20 | Official directory fetched; first 10 entries extracted | Pagination; duplicate Feuerkogel POIs; small lifts |
| Salzburg | 36 | Official snow-report directory fetched, truncated | Continue source; remove duplicate report variants; establish jurisdiction |
| Styria | 53 | Official directory fetched; 24 linked entries extracted | Pagination/filters, small lifts and current operating identities |
| Tyrol | 72 | Official directory fetched; first six linked entries extracted | Load remaining entries; include East Tyrol; shared networks |
| Vorarlberg | 36 | Official Arlberg network and Warth–Schröcken pages fetched | Province-wide directory reconciliation remains |
| Vienna | 2 | City authority confirms Hohe Wand Wiese's synthetic surface | Verify Dollwiese's current snow operation separately |
| Burgenland | Not established | No adequate primary inventory obtained yet | Check local lifts; do not infer zero from absence in the seed source |

The source's province labels are preserved in the JSON. The official-lead
file is not additive to the 265 rows: it contains overlaps and duplicate POIs.

## Findings that change the implementation approach

1. Ski Arlberg appears in the secondary list under both Tyrol and Vorarlberg.
   Both rows are annotated as the same shared network, not two new resorts.
   The existing app's Lech Zürs and St Anton are scoped views within it.
2. The official Ski Arlberg site defines three ski regions. Warth–Schröcken
   is the missing third region; St Christoph, Stuben and Oberlech also need
   village/sector reconciliation rather than automatic extra resort counts.
3. Warth–Schröcken's official page repeats network-wide statistics.
   Official provenance alone does not make those numbers local to Warth.
4. Salzburg's official report directory includes out-of-state areas such as
   Ankogel and Feuerkogel, and duplicated report variants. Do not assign
   country/state or count resorts from the directory host or headings alone.
5. The Upper Austria directory has both “Family ski resort Feuerkogel” and
   “Feuerkogel plateau”. Keep them as source records until explicitly merged.
6. Vienna's city page describes Hohe Wand Wiese as a conveyor-served
   synthetic teaching slope that does not require snow. Marked excluded from
   the snow-resort rollout; retained for a visible audit trail.
7. Historical secondary records contain suspect combined/closed-area names.
   No elevations, lift counts or operational claims were imported from them.

## Next work order

1. Finish source pagination and obtain province-level evidence for Vorarlberg
   and Burgenland. Reconcile all seed rows, adding official omissions.
2. Verify Warth–Schröcken's terrain, representative forecast point, village
   locations and winter arrival routes. Expand the remaining Arlberg village
   coverage only where distinct local evidence supports it.
3. Implement the verified Arlberg additions with current Austria conventions,
   then validate weather, alerts, transport, discovery and SEO routes.
4. Continue through Austrian regions in batches. Sölden, Ischgl and SkiWelt
   remain candidates, not a substitute for the national ledger.

## Completion gates

Every canonical area needs an explicit included/excluded/unresolved
disposition with official evidence; connected networks and aliases need
documented relationships. Each included destination needs tested runtime
coverage. Live lift/snow/camera ingestion is optional only if the UI clearly
uses official link-outs instead; fabricated or stale live claims are not.

Nationwide completion is not established in this first pass. Do not display
a percentage using 265 as a denominator, or describe these records as live
coverage. France, Switzerland and Italy remain deferred.