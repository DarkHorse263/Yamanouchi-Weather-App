import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Vancouver & the Island · the city day hills and the Vancouver Island
 * destination. This is deliberately an honest mixed bag, not a destination
 * resort region:
 *
 *   Cypress, Grouse, Mt Seymour → the three North Shore hills, 30-45 min
 *     from downtown Vancouver · small, low, and busy after work, but real
 *     night skiing and the closest turns to a major city in Canada.
 *   Mount Washington            → the actual destination mountain, but it
 *     is on Vancouver Island · a ferry-and-drive or a flight to Comox from
 *     Vancouver, not a day trip from the city.
 *
 * We do not oversell the North Shore hills · they are city hills with lifts,
 * night skiing and a lot of rain-line risk at their low elevations. Mount
 * Washington gets Vancouver Island's deep maritime snowpack but is a
 * separate trip.
 *
 * Northern-hemisphere season (Dec to Apr · the low North Shore hills open
 * later and close earlier than the Island). Weather is Open-Meteo with the
 * existing OpenWeatherMap fallback · no Environment Canada observation
 * reconciliation is wired, and DriveBC is a link-out only, hence
 * `roadsSource.dataAvailable: false`.
 */
export const vancouverRegion: RegionConfig = {
  id: "vancouver",
  name: "Vancouver & the Island",
  subtitle: "British Columbia · Canada",
  shortTag: "BC",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Cypress", "Grouse", "Mt Seymour", "Mount Washington"],
  resorts: [
    { path: "/mountain/cypress-mountain", label: "Cypress Mountain" },
    { path: "/mountain/grouse-mountain", label: "Grouse Mountain" },
    { path: "/mountain/mount-seymour", label: "Mt Seymour" },
    { path: "/mountain/mount-washington", label: "Mount Washington Alpine Resort" },
  ],
  mountains: [
    {
      id: "cypress-mountain",
      name: "Cypress Mountain",
      elevationM: 1440,
      lat: 49.3958,
      lng: -123.2039,
      blurb: "the biggest of the three north shore hills · 2010 olympic freestyle venue, city day skiing with night runs",
      websiteUrl: "https://www.cypressmountain.com/",
      snowReportUrl: "https://www.cypressmountain.com/mountain-report",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      nordic_focus: true,
    },
    {
      id: "grouse-mountain",
      name: "Grouse Mountain",
      elevationM: 1250,
      lat: 49.3803,
      lng: -123.0827,
      blurb: "the peak of vancouver · a skyride straight up from the north shore to lit night runs above the city",
      websiteUrl: "https://www.grousemountain.com/",
      snowReportUrl: "https://www.grousemountain.com/current_conditions",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "mount-seymour",
      name: "Mt Seymour",
      elevationM: 1265,
      lat: 49.3689,
      lng: -122.9503,
      blurb: "the quietest, highest and most family-run north shore hill · low-key learner terrain and backcountry gates",
      websiteUrl: "https://mtseymour.ca/",
      snowReportUrl: "https://mtseymour.ca/the-mountain/todays-conditions-hours",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
    {
      id: "mount-washington",
      name: "Mount Washington Alpine Resort",
      elevationM: 1588,
      lat: 49.7442,
      lng: -125.2947,
      blurb: "vancouver island's destination mountain · a huge maritime snowpack above the comox valley, reached by ferry or flight",
      websiteUrl: "https://mountwashington.ca/",
      snowReportUrl: "https://mountwashington.ca/the-mountain/conditions-terrain/alpine-conditions.html",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
      nordic_focus: true,
    },
  ],
  baseTowns: [
    {
      id: "vancouver-city",
      name: "Vancouver",
      lat: 49.2827,
      lng: -123.1207,
      radiusM: 12000,
      blurb: "the three north shore hills are 30-45 min day trips from downtown · night skiing after work",
      nearbyMountainIds: ["cypress-mountain", "grouse-mountain", "mount-seymour"],
    },
    {
      id: "courtenay",
      name: "Courtenay",
      lat: 49.6877,
      lng: -124.9946,
      radiusM: 9000,
      blurb: "comox valley town on vancouver island · about 40 min up the road to mount washington",
      nearbyMountainIds: ["mount-washington"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Destination BC · HelloBC", url: "https://www.hellobc.com/" },
    { category: "Tourism", label: "Destination Vancouver", url: "https://www.destinationvancouver.com/" },
    { category: "Tourism", label: "Comox Valley tourism", url: "https://www.discovercomoxvalley.com/" },
    { category: "Resorts", label: "Cypress Mountain", url: "https://www.cypressmountain.com/" },
    { category: "Resorts", label: "Grouse Mountain", url: "https://www.grousemountain.com/" },
    { category: "Resorts", label: "Mt Seymour", url: "https://mtseymour.ca/" },
    { category: "Resorts", label: "Mount Washington Alpine Resort", url: "https://mountwashington.ca/" },
    { category: "Transport", label: "DriveBC · highway conditions & cameras", url: "https://www.drivebc.ca/" },
    { category: "Transport", label: "BC Ferries · Vancouver to the Island", url: "https://www.bcferries.com/" },
    { category: "Safety", label: "Avalanche Canada · daily forecasts", url: "https://avalanche.ca/forecasts" },
    { category: "Weather", label: "Environment Canada · BC forecasts", url: "https://weather.gc.ca/" },
  ],
  roadsSource: {
    label: "DriveBC",
    url: "https://www.drivebc.ca/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
