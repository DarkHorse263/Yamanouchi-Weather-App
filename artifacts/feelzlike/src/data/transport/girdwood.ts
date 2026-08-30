import type { TransportProviderList } from "@/types/transport";

/** Girdwood operator verified against its official site (Aug 2026). */
export const GIRDWOOD_TRANSPORT: TransportProviderList = [
  {
    id: "us-glacier-valley-transit",
    name: "Glacier Valley Transit",
    type: "bus",
    leg: "to_mountain",
    operator: "Glacier Valley Transit",
    phone: null,
    website: "https://glaciervalleytransit.com/",
    route_summary:
      "Free public bus around Girdwood Valley, linking downtown, Alyeska Resort's tram and day lodge, and the train depot. Donations are optional.",
    schedule_url:
      "https://glaciervalleytransit.com/glacier-valley-transit-bus-routes-and-schedule/",
    featured: true,
    regions: ["girdwood"],
  },
];
