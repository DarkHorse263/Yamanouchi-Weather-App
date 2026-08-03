import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Tasmania · boutique alpine region in northeast TAS. Ben Lomond is the
 * only commercial ski lift operation on the island · conditions are
 * weather-dependent and short windows reward locals. Three base towns:
 *
 *   Ben Lomond Base → on-mountain village (Carr Villa / Creek Inn)
 *   Launceston      → closest city base · ~90 min drive
 *   Hobart          → state capital · long day-trips when conditions deliver
 *
 * Mt Mawson in Mt Field NP is intentionally excluded · it's a club tow,
 * not a commercial operation, and the user brief is chairlift-first.
 */
export const tasmaniaRegion: RegionConfig = {
  id: "tasmania",
  name: "Tasmania",
  subtitle: "TAS · Australia",
  shortTag: "TAS",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  summaryMountains: ["Ben Lomond"],
  resorts: [
    { path: "/mountain/ben-lomond", label: "Ben Lomond" },
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
  ],
  baseTowns: [
    {
      id: "ben-lomond-base",
      name: "Ben Lomond Base",
      lat: -41.5392,
      lng: 147.6486,
      // on-mountain village (Carr Villa / Creek Inn) · tight radius around
      // the alpine village core at the foot of the chairlifts.
      radiusM: 1500,
      blurb: "tasmania's only ski lift operation · on-mountain village at the foot of the lifts",
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
      nearbyMountainIds: ["ben-lomond"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Discover Tasmania", url: "https://www.discovertasmania.com.au/" },
    { category: "Tourism", label: "Visit Northern Tasmania", url: "https://www.northerntasmania.com.au/" },
    { category: "Resorts", label: "Ben Lomond Snow Sports", url: "https://tasmania.ski/" },
    { category: "National Park", label: "Ben Lomond National Park · Parks Tasmania", url: "https://parks.tas.gov.au/explore-our-parks/ben-lomond-national-park" },
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
