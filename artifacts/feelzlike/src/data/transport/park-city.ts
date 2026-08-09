import type { TransportProviderList } from "@/types/transport";

/**
 * Park City (Utah, USA) transport providers.
 *
 * All operators verified against their official sites (Aug 2026). Phone
 * numbers left `null` when not directly verifiable - we never guess.
 */
export const PARK_CITY_TRANSPORT: TransportProviderList = [
  {
    id: "us-park-city-transit",
    name: "Park City Transit",
    type: "bus",
    leg: "to_mountain",
    operator: "Park City Municipal",
    phone: null,
    website: "https://www.parkcity.gov/departments/transit-bus",
    route_summary:
      "Park City's free bus network - routes link Old Town, the Park City Mountain base areas and Deer Valley. No ticket needed, boards on Main Street.",
    schedule_url: "https://www.parkcity.gov/departments/transit-bus",
    featured: true,
    regions: ["park-city"],
  },
  {
    id: "us-high-valley-transit-101",
    name: "High Valley Transit 101",
    type: "bus",
    leg: "to_town",
    operator: "High Valley Transit",
    phone: null,
    website: "https://www.hvtutah.gov/",
    route_summary:
      "Free express bus between Salt Lake City and Park City's Old Town Transit Center - the car-free route up Parleys Canyon from the city and airport connections.",
    schedule_url: "https://www.hvtutah.gov/bus-101-to-old-town-transit-center",
    regions: ["park-city"],
  },
];
