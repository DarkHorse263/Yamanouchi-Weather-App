import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Summit County · the I-70 mountain corridor an hour west of Denver, home to
 * five resorts across four base towns:
 *
 *   Breckenridge   → Breckenridge          · Epic Pass, town = resort name
 *   Keystone/Dillon→ Keystone              · Epic Pass, town = resort name
 *   Copper Mountain→ Copper Mountain       · Ikon Pass, town = resort name
 *   Georgetown     → Arapahoe Basin, Loveland · Ikon (A-Basin) / independent (Loveland)
 *
 * Naming collisions: Breckenridge, Keystone and Copper Mountain each share
 * their resort's name with the base town. Per the Canada build's convention
 * (sun-peaks-resort, lake-louise-resort), the mountain entries take a
 * `-resort` suffix and the town ids stay bare.
 *
 * Northern-hemisphere season (mid-Nov to early May). Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback · no NWS observation
 * reconciliation is wired, so we don't credit a live national feed. CDOT
 * publishes cotrip.org but nothing is integrated yet, hence
 * `roadsSource.dataAvailable: false`.
 */
export const summitCountyRegion: RegionConfig = {
  id: "summit-county",
  name: "Summit County",
  subtitle: "Colorado · USA",
  shortTag: "CO",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Breckenridge", "Keystone", "Copper Mountain", "Arapahoe Basin", "Loveland"],
  resorts: [
    { path: "/mountain/breckenridge-resort", label: "Breckenridge" },
    { path: "/mountain/keystone-resort", label: "Keystone" },
    { path: "/mountain/copper-mountain-resort", label: "Copper Mountain" },
    { path: "/mountain/arapahoe-basin", label: "Arapahoe Basin" },
    { path: "/mountain/loveland", label: "Loveland" },
  ],
  mountains: [
    {
      id: "breckenridge-resort",
      name: "Breckenridge",
      elevationM: 2926,
      lat: 39.4817,
      lng: -106.0384,
      blurb: "five interconnected peaks above a historic mining town · Epic Pass flagship",
      websiteUrl: "https://www.breckenridge.com/",
      snowReportUrl: "https://www.breckenridge.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
    {
      id: "keystone-resort",
      name: "Keystone",
      elevationM: 2835,
      lat: 39.6084,
      lng: -105.9439,
      blurb: "three mountains and Colorado's biggest night-skiing operation · usually first to open",
      websiteUrl: "https://www.keystoneresort.com/",
      snowReportUrl: "https://www.keystoneresort.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "copper-mountain-resort",
      name: "Copper Mountain",
      elevationM: 2960,
      lat: 39.5022,
      lng: -106.1512,
      blurb: "naturally divided terrain, easiest on the east side, steepest west · Ikon Pass",
      websiteUrl: "https://www.coppercolorado.com/",
      snowReportUrl: "https://www.coppercolorado.com/the-mountain",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
    {
      id: "arapahoe-basin",
      name: "Arapahoe Basin",
      elevationM: 3286,
      lat: 39.6425,
      lng: -105.8719,
      blurb: "high-alpine and steep · one of the latest closing dates in Colorado most years",
      websiteUrl: "https://www.arapahoebasin.com/",
      snowReportUrl: "https://www.arapahoebasin.com/snow-report/",
      expert_only: true,
      backcountry_access: true,
      summerOpen: true,
    },
    {
      id: "loveland",
      name: "Loveland",
      elevationM: 3245,
      lat: 39.6803,
      lng: -105.8974,
      blurb: "right on the Continental Divide at the Eisenhower Tunnel · independent, no crowds",
      websiteUrl: "https://skiloveland.com/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
  ],
  baseTowns: [
    {
      id: "breckenridge",
      name: "Breckenridge",
      lat: 39.4817,
      lng: -106.0384,
      radiusM: 6000,
      blurb: "historic Victorian mining town at the base of the mountain",
      nearbyMountainIds: ["breckenridge-resort"],
    },
    {
      id: "keystone",
      name: "Keystone / Dillon",
      lat: 39.5769,
      lng: -105.9469,
      radiusM: 6000,
      blurb: "purpose-built resort village and the neighbouring reservoir town of Dillon",
      nearbyMountainIds: ["keystone-resort"],
    },
    {
      id: "copper-mountain",
      name: "Copper Mountain",
      lat: 39.5022,
      lng: -106.1512,
      radiusM: 5000,
      blurb: "ski-in village at the base, roughly midway between Breckenridge and Vail",
      nearbyMountainIds: ["copper-mountain-resort"],
    },
    {
      id: "georgetown",
      name: "Georgetown",
      lat: 39.7047,
      lng: -105.6997,
      radiusM: 6000,
      blurb: "historic mining town off I-70 · closest base for Arapahoe Basin and Loveland",
      nearbyMountainIds: ["arapahoe-basin", "loveland"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Breckenridge Tourism Office", url: "https://www.gobreck.com/" },
    { category: "Tourism", label: "Visit Summit County", url: "https://www.summitcounty.org/" },
    { category: "Resorts", label: "Breckenridge", url: "https://www.breckenridge.com/" },
    { category: "Resorts", label: "Keystone", url: "https://www.keystoneresort.com/" },
    { category: "Resorts", label: "Copper Mountain", url: "https://www.coppercolorado.com/" },
    { category: "Resorts", label: "Arapahoe Basin", url: "https://www.arapahoebasin.com/" },
    { category: "Resorts", label: "Loveland", url: "https://skiloveland.com/" },
    { category: "Transport", label: "CDOT · cotrip.org road conditions & cameras", url: "https://www.cotrip.org/" },
    { category: "Transport", label: "CDOT · I-70 Mountain Corridor", url: "https://www.codot.gov/travel/i70mountain" },
    { category: "Safety", label: "Colorado Avalanche Information Center", url: "https://avalanche.state.co.us/forecasts" },
  ],
  roadsSource: {
    label: "CDOT · cotrip.org",
    url: "https://www.cotrip.org/",
    // No CDOT/cotrip.org feed integration in this pass · the UI shows an
    // honest "not wired yet" panel and links out rather than implying live data.
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
