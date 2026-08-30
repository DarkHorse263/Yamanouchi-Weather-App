import type { TransportProviderList } from "@/types/transport";

/**
 * Bend / Mt. Bachelor (Oregon, USA) transport providers.
 *
 * Verified against the operator's official site (Aug 2026).
 */
export const BEND_TRANSPORT: TransportProviderList = [
  {
    id: "us-cet-mt-bachelor-winter",
    name: "Mt. Bachelor Ski Bus",
    type: "bus",
    leg: "to_mountain",
    operator: "Cascades East Transit",
    phone: null,
    website: "https://cascadeseasttransit.com/",
    route_summary:
      "Paid seasonal winter bus from Bend's Hawthorne Station and Mt. Bachelor Park & Ride to West Village and Sunrise Lodge. Service and fares vary by season.",
    schedule_url: "https://cascadeseasttransit.com/ride/mt-bachelor-winter/",
    regions: ["bend"],
  },
];
