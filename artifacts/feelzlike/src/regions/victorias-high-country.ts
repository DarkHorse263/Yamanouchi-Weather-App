import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Victoria's High Country - third AU region after Snowy Mountains.
 *
 * Towns-first per the universal rule: 7 base towns each surface the
 * mountain(s) they serve. Resort relationships:
 *   Mansfield      -> Mt Buller, Mt Stirling
 *   Bright         -> Falls Creek, Mt Hotham (Great Alpine Rd hub)
 *   Mount Beauty   -> Falls Creek (closest sealed road), Mt Hotham
 *   Harrietville   -> Mt Hotham (chains-fit point on the Great Alpine Rd)
 *   Dinner Plain   -> Mt Hotham (alpine village 10 min from the resort)
 *   Omeo           -> Mt Hotham (southern Great Alpine Rd, Gippsland side)
 *   Marysville     -> Lake Mountain (gateway town)
 *   Warburton      -> Mt Donna Buang (closest town to the snow gum summit)
 *
 * Six mountain entries, but Mt Stirling is presented as Buller's nordic
 * sister (separate access, shared Mansfield gateway). Lake Mountain and
 * Mt Donna Buang use the new `snow_play_only` tag - neither has chairlift
 * downhill skiing. Stirling and Lake Mountain also carry `nordic_focus`.
 */
