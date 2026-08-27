---
name: feelzlike catalogue-owned mountain runtime
description: Runtime honesty rules for ski areas published from generated catalogues rather than authored region files.
---

A published catalogue mountain must be projected into the API weather-location registry, including aliases, coordinates, forecast elevation, region, country, and an explicit IANA timezone. Every catalogue-only region also needs a deterministic published mountain as its valid headline-weather location. Generated base towns must use the mountain-link-only experience unless the app has real town weather for that locality.

**Why:** A route and region card can look complete while the mountain weather request still 404s. A region without a representative location makes the headline pipeline call upstream weather with undefined coordinates. Using a centroid as town weather also creates a false location claim. Geographic timezone heuristics are unsafe around irregular boundaries such as Idaho's Pacific/Mountain split.

**How to apply:** Whenever another catalogue publishes records, test every public ID and alias through weather resolution, require explicit timezone metadata, give catalogue-only regions a finite representative headline location, collision-check all namespaces, and mark synthetic catalogue towns as link-only.