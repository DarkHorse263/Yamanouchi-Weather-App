import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Wanaka · the laid-back lake town an hour north of Queenstown (Otago).
 * Two contrasting ski areas share the one gateway town:
 *
 *   Cardrona   → wide groomers, NZ's biggest terrain parks, family base
 *   Treble Cone → the steep one · big off-piste and the highest skiable
 *                 terrain in the southern lakes
 *
 * Southern-hemisphere season (Jun-Sep). Open-Meteo primary + the existing
 * OpenWeatherMap fallback · no national AWS feed wired for NZ.
 */
export const wanakaRegion: RegionConfig = {
  id: "wanaka",
  name: "Wanaka",
  subtitle: "Otago · New Zealand",
  shortTag: "NZ",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "south",
  summaryMountains: ["Cardrona", "Treble Cone"],
  resorts: [
    { path: "/mountain/cardrona", label: "Cardrona" },
    { path: "/mountain/treble-cone", label: "Treble Cone" },
  ],
  mountains: [
    {
      id: "cardrona",
      name: "Cardrona",
      elevationM: 1860,
      lat: -44.8741,
      lng: 168.9492,
      blurb: "wide sunny groomers · nz's biggest terrain parks and family base",
      websiteUrl: "https://www.cardrona.com/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "treble-cone",
      name: "Treble Cone",
      elevationM: 2088,
      lat: -44.6311,
      lng: 168.8978,
      blurb: "the steep one · big off-piste and the highest skiable terrain in the lakes",
      websiteUrl: "https://www.treblecone.com/",
      expert_only: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "wanaka",
      name: "Wanaka",
      lat: -44.7032,
      lng: 169.1321,
      radiusM: 5000,
      blurb: "lakeside base town · ~35 min to cardrona, ~30 min to treble cone",
      nearbyMountainIds: ["cardrona", "treble-cone"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Lake Wanaka Tourism", url: "https://www.lakewanaka.co.nz/" },
    { category: "Resorts", label: "Cardrona Alpine Resort", url: "https://www.cardrona.com/" },
    { category: "Resorts", label: "Treble Cone", url: "https://www.treblecone.com/" },
    { category: "Transport", label: "Waka Kotahi NZTA · journeys & road conditions", url: "https://www.journeys.nzta.govt.nz/" },
  ],
  roadsSource: {
    label: "Waka Kotahi NZTA · journeys",
    url: "https://www.journeys.nzta.govt.nz/regions/otago",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
