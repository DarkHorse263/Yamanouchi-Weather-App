---
name: feelzlike units preference
description: How the member units (metric/imperial) preference propagates through display components
---

Canonical data app-wide stays METRIC (°C, cm). Conversion happens only at the display edge via `useUnits()` (artifacts/feelzlike/src/components/auth/UserPrefsProvider.tsx) backed by pure helpers in `src/lib/unitsFormat.ts`.

**Rule:** components inside the feelzlike artifact call `useUnits()` directly (safe without a provider — defaults metric). Components in the shared `lib/feelzlike-dashboard` package must NOT import app hooks; they take optional display-edge props instead (`formatTemp`/`tempUnitLabel`, `formatValue`/`formatSnowValue`/`snowUnitLabel`/`unitLabel`) defaulting to the metric presentation, and callers pass values bound from `useUnits()`.

**Why:** the dashboard package is app-agnostic and also renders in contexts without the prefs provider; prop injection keeps it pure while letting the whole app flip at once when a member saves their preference.

**How to apply:** any new temp/snow readout — convert with `u.temp`/`u.snow`/`u.snowVal` and label with `u.tempUnit`/`u.snowUnit` (reviews reject bare `°` without a C/F label). Wind (km/h) and elevations (m) are still metric-only everywhere — mph/feet is a proposed follow-up, keep them consistent until then. Unit-thresholds explainer copy (powder window criteria) must also be unit-aware.
