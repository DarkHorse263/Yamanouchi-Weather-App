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
import snowballLogo from "@assets/SnowballJapan_280726_1785212054795.jpeg";

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

/**
 * Snoexpress · coach transfers + snow packages, Snowy Mountains (AU).
 * Owner-approved preferred supplier · red brand treatment (no usable
 * transparent logo yet — their wordmark only exists white-on-red; swap
 * in `brand.logo` if they supply one).
 */
const SNOEXPRESS: TownPartner = {
  name: "Snoexpress",
  kicker: "Transport partner",
  tagline: "your link to the snowfields · weekend snow packages + coach transfers",
  url: "https://snoexpress.com.au",
  cta: "book a seat",
  display: "ad",
  messages: [
    "coaches from Newcastle, Sydney + Canberra to Jindabyne, Perisher + Thredbo",
    "private transfers + trip planning available",
  ],
  brand: {
    bgFrom: "#c6262e",
    bgTo: "#8f1a20",
    theme: "dark",
    ctaBg: "#ffffff",
    ctaText: "#c6262e",
  },
};

/** Snowball Japan · chalets + lodges at Madarao, Tangram and Sano (Nagano). */
const SNOWBALL_JAPAN: TownPartner = {
  name: "Snowball Japan",
  nameJa: "スノーボール日本",
  kicker: "Stay partner",
  kickerJa: "宿泊パートナー",
  tagline: "chalets + lodges at Madarao, Tangram and Sano · book direct",
  taglineJa: "斑尾・タングラム・佐野のシャレー＆ロッジ · 直接予約",
  url: "https://www.snowballjapan.com",
  cta: "browse stays",
  ctaJa: "宿を見る",
  display: "ad",
  messages: [
    "private self-catered lodges in the heart of the Japanese Alps",
    "minutes from the lifts · near the famous snow monkeys",
  ],
  messagesJa: [
    "日本アルプスの中心にあるプライベート貸切ロッジ",
    "リフトまで数分 · 有名な地獄谷野猿公苑の近く",
  ],
  brand: {
    logo: snowballLogo,
    logoAlt: "Snowball Japan",
    bgFrom: "#ffffff",
    bgTo: "#e2e8f0",
    theme: "light",
    ctaBg: "#0f172a",
    ctaText: "#ffffff",
  },
};

export const TOWN_PARTNERS: Record<string, TownPartner> = {
  // Snoexpress · Snowy Mountains base towns.
  jindabyne: SNOEXPRESS,
  berridale: SNOEXPRESS,
  cooma: SNOEXPRESS,
  // Snowball Japan · Madarao/Tangram base town.
  "madarao-kogen": SNOWBALL_JAPAN,
};

/**
 * Region-page featured partners · same product sold one level up.
 * Keyed by region id (e.g. "iiyama", "snowy-mountains") and rendered
 * directly under the region header on the base-town picker page.
 * Identical honesty rules: empty until a deal signs, one partner per
 * region, disclosure label always visible, link rel="sponsored".
 */
export const REGION_PARTNERS: Record<string, TownPartner> = {
  "snowy-mountains": SNOEXPRESS,
  iiyama: SNOWBALL_JAPAN,
  yamanouchi: SNOWBALL_JAPAN,
};

/**
 * Tag a partner's outbound URL with standard UTM parameters so the
 * partner's own analytics shows feelzlike as the traffic source · this
 * is the owner's proof-of-value when a deal comes up for renewal.
 *
 *   utm_source   = feelzlike
 *   utm_medium   = featured-partner
 *   utm_campaign = <place id>-<placement>  e.g. "jindabyne-ad" · the
 *                  place id is the town id or, for region-page deals,
 *                  the region id.
 *
 * Existing query params on the partner URL are preserved; their own
 * utm_* values (if any) are overwritten so the click is always
 * attributed to this placement. Returns the URL untouched if it fails
 * to parse · a broken tracker must never break the link.
 */
export function withPartnerUtm(
  url: string,
  placeId: string,
  placement: "listing" | "ad",
): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "feelzlike");
    u.searchParams.set("utm_medium", "featured-partner");
    u.searchParams.set("utm_campaign", `${placeId}-${placement}`);
    return u.toString();
  } catch {
    return url;
  }
}
