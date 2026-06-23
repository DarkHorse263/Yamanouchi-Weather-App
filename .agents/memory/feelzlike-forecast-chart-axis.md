---
name: feelzlike forecast chart y-axis clipping
description: Why ForecastChart's YAxis needs an explicit per-metric width and no negative left chart margin.
---

The 24-hour-trend AreaChart (artifacts/feelzlike/src/components/weather/ForecastChart.tsx) appends the unit to each Y-axis tick ("°C" / "cm" / "km/h") via tickFormatter. The Wind metric's "km/h" labels are the widest.

**Why:** A negative `margin.left` (was -20) plus recharts' default YAxis width (60) tightens the gap for narrow temperature labels but pushes the axis partly off the container's left edge, clipping the wider "km/h" wind labels (James saw "Nkm/h" rendered as "m/h"). Temperature/Snowfall looked fine, so the bug only showed on the Wind tab.

**How to apply:** Keep `margin.left` at 0 (not negative) and set an explicit YAxis `width` sized for the metric (wind ~56, others ~44). Do not reintroduce a negative left margin (or a leftward `dx`) to "tighten" the axis · it re-clips wide unit labels.
