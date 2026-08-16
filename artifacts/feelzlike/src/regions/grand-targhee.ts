import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Grand Targhee, WY · one resort, one base town (Alta, WY):
 *
 *   Grand Targhee Resort → Mountain Collective (not Ikon/Epic) · known for
 *                           Wyoming's/the Tetons' deepest average annual
 *                           snowfall on the west side of the range ·
 *                           contested 694-acre USFS expansion approved but
 *                           not yet built — objections process runs
 *                           through July 2026 and does not affect the
 *                           2025-26 season, noted as forward-looking
 *                           context only, not current-season terrain.
 *
 * Naming collision: town "Alta, WY" is disambiguated with a `-wy` suffix
 * (alta-wy) since "Alta" alone is already taken by Utah's Alta ski resort
 * (see cottonwood-canyons.ts) — same defensive-naming precedent as
 * Vermont's peru-vt/manchester-vt. The resort id "grand-targhee-resort"
 * carries the `-resort` suffix even though no town of the same bare name
 * exists in this region, to avoid any future collision with a
 * region-level id of the same short name.
 *
 * Second Wyoming region, America/Denver timezone. Avalanche:
 * Bridger-Teton Avalanche Center covers this region under its "Tetons"
 * zone (shared with Jackson Hole) — see RegionSources.tsx. Wyoming's
 * dynamic chain law (WY Statute §31-5-956, Teton Pass WY-22) is documented
 * in roads.ts's `wyChainEntry()`; the Teton Pass corridor is also the
 * primary route between Jackson/Teton Village and the Teton Valley/Grand
 * Targhee side of the range.
 */
export const grandTargheeRegion: RegionConfig = {
  id: "grand-targhee",
  name: "Grand Targhee",
  subtitle: "Wyoming · USA",
  shortTag: "WY",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Grand Targhee Resort"],
  resorts: [{ path: "/mountain/grand-targhee-resort", label: "Grand Targhee Resort" }],
  mountains: [
    {
      id: "grand-targhee-resort",
      name: "Grand Targhee Resort",
      elevationM: 2393,
      lat: 43.7904,
      lng: -110.9576,
      blurb: "Mountain Collective Pass (not Ikon/Epic) · renowned for the deepest average annual snowfall on the west side of the Tetons · Fred's Mountain summit 9,862 ft, hike-to Mary's Nipple 9,920 ft, 2,270 ft vertical · a contested 694-acre USFS expansion has been approved but is not yet built; objections run through July 2026 and do not affect the 2025-26 season.",
      websiteUrl: "https://grandtarghee.com/",
      snowReportUrl: "https://www.grandtarghee.com/the-mountain/cams-conditions/mountain-report",
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      // `-wy` suffix disambiguates from Utah's Alta (cottonwood-canyons.ts)
      // — see region-file header comment above.
      id: "alta-wy",
      name: "Alta",
      lat: 43.7897,
      lng: -110.9310,
      radiusM: 8000,
      blurb: "Small Teton Valley town on the Idaho-Wyoming border, the closest base town to Grand Targhee Resort",
      nearbyMountainIds: ["grand-targhee-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Teton Valley, ID/WY tourism", url: "https://tetonvalleychamber.com/" },
    { category: "Resorts", label: "Grand Targhee Resort", url: "https://grandtarghee.com/" },
    { category: "Avalanche", label: "Bridger-Teton Avalanche Center (Tetons zone)", url: "https://bridgertetonavalanchecenter.org/" },
    { category: "Transport", label: "WYDOT · wyoroad.info road conditions", url: "https://wyoroad.info/" },
  ],
  roadsSource: {
    label: "WYDOT · wyoroad.info",
    url: "https://wyoroad.info/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
