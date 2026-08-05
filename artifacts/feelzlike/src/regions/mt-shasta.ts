import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Mt. Shasta · one mountain (Mt. Shasta Ski Park), the northernmost
 * California resort in this rollout, in the Cascades rather than the
 * Sierra Nevada.
 *
 * Naming: no collision. Region id "mt-shasta" and base town "Mount
 * Shasta" use distinct spellings/id forms, and the resort's full name
 * ("Mt. Shasta Ski Park") does not collide with either.
 *
 * ⚠️ Season honesty gate: 2025-26 was a notably short/poor season here —
 * opened Dec 27, 2025 (after ~10 inches of snow on Christmas Day) but
 * closed early on March 2, 2026 due to lack of snow, 5 days short of the
 * resort's advertised 60-day operating guarantee. Surfaced directly in
 * the blurb below rather than only logged as a data gap, per the source
 * research's explicit recommendation.
 *
 * ⚠️ Elevation honesty gate: base/summit figures could NOT be confirmed
 * from an authoritative first-party source in research (commonly cited
 * industry-wide as ~6,600 ft / ~7,800 ft, but unverified). `elevationM`
 * is therefore omitted entirely rather than guessed — this field is
 * optional in the RegionConfig/MountainLink schema, so omitting it is the
 * honest choice over shipping an unverified number.
 *
 * ⚠️ Mt. Shasta is explicitly OUTSIDE both the Sierra Avalanche Center's
 * and Eastern Sierra Avalanche Center's coverage areas (it's in the
 * Cascades, far north of the Sierra Nevada). No dedicated backcountry
 * avalanche forecasting authority was identified for this region in
 * research — stated honestly rather than pointing at SAC/ESAC.
 *
 * First Pacific-timezone region on this branch. Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback. Caltrans QuickMap publishes
 * quickmap.dot.ca.gov (I-5/SR-89) but nothing is integrated yet, hence
 * `roadsSource.dataAvailable: false`.
 */
export const mtShastaRegion: RegionConfig = {
  id: "mt-shasta",
  name: "Mt. Shasta",
  subtitle: "California · USA",
  shortTag: "CA",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Mt. Shasta Ski Park"],
  resorts: [{ path: "/mountain/mt-shasta-ski-park", label: "Mt. Shasta Ski Park" }],
  mountains: [
    {
      id: "mt-shasta-ski-park",
      name: "Mt. Shasta Ski Park",
      // No elevationM — base/summit figures were not independently
      // confirmed from an authoritative source in research. Flagged
      // rather than guessed; see header comment above.
      lat: 41.3208,
      lng: -122.2036,
      blurb: "Indy Pass · California's northernmost ski area, on the south flank of Mt. Shasta · 2025-26 season closed early (Mar 2, 2026) due to lack of snow, 5 days short of the resort's 60-day guarantee — base/summit elevation unverified from an authoritative source",
      websiteUrl: "https://www.skipark.com/",
      snowReportUrl: "https://www.skipark.com/winter/conditions",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "mount-shasta",
      name: "Mount Shasta",
      lat: 41.3099,
      lng: -122.3106,
      radiusM: 12000,
      blurb: "I-5 town at the base of Mt. Shasta, about 15 minutes from the ski park via SR-89",
      nearbyMountainIds: ["mt-shasta-ski-park"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Mount Shasta", url: "https://www.mtshastachamber.com/" },
    { category: "Resorts", label: "Mt. Shasta Ski Park", url: "https://www.skipark.com/" },
    { category: "Transport", label: "Caltrans QuickMap · I-5/SR-89 conditions", url: "https://quickmap.dot.ca.gov/" },
  ],
  roadsSource: {
    label: "Caltrans QuickMap · quickmap.dot.ca.gov",
    url: "https://quickmap.dot.ca.gov/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
