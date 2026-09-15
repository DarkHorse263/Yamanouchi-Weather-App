import type { TransportProviderList } from "@/types/transport";

/** Official St Anton arrival links. Timetables and journey times are not asserted. */
export const ST_ANTON_TRANSPORT: TransportProviderList = [
  {
    id: "at-st-anton-arrival",
    name: "St Anton am Arlberg · official arrival information",
    type: "train",
    leg: "to_town",
    operator: "St Anton am Arlberg tourism",
    phone: null,
    website: "https://www.stantonamarlberg.com/en/arrival",
    route_summary: "Use the destination's official arrival page for current rail, road and transfer guidance. Check the operator timetable and road conditions before travel.",
    regions: ["st-anton"],
    mountains_served: ["st-anton-resort"],
  },
  {
    id: "at-st-anton-ski-arlberg-arrival",
    name: "Ski Arlberg · St Anton arrival guidance",
    type: "bus",
    leg: "to_town",
    operator: "Ski Arlberg",
    phone: null,
    website: "https://www.skiarlberg.at/en/st-anton/getting-here",
    route_summary: "Official Ski Arlberg arrival guidance for St Anton. This is a link-out only; no live timetable or transfer availability is claimed here.",
    regions: ["st-anton"],
    mountains_served: ["st-anton-resort"],
  },
];