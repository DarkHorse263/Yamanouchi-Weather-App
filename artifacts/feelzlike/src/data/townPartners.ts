/**
 * Town-page featured partners · PAID placements on the town home page.
 *
 * Honesty rules (same as transport `partner` flag):
 *  - An entry here means a SIGNED listing deal is active. Nobody appears
 *    without one · this record stays empty until a deal signs.
 *  - The card is always labelled "Featured partner" and its outbound link
 *    carries rel="sponsored". It promotes the partner's own services and
 *    never influences weather, snow or road content.
 *  - Keyed by town id (the kebab-case URL id, e.g. "madarao-kogen").
 *    One partner per town · prominence is sold, the market is not.
 *
 * Example entry (do NOT enable without a signed agreement):
 *
 *   "madarao-kogen": {
 *     name: "Snowball Japan Properties",
 *     kicker: "Stay partner",
 *     kickerJa: "宿泊パートナー",
 *     tagline: "Chalets and lodges at Madarao & Tangram · book direct.",
 *     taglineJa: "斑尾・タングラムのシャレー＆ロッジ · 直接予約",
 *     url: "https://example.com",
 *     cta: "Browse stays",
 *     ctaJa: "宿を見る",
 *   },
 */
export type TownPartner = {
  /** Partner's trading name, shown as the card title. */
  name: string;
  nameJa?: string;
  /** Short category kicker, e.g. "Stay partner" / "Transport partner". */
  kicker: string;
  kickerJa?: string;
  /** One honest line about what they offer. */
  tagline: string;
  taglineJa?: string;
  /** Partner's own site · link carries rel="sponsored". */
  url: string;
  /** Link label, e.g. "Browse stays" / "Book a seat". */
  cta: string;
  ctaJa?: string;
};

export const TOWN_PARTNERS: Record<string, TownPartner> = {
  // Empty · entries are added one line at a time as listing deals sign.
};
