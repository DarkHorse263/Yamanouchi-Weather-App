import type { TransportProviderList } from "@/types/transport";

/**
 * Okanagan (BC Interior, Canada) transport providers.
 *
 * Verified Sun Peaks shuttle operators only · each is listed by Sun Peaks
 * Resort and publishes its own durable service page. Timetables and availability
 * can change, so summaries describe verified connections without promising
 * specific departure times.
 */
export const OKANAGAN_TRANSPORT: TransportProviderList = [
  {
    id: "ca-peak-shuttles-sun-peaks",
    name: "Peak Shuttles",
    type: "shuttle",
    leg: "to_mountain",
    operator: "Peak Shuttles Ltd.",
    phone: null,
    website: "https://www.peakshuttles.com/ykaairporttransfer",
    route_summary:
      "Pre-booked shared or private transfers between Sun Peaks Resort and Kamloops Airport (YKA), Kamloops hotels, and the city's bus and train terminals.",
    schedule_url: "https://www.peakshuttles.com/ykaairporttransfer",
    regions: ["okanagan"],
    mountains_served: ["sun-peaks-resort"],
  },
  {
    id: "ca-tastefull-excursions-sun-peaks",
    name: "TasteFull Excursions",
    type: "shuttle",
    leg: "to_mountain",
    operator: "TasteFull Excursions",
    phone: null,
    website:
      "https://www.tastefullexcursions.ca/shuttles/kamloops-airport-shuttle",
    route_summary:
      "Pre-booked shuttle service between Kamloops Airport (YKA) and Sun Peaks Resort in both directions, with private charter options also available.",
    schedule_url:
      "https://www.tastefullexcursions.ca/shuttles/kamloops-airport-shuttle",
    regions: ["okanagan"],
    mountains_served: ["sun-peaks-resort"],
  },
  {
    id: "ca-sun-star-shuttle-sun-peaks",
    name: "Sun Star Shuttle",
    type: "shuttle",
    leg: "to_mountain",
    operator: "Sun Star Shuttle",
    phone: "250-554-8005",
    website: "https://www.sunstarshuttle.com/services/shuttle-services",
    route_summary:
      "Pre-booked transfers between Sun Peaks Resort and Kamloops Airport (YKA), plus Kelowna Airport (YLW) and private inter-resort connections.",
    schedule_url: "https://www.sunstarshuttle.com/services/shuttle-services",
    regions: ["okanagan"],
    mountains_served: ["sun-peaks-resort"],
  },
];
