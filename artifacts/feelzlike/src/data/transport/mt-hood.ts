import type { TransportProviderList } from "@/types/transport";

/** Mt. Hood operators verified against official sites (Aug 2026). */
export const MT_HOOD_TRANSPORT: TransportProviderList = [
  {
    id: "us-mt-hood-express",
    name: "Mt. Hood Express",
    type: "bus",
    leg: "to_mountain",
    operator: "Clackamas County",
    phone: null,
    website: "https://www.clackamas.us/mthoodexpress",
    route_summary:
      "Public bus from Sandy through the Mt. Hood villages and Government Camp to Timberline Lodge. Fares apply and mountain service can be weather affected.",
    schedule_url: "https://rideclackamas.org/provider/mhx/",
    regions: ["mt-hood"],
  },
  {
    id: "us-mt-hood-gorge-to-mountain",
    name: "Gorge-To-Mountain Express",
    type: "bus",
    leg: "to_mountain",
    operator: "Columbia Area Transit",
    phone: null,
    website: "https://www.ridecatbus.org/gorge-to-mountain-express/",
    route_summary:
      "Seasonal winter bus from Hood River to Mt. Hood Meadows, with limited operating days and advance planning required.",
    schedule_url: "https://www.ridecatbus.org/gorge-to-mountain-express/",
    regions: ["mt-hood"],
  },
];
