import type { TransportProviderList } from "@/types/transport";

/**
 * Whitefish (Montana, USA) transport providers.
 *
 * Verified against the resort's official site (Aug 2026).
 */
export const WHITEFISH_TRANSPORT: TransportProviderList = [
  {
    id: "us-whitefish-snow-bus",
    name: "S.N.O.W. Bus",
    type: "shuttle",
    leg: "to_mountain",
    operator: "Big Mountain Commercial Association",
    phone: null,
    website: "https://skiwhitefish.com/snowbus/",
    route_summary:
      "Free seasonal shuttle between downtown Whitefish and Whitefish Mountain Resort, with town stops including the Depot Transit Center. No ticket is required.",
    schedule_url: "https://skiwhitefish.com/snowbus/",
    featured: true,
    regions: ["whitefish"],
  },
];
