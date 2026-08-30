import type { TransportProviderList } from "@/types/transport";

/** Winter Park operators verified against official sites (Aug 2026). */
export const WINTER_PARK_TRANSPORT: TransportProviderList = [
  {
    id: "us-winter-park-the-lift",
    name: "The Lift",
    type: "bus",
    leg: "to_mountain",
    operator: "Town of Winter Park",
    phone: null,
    website: "https://www.theliftwp.com/",
    route_summary:
      "Free public buses link Winter Park Resort, downtown Winter Park, Fraser and Granby, with routes and frequency changing by season.",
    schedule_url: "https://www.theliftwp.com/our-services",
    featured: true,
    regions: ["winter-park"],
  },
  {
    id: "us-winter-park-express",
    name: "Winter Park Express",
    type: "train",
    leg: "to_mountain",
    operator: "Amtrak",
    phone: null,
    website: "https://www.winterparkresort.com/plan-your-trip/getting-here",
    route_summary:
      "Seasonal ski train from Denver Union Station directly to Winter Park Resort. Service runs on selected winter days and advance booking is strongly recommended.",
    schedule_url: "https://www.winterparkresort.com/plan-your-trip/getting-here",
    regions: ["winter-park"],
  },
];
