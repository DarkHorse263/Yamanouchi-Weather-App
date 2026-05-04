import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

export const snowyMountainsRegion: RegionConfig = {
  id: "snowy-mountains",
  name: "Snowy Mountains",
  subtitle: "NSW · Australia",
  shortTag: "NSW",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  resorts: [
    { path: "/mountain/thredbo",   label: "Thredbo" },
    { path: "/mountain/perisher",  label: "Perisher" },
    { path: "/mountain/charlottes-pass", label: "Charlotte's Pass" },
    { path: "/mountain/selwyn",    label: "Selwyn" },
  ],
  mountains: [
    { id: "thredbo",         name: "Thredbo",          elevationM: 2037, lat: -36.5054, lng: 148.3089, blurb: "NSW · the high one",                          websiteUrl: "https://www.thredbo.com.au" },
    { id: "perisher",        name: "Perisher",         elevationM: 2054, lat: -36.3717, lng: 148.4086, blurb: "NSW · the big one (4 resorts)",              websiteUrl: "https://www.perisher.com.au" },
    { id: "charlottes-pass", name: "Charlotte's Pass", elevationM: 1837, lat: -36.4314, lng: 148.3297, blurb: "NSW · ski-in village above the snowline",    websiteUrl: "https://www.charlottepass.com.au" },
    { id: "selwyn",          name: "Selwyn",           elevationM: 1614, lat: -35.8383, lng: 148.5267, blurb: "NSW · family beginner mountain",             websiteUrl: "https://www.selwynsnow.com.au" },
  ],
  baseTowns: [
    {
      id: "jindabyne",
      name: "Jindabyne",
      lat: -36.4106,
      lng: 148.6206,
      radiusM: 5000,
      blurb: "Lakeside base town · 30 min to Thredbo & Perisher",
      nearbyMountainIds: ["thredbo", "perisher", "charlottes-pass"],
    },
    {
      id: "berridale",
      name: "Berridale",
      lat: -36.3686,
      lng: 148.8311,
      radiusM: 4000,
      blurb: "Quiet village stop on the Snowy Mountains Highway",
      nearbyMountainIds: ["thredbo", "perisher", "charlottes-pass", "selwyn"],
    },
    {
      id: "cooma",
      name: "Cooma",
      lat: -36.2350,
      lng: 149.1280,
      radiusM: 6000,
      blurb: "Regional hub · 1 hr to the snowfields",
      nearbyMountainIds: ["thredbo", "perisher", "charlottes-pass", "selwyn"],
    },
  ],
  footer: "v0.3 · feelzlike",
  roadsSource: {
    label: "Live Traffic NSW",
    url: "https://www.livetraffic.com",
    dataAvailable: true,
  },
};
