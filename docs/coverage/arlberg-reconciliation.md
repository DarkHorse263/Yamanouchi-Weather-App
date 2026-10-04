# Arlberg identity reconciliation

Checked 4 October 2026.

Official source:
https://www.skiarlberg.at/en/winter/ski-resort

The operator identifies three ski regions:

| Official ski region | Current app | Gap and proposed treatment |
|---|---|---|
| St Anton – St Christoph – Stuben | St Anton resort view and village | Verify St Christoph/Stuben individually; do not silently extend the existing forecast's scope |
| Lech – Oberlech – Zürs | Lech Zürs resort view; Lech and Zürs villages | Verify Oberlech as village/sector, not another independently counted network |
| Warth–Schröcken | No authored region | First new-region candidate within Austria; verify one combined area and its two village destinations |

Ski Arlberg itself is the parent network, not another resort to add alongside
all children. The secondary inventory's two state-level network rows are
annotated as duplicates at network level, not deleted as if one state's
access did not exist.

## Warth–Schröcken source inspection

Fetched:
https://www.skiarlberg.at/en/warth-schroecken/winter/ski-region

The official page verifies the area's identity and provides links to:
- lift report: https://www.skiarlberg.at/en/warth-schroecken/live-info/cable-cars-lifts
- interactive map: https://www.skiarlberg.at/en/warth-schroecken/live-info/map-navigation

Those linked pages have not yet been verified as usable feeds. The page
repeats 85 lifts and wider Arlberg terrain/freeride figures: do not import
them as Warth–Schröcken-only counts.

### Evidence required before runtime implementation

- Official terrain minimum/maximum and map-based representative coordinates.
- Verified Warth and Schröcken village elevations/coordinates, separate from
  terrain elevations. Do not calculate village weather from an assumed base.
- Explicit forecast midpoint and shared-cell elevation phase handling.
- Winter road approaches and closures. Existing Lech preparation warns
  against assuming the Lech–Warth road is a winter arrival route.
- Current public transport source; no invented timetable or journey time.
- Correct avalanche authority link and source-labelled official report links.
- Camera viewpoints/permissions if embedding is proposed; otherwise link out.

Implementation should use the existing AT country/timezone/threshold policies
and preserve official-link-only status until live sources independently pass
freshness, scope and permission checks.