import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Tasmania · boutique alpine region in northeast TAS. Ben Lomond is the
 * commercial ski lift operation on the island. Mount Mawson is the second
 * operating field: volunteer staffed, public and wholly conditions-dependent.
 *
 *   Ben Lomond Base → on-mountain village (Carr Villa / Creek Inn)
 *   Launceston      → closest city base · ~90 min drive
 *   Maydena         → nearest town to Mt Field and Mount Mawson
 *   Hobart          → state capital · long day-trips when conditions deliver
 */
export const tasmaniaRegion: RegionConfig = {
  id: "tasmania",
  name: "Tasmania",
  subtitle: "TAS · Australia",
  shortTag: "TAS",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  summaryMountains: ["Ben Lomond", "Mount Mawson"],
  resorts: [
    { path: "/mountain/ben-lomond", label: "Ben Lomond" },
    { path: "/mountain/mount-mawson", label: "Mount Mawson" },
  ],
  mountains: [
    {
      id: "ben-lomond",
      name: "Ben Lomond",
      elevationM: 1572,
      lat: -41.5378,
      lng: 147.6736,
      blurb: "tasmania's only commercial ski lifts · weather-dependent, short windows reward locals",
      websiteUrl: "https://benlomondalpineresort.com.au/",
      snowReportUrl: "https://benlomondalpineresort.com.au/snow-report/",
      beginner_friendly: true,
      kids_lessons: true,
      backcountry_access: true,
    },
    {
      id: "mount-mawson",
      name: "Mount Mawson",
      elevationM: 1250,
      lat: -42.6830,
      lng: 146.5860,
      blurb: "volunteer club field · public access · natural-snow and conditions dependent",
      websiteUrl: "https://parks.tas.gov.au/things-to-do/skiing-and-snow-activities",
      snowReportUrl: "https://www.mtmawson.info/",
    },
  ],
  baseTowns: [
    {
      id: "maydena",
      name: "Maydena",
      lat: -42.7573,
      lng: 146.6262,
      radiusM: 3000,
      blurb: "Derwent Valley gateway · nearest town to Mt Field and Mount Mawson",
      nearbyMountainIds: ["mount-mawson"],
    },
    {
      id: "ben-lomond-base",
      name: "Ben Lomond Base",
      lat: -41.5392,
      lng: 147.6486,
      // on-mountain village (Carr Villa / Creek Inn) · tight radius around
      // the alpine village core at the foot of the chairlifts.
      radiusM: 1500,
      blurb: "tasmania's commercial ski area · on-mountain village at the foot of the lifts",
      nearbyMountainIds: ["ben-lomond"],
    },
    {
      id: "launceston",
      name: "Launceston",
      lat: -41.4332,
      lng: 147.1442,
      // city radius · launceston is the closest sealed-road city base
      // for ben lomond (~90 min drive via jacobs ladder).
      radiusM: 5000,
      blurb: "closest city base for ben lomond · ~90 min drive via jacobs ladder",
      nearbyMountainIds: ["ben-lomond"],
    },
    {
      id: "hobart",
      name: "Hobart",
      lat: -42.8821,
      lng: 147.3272,
      // capital radius · hobart is a long day-trip (~3 hrs each way) but
      // it's where most visiting skiers actually land.
      radiusM: 5000,
      blurb: "tasmania's capital · long day-trips when conditions deliver",
      nearbyMountainIds: ["ben-lomond", "mount-mawson"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Discover Tasmania", url: "https://www.discovertasmania.com.au/" },
    { category: "Tourism", label: "Visit Northern Tasmania", url: "https://www.northerntasmania.com.au/" },
    { category: "Resorts", label: "Ben Lomond Snow Sports", url: "https://tasmania.ski/" },
    { category: "National Park", label: "Ben Lomond National Park · Parks Tasmania", url: "https://parks.tas.gov.au/explore-our-parks/ben-lomond-national-park" },
    { category: "Ski fields", label: "Skiing and snow activities · Parks Tasmania", url: "https://parks.tas.gov.au/things-to-do/skiing-and-snow-activities" },
    { category: "Club field", label: "Mount Mawson Ski Club", url: "https://www.mtmawson.info/" },
    { category: "Transport", label: "Transport Tasmania · live traffic", url: "https://www.transport.tas.gov.au/" },
    { category: "Backcountry safety", label: "Bureau of Meteorology · Tasmania alpine forecast", url: "http://www.bom.gov.au/tas/forecasts/alpine.shtml" },
  ],
  weatherSource: {
    label: "Open-Meteo + BOM",
  },
  roadsSource: {
    label: "Transport Tasmania",
    url: "https://www.transport.tas.gov.au/",
    dataAvailable: false,
  },
};
