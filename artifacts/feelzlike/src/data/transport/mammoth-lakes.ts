import type { TransportProviderList } from "@/types/transport";

/** Mammoth Lakes operators verified against official sites (Aug 2026). */
export const MAMMOTH_LAKES_TRANSPORT: TransportProviderList = [
  {
    id: "us-mammoth-esta-red-line",
    name: "ESTA Red Line",
    type: "bus",
    leg: "to_mountain",
    operator: "Eastern Sierra Transit Authority",
    phone: null,
    website: "https://www.estransit.com/",
    route_summary:
      "Free winter bus between Mammoth Lakes and Mammoth Mountain's Main Lodge, serving stops through town and along Main Street.",
    schedule_url: "https://www.estransit.com/red-line",
    featured: true,
    regions: ["mammoth-lakes"],
  },
  {
    id: "us-mammoth-esta-airport",
    name: "ESTA Airport Connections",
    type: "bus",
    leg: "to_town",
    operator: "Eastern Sierra Transit Authority",
    phone: null,
    website: "https://www.estransit.com/airport-connections",
    route_summary:
      "Scheduled public-bus connections for Eastern Sierra airports and Mammoth Lakes. Flights and timetables are seasonal, so confirm the current connection before booking.",
    schedule_url: "https://www.estransit.com/airport-connections",
    regions: ["mammoth-lakes"],
  },
];
