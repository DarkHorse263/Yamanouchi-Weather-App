import type { TransportProviderList } from "@/types/transport";

/**
 * Stowe & Smugglers' Notch (Vermont, USA) transport providers.
 *
 * All operators verified against their official sites (Aug 2026). Phone
 * numbers left `null` when not directly verifiable - we never guess.
 */
export const STOWE_SMUGGLERS_NOTCH_TRANSPORT: TransportProviderList = [
  {
    id: "us-gmt-mountain-road-shuttle",
    name: "Mountain Road Shuttle",
    type: "bus",
    leg: "to_mountain",
    operator: "Green Mountain Transit (Route 108)",
    phone: null,
    website: "https://ridegmt.com/route-108-mountain-road-shuttle/",
    route_summary:
      "Free winter shuttle up the Mountain Road from Stowe village to the Stowe Mountain Resort base areas - runs daily through the ski season.",
    schedule_url: "https://ridegmt.com/route-108-mountain-road-shuttle/",
    featured: true,
    seasonality: "winter_only",
    regions: ["stowe-smugglers-notch"],
  },
  {
    id: "us-amtrak-vermonter",
    name: "Amtrak Vermonter",
    type: "train",
    leg: "to_town",
    operator: "Amtrak",
    phone: null,
    website: "https://www.amtrak.com/stations/wab",
    route_summary:
      "The daily Vermonter from New York and Springfield stops at Waterbury-Stowe station, about 15 km from Stowe village - taxis and lodging shuttles cover the last leg.",
    schedule_url: "https://www.amtrak.com/vermonter-train",
    regions: ["stowe-smugglers-notch"],
  },
];
