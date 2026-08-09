import type { TransportProviderList } from "@/types/transport";

/**
 * Vail Valley (Colorado, USA) transport providers.
 *
 * All operators verified against their official sites (Aug 2026). Eagle
 * County's old "ECO Transit" rebranded as Core Transit - don't revert the
 * name. Phone numbers left `null` when not directly verifiable.
 */
export const VAIL_VALLEY_TRANSPORT: TransportProviderList = [
  {
    id: "us-vail-transit",
    name: "Vail Transit",
    type: "bus",
    leg: "to_mountain",
    operator: "Town of Vail",
    phone: null,
    website: "https://www.vail.gov/government/departments/transportation-services/bus-information",
    route_summary:
      "Vail's free town bus - the in-town loop links Vail Village, Lionshead and Golden Peak base areas, with outlying routes to East and West Vail. No ticket needed.",
    schedule_url: "https://ride.vail.gov/",
    featured: true,
    regions: ["vail-valley"],
  },
  {
    id: "us-core-transit",
    name: "Core Transit",
    type: "bus",
    leg: "around_town",
    operator: "Eagle Valley Transportation Authority",
    phone: null,
    website: "https://coretransit.org/",
    route_summary:
      "Valley-wide buses (formerly ECO Transit) linking Vail, Avon, Beaver Creek, Edwards and Eagle along the I-70 corridor - handy for lodging outside Vail itself.",
    schedule_url: "https://coretransit.org/routes-schedules/",
    regions: ["vail-valley"],
  },
  {
    id: "us-bustang-west",
    name: "Bustang West Line",
    type: "bus",
    leg: "to_town",
    operator: "Colorado Department of Transportation",
    phone: null,
    website: "https://ridebustang.com/",
    route_summary:
      "CDOT's I-70 coach from Denver Union Station to the Vail Transportation Center - a car-free way into the valley. Book ahead on powder weekends.",
    schedule_url: "https://ridebustang.com/",
    regions: ["vail-valley"],
  },
  {
    id: "us-epic-mountain-express-vail",
    name: "Epic Mountain Express",
    type: "shuttle",
    leg: "to_town",
    operator: "Epic Mountain Express",
    phone: null,
    website: "https://www.epicmountainexpress.com/",
    route_summary:
      "Shared and private shuttles from Denver International Airport direct to Vail and Beaver Creek. Pre-booked.",
    schedule_url: "https://www.epicmountainexpress.com/schedules",
    regions: ["vail-valley"],
  },
];
