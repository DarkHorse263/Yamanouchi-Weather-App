import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Jay Peak/Northeast Kingdom · two base towns (Jay, East Burke), two
 * resorts:
 *
 *   Jay Peak       → Indy Pass · Vermont's northernmost major resort,
 *                     famous for the region's highest average natural
 *                     snowfall · very late/approximate closing (among the
 *                     last 6 New England areas open per an Apr 20 2026
 *                     report) · opened Nov 22-23 2025 (full operations
 *                     Nov 29)
 *   Burke Mountain → Indy Pass · newly linked to Smugglers' Notch via
 *                     shared Bear Den Partners ownership (see the
 *                     acquisition note below) · opened Dec 6 2025,
 *                     2025-26 closing date NOT confirmed (~Apr 12 2026
 *                     estimate)
 *
 * Region id "jay-peak-nek" abbreviates "Northeast Kingdom" to avoid an
 * unwieldy full-phrase slug, consistent with this codebase's existing
 * precedent of using recognisable short forms for multi-word region names
 * (e.g. "cache-valley" rather than a longer descriptive slug elsewhere in
 * the registry). No naming collisions: the resort "Jay Peak" does not
 * match the base town "Jay" (different strings), Burke Mountain does not
 * match East Burke, and the region id matches neither. Confirmed via grep
 * across the full registry.
 *
 * Burke Mountain shares the same acquisition context as Smugglers' Notch
 * (see stowe-smugglers-notch.ts): both are now owned by Bear Den Partners
 * as of February 2026, with a joint pass between the two planned to start
 * the 2026-27 season — NOT yet in effect for 2025-26. Both resorts are
 * described here as operating independently for the current season, with
 * the pending joint-pass change noted as forward-looking context only.
 *
 * First Eastern-timezone (America/New_York) region in the USA module.
 * Vermont has no dedicated avalanche-forecasting authority and no
 * statewide chain law for passenger vehicles — see roads.ts and
 * RegionSources.tsx.
 */
export const jayPeakNekRegion: RegionConfig = {
  id: "jay-peak-nek",
  name: "Jay Peak/Northeast Kingdom",
  subtitle: "Vermont · USA",
  shortTag: "VT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Jay Peak", "Burke Mountain"],
  resorts: [
    { path: "/mountain/jay-peak", label: "Jay Peak" },
    { path: "/mountain/burke-mountain", label: "Burke Mountain" },
  ],
  mountains: [
    {
      id: "jay-peak",
      name: "Jay Peak",
      elevationM: 553,
      lat: 44.9241,
      lng: -72.5215,
      blurb: "Indy Pass · Vermont's northernmost major resort, known for the region's highest average natural snowfall · very late/approximate 2025-26 closing (among the last 6 New England areas still open per an Apr 20 2026 report) · opened Nov 22-23 2025, full operations from Nov 29",
      websiteUrl: "https://jaypeakresort.com/",
      snowReportUrl: "https://jaypeakresort.com/mountain/conditions",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      kids_lessons: true,
    },
    {
      id: "burke-mountain",
      name: "Burke Mountain",
      // ⚠️ Base elevation sources disagree (1,210-1,267 ft) — using the
      // lower-bound estimate, flagged rather than guessed at the higher
      // figure.
      elevationM: 369,
      lat: 44.5876,
      lng: -71.9106,
      // ⚠️ Acquisition/pass status honesty gate — see region-file header
      // comment above.
      blurb: "Indy Pass · newly linked to Smugglers' Notch via shared Bear Den Partners ownership (Feb 2026), with a joint pass between the two planned to start the 2026-27 season — not yet in effect this season · opened Dec 6 2025, 2025-26 closing date not confirmed (~Apr 12 2026 estimate) · ⚠️ base elevation sources disagree (1,210-1,267 ft), shown here as an approximate lower-bound estimate",
      websiteUrl: "https://www.skiburke.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "jay",
      name: "Jay",
      lat: 44.9417,
      lng: -72.5083,
      radiusM: 10000,
      blurb: "Small town near the Canadian border, the base town for Jay Peak",
      nearbyMountainIds: ["jay-peak"],
    },
    {
      id: "east-burke",
      name: "East Burke",
      lat: 44.6112,
      lng: -71.9227,
      radiusM: 10000,
      blurb: "Northeast Kingdom village, the base town for Burke Mountain",
      nearbyMountainIds: ["burke-mountain"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Vermont's Northeast Kingdom", url: "https://www.nekchamber.com/" },
    { category: "Resorts", label: "Jay Peak", url: "https://jaypeakresort.com/" },
    { category: "Resorts", label: "Burke Mountain", url: "https://www.skiburke.com/" },
    { category: "Transport", label: "VTrans · 511vt.com road conditions", url: "https://511vt.com/" },
  ],
  roadsSource: {
    label: "VTrans · 511vt.com",
    url: "https://511vt.com/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
