import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Provo · a single resort ("Sundance Mountain Resort") in the mountains
 * above Provo, with two base towns: Provo itself and the small village of
 * Sundance right at the resort base. No naming collision between the
 * region id ("provo") and either base town id, since both take a
 * `-town` suffix for consistency with the flat location registry (same
 * defensive pattern used for Crested Butte/Telluride/Durango in the
 * Colorado pass, applied here even though a literal collision only exists
 * for the "provo" id).
 *
 * Sundance Mountain Resort is independently owned and confirmed by the
 * resort itself to not participate in either the Ikon Pass or Epic Pass
 * programs.
 *
 * Northern-hemisphere season (early Dec to late March). Weather is
 * Open-Meteo with the existing OpenWeatherMap fallback · no NWS
 * observation reconciliation is wired. UDOT publishes udottraffic.utah.gov
 * but nothing is integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const provoRegion: RegionConfig = {
  id: "provo",
  name: "Provo",
  subtitle: "Utah · USA",
  shortTag: "UT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Sundance Mountain Resort"],
  resorts: [{ path: "/mountain/sundance-mountain-resort", label: "Sundance Mountain Resort" }],
  mountains: [
    {
      id: "sundance-mountain-resort",
      name: "Sundance Mountain Resort",
      elevationM: 1859,
      lat: 40.3970,
      lng: -111.5847,
      blurb: "independent (no Ikon or Epic Pass) · Robert Redford's low-key resort in Provo Canyon",
      websiteUrl: "https://www.sundanceresort.com/",
      snowReportUrl: "https://www.sundanceresort.com/mountain-report/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "provo-town",
      name: "Provo",
      lat: 40.2338,
      lng: -111.6585,
      radiusM: 10000,
      blurb: "university city at the mouth of Provo Canyon, about 20 minutes from Sundance",
      nearbyMountainIds: ["sundance-mountain-resort"],
    },
    {
      id: "sundance-town",
      name: "Sundance",
      lat: 40.3970,
      lng: -111.5847,
      radiusM: 6000,
      blurb: "small village right at the resort base, in Provo Canyon along the Alpine Loop",
      nearbyMountainIds: ["sundance-mountain-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Provo", url: "https://www.visitprovo.com/" },
    { category: "Resorts", label: "Sundance Mountain Resort", url: "https://www.sundanceresort.com/" },
    { category: "Resorts", label: "Sundance · webcams", url: "https://www.sundanceresort.com/webcams/" },
    { category: "Transport", label: "UDOT · statewide traffic & road conditions", url: "https://www.udottraffic.utah.gov/" },
    { category: "Safety", label: "Utah Avalanche Center · Provo forecast", url: "https://utahavalanchecenter.org/" },
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