export const victoriasHighCountryRegion: RegionConfig = {
  id: "victorias-high-country",
  name: "Victoria's High Country",
  subtitle: "VIC · Australia",
  shortTag: "VIC",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "south",
  resorts: [
    { path: "/mountain/mt-buller",       label: "Mt Buller" },
    { path: "/mountain/falls-creek",     label: "Falls Creek" },
    { path: "/mountain/mt-hotham",       label: "Mt Hotham" },
    { path: "/mountain/mt-stirling",     label: "Mt Stirling" },
    { path: "/mountain/lake-mountain",   label: "Lake Mountain" },
    { path: "/mountain/mt-donna-buang",  label: "Mt Donna Buang" },
  ],
  mountains: [
    // Mt Buller: VIC's biggest day-tripper. Full-service alpine village,
    // chairlift downhill, terrain park, ski school. ~3hrs from Melbourne.
    { id: "mt-buller",       name: "Mt Buller",       elevationM: 1805, lat: -37.1456, lng: 146.4391, blurb: "VIC · the big one · 3 hrs from Melbourne",         websiteUrl: "https://www.mtbuller.com.au", snowReportUrl: "https://www.mtbuller.com.au/winter/snow-weather/snow-report",        beginner_friendly: true, kids_lessons: true, terrain_park: true },
    // Mt Stirling: nordic sister of Buller, shared Mansfield gateway.
    // Cross-country & backcountry only - no chairlifts. Tickets sold at
    // Telephone Box Junction.
    { id: "mt-stirling",     name: "Mt Stirling",     elevationM: 1747, lat: -37.1167, lng: 146.4500, blurb: "VIC · cross-country & backcountry sister to Buller", websiteUrl: "https://mtstirling.com.au", snowReportUrl: "https://www.mtstirling.com.au/snow-report/",          nordic_focus: true, backcountry_access: true },
    // Falls Creek: largest alpine ski area in VIC by skiable terrain.
    // Self-contained ski-in/ski-out village.
    { id: "falls-creek",     name: "Falls Creek",     elevationM: 1842, lat: -36.8628, lng: 147.2778, blurb: "VIC · largest skiable area · ski-in village",      websiteUrl: "https://www.fallscreek.com.au", snowReportUrl: "https://www.fallscreek.com.au/snowreport/",     beginner_friendly: true, kids_lessons: true, terrain_park: true },
    // Mt Hotham: highest VIC resort, the steep one. Hotham Airport for
    // direct fly-in. Dinner Plain is the alpine village 10 min away.
    { id: "mt-hotham",       name: "Mt Hotham",       elevationM: 1862, lat: -36.9779, lng: 147.1361, blurb: "VIC · the high & steep one · Hotham Airport access", websiteUrl: "https://www.mthotham.com.au", snowReportUrl: "https://www.mthotham.com.au/mountain/conditions/snow-reports",        terrain_park: true, backcountry_access: true, kids_lessons: true },
    // Lake Mountain: nordic + snow play only, no alpine downhill. The
    // closest snow to Melbourne (~2 hrs via Marysville).
    { id: "lake-mountain",   name: "Lake Mountain",   elevationM: 1480, lat: -37.5181, lng: 145.8983, blurb: "VIC · nordic & snow play · closest snow to Melbourne", websiteUrl: "https://www.lakemountainresort.com.au", snow_play_only: true, nordic_focus: true, kids_lessons: true },
    // Mt Donna Buang: free public snow play summit run by Yarra Ranges
    // / Parks Victoria. No resort, no lifts - just toboggans on the day.
    { id: "mt-donna-buang", name: "Mt Donna Buang",   elevationM: 1250, lat: -37.6961, lng: 145.6989, blurb: "VIC · free snow play summit · 1.5 hrs from Melbourne", websiteUrl: "https://www.parks.vic.gov.au/places-to-see/parks/yarra-ranges-national-park", snow_play_only: true },
  ],
  baseTowns: [
    {
      id: "mansfield",
      name: "Mansfield",
      lat: -37.0539,
      lng: 146.0894,
      radiusM: 5000,
      blurb: "Cattle country gateway · 50 min to Buller & Stirling",
      nearbyMountainIds: ["mt-buller", "mt-stirling"],
    },
    {
      id: "bright",
      name: "Bright",
      lat: -36.7300,
      lng: 146.9617,
      radiusM: 4000,
      blurb: "Great Alpine Road hub · gateway to Falls Creek & Hotham",
      nearbyMountainIds: ["falls-creek", "mt-hotham"],
    },
    {
      id: "mount-beauty",
      name: "Mount Beauty",
      lat: -36.7327,
      lng: 147.1696,
      radiusM: 4000,
      blurb: "Closest sealed-road town to Falls Creek · 30 min up",
      nearbyMountainIds: ["falls-creek", "mt-hotham"],
    },
    {
      id: "harrietville",
      name: "Harrietville",
      lat: -36.8868,
      lng: 147.0656,
      radiusM: 3000,
      blurb: "Last village before Hotham · chains fit on the way up",
      nearbyMountainIds: ["mt-hotham"],
    },
    {
      id: "dinner-plain",
      name: "Dinner Plain",
      lat: -36.9276,
      lng: 147.2400,
      radiusM: 3000,
      blurb: "Alpine village · 10 min from Mt Hotham · ski-in feel",
      nearbyMountainIds: ["mt-hotham"],
    },
    {
      id: "marysville",
      name: "Marysville",
      lat: -37.5128,
      lng: 145.7497,
      radiusM: 4000,
      blurb: "Yarra Ranges gateway · 20 min to Lake Mountain",
      nearbyMountainIds: ["lake-mountain"],
    },
    {
      id: "warburton",
      name: "Warburton",
      lat: -37.7553,
      lng: 145.6906,
      radiusM: 4000,
      blurb: "Yarra Valley town · closest base to Mt Donna Buang",
      nearbyMountainIds: ["mt-donna-buang"],
    },
    {
      id: "omeo",
      name: "Omeo",
      lat: -37.0975,
      lng: 147.5942,
      radiusM: 4000,
      blurb: "Southern Great Alpine Road · gateway to Hotham from Gippsland",
      nearbyMountainIds: ["mt-hotham"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Victoria's High Country", url: "https://www.victoriashighcountry.com.au/", blurb: "Official regional tourism site" },
    { category: "Tourism", label: "Visit Victoria - High Country", url: "https://www.visitvictoria.com/regions/high-country" },
    { category: "Tourism", label: "Mansfield Mt Buller Tourism", url: "https://www.mansfieldmtbuller.com.au/" },
    { category: "Tourism", label: "Bright & Surrounds Tourism", url: "https://www.brightvic.com.au/" },
    { category: "National parks", label: "Alpine National Park (Parks Victoria)", url: "https://www.parks.vic.gov.au/places-to-see/parks/alpine-national-park" },
    { category: "National parks", label: "Yarra Ranges National Park", url: "https://www.parks.vic.gov.au/places-to-see/parks/yarra-ranges-national-park" },
    { category: "Resorts", label: "Mt Buller", url: "https://www.mtbuller.com.au" },
    { category: "Resorts", label: "Mt Stirling", url: "https://mtstirling.com.au" },
    { category: "Resorts", label: "Falls Creek", url: "https://www.fallscreek.com.au" },
    { category: "Resorts", label: "Mt Hotham", url: "https://www.mthotham.com.au" },
    { category: "Resorts", label: "Lake Mountain Alpine Resort", url: "https://www.lakemountainresort.com.au" },
  ],
  weatherSource: {
    label: "Open-Meteo + BOM",
  },
  roadsSource: {
    label: "VicTraffic (VicRoads)",
    url: "https://traffic.transport.vic.gov.au/",
    dataAvailable: false,
  },
};
