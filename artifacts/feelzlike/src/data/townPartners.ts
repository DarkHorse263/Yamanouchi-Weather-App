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
  /**
   * How the placement renders on the town home page:
   *  - "listing" (default) · quiet card between the weather panel and
   *    the section tiles.
   *  - "ad" · branded banner directly under the town header that
   *    rotates through `messages`. Same disclosure rules apply.
   */
  display?: "listing" | "ad";
  /** Extra rotating lines for the "ad" banner (tagline is always first). */
  messages?: string[];
  messagesJa?: string[];
  /**
   * Optional partner branding for the "ad" banner so it reads like the
   * partner's own ad. Without it the banner uses the house blue style.
   * Colours are plain CSS values from the partner's brand. Logos should
   * be owner-hosted assets once a deal signs (hotlinks rot).
   */
  brand?: {
    /** Partner logo (transparent PNG best) · rendered in a white chip. */
    logo?: string;
    logoAlt?: string;
    /** Banner background gradient, left → right. */
    bgFrom: string;
    bgTo: string;
    /** "dark" background = light text · "light" background = dark text. */
    theme: "dark" | "light";
    /** CTA pill colours. */
    ctaBg: string;
    ctaText: string;
    ctaBorder?: string;
  };
};

export const TOWN_PARTNERS: Record<string, TownPartner> = {
  // Empty · entries are added one line at a time as listing deals sign.
};
