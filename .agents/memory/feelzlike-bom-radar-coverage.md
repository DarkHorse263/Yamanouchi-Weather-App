---
name: feelzlike BOM radar coverage
description: How /near-you (GPS + search) picks an official BOM radar for ANY Australian coordinate, and why the catalogue is smaller than BOM's full radar list.
---

Any Australian coordinate (GPS auto-detect or place search on /near-you) gets its
OWN nearest *covering* Bureau of Meteorology radar, NOT the official radar of the
nearest curated ski region. The pure lookup (`nearestBomRadar`) picks the sharpest
range whose usable radius (nominal km * 0.9) still contains the point, preferring
the most detail and tie-breaking by distance; a point outside every radar's sweep
(remote inland AU like Birdsville, or overseas) returns null.

**Why:** /near-you already renders full weather for arbitrary coords, but the radar
was region-mapped, so a non-ski town (e.g. Sydney) showed the wrong region's radar.
The override is threaded as an OPTIONAL `location` prop on RadarMap; region pages
pass nothing and are unchanged. The 0.9 factor keeps a match comfortably inside the
sweep instead of on the noisy outer edge.

**The catalogue is deliberately a SUBSET of BOM's radars.** A displayable loop gif
(`IDR<id><range>.gif`) only exists for radars in BOM's published FTP set. Coverage =
(FTP set) ∩ (radars we have coords for) = 58. Several real radars (e.g. Townsville,
Karratha, Gove, West Takone) publish NO loop gif, so they are excluded · pointing at
one would 404. Names/coords come from each radar's own loop page `<title>` + quoted
`lat`, not the state index anchors (those were mismapped). Some excluded sites are
still honestly covered by a neighbour's wider range (Townsville → Bowen 256 km).

**How to apply:** to add/repair a radar, FIRST verify `www.bom.gov.au/radar/IDRxx<range>.gif`
actually serves a gif (shell curl with a browser UA works; the api-server proxy adds
a bom.gov.au Referer to dodge the 403 hotlink block). Never add a radar whose gif BOM
doesn't publish. When `nearestBomRadar` returns null, hide the Official tab entirely
and say plainly that no BOM radar reaches the spot · never fall back to a far region's
radar and imply it is local.
