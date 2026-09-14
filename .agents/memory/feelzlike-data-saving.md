---
name: feelzlike media data-saving contract
description: Consent and visibility rules for radar and third-party media, plus limits on bandwidth claims.
---

Data Saver is a media opt-in mode, not a forecast restriction or a hard byte cap. Browser saveData supplies the default until the user chooses otherwise. Windy and YouTube always require a click, even in normal mode. Radar opt-in must not carry across a changed location/source.

**Why:** unusually high household router usage was reported without evidence establishing app attribution. Preventing unnecessary downloads is justified; claiming a cause or guaranteed bandwidth limit is not.

**How to apply:** gate network-owning media components on both document visibility and viewport intersection. Keep the observer attached to a stable wrapper when swapping prompts and media. Abort fetches and remove iframe/map internals when inactive; use one latest temporal radar frame in Data Saver. Keep forecast freshness and private-cache exclusions intact, and never clear existing caches merely to reduce traffic.

Preferences must synchronize across mounted consumers even when storage writes fail.

**Why:** a toggle-local fallback can show Data Saver enabled while other media components still act on the old value.

**How to apply:** retain a shared in-memory override and notify all consumers with the chosen value, rather than relying on rereading storage after a failed write.