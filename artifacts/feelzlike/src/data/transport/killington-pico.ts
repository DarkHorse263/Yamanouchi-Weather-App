import type { TransportProviderList } from "@/types/transport";

/**
 * Killington/Pico (Vermont, USA) transport providers.
 *
 * Verified against the operator's official site (Aug 2026).
 */
export const KILLINGTON_PICO_TRANSPORT: TransportProviderList = [
  {
    id: "us-the-bus-rutland-killington",
    name: "The Bus · Rutland–Killington",
    type: "bus",
    leg: "to_mountain",
    operator: "Marble Valley Regional Transit District",
    phone: null,
    website: "https://thebus.com/",
    route_summary:
      "Year-round public bus from downtown Rutland through Mendon and Pico to Killington, with winter stops along Killington Road and at the resort base lodges. Fares apply.",
    schedule_url: "https://thebus.com/routes/rutland-killington-commuter/",
    regions: ["killington-pico"],
  },
];
