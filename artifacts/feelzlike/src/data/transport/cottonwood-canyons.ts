import type { TransportProviderList } from "@/types/transport";

/**
 * Cottonwood Canyons (Utah, USA) transport providers.
 *
 * Verified against the operator's official site (Aug 2026).
 */
export const COTTONWOOD_CANYONS_TRANSPORT: TransportProviderList = [
  {
    id: "us-uta-cottonwood-ski-bus",
    name: "UTA Cottonwood Canyons Ski Bus",
    type: "bus",
    leg: "to_mountain",
    operator: "Utah Transit Authority",
    phone: null,
    website: "https://www.rideuta.com/",
    route_summary:
      "Seasonal public ski buses serve Snowbird and Alta in Little Cottonwood Canyon, and Solitude and Brighton in Big Cottonwood Canyon. A fare or eligible resort pass is required.",
    schedule_url: "https://www.rideuta.com/Rider-Info/Ski-Service",
    regions: ["cottonwood-canyons"],
  },
];
