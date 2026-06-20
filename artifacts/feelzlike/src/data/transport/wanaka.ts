import type { TransportProviderList } from "@/types/transport";

/**
 * Wanaka (Otago, NZ) transport providers.
 *
 * Verified operators only · phone/website/schedule_url are null when not
 * directly verifiable, never guessed. Cardrona and Treble Cone are both run
 * by RealNZ, which operates a pre-bookable mountain shuttle to each.
 */
export const WANAKA_TRANSPORT: TransportProviderList = [
  {
    id: "nz-realnz-cardrona-treblecone-shuttle",
    name: "Cardrona & Treble Cone Mountain Shuttle",
    type: "shuttle",
    operator: "RealNZ",
    phone: null,
    website: "https://www.cardrona-treblecone.com/mountains/transport",
    route_summary:
      "Pre-bookable ski-season shuttle from Wanaka (and Queenstown) to Cardrona and Treble Cone. Pre-booking is essential · seats sell out on powder days.",
    schedule_url: "https://www.cardrona-treblecone.com/mountains/transport",
    regions: ["wanaka"],
    seasonality: "winter_only",
    mountains_served: ["cardrona", "treble-cone"],
  },
];
