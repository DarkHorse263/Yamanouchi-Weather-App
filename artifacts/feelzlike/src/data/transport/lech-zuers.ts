import type { TransportProviderList } from "@/types/transport";

/** Official Lech Zürs arrival links. Timetables and journey times are not asserted. */
export const LECH_ZUERS_TRANSPORT: TransportProviderList = [
  {
    id: "at-vorarlberg-750-langen-lech",
    name: "Regional bus 750 · Langen am Arlberg to Lech",
    type: "bus",
    leg: "to_town",
    operator: "Vorarlberg public transport",
    phone: null,
    website: "https://www.skiarlberg.at/en/lech-zuers/getting-here-parking",
    route_summary: "Official Lech Zürs arrival guidance identifies regional bus 750 from Langen am Arlberg via Stuben and Zürs to Lech. Check the current operator timetable before travel.",
    regions: ["lech-zuers"],
    mountains_served: ["lech-zuers-resort"],
  },
  {
    id: "at-vorarlberg-760-st-anton-lech",
    name: "Regional bus 760 · St Anton am Arlberg to Lech",
    type: "bus",
    leg: "to_town",
    operator: "Vorarlberg public transport",
    phone: null,
    website: "https://www.skiarlberg.at/en/lech-zuers/getting-here-parking",
    route_summary: "Official Lech Zürs arrival guidance identifies regional bus 760 from St Anton am Arlberg via St Christoph and Zürs to Lech. Check the current operator timetable before travel.",
    regions: ["lech-zuers"],
    mountains_served: ["lech-zuers-resort"],
  },
];