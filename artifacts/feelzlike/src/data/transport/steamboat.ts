import type { TransportProviderList } from "@/types/transport";

/** Steamboat operators verified against official sites (Aug 2026). */
export const STEAMBOAT_TRANSPORT: TransportProviderList = [
  {
    id: "us-steamboat-sst",
    name: "Steamboat Springs Transit",
    type: "bus",
    leg: "to_mountain",
    operator: "City of Steamboat Springs",
    phone: null,
    website: "https://steamboatsprings.net/166/Transit",
    route_summary:
      "Free city buses connect downtown Steamboat Springs, the mountain area and lodging stops. Winter routes add frequent service to the ski base.",
    schedule_url: "https://steamboatsprings.net/166/Transit",
    featured: true,
    regions: ["steamboat"],
  },
  {
    id: "us-steamboat-ski-town-transportation",
    name: "Ski Town Transportation",
    type: "shuttle",
    leg: "to_town",
    operator: "Ski Town Transportation",
    phone: null,
    website: "https://www.skitowntransportation.com/services/steamboat-airport-shuttle",
    route_summary:
      "Pre-booked shared and private transfers between Yampa Valley Regional Airport and Steamboat Springs lodging.",
    schedule_url:
      "https://www.steamboat.com/plan-your-trip/getting-here-and-around/airport-shuttle/ski-town-transportation",
    regions: ["steamboat"],
  },
];
