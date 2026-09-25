import type { TransportProviderList } from "@/types/transport";

/**
 * Stowe & Smugglers' Notch (Vermont, USA) transport providers.
 *
 * Operators and routes checked against official destination/operator pages. Phone
 * numbers left `null` when not directly verifiable - we never guess.
 */
export const STOWE_SMUGGLERS_NOTCH_TRANSPORT: TransportProviderList = [
  {
    id: "us-rct-mountain-road-shuttle",
    name: "Mountain Road Shuttle",
    type: "bus",
    leg: "to_mountain",
    operator: "Rural Community Transportation (RCT)",
    phone: null,
    website: "https://gostowe.com/plan-your-visit/winter-shuttle",
    route_summary:
      "Free seasonal shuttle along Mountain Road (Route 108) from Stowe village to Stowe Mountain Resort and Spruce Peak. Check the destination page for this winter's dates, schedule and service updates.",
    schedule_url: "https://gostowe.com/plan-your-visit/winter-shuttle",
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
