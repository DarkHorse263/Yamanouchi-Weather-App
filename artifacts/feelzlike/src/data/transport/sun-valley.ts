import type { TransportProviderList } from "@/types/transport";

/** Sun Valley operators verified against official sites (Aug 2026). */
export const SUN_VALLEY_TRANSPORT: TransportProviderList = [
  {
    id: "us-sun-valley-mountain-rides",
    name: "Mountain Rides",
    type: "bus",
    leg: "to_mountain",
    operator: "Mountain Rides Transportation Authority",
    phone: null,
    website: "https://mountainrides.org/",
    route_summary:
      "Free public buses around Ketchum, Sun Valley and the Wood River Valley, with ski-season service to Bald and Dollar mountains.",
    schedule_url: "https://mountainrides.org/",
    featured: true,
    regions: ["sun-valley"],
  },
  {
    id: "us-sun-valley-airport-shuttle",
    name: "Mountain Rides Airport Shuttle",
    type: "shuttle",
    leg: "to_town",
    operator: "Mountain Rides Transportation Authority",
    phone: null,
    website: "https://mountainrides.org/airport-shuttle/",
    route_summary:
      "Free scheduled shuttle between Friedman Memorial Airport and stops in Hailey, Ketchum and Sun Valley. Check the current flight-linked timetable.",
    schedule_url: "https://mountainrides.org/airport-shuttle/",
    regions: ["sun-valley"],
  },
];
