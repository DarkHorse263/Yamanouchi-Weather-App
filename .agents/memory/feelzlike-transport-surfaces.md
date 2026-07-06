---
name: feelzlike transport page surfaces
description: Which regions use bespoke transport pages vs the generic TownTransport, so edits land on the right surface.
---

# feelzlike transport page surfaces

Some regions render a **bespoke** transport page instead of the generic
`TownTransport`. Known custom pages: `snowy-mountains` and
`victoria's high country` (VHC) — both wired directly in the region router.
Everything else falls through to the generic `TownTransport`, which groups
providers by journey `leg` (to_town / to_mountain / around_town) and hosts the
`CarHireCard` + the `featured` operator hero (`FeaturedProviderCard` +
`extra_links`).

**Rule:** a change to generic `TownTransport` (new card, featured hero, leg
grouping, empty-state copy) will **not** surface for snowy-mountains or VHC.
To ship the same change everywhere you must also edit the custom page(s).

**Why:** the featured-operator hero (Cooma Coaches → snowbusaustralia.com.au)
was added to the generic `TownTransport` AND, because snowy routes to the
custom page, the same Cooma hero + Snow Bus link had to be added directly on
the custom Snowy page. The generic `featured`/`extra_links` machinery is
therefore forward-looking: it has no live consumer until a `featured: true`
provider exists in a region that uses the generic page. This is the same
"multiple surfaces" trap already documented for the lift panels.

**How to apply:** before assuming a transport change is done, check the region
router for a bespoke page. If the region has one, mirror the change there too,
and don't rely on generic-page fields (`featured`, `extra_links`) rendering for
a custom-page region.
