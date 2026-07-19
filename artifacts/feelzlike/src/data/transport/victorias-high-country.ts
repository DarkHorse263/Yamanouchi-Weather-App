import type { TransportProviderList } from "@/types/transport";

/**
 * Victoria's High Country (VIC, Australia) transport providers.
 *
 * Phone numbers and websites left as `null` when not directly verifiable -
 * we never guess. Operators verified May 2026.
 *
 * Tagging contract used by the custom VHC Transport page:
 * - `seasonality`: "winter_only" hides the card in AU green season.
 * - `mountains_served`: enables per-town filtering (Mansfield gets only
 *   Buller/Stirling ops; Bright gets Falls/Hotham; etc.). Omit for the
 *   regional rail spine (V/Line) which is treated as universal.
 */
export const VICTORIAS_HIGH_COUNTRY_TRANSPORT: TransportProviderList = [
  {
    id: "au-vline-train-coach",
    name: "V/Line Train & Coach",
    type: "train",
    leg: "to_town",
    operator: "V/Line (Department of Transport and Planning, Victoria)",
    phone: "1800 800 007",
    website: "https://www.vline.com.au",
    route_summary:
      "Regional rail and connecting coaches across Victoria. Trains to Wangaratta and Seymour with V/Line coaches onward to Bright, Mt Beauty, Mansfield, Omeo and Dinner Plain. Lilydale buses serve Marysville and Warburton in the Yarra Ranges.",
    schedule_url: "https://www.vline.com.au/Timetables/Train-coach-timetables",
    regions: ["victorias-high-country"],
    seasonality: "year_round",
    // mountains_served omitted on purpose - V/Line is the universal spine.
  },
  {
    id: "au-mansfield-mt-buller-bus-lines",
    name: "Mansfield-Mt Buller Bus Lines (MMBL)",
    type: "bus",
    leg: "to_mountain",
    operator: "Mansfield-Mt Buller Bus Lines",
    phone: "1800 800 905",
    website: "https://www.mmbl.com.au",
    route_summary:
      "The Mt Buller bus. Daily Melbourne to Mt Buller winter coaches plus year-round Mansfield, Merrijig and Mirimbah shuttles to the village. Operates the in-resort village shuttle through the season.",
    schedule_url: "https://www.mmbl.com.au/winterservice",
    regions: ["victorias-high-country"],
    seasonality: "year_round",
    mountains_served: ["mt-buller", "mt-stirling"],
  },
  {
    id: "au-falls-creek-coach-service",
    name: "Falls Creek Coach Service",
    type: "bus",
    leg: "to_mountain",
    operator: "Falls Creek Coach Service (formerly Pyles)",
    phone: null,
    website: "https://fallscreekcoachservice.com.au",
    route_summary:
      "Falls Creek's local operator. Albury and Mt Beauty connections to Falls Creek village, plus the in-resort village shuttle in winter. Also runs the Mt Beauty to Bogong Village summer service.",
    schedule_url: "https://fallscreekcoachservice.com.au/public-transport-timetables/",
    regions: ["victorias-high-country"],
    seasonality: "year_round",
    mountains_served: ["falls-creek"],
  },
  {
    id: "au-snow-bus-australia",
    name: "Snow Bus Australia",
    type: "bus",
    leg: "to_town",
    operator: "Snow Bus Australia",
    phone: "1300 781 221",
    website: "https://www.snowbusaustralia.com.au",
    route_summary:
      "The Melbourne ski-coach. Daily winter services from Melbourne CBD and Tullamarine to Mt Buller, Mt Hotham, Falls Creek and Dinner Plain · the all-resort coach off-mountain visitors actually book.",
    schedule_url: "https://www.snowbusaustralia.com.au",
    regions: ["victorias-high-country"],
    seasonality: "winter_only",
    mountains_served: ["mt-buller", "falls-creek", "mt-hotham"],
  },
  {
    id: "au-snowball-express",
    name: "Snowball Express",
    type: "bus",
    leg: "to_town",
    operator: "Alpine Spirit Coaches",
    phone: "(03) 5751 1795",
    website: "https://www.snowballexpress.com.au",
    route_summary:
      "Winter coach from Melbourne to Mt Hotham and Dinner Plain via Bright and Harrietville. The named Hotham coach for off-mountain visitors without a 4WD.",
    schedule_url: "https://www.snowballexpress.com.au/faqs-mt-hotham-bus.html",
    regions: ["victorias-high-country"],
    seasonality: "winter_only",
    mountains_served: ["mt-hotham"],
  },
  {
    id: "au-hotham-bus",
    name: "Hotham Bus",
    type: "bus",
    leg: "to_town",
    operator: "Hotham Bus",
    phone: null,
    website: "https://www.hothambus.com.au",
    route_summary:
      "Direct Melbourne to Mt Hotham winter coach with pickups along the Hume Freeway and the Great Alpine Road.",
    regions: ["victorias-high-country"],
    seasonality: "winter_only",
    mountains_served: ["mt-hotham"],
  },
  {
    id: "au-mt-hotham-bus-charter",
    name: "Mt Hotham Bus (Charter)",
    type: "shuttle",
    leg: "to_mountain",
    operator: "Mt Hotham Bus",
    phone: null,
    website: "https://www.hothambus.com.au",
    route_summary:
      "North East Victoria coach charter and private group transfers to Mt Hotham, Falls Creek and the broader High Country.",
    regions: ["victorias-high-country"],
    seasonality: "year_round",
    mountains_served: ["mt-hotham", "falls-creek"],
  },
  {
    id: "au-mansfield-taxis",
    name: "Mansfield Taxis",
    type: "taxi",
    leg: "around_town",
    operator: "Mansfield Taxis",
    phone: "0408 579 268",
    website: null,
    route_summary:
      "Local taxi based at 137 High St, Mansfield. Useful for last-mile transfers to accommodation, dinner runs and Mt Buller connections in winter.",
    regions: ["victorias-high-country"],
    seasonality: "year_round",
    mountains_served: ["mt-buller", "mt-stirling"],
  },
  {
    id: "au-bright-taxi-service",
    name: "Bright Taxi Service",
    type: "taxi",
    leg: "around_town",
    operator: "Bright Taxi Service (Porepunkah)",
    phone: "0423 015 152",
    website: null,
    route_summary:
      "24/7 local taxi covering Bright, Porepunkah and the Ovens Valley. Handy for airport pickups from Wangaratta and last-mile from Bright into the surrounding base towns.",
    regions: ["victorias-high-country"],
    seasonality: "year_round",
    mountains_served: ["falls-creek", "mt-hotham"],
  },
  {
    id: "au-mt-beauty-taxi-transfers",
    name: "Mt Beauty Taxi & Transfers",
    type: "taxi",
    leg: "around_town",
    operator: "Mt Beauty Taxi & Transfers",
    phone: "0409 573 909",
    website: null,
    route_summary:
      "Mt Beauty-based taxi and pre-booked transfers servicing Falls Creek, Mt Hotham, Bright, Albury/Wodonga and the Kiewa Valley. Snow, hike and bike transfers in season.",
    regions: ["victorias-high-country"],
    seasonality: "year_round",
    mountains_served: ["falls-creek", "mt-hotham"],
  },
  {
    id: "au-snow-taxi",
    name: "Snow Taxi",
    type: "taxi",
    leg: "around_town",
    operator: "Snow Taxi",
    phone: null,
    website: "https://snowtaxi.au",
    route_summary:
      "Pre-booked alpine taxi for door-to-door transfers between Harrietville, Mt Hotham and Dinner Plain. Tracked vehicles, driver allocation and ride-share option.",
    regions: ["victorias-high-country"],
    seasonality: "winter_only",
    mountains_served: ["mt-hotham"],
  },
];
