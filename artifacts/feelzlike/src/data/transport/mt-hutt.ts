import type { TransportProviderList } from "@/types/transport";

/**
 * Mt Hutt (Canterbury, NZ) transport providers.
 *
 * Verified operators only · phone/website/schedule_url are null when not
 * directly verifiable, never guessed. Methven Travel runs the local ski bus
 * up the access road plus year-round Christchurch Airport transfers.
 */
export const MT_HUTT_TRANSPORT: TransportProviderList = [
  {
    id: "nz-methven-travel-ski-bus",
    name: "Methven Ski Bus & Airport Transfers",
    type: "bus",
    leg: "to_mountain",
    operator: "Methven Travel",
    phone: null,
    website: "https://www.methventravel.co.nz/methven-ski-bus/",
    route_summary:
      "Methven Travel runs the daily ski-season bus from Methven up the Mt Hutt access road, plus year-round transfers between Christchurch Airport and Methven. Book ahead.",
    schedule_url: "https://www.methventravel.co.nz/methven-ski-bus/",
    regions: ["mt-hutt"],
    mountains_served: ["mt-hutt"],
  },
];
