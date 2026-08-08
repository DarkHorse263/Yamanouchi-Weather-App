import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Park City · two resorts sharing the town of Park City:
 *
 *   Park City Mountain → Epic Pass (Vail Resorts)
 *   Deer Valley        → full Ikon Pass only, ski-only (no snowboarding)
 *
 * Naming collision: the region id and the base town are both "Park City".
 * Per the Crested Butte/Telluride/Durango convention established in the
 * Colorado pass (region id equals the town name), the base town takes the
 * `-town` suffix: `park-city-town`. The lead resort, Park City Mountain,
 * does not collide with anything and keeps its plain, official-name slug.
 *
 * ⚠️ Deer Valley is also ski-only — no snowboarding permitted, same as
 * Alta in Cottonwood Canyons. Called out in the blurb/tourismLinks; no
 * dedicated schema field exists for this yet.
 *
 * Northern-hemisphere season (early Dec to early April). Weather is
 * Open-Meteo with the existing OpenWeatherMap fallback · no NWS
 * observation reconciliation is wired. UDOT publishes udottraffic.utah.gov
 * but nothing is integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const parkCityRegion: RegionConfig = {
  id: "park-city",
  name: "Park City",
  subtitle: "Utah · USA",
  shortTag: "UT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Park City Mountain", "Deer Valley"],
  resorts: [
    { path: "/mountain/park-city-mountain", label: "Park City Mountain" },
    { path: "/mountain/deer-valley-resort", label: "Deer Valley" },
  ],
  mountains: [
    {
      id: "park-city-mountain",
      name: "Park City Mountain",
      elevationM: 2073,
      lat: 40.6514,
      lng: -111.5080,
      blurb: "the largest ski resort in the US · Epic Pass, Mountain Village and Canyons Village",
      websiteUrl: "https://www.parkcitymountain.com/",
      snowReportUrl: "https://www.parkcitymountain.com/the-mountain/mountain-conditions/terrain-and-lift-status.aspx",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
    {
      id: "deer-valley-resort",
      name: "Deer Valley",
      elevationM: 2003,
      lat: 40.6374,
      lng: -111.4783,
      blurb: "ski-only (no snowboarding) · full Ikon Pass only · groomed, upscale, famously good grooming and service",
      websiteUrl: "https://www.deervalley.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "park-city-town",
      name: "Park City",
      lat: 40.6461,
      lng: -111.4980,
      radiusM: 9000,
      blurb: "historic mining-town-turned-resort about 35 minutes from Salt Lake City International Airport",
      nearbyMountainIds: ["park-city-mountain", "deer-valley-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Park City", url: "https://www.visitparkcity.com/" },
    { category: "Resorts", label: "Park City Mountain", url: "https://www.parkcitymountain.com/" },
    { category: "Resorts", label: "Deer Valley (ski-only, no snowboarding)", url: "https://www.deervalley.com/" },
    { category: "Transport", label: "UDOT · statewide traffic & road conditions", url: "https://www.udottraffic.utah.gov/" },
    { category: "Safety", label: "Utah Avalanche Center · Salt Lake forecast", url: "https://utahavalanchecenter.org/archives/forecasts/salt-lake" },
  ],
  roadsSource: {
    label: "UDOT · udottraffic.utah.gov",
    url: "https://www.udottraffic.utah.gov/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
