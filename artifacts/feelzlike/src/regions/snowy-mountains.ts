import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

export const snowyMountainsRegion: RegionConfig = {
  id: "snowy-mountains",
  name: "Snowy Mountains",
  subtitle: "NSW · Australia",
  shortTag: "NSW",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "south",
  // Curated display order across the app (May 2026): Perisher and Thredbo
  // are the two flagship day-tripper resorts and always lead. Selwyn is the
  // family-beginner mountain. Charlotte's Pass is listed last because it's
  // harder to reach - the village is snowbound in winter, so day-trippers
  // need the oversnow transfer from Perisher Valley (DayTripper package
  // required, ~30-45 min). It's a real day-trip option, just not as
  // straightforward as driving up to Thredbo or Perisher.
  resorts: [
    { path: "/mountain/perisher",  label: "Perisher" },
    { path: "/mountain/thredbo",   label: "Thredbo" },
    { path: "/mountain/selwyn",    label: "Selwyn" },
    { path: "/mountain/charlottes-pass", label: "Charlotte's Pass" },
  ],
  mountains: [
    // Terrain tags (Sprint 4.1) - sourced from official trail maps + AU resort positioning.
    // Perisher: largest in southern hemisphere, 4 connected resorts → covers everything.
    { id: "perisher",        name: "Perisher",         elevationM: 2054, lat: -36.3717, lng: 148.4086, blurb: "NSW · the big one (4 resorts)",              websiteUrl: "https://www.perisher.com.au",       beginner_friendly: true, kids_lessons: true, terrain_park: true },
    // Thredbo: highest vertical in AU, advanced skiers' choice, has terrain_park + lift-served backcountry.
    { id: "thredbo",         name: "Thredbo",          elevationM: 2037, lat: -36.5054, lng: 148.3089, blurb: "NSW · the high one",                          websiteUrl: "https://www.thredbo.com.au",        terrain_park: true, backcountry_access: true, kids_lessons: true },
    // Selwyn: explicitly family-beginner, no expert terrain.
    { id: "selwyn",          name: "Selwyn",           elevationM: 1614, lat: -35.8383, lng: 148.5267, blurb: "NSW · family beginner mountain",             websiteUrl: "https://www.selwynsnow.com.au",     beginner_friendly: true, kids_lessons: true },
    // Charlotte's Pass: small ski-in village, mostly intermediate, kids' programs.
    // Day-trippable via the DayTripper package: park at Perisher Valley (or
    // take the Skitube from Bullocks Flat), then oversnow vehicle ~30-45 min
    // up to the village. Standard lift tickets are overnight-guests only.
    { id: "charlottes-pass", name: "Charlotte's Pass", elevationM: 1837, lat: -36.4314, lng: 148.3297, blurb: "NSW · ski-in village · day trip via oversnow from Perisher", websiteUrl: "https://www.charlottepass.com.au", beginner_friendly: true, kids_lessons: true },
  ],
  baseTowns: [
    {
      id: "jindabyne",
      name: "Jindabyne",
      lat: -36.4106,
      lng: 148.6206,
      radiusM: 5000,
      blurb: "Lakeside base town · 30 min to Thredbo & Perisher",
      nearbyMountainIds: ["perisher", "thredbo", "charlottes-pass"],
    },
    {
      id: "berridale",
      name: "Berridale",
      lat: -36.3686,
      lng: 148.8311,
      radiusM: 4000,
      blurb: "Quiet village stop on the Snowy Mountains Highway",
      nearbyMountainIds: ["perisher", "thredbo", "selwyn", "charlottes-pass"],
    },
    {
      id: "cooma",
      name: "Cooma",
      lat: -36.2350,
      lng: 149.1280,
      radiusM: 6000,
      blurb: "Regional hub · 1 hr to the snowfields",
      nearbyMountainIds: ["perisher", "thredbo", "selwyn", "charlottes-pass"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Snowy Mountains - Destination NSW", url: "https://www.snowymountains.com.au/", blurb: "Official regional tourism site" },
    { category: "Tourism", label: "Visit NSW - Snowy Mountains", url: "https://www.visitnsw.com/destinations/snowy-mountains" },
    { category: "Tourism", label: "Snowy Valleys Council - Visitor Info", url: "https://www.visitsnowyvalleys.com.au/" },
    { category: "National parks", label: "Kosciuszko National Park (NPWS)", url: "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/kosciuszko-national-park" },
    { category: "Resorts", label: "Perisher", url: "https://www.perisher.com.au" },
    { category: "Resorts", label: "Thredbo", url: "https://www.thredbo.com.au" },
    { category: "Resorts", label: "Selwyn Snow Resort", url: "https://www.selwynsnow.com.au" },
    { category: "Resorts", label: "Charlotte's Pass", url: "https://www.charlottepass.com.au" },
  ],
  weatherSource: {
    label: "Open-Meteo + BOM",
    labelJa: "Open-Meteo・BOM",
  },
  roadsSource: {
    label: "Live Traffic NSW",
    url: "https://www.livetraffic.com",
    dataAvailable: true,
  },
};
