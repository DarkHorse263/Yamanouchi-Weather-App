import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Ruapehu · the North Island's only major ski terrain, on the active
 * volcano in Tongariro National Park. Two ski areas on the one massif,
 * with Ohakune the gateway town used here:
 *
 *   Whakapapa → bigger, varied terrain on the northwest face
 *   Turoa     → southwest face above Ohakune · highest lifted terrain in NZ
 *   Ohakune   → the Turoa-side base town (the Whakapapa side is reached
 *               via National Park village / the Bruce Road)
 *
 * Southern-hemisphere season (Jun-Sep). Open-Meteo primary + the existing
 * OpenWeatherMap fallback · no national AWS feed wired for NZ.
 */
export const ruapehuRegion: RegionConfig = {
  id: "ruapehu",
  name: "Ruapehu",
  subtitle: "Central Plateau · New Zealand",
  shortTag: "NZ",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "south",
  summaryMountains: ["Whakapapa", "Turoa"],
  resorts: [
    { path: "/mountain/whakapapa", label: "Whakapapa" },
    { path: "/mountain/turoa", label: "Turoa" },
  ],
  mountains: [
    {
      id: "whakapapa",
      name: "Whakapapa",
      elevationM: 2020,
      lat: -39.2547,
      lng: 175.5619,
      blurb: "the big one on the northwest face · varied terrain, knoll ridge high point",
      websiteUrl: "https://www.whakapapa.com/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "turoa",
      name: "Turoa",
      elevationM: 2300,
      lat: -39.3072,
      lng: 175.5286,
      blurb: "southwest face above ohakune · highest lifted terrain in new zealand",
      websiteUrl: "https://www.turoa.co.nz/",
      beginner_friendly: true,
      terrain_park: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "ohakune",
      name: "Ohakune",
      lat: -39.4181,
      lng: 175.3956,
      radiusM: 5000,
      blurb: "lively turoa-side base town · ~17 km up the ohakune mountain road to the lifts",
      nearbyMountainIds: ["turoa", "whakapapa"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Ruapehu", url: "https://www.visitruapehu.com/" },
    { category: "Resorts", label: "Whakapapa", url: "https://www.whakapapa.com/" },
    { category: "Resorts", label: "Turoa", url: "https://www.turoa.co.nz/" },
    { category: "National park", label: "Tongariro National Park · DOC", url: "https://www.doc.govt.nz/parks-and-recreation/places-to-go/central-north-island/places/tongariro-national-park/" },
    { category: "Transport", label: "Waka Kotahi NZTA · journeys & road conditions", url: "https://www.journeys.nzta.govt.nz/" },
  ],
  roadsSource: {
    label: "Waka Kotahi NZTA · journeys",
    url: "https://www.journeys.nzta.govt.nz/regions/manawatu-whanganui",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
