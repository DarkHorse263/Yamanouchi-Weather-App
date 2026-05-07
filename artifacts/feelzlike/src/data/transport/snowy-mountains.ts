import type { TransportProviderList } from "@/types/transport";

/**
 * Snowy Mountains (NSW, Australia) transport providers.
 *
 * Phone numbers and websites left as `null` when not directly verifiable —
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
      "Cooma's local operator — runs the Snowy Mountains Bus Service plus charters, school runs and ski-season shuttles to Perisher and Thredbo.",
    schedule_url: "https://coomacoaches.com.au/snowy-mountains-bus-service/",
    regions: ["snowy-mountains"],
  },
  {
    id: "au-snowliner-coaches",
    name: "Snowliner Coaches",
    type: "bus",
    operator: "Snowliner Coaches",
    phone: null,
    website: null,
    route_summary:
      "Cooma-based charter and ski-season transfers across the Snowy Mountains, including private resort transfers.",
    regions: ["snowy-mountains"],
  },
  {
    id: "au-greyhound-snowy",
    name: "Greyhound Australia",
    type: "bus",
    operator: "Greyhound Australia Pty Ltd",
    phone: "1300 473 946",
    website: "https://www.greyhound.com.au",
    route_summary:
      "Long-distance coach services from Sydney and Canberra connecting to the Snowy Mountains region (typically via Cooma).",
    schedule_url: "https://www.greyhound.com.au",
    regions: ["snowy-mountains"],
  },
  {
    id: "au-murrays-coaches",
    name: "Murrays Coaches",
    type: "bus",
    operator: "Murrays Australia Pty Ltd",
    phone: "13 22 51",
    website: "https://www.murrays.com.au",
    route_summary:
      "Canberra ↔ Cooma scheduled coach service; charter and group transfers into the alpine region on request.",
    schedule_url: "https://www.murrays.com.au",
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
    id: "au-snowy-mountains-airport-shuttles",
    name: "Snowy Mountains Airport shuttles",
    type: "shuttle",
    operator: "Snowy Mountains Airport (Cooma) and partner operators",
    phone: null,
    website: "https://snowymountainsairport.com.au",
    route_summary:
      "On-demand shuttle and pre-booked transfers from Snowy Mountains Airport (Cooma–Snowy Mountains, OOM) to Jindabyne, Berridale, Perisher and Thredbo. Bookings via the operators listed on the airport site.",
    schedule_url: "https://snowymountainsairport.com.au/transport",
    regions: ["snowy-mountains"],
  },
];
