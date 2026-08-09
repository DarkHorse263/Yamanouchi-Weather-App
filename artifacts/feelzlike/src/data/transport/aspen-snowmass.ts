import type { TransportProviderList } from "@/types/transport";

/**
 * Aspen Snowmass (Colorado, USA) transport providers.
 *
 * All operators verified against their official sites (Aug 2026). Phone
 * numbers left `null` when not directly verifiable - we never guess.
 */
export const ASPEN_SNOWMASS_TRANSPORT: TransportProviderList = [
  {
    id: "us-rfta-skier-shuttles",
    name: "RFTA Aspen–Snowmass buses",
    type: "bus",
    leg: "to_mountain",
    operator: "Roaring Fork Transportation Authority",
    phone: null,
    website: "https://www.rfta.com/",
    route_summary:
      "RFTA runs the free Aspen–Snowmass Village service plus in-season skier shuttles to Aspen Highlands and Buttermilk from Rubey Park in downtown Aspen.",
    schedule_url: "https://www.rfta.com/routes/",
    featured: true,
    regions: ["aspen-snowmass"],
  },
  {
    id: "us-rfta-valley",
    name: "RFTA valley buses",
    type: "bus",
    leg: "to_town",
    operator: "Roaring Fork Transportation Authority",
    phone: null,
    website: "https://www.rfta.com/",
    route_summary:
      "Frequent valley buses (including the VelociRFTA BRT) link Glenwood Springs, Carbondale and Basalt with Aspen - the budget route into town if you're staying down-valley.",
    schedule_url: "https://www.rfta.com/routes/",
    regions: ["aspen-snowmass"],
  },
];
