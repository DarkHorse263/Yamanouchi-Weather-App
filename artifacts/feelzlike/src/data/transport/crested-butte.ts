import type { TransportProviderList } from "@/types/transport";

/**
 * Crested Butte (Colorado, USA) transport providers.
 *
 * Verified against the operator's official site (Aug 2026).
 */
export const CRESTED_BUTTE_TRANSPORT: TransportProviderList = [
  {
    id: "us-gunnison-valley-rta",
    name: "Gunnison Valley RTA Free Bus",
    type: "bus",
    leg: "to_mountain",
    operator: "Gunnison Valley Rural Transportation Authority",
    phone: null,
    website: "https://www.gunnisonvalleyrta.com/",
    route_summary:
      "Free daily bus linking Gunnison, Crested Butte and Mt. Crested Butte. It reaches the mountain transit centre but does not serve Gunnison–Crested Butte Regional Airport.",
    schedule_url: "https://www.gunnisonvalleyrta.com/free-bus-schedule",
    featured: true,
    regions: ["crested-butte"],
  },
];
