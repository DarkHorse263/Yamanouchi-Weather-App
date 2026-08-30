import type { TransportProviderList } from "@/types/transport";

/** Jackson Hole operators verified against official sites (Aug 2026). */
export const JACKSON_HOLE_TRANSPORT: TransportProviderList = [
  {
    id: "us-jackson-start-bus",
    name: "START Bus",
    type: "bus",
    leg: "to_mountain",
    operator: "Southern Teton Area Rapid Transit",
    phone: null,
    website: "https://www.jacksonwy.gov/363/START-Bus",
    route_summary:
      "Public buses between Jackson and Teton Village, plus local routes around Jackson. Check the current schedule and fare before travelling.",
    schedule_url: "https://www.jacksonwy.gov/404/Schedules",
    featured: true,
    regions: ["jackson-hole"],
  },
  {
    id: "us-jackson-airport-shuttle",
    name: "Jackson Hole Airport Shuttle",
    type: "shuttle",
    leg: "to_town",
    operator: "Jackson Hole Airport / START Bus",
    phone: null,
    website: "https://www.jacksonholeairport.com/transit-app/",
    route_summary:
      "Seasonal winter coach between Jackson Hole Airport and Miller Park in Jackson, with connections to other START Bus routes. Check operating dates before relying on it.",
    schedule_url: "https://www.jacksonholeairport.com/transit-app/",
    regions: ["jackson-hole"],
  },
];
