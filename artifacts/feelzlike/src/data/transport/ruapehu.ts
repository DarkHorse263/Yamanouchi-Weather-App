import type { TransportProviderList } from "@/types/transport";

/**
 * Ruapehu (Central Plateau, NZ) transport providers.
 *
 * Verified operators only · phone/website/schedule_url are null when not
 * directly verifiable, never guessed. Whakapapa is reached from National
 * Park village, where local shuttles run from the Park & Ride; InterCity
 * coaches serve National Park and Ohakune on the main trunk line.
 */
export const RUAPEHU_TRANSPORT: TransportProviderList = [
  {
    id: "nz-ruapehu-mountain-transport",
    name: "Ruapehu Mountain Transport",
    type: "shuttle",
    leg: "to_mountain",
    operator: "Ruapehu Mountain Transport",
    phone: "+64 27 892 2954",
    website: null,
    route_summary:
      "Ski-season shuttle from the National Park village Park & Ride (59 Findlay St) up the Bruce Road to Whakapapa. Pre-book your seat.",
    regions: ["ruapehu"],
    seasonality: "winter_only",
    mountains_served: ["whakapapa"],
  },
  {
    id: "nz-summit-shuttles",
    name: "Summit Shuttles",
    type: "shuttle",
    leg: "to_mountain",
    operator: "Summit Shuttles",
    phone: "+64 21 784 202",
    website: null,
    route_summary:
      "Ski-season shuttle from National Park village to Whakapapa via the Bruce Road. Pre-book your seat.",
    regions: ["ruapehu"],
    seasonality: "winter_only",
    mountains_served: ["whakapapa"],
  },
  {
    id: "nz-intercity-ruapehu",
    name: "InterCity",
    type: "bus",
    leg: "to_town",
    operator: "InterCity Group (NZ)",
    phone: null,
    website: "https://www.intercity.co.nz/",
    route_summary:
      "National coach network with stops at National Park (for Whakapapa) and Ohakune (for Turoa). Connect to a local shuttle for the final climb to the mountain.",
    regions: ["ruapehu"],
    mountains_served: ["whakapapa", "turoa"],
  },
];
