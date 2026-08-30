import type { TransportProviderList } from "@/types/transport";

/** Telluride operators verified against official sites (Aug 2026). */
export const TELLURIDE_TRANSPORT: TransportProviderList = [
  {
    id: "us-telluride-galloping-goose",
    name: "Galloping Goose",
    type: "bus",
    leg: "around_town",
    operator: "Town of Telluride",
    phone: null,
    website: "https://telluride.gov/255/Public-Transit",
    route_summary:
      "Free town loop around Telluride, serving key stops for lodging, downtown and the gondola connection to Mountain Village.",
    schedule_url: "https://telluride.gov/255/Public-Transit",
    featured: true,
    regions: ["telluride"],
  },
];
