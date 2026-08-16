import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Stowe/Smugglers' Notch · two base towns (Stowe, Jeffersonville), two
 * resorts:
 *
 *   Stowe Mountain Resort → Epic Pass, part of Vail's Northeast group with
 *                            Mount Snow and Okemo · confirmed 2025-26
 *                            season (opened Nov 21 2025, closed Apr 25
 *                            2026)
 *   Smugglers' Notch      → Independent for 2025-26 · see the acquisition
 *                            note below · 2025-26 closing date NOT
 *                            confirmed by the resort
 *
 * No naming collisions: neither resort name matches either base town
 * (Stowe, Jeffersonville), and the region id "stowe-smugglers-notch"
 * matches neither. Confirmed via grep across the full registry.
 *
 * ⚠️ SMUGGLERS' NOTCH — mid-acquisition, current-season status only:
 * Smugglers' Notch was acquired by new ownership (Bear Den Partners) in
 * February 2026, and a joint pass with Burke Mountain (also under Bear Den
 * Partners) is planned starting the 2026-27 season — NOT yet in effect for
 * 2025-26. This region file, weather.ts, webcams.ts and RegionSources.tsx
 * all describe Smugglers' Notch as independent for the CURRENT (2025-26)
 * season only, with the pending 2026-27 joint-pass change noted as
 * forward-looking context, not a live feature. No confirmed live webcam
 * page was found in research, so its webcams.ts entry falls back to the
 * main site link.
 *
 * Stowe's base elevation has source conflicts (1,340-2,035 ft depending on
 * source, likely reflecting different base-area measurement points across
 * the Mansfield/Spruce Peak complex). elevationM below uses the
 * lower-bound estimate (1,340 ft / 408m) with this conflict flagged rather
 * than silently picking the higher figure; summit (Mt. Mansfield, 4,395
 * ft / 1,340m) is well-established and unambiguous.
 *
 * First Eastern-timezone (America/New_York) region in the USA module.
 * Vermont has no dedicated avalanche-forecasting authority and no
 * statewide chain law for passenger vehicles — see roads.ts and
 * RegionSources.tsx.
 */
export const stoweSmugglersNotchRegion: RegionConfig = {
  id: "stowe-smugglers-notch",
  name: "Stowe/Smugglers' Notch",
  subtitle: "Vermont · USA",
  shortTag: "VT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Stowe Mountain Resort", "Smugglers' Notch"],
  resorts: [
    { path: "/mountain/stowe-mountain-resort", label: "Stowe Mountain Resort" },
    { path: "/mountain/smugglers-notch", label: "Smugglers' Notch" },
  ],
  mountains: [
    {
      id: "stowe-mountain-resort",
      name: "Stowe Mountain Resort",
      // ⚠️ Base elevation source conflict (1,340-2,035 ft across sources) —
      // using the lower-bound estimate, flagged rather than guessed at the
      // higher figure. Summit (Mt. Mansfield) is unambiguous.
      elevationM: 408,
      lat: 44.5303,
      lng: -72.7883,
      blurb: "Epic Pass · Vail's Northeast group with Mount Snow and Okemo · Vermont's highest peak (Mt. Mansfield, 4,395 ft) · confirmed 2025-26 season (opened Nov 21 2025, closed Apr 25 2026) · ⚠️ base elevation has conflicting figures across sources (1,340-2,035 ft), shown here as an approximate lower-bound estimate",
      websiteUrl: "https://www.stowe.com/",
      snowReportUrl: "https://www.stowe.com/the-mountain/mountain-report.aspx",
      expert_only: false,
      backcountry_access: true,
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "smugglers-notch",
      name: "Smugglers' Notch",
      elevationM: 314,
      lat: 44.5991,
      lng: -72.7864,
      // ⚠️ Mid-acquisition honesty gate: see region-file header comment
      // above. Reflects 2025-26 status only.
      blurb: "Independent for the 2025-26 season · acquired by new ownership (Bear Den Partners) in February 2026, with a joint pass alongside Burke Mountain planned to start the 2026-27 season — not yet in effect this season · 2025-26 closing date not confirmed by the resort · family-oriented, known for not having snowmaking-dependent grooming culture like larger resorts",
      websiteUrl: "https://www.smuggs.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "stowe",
      name: "Stowe",
      lat: 44.4654,
      lng: -72.6874,
      radiusM: 12000,
      blurb: "Classic Vermont mountain town along VT-108, the main gateway to Stowe Mountain Resort",
      nearbyMountainIds: ["stowe-mountain-resort"],
    },
    {
      id: "jeffersonville",
      name: "Jeffersonville",
      lat: 44.6511,
      lng: -72.8298,
      radiusM: 10000,
      blurb: "Small village on VT-108, the closest base town to Smugglers' Notch",
      nearbyMountainIds: ["smugglers-notch"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Go Stowe", url: "https://www.gostowe.com/" },
    { category: "Resorts", label: "Stowe Mountain Resort", url: "https://www.stowe.com/" },
    { category: "Resorts", label: "Smugglers' Notch (independent for 2025-26)", url: "https://www.smuggs.com/" },
    { category: "Transport", label: "VTrans · New England 511 road conditions", url: "https://www.newengland511.org/region/Vermont" },
  ],
  roadsSource: {
    label: "VTrans · New England 511",
    url: "https://www.newengland511.org/region/Vermont",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
