import type { TransportProviderList } from "@/types/transport";

/**
 * Queenstown (Otago, NZ) transport providers.
 *
 * Verified operators only · phone/website/schedule_url are null when not
 * directly verifiable, never guessed. Both ski fields are run by NZSki,
 * which operates a dedicated ski bus to each from central Queenstown.
 */
export const QUEENSTOWN_TRANSPORT: TransportProviderList = [
  {
    id: "nz-coronet-peak-ski-bus",
    name: "Coronet Peak Ski Bus",
    type: "bus",
    leg: "to_mountain",
    operator: "NZSki",
    phone: "0800 697 547",
    website: "https://www.coronetpeak.co.nz/getting-here/",
    route_summary:
      "Daily ski-season bus from central Queenstown (departs near the Snow Centre, 9 Duke St) up to Coronet Peak. Book online; the fare can be added to a lift pass.",
    schedule_url: "https://shop.coronetpeak.co.nz/shop/product/67/ski-bus",
    regions: ["queenstown"],
    seasonality: "winter_only",
    mountains_served: ["coronet-peak"],
  },
  {
    id: "nz-remarkables-ski-bus",
    name: "The Remarkables Ski Bus",
    type: "bus",
    leg: "to_mountain",
    operator: "NZSki",
    phone: "0800 697 547",
    website: "https://www.theremarkables.co.nz/getting-here/",
    route_summary:
      "Daily ski-season bus from central Queenstown to The Remarkables, avoiding the steep unsealed access road. Book online; the fare can be added to a lift pass.",
    schedule_url: "https://shop.theremarkables.co.nz/shop/product/67/ski-bus",
    regions: ["queenstown"],
    seasonality: "winter_only",
    mountains_served: ["the-remarkables"],
  },
];
