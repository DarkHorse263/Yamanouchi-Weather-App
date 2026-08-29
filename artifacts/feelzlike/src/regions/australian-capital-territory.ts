import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Australian Capital Territory · Corin Forest is a compact, snowmaking-led
 * snow-play and learn-to-ski facility in the Brindabellas. Natural snowfall
 * is rare here: this is not presented as a conventional alpine resort.
 */
export const australianCapitalTerritoryRegion: RegionConfig = {
  id: "australian-capital-territory",
  name: "Australian Capital Territory",
  subtitle: "ACT · Australia",
  shortTag: "ACT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "south",
  summaryMountains: ["Corin Forest"],
  resorts: [
    { path: "/mountain/corin-forest", label: "Corin Forest" },
  ],
  mountains: [
    {
      id: "corin-forest",
      name: "Corin Forest",
      elevationM: 1200,
      lat: -35.5294,
      lng: 148.9915,
      blurb: "ACT · small snowmaking-led snow play & learn-to-ski slope",
      websiteUrl: "https://www.corin.com.au/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "canberra",
      name: "Canberra",
      lat: -35.2809,
      lng: 149.1300,
      radiusM: 8000,
      blurb: "capital-city base · about 45 min to Corin Forest",
      nearbyMountainIds: ["corin-forest"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Facility", label: "Corin Forest", url: "https://www.corin.com.au/", blurb: "Official bookings and visitor information" },
    { category: "Tourism", label: "Visit Canberra", url: "https://visitcanberra.com.au/" },
    { category: "National park", label: "Namadgi National Park", url: "https://www.parks.act.gov.au/find-a-park/namadgi-national-park" },
  ],
  weatherSource: { label: "Open-Meteo + BOM" },
  roadsSource: {
    label: "Access Canberra",
    url: "https://www.accesscanberra.act.gov.au/driving-transport-and-parking/traffic-and-parking/traffic-updates",
    dataAvailable: false,
  },
};