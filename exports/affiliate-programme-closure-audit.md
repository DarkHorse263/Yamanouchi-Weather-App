# Expedia AU and Hotels.com AU programme closure

## Evidence and scope
The owner supplied authenticated Awin notices stating that Expedia AU (121720)
and Hotels.com AU (121724) close on 30 October 2026. The owner authorised early
removal of the affected app placements, preserving the separate CJ links.

## Findings and action
- The live town stay page and shared platform bars used Expedia AU for both
  Australian and New Zealand destinations. Those placements are now omitted,
  including Australian state aliases and direct calls to the URL builder.
- Older curated Australian property records contain Expedia URLs. They remain
  historical source data, but the booking builder suppresses them in both
  curated and discovery modes, including map popups and property cards.
- Hotels.com uses the separate CJ creative. That configuration and its
  consent gate are unchanged. Every accommodation rendering path explicitly
  excludes Hotels.com and Expedia from Awin auto-conversion using the documented
  data-awinignore attribute, including plain destination fallbacks.
- International Expedia destinations remain direct links, excluded from Awin
  conversion. No replacement affiliate contract has been assumed.
- Europcar's Awin path, the Awin loader and its advertising-consent gate are
  unchanged. Booking.com and trivago CJ configuration is unchanged.
- No hardcoded tracking links containing the two closing advertiser IDs were
  found in application source. No additional Expedia/Awin promotional material
  was identified in the searched HTML/text/Markdown export sources. Email
  templates do not embed those placements.
- Static asset cache version is advanced so installed clients can refresh
  to the changed interface.

## Remaining external steps
Publish the changes and reload existing sessions. This audit does not modify
the Awin advertiser dashboard, third-party campaign accounts or previously
distributed material. The owner should check those for old programme links
and offers before 30 October 2026. Do not disable Awin globally: Europcar
still uses it.

The notices establish Awin closures only. CJ account approval, programme
availability and commission reporting were not verified by this code audit.
The old request to test Expedia Awin clicks is superseded; only the Europcar
part remains relevant.

## Verification
Focused tests cover retirement across AU/NZ aliases, suppression of old
curated Expedia URLs, preservation of international direct destinations,
Hotels.com CJ configuration and rendering-path exclusions. No affiliate
links were visited and no artificial commission clicks were generated.

Official exclusion documentation:
https://success.awin.com/s/article/What-is-Convert-a-Link?language=en_US