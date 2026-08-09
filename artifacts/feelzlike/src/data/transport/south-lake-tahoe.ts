import type { TransportProviderList } from "@/types/transport";

/**
 * South Lake Tahoe (California, USA) transport providers.
 *
 * All operators verified against their official sites (Aug 2026). Phone
 * numbers left `null` when not directly verifiable - we never guess.
 */
export const SOUTH_LAKE_TAHOE_TRANSPORT: TransportProviderList = [
  {
    id: "us-lake-link",
    name: "Lake Link",
    type: "shuttle",
    leg: "around_town",
    operator: "South Shore Transportation Management Association",
    phone: null,
    website: "https://ss-tma.org/lake-link/",
    route_summary:
      "Free on-demand microtransit vans around South Lake Tahoe and Stateline - book a ride in the app for the casino corridor, Heavenly Village and nearby lodging.",
    schedule_url: "https://city.ridewithvia.com/south-tahoe",
    featured: true,
    regions: ["south-lake-tahoe"],
  },
  {
    id: "us-south-tahoe-airporter",
    name: "South Tahoe Airporter",
    type: "bus",
    leg: "to_town",
    operator: "South Tahoe Airporter",
    phone: null,
    website: "https://southtahoeairporter.com/",
    route_summary:
      "Scheduled coach between Reno-Tahoe Airport and the Stateline casino hotels on the south shore - the simplest car-free way in from the airport. Pre-booked.",
    schedule_url: "https://southtahoeairporter.com/",
    regions: ["south-lake-tahoe"],
  },
];
