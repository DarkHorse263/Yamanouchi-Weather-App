import type { TransportProviderList } from "@/types/transport";

/**
 * Snowy Mountains (NSW, Australia) transport providers.
 *
 * Phone numbers and websites left as `null` when not directly verifiable -
 * we never guess. The Cooma Coaches phone matches the long-standing entry
 * already returned by /api/bus-services.
 */
export const SNOWY_MOUNTAINS_TRANSPORT: TransportProviderList = [
  {
    id: "au-cooma-coaches",
    name: "Cooma Coaches",
    type: "bus",
    operator: "Cooma Coaches Pty Ltd",
    phone: "(02) 6452 1584",
    website: "https://www.coomacoaches.com.au",
    route_summary:
      "Cooma's local operator - runs the Snowy Mountains Bus Service plus charters, school runs and ski-season shuttles to Perisher and Thredbo.",
    schedule_url: "https://coomacoaches.com.au/snowy-mountains-bus-service/",
    regions: ["snowy-mountains"],
  },
  {
    id: "au-nsw-trainlink-xplorer",
    name: "NSW TrainLink Xplorer",
    type: "train",
    operator: "NSW TrainLink (Transport for NSW)",
    phone: "13 22 32",
    website: "https://transportnsw.info/regional",
    route_summary:
      "Sydney → Canberra Xplorer service connects with road coaches to Cooma; book a through-fare via NSW TrainLink for the rail-then-coach combo.",
    schedule_url: "https://transportnsw.info/regional/timetables",
    regions: ["snowy-mountains"],
  },
  {
    id: "au-snoexpress",
    name: "SnoExpress",
    type: "shuttle",
    operator: "SnoExpress",
    phone: null,
    website: "https://snoexpress.com.au",
    route_summary:
      "Door-to-door snowfield transfers from Sydney, Canberra and the airport into Jindabyne, Thredbo and Perisher. Pre-booked.",
    schedule_url: "https://snoexpress.com.au",
    regions: ["snowy-mountains"],
  },
  {
    id: "au-jindabyne-taxis",
    name: "Jindabyne Taxis",
    type: "taxi",
    operator: "Jindabyne Taxi Service",
    phone: null,
    website: null,
    route_summary:
      "Local taxi service around Jindabyne - useful for last-mile transfers to Perisher Skitube, Thredbo, accommodation and dinner runs.",
    regions: ["snowy-mountains"],
  },
];
