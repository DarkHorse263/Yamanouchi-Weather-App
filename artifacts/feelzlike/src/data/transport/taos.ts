import type { TransportProviderList } from "@/types/transport";

/** Taos operators verified against official sites (Aug 2026). */
export const TAOS_TRANSPORT: TransportProviderList = [
  {
    id: "us-taos-blue-bus-341",
    name: "Blue Bus 341 TSV Green",
    type: "bus",
    leg: "to_mountain",
    operator: "North Central Regional Transit District",
    phone: null,
    website: "https://www.ncrtd.org/ski-bus/",
    route_summary:
      "Free seasonal ski bus from Taos to Taos Ski Valley, with stops including the town centre and Arroyo Seco. Check winter operating dates and reservation guidance.",
    schedule_url: "https://www.ncrtd.org/all-routes/341-tsv-green/",
    featured: true,
    regions: ["taos"],
  },
];
