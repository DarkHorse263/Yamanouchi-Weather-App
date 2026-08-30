import type { TransportProviderList } from "@/types/transport";

/** Big Sky operators verified against official sites (Aug 2026). */
export const BIG_SKY_TRANSPORT: TransportProviderList = [
  {
    id: "us-big-sky-skyline",
    name: "Skyline",
    type: "bus",
    leg: "to_mountain",
    operator: "Skyline Bus",
    phone: null,
    website: "https://skylinebus.com/",
    route_summary:
      "Free local bus routes link Big Sky's Canyon, Meadow and Mountain areas, including Big Sky Resort. Seasonal routes and times change, so check the live schedule.",
    schedule_url: "https://skylinebus.com/routes",
    featured: true,
    regions: ["big-sky"],
  },
  {
    id: "us-big-sky-connect",
    name: "Big Sky Connect",
    type: "shuttle",
    leg: "around_town",
    operator: "Skyline Bus",
    phone: null,
    website: "https://skylinebus.com/routes/app",
    route_summary:
      "Free on-demand shared rides within the Big Sky service area, booked through the Skyline app. It is a local connection service, not an airport shuttle.",
    schedule_url: "https://skylinebus.com/routes/app",
    regions: ["big-sky"],
  },
];
