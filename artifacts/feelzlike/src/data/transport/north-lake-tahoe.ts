import type { TransportProviderList } from "@/types/transport";

/**
 * North Lake Tahoe (California, USA) transport providers.
 *
 * All operators verified against their official sites (Aug 2026). Phone
 * numbers left `null` when not directly verifiable - we never guess.
 */
export const NORTH_LAKE_TAHOE_TRANSPORT: TransportProviderList = [
  {
    id: "us-tart",
    name: "TART",
    type: "bus",
    leg: "to_mountain",
    operator: "Tahoe Truckee Area Regional Transit",
    phone: null,
    website: "https://tahoetruckeetransit.com/",
    route_summary:
      "Free regional buses linking Truckee, Tahoe City and Kings Beach with Palisades Tahoe and Northstar in winter, plus TART Connect on-demand vans around the north shore.",
    schedule_url: "https://tahoetruckeetransit.com/how-to-ride/",
    featured: true,
    regions: ["north-lake-tahoe"],
  },
  {
    id: "us-amtrak-zephyr-truckee",
    name: "Amtrak California Zephyr",
    type: "train",
    leg: "to_town",
    operator: "Amtrak",
    phone: null,
    website: "https://www.amtrak.com/stations/tru",
    route_summary:
      "The daily California Zephyr stops in downtown Truckee - one train a day each way between the Bay Area / Sacramento and Reno, right over Donner Pass.",
    schedule_url: "https://www.amtrak.com/stations/tru",
    regions: ["north-lake-tahoe"],
  },
  {
    id: "us-north-lake-tahoe-express",
    name: "North Lake Tahoe Express",
    type: "shuttle",
    leg: "to_town",
    operator: "North Lake Tahoe Express",
    phone: null,
    website: "https://northlaketahoeexpress.com/",
    route_summary:
      "Scheduled airport shuttle between Reno-Tahoe Airport and the north shore - stops include Truckee, Palisades Tahoe, Northstar and Tahoe City. Pre-booked.",
    schedule_url: "https://northlaketahoeexpress.com/routes/",
    regions: ["north-lake-tahoe"],
  },
];
