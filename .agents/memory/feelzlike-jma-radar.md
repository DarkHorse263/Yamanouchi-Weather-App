---
name: feelzlike JP official JMA radar
description: How the Japan Official radar tab works (JMA hrpns nowcast tiles) and its honesty/fallback rules.
---

# JP Official radar = JMA hrpns nowcast tiles

The Japan "Official" tab renders the JMA high-resolution precipitation
nowcast as live map tiles layered on the app's own labelled basemap — the
same pattern as the AU licensed WillyWeather feed, NOT a link-out and NOT an
iframe.

**Key facts:**
- Frame discovery: `targetTimes_N1.json` on jma.go.jp has NO CORS headers, so
  the browser cannot read it. A tiny server proxy (`/api/jma-radar/times`)
  serves it; the radar tiles themselves are public JMA CDN PNGs the browser
  loads directly (no key, CORS-fine) — tile traffic never touches the server.
- Tile path needs BOTH timestamps verbatim:
  `…/nowc/{basetime}/none/{validtime}/surf/hrpns/{z}/{x}/{y}.png`, UTC
  YYYYMMDDHHMMSS, max native zoom 10.
- **Honesty rule: past frames only.** N1 lists observed frames where
  `validtime === basetime`; N2/N3 are model nowcast FORECASTS. The server
  filters `validtime <= basetime` + `elements` contains `hrpns` so a tab
  labelled "radar" only ever animates measurement, never extrapolation.
  Don't loosen this without product sign-off.
- Fallback ladder: proxy failure past the 90-min stale cap → client degrades
  to the pre-existing official-site link-out card (never a blank panel).
- Client loop mirrors the AU WillyOfficialView (opacity-flipped layers,
  play/pause, frame dots, freshness footer, 45-min delayed flag). A paused
  user's selected frame must survive the 4-min background refresh (only snap
  to newest while playing).
- NZ stays link-out only (MetService has no embeddable tiles/frames).

**Why:** JP previously had link-out only; users compared it unfavourably to
the AU animated radar. The proxy-only-discovery split keeps server cost near
zero while staying inside JMA's public tile terms.
