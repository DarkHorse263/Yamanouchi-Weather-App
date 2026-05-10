import type { TransportProviderList } from "@/types/transport";

/**
 * Victoria's High Country (VIC, Australia) transport providers.
 *
 * Phone numbers and websites left as `null` when not directly verifiable -
 * we never guess. Operators verified May 2026; alpine resort coach
 * services are seasonal (winter only) where noted in route_summary.
 */
export const VICTORIAS_HIGH_COUNTRY_TRANSPORT: TransportProviderList = [
  {
    id: "au-vline-train-coach",
    name: "V/Line Train & Coach",
    type: "train",
    operator: "V/Line (Department of Transport and Planning, Victoria)",
    phone: "1800 800 007",
    website: "https://www.vline.com.au",
    route_summary:
      "Regional rail and connecting coaches across Victoria. Southern Cross to Wangaratta and Seymour by train, with V/Line coaches onward to Bright, Mansfield, Mt Beauty and Omeo.",
    schedule_url: "https://www.vline.com.au/Timetables/Train-coach-timetables",
    regions: ["victorias-high-country"],
  },
  {
    id: "au-mansfield-mt-buller-bus-lines",
    name: "Mansfield-Mt Buller Bus Lines (MMBL)",
    type: "bus",
    operator: "Mansfield-Mt Buller Bus Lines",
    phone: "1800 800 905",
    website: "https://www.mmbl.com.au",
    route_summary:
      "The Mt Buller bus. Daily Melbourne to Mt Buller winter coaches plus year-round Mansfield, Merrijig and Mirimbah shuttles to the village.",
    schedule_url: "https://www.mmbl.com.au/winterservice",
    regions: ["victorias-high-country"],
  },
  {
    id: "au-falls-creek-coach-service",
    name: "Falls Creek Coach Service",
    type: "bus",
    operator: "Falls Creek Coach Service (formerly Pyles)",
    phone: null,
    website: "https://fallscreekcoachservice.com.au",
    route_summary:
      "Falls Creek's local operator. Albury and Mt Beauty connections to Falls Creek village, plus the village in-resort shuttle in winter.",
    schedule_url: "https://fallscreekcoachservice.com.au/public-transport-timetables/",
    regions: ["victorias-high-country"],
  },
  {
    id: "au-snowball-express",
    name: "Snowball Express",
    type: "bus",
    operator: "Alpine Spirit Coaches",
    phone: "(03) 5751 1795",
    website: "https://www.snowballexpress.com.au",
    route_summary:
      "Winter coach service from Melbourne to Mt Hotham and Dinner Plain via Bright and Harrietville. Local operator recommended by the resort.",
    schedule_url: "https://www.snowballexpress.com.au/faqs-mt-hotham-bus.html",
    regions: ["victorias-high-country"],
  },
  {
    id: "au-hotham-bus",
    name: "Hotham Bus",
    type: "bus",
    operator: "Hotham Bus",
    phone: null,
    website: "https://www.hothambus.com",
    route_summary:
      "Direct Melbourne to Mt Hotham winter coach service with pickups along the Hume and the Great Alpine Road.",
    regions: ["victorias-high-country"],
  },
  {
    id: "au-mt-hotham-bus-charter",
    name: "Mt Hotham Bus (Charter)",
    type: "shuttle",
    operator: "Mt Hotham Bus",
    phone: null,
    website: "https://www.mthothambus.com.au",
    route_summary:
      "North East Victoria coach charter and private group transfers to Mt Hotham, Falls Creek and the broader High Country.",
    regions: ["victorias-high-country"],
  },
  {
    id: "au-mansfield-taxis",
    name: "Mansfield Taxis",
    type: "taxi",
    operator: "Mansfield Taxis",
    phone: "0408 579 268",
    website: null,
    route_summary:
      "Local taxi based at 137 High St, Mansfield. Useful for last-mile transfers to accommodation, dinner runs and Mt Buller connections in winter.",
    regions: ["victorias-high-country"],
  },
  {
    id: "au-bright-taxi-service",
    name: "Bright Taxi Service",
    type: "taxi",
    operator: "Bright Taxi Service (Porepunkah)",
    phone: "0423 015 152",
    website: null,
    route_summary:
      "24/7 local taxi covering Bright, Porepunkah and the Ovens Valley. Handy for airport pickups from Wangaratta and last-mile from Bright into the surrounding base towns.",
    regions: ["victorias-high-country"],
  },
  {
    id: "au-mt-beauty-taxi-transfers",
    name: "Mt Beauty Taxi & Transfers",
    type: "taxi",
    operator: "Mt Beauty Taxi & Transfers",
    phone: "0409 573 909",
    website: null,
    route_summary:
      "Mt Beauty-based taxi and pre-booked transfers servicing Falls Creek, Mt Hotham, Bright, Albury/Wodonga and the Kiewa Valley. Snow, hike and bike transfers in season.",
    regions: ["victorias-high-country"],
  },
  {
    id: "au-snow-taxi",
    name: "Snow Taxi",
    type: "taxi",
    operator: "Snow Taxi",
    phone: null,
    website: "https://snowtaxi.au",
    route_summary:
      "Pre-booked alpine taxi for door-to-door transfers between Harrietville, Mt Hotham and Dinner Plain. Tracked vehicles, driver allocation and ride-share option.",
    regions: ["victorias-high-country"],
  },
];
