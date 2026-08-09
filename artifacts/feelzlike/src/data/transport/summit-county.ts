import type { TransportProviderList } from "@/types/transport";

/**
 * Summit County (Colorado, USA) transport providers.
 *
 * All operators verified against their official sites (Aug 2026). Phone
 * numbers left `null` when not directly verifiable - we never guess.
 */
export const SUMMIT_COUNTY_TRANSPORT: TransportProviderList = [
  {
    id: "us-summit-stage",
    name: "Summit Stage",
    type: "bus",
    leg: "to_mountain",
    operator: "Summit County Government",
    phone: null,
    website: "https://www.summitcountyco.gov/services/transit_summit_stage/index.php",
    route_summary:
      "Summit County's free county-wide bus - links Breckenridge, Frisco, Dillon and Silverthorne with Keystone and Copper Mountain year-round. No ticket needed, ski racks on board.",
    schedule_url:
      "https://www.summitcountyco.gov/services/transit_summit_stage/bus_schedule/index.php",
    featured: true,
    regions: ["summit-county"],
  },
  {
    id: "us-breck-free-ride",
    name: "Breck Free Ride",
    type: "bus",
    leg: "around_town",
    operator: "Town of Breckenridge",
    phone: null,
    website: "https://www.breckfreeride.com/",
    route_summary:
      "Breckenridge's free town bus - loops between the gondola, Main Street, lodging areas and the base lifts. Just hop on.",
    schedule_url: "https://www.breckfreeride.com/routes-schedules",
    regions: ["summit-county"],
  },
  {
    id: "us-bustang-pegasus",
    name: "Bustang / Pegasus",
    type: "bus",
    leg: "to_town",
    operator: "Colorado Department of Transportation",
    phone: null,
    website: "https://ridebustang.com/",
    route_summary:
      "CDOT's I-70 coach from Denver (Union Station and Federal Center) to Frisco - connect to the free Summit Stage for Breckenridge, Keystone and Copper. Book ahead on powder weekends.",
    schedule_url: "https://ridebustang.com/",
    regions: ["summit-county"],
  },
  {
    id: "us-epic-mountain-express-summit",
    name: "Epic Mountain Express",
    type: "shuttle",
    leg: "to_town",
    operator: "Epic Mountain Express",
    phone: null,
    website: "https://www.epicmountainexpress.com/",
    route_summary:
      "Shared and private shuttles from Denver International Airport direct to Breckenridge and the Summit County resorts. Pre-booked.",
    schedule_url: "https://www.epicmountainexpress.com/schedules",
    regions: ["summit-county"],
  },
];
