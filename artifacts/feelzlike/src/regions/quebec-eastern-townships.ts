import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Québec · the Eastern Townships (Cantons-de-l'Est), the Appalachian belt
 * between Montréal and the Vermont border. Two towns, one mountain each:
 *
 *   Bromont → Ski Bromont (Mont Brome)
 *   Sutton  → Mont Sutton
 *
 * Naming: the town id `bromont` and the ski area share a name, so the
 * mountain takes the `-resort` suffix per the region convention.
 *
 * Elevations here are Appalachian rather than alpine — Sutton's lifts top
 * out at 840 m (the 968 m Round Top summit above it is inside a nature
 * reserve and is not lift-served) and Mont Brome at 553 m.
 *
 * Northern-hemisphere season (early Dec to early Apr). Weather is
 * Open-Meteo with the existing OpenWeatherMap fallback · no Environment
 * Canada observation reconciliation is wired, and Québec 511 is a link-out
 * only, hence `roadsSource.dataAvailable: false`.
 */
export const quebecEasternTownshipsRegion: RegionConfig = {
  id: "quebec-eastern-townships",
  name: "Eastern Townships",
  subtitle: "Québec · Canada",
  shortTag: "QC",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Ski Bromont", "Mont Sutton"],
  resorts: [
    { path: "/mountain/bromont-resort", label: "Ski Bromont" },
    { path: "/mountain/mont-sutton", label: "Mont Sutton" },
  ],
  mountains: [
    {
      id: "bromont-resort",
      name: "Ski Bromont",
      elevationM: 553,
      lat: 45.2892,
      lng: -72.6378,
      blurb: "seven sectors across mont brome · the largest lit night-ski terrain in north america",
      websiteUrl: "https://www.bromontmontagne.com/",
      snowReportUrl: "https://www.bromontmontagne.com/en/detailed-conditions/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      summerOpen: true,
    },
    {
      id: "mont-sutton",
      name: "Mont Sutton",
      elevationM: 840,
      lat: 45.0850,
      lng: -72.5500,
      blurb: "québec's glade mountain · an interconnected sous-bois network rather than cut trails",
      websiteUrl: "https://montsutton.com/",
      snowReportUrl: "https://montsutton.com/la-montagne/conditions-de-ski-2/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "bromont",
      name: "Bromont",
      lat: 45.3168,
      lng: -72.6491,
      radiusM: 6000,
      blurb: "townships town off autoroute 10 · about 5 min from the ski hill, 45 min from montréal",
      nearbyMountainIds: ["bromont-resort"],
    },
    {
      id: "sutton",
      name: "Sutton",
      lat: 45.1001,
      lng: -72.6158,
      radiusM: 6000,
      blurb: "village under the sutton range near the vermont line · about 10 min to the lifts",
      nearbyMountainIds: ["mont-sutton"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Cantons-de-l'Est", url: "https://www.cantonsdelest.com/" },
    { category: "Tourism", label: "Eastern Townships tourism", url: "https://www.easterntownships.org/" },
    { category: "Tourism", label: "Bonjour Québec", url: "https://www.bonjourquebec.com/" },
    { category: "Resorts", label: "Ski Bromont", url: "https://www.bromontmontagne.com/" },
    { category: "Resorts", label: "Ski Bromont · webcams", url: "https://www.bromontmontagne.com/en/webcams/" },
    { category: "Resorts", label: "Mont Sutton", url: "https://montsutton.com/" },
    { category: "Transport", label: "Québec 511 · road conditions & cameras", url: "https://www.quebec511.info/" },
    { category: "Safety", label: "Avalanche Québec · backcountry bulletins", url: "https://www.avalanchequebec.ca/bulletin-davalanche/" },
    { category: "Weather", label: "Environment Canada · Québec forecasts", url: "https://weather.gc.ca/" },
  ],
  roadsSource: {
    label: "Québec 511",
    url: "https://www.quebec511.info/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
