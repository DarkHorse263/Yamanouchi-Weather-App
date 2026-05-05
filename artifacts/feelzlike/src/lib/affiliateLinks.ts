// ─────────────────────────────────────────────────────────────────────────────
// affiliateLinks.ts — single source of truth for accommodation deep-links.
//
// WHY THIS EXISTS
// Before this helper, every place that rendered a "Book on X" link
// (StayCard, StayMap popover, future Eat reservation buttons) built its own
// URL inline. When affiliate IDs come through from each programme, we don't
// want to hunt down 6 places — we want to set an env var ONCE and have every
// link in the app pick it up.
//
// SETTING AFFILIATE IDS (when programmes are approved):
//   In Replit Secrets, set any of:
//     VITE_BOOKING_AFFILIATE_ID      e.g. "1234567"      (Booking.com aid)
//     VITE_AGODA_AFFILIATE_ID        e.g. "1234567"      (Agoda cid)
//     VITE_EXPEDIA_AFFILIATE_ID      e.g. "ABC.HOTEL.1"  (Expedia EAN affcid)
//     VITE_HOTELS_AFFILIATE_ID                           (Hotels.com — same scheme as Expedia)
//     VITE_TRIP_AFFILIATE_ID                             (Trip.com allianceid)
//     VITE_AIRBNB_AFFILIATE_ID                           (Airbnb partner code)
//     VITE_JALAN_AFFILIATE_ID                            (JP-only)
//     VITE_RAKUTEN_AFFILIATE_ID                          (JP-only)
//     VITE_TRIPADVISOR_AFFILIATE_ID                      (search URL, no inline injection — kept for parity)
//   Then redeploy. `affiliateStatus()` flips that provider from "pending" to "active".
//
// LINK STRATEGY (HYBRID — curated first, search fallback)
// We have two URL sources for each provider:
//   1) CURATED: a deep link the data team handpicked into `stay.booking_links`
//      (or `stay.website` for `official`). Lands directly on the property page.
//   2) SEARCH:  a query URL built from `name + town`. Lands on the OTA's search
//      results page, which works even when no direct deep link is curated.
//
// Default behaviour: ONLY return providers whose curated URL exists. This keeps
// UI parity with the pre-helper StayCard (Prompt 2.2 behaviour) — a stay
// shows only the booking buttons the data team intended, never a misleading
// "Book on Booking.com" button when the property isn't curated there.
//
// Opt-in `discoverAll: true` adds search URLs for every applicable provider
// in addition to the curated ones — useful for future "discovery mode" surfaces
// (e.g. "find this property elsewhere") but never the default StayCard render.
//
// Either way, affiliate IDs (when set) are injected onto every URL so we earn
// from clicks regardless of source.
// ─────────────────────────────────────────────────────────────────────────────

import type { Stay } from "@/types/stayEat";

// Order also drives default render order in StayCard / StayMap.
export const PROVIDERS = [
  "booking_com",
  "agoda",
  "expedia",
  "hotels_com",
  "trip_com",
  "airbnb",
  "jalan",
  "rakuten",
  "tripadvisor",
  "official",
] as const;
export type Provider = (typeof PROVIDERS)[number];

// Country-coverage matrix. Providers omitted from a country build to `null`,
// which `buildBookingLinks` filters out — so JP-only providers never appear
// on AU stays and vice versa.
const PROVIDER_COUNTRIES: Record<Provider, ReadonlyArray<"AU" | "JP">> = {
  booking_com: ["AU", "JP"],
  agoda: ["AU", "JP"],
  expedia: ["AU", "JP"],
  hotels_com: ["AU", "JP"],
  trip_com: ["AU", "JP"],
  airbnb: ["AU", "JP"],
  jalan: ["JP"],
  rakuten: ["JP"],
  tripadvisor: ["AU", "JP"],
  official: ["AU", "JP"],
};

// Read from import.meta.env defensively (works in Vite dev/build; returns null
// in node test env so tests can run without a dev server).
function readEnv(key: string): string | null {
  try {
    const env = (import.meta as { env?: Record<string, string | undefined> }).env;
    const v = env?.[key];
    return typeof v === "string" && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

/**
 * Affiliate IDs keyed by provider. `null` = not yet configured.
 * Set the corresponding `VITE_*_AFFILIATE_ID` env var to activate.
 * `official` is intentionally always null (no affiliate programme for direct sites).
 */
export const AFFILIATE_IDS: Record<Provider, string | null> = {
  booking_com: readEnv("VITE_BOOKING_AFFILIATE_ID"),
  agoda: readEnv("VITE_AGODA_AFFILIATE_ID"),
  expedia: readEnv("VITE_EXPEDIA_AFFILIATE_ID"),
  hotels_com: readEnv("VITE_HOTELS_AFFILIATE_ID"),
  trip_com: readEnv("VITE_TRIP_AFFILIATE_ID"),
  airbnb: readEnv("VITE_AIRBNB_AFFILIATE_ID"),
  jalan: readEnv("VITE_JALAN_AFFILIATE_ID"),
  rakuten: readEnv("VITE_RAKUTEN_AFFILIATE_ID"),
  tripadvisor: readEnv("VITE_TRIPADVISOR_AFFILIATE_ID"),
  official: null,
};

/** Display name per provider — used by buttons and popovers. */
export const PROVIDER_LABELS: Record<Provider, string> = {
  booking_com: "Booking.com",
  agoda: "Agoda",
  expedia: "Expedia",
  hotels_com: "Hotels.com",
  trip_com: "Trip.com",
  airbnb: "Airbnb",
  jalan: "Jalan",
  rakuten: "Rakuten",
  tripadvisor: "Tripadvisor",
  official: "Official site",
};

/** Short label used on tight surfaces (StayCard chip, mobile popover). */
export const PROVIDER_SHORT_LABELS: Record<Provider, string> = {
  booking_com: "Booking",
  agoda: "Agoda",
  expedia: "Expedia",
  hotels_com: "Hotels",
  trip_com: "Trip",
  airbnb: "Airbnb",
  jalan: "Jalan",
  rakuten: "Rakuten",
  tripadvisor: "Tripadvisor",
  official: "Official",
};

/** Brand colours sourced from each provider's press kit / public branding. */
export const PROVIDER_BRAND_COLOURS: Record<
  Provider,
  { bg: string; fg: string }
> = {
  booking_com: { bg: "#003580", fg: "#ffffff" },
  agoda: { bg: "#5392f9", fg: "#ffffff" },
  expedia: { bg: "#fcc917", fg: "#1a1a1a" },
  hotels_com: { bg: "#d22630", fg: "#ffffff" },
  trip_com: { bg: "#287dfa", fg: "#ffffff" },
  airbnb: { bg: "#FF5A5F", fg: "#ffffff" },
  jalan: { bg: "#ff6600", fg: "#ffffff" },
  rakuten: { bg: "#bf0000", fg: "#ffffff" },
  tripadvisor: { bg: "#00aa6c", fg: "#ffffff" },
  // Official: neutral surface; consumers should add a hairline ring.
  official: { bg: "#ffffff", fg: "#1a1a1a" },
};

// Pretty town labels — keep in sync with the curated town slugs in
// `src/types/stayEat.ts` (TOWN_SLUGS). Falls back to slug-deslugification
// for any future town we haven't explicitly labelled.
const TOWN_LABELS: Record<string, string> = {
  jindabyne: "Jindabyne",
  berridale: "Berridale",
  cooma: "Cooma",
  yudanaka: "Yudanaka",
  shibu_onsen: "Shibu Onsen",
  yomase: "Yomase Onsen",
};

function townLabel(slug: string): string {
  return TOWN_LABELS[slug] ?? slug.replace(/_/g, " ");
}

function buildSearchQuery(stay: Stay, opts: { preferLocal?: boolean } = {}): string {
  const useLocal = opts.preferLocal === true && typeof stay.name_local === "string" && stay.name_local.length > 0;
  const base = useLocal ? (stay.name_local as string) : stay.name;
  return `${base} ${townLabel(stay.town)}`;
}

// Append `key=value` to a URL only when that key isn't already present.
// Curated URLs from the data team may already include affiliate or tracking
// params; we don't want to double-write them.
function appendIfMissing(url: string, key: string, value: string): string {
  const probe = new RegExp(`[?&]${key}=`);
  if (probe.test(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

// Resolve the curated source URL for a provider — i.e. the URL the data team
// handpicked into the stay record, or null if nothing was curated.
//   - `official`     → `stay.website`
//   - `tripadvisor`  → not in schema; always null (curated TA URLs not tracked)
//   - everything else → `stay.booking_links[provider]`
function curatedUrlFor(stay: Stay, provider: Provider): string | null {
  if (provider === "official") {
    return typeof stay.website === "string" && stay.website.length > 0
      ? stay.website
      : null;
  }
  if (provider === "tripadvisor") {
    return null;
  }
  // Schema providers — type-narrowed via the explicit list of keys.
  const links = stay.booking_links;
  // Index access — BookingLinksSchema covers all of these keys.
  const url = (links as Record<string, string | null | undefined>)[provider];
  return typeof url === "string" && url.length > 0 ? url : null;
}

// ── Per-provider URL templates + affiliate-key registry ─────────────────────
// Each entry knows:
//   - searchUrl(stay): how to build a clean search URL for discoverAll mode
//   - affiliateParam:  the URL parameter that carries the affiliate ID
//                       (or null when the provider uses non-URL tracking)

interface ProviderRules {
  searchUrl: (stay: Stay) => string;
  affiliateParam: string | null; // null = no URL-param affiliate scheme
}

const PROVIDER_RULES: Record<Provider, ProviderRules> = {
  booking_com: {
    searchUrl: (stay) =>
      `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(buildSearchQuery(stay))}`,
    affiliateParam: "aid",
  },
  agoda: {
    searchUrl: (stay) =>
      `https://www.agoda.com/search?q=${encodeURIComponent(buildSearchQuery(stay))}`,
    affiliateParam: "cid",
  },
  expedia: {
    searchUrl: (stay) =>
      `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(buildSearchQuery(stay))}`,
    // EAN/Affiliate Hub uses `affcid` on search URLs for cross-property tracking.
    affiliateParam: "affcid",
  },
  hotels_com: {
    searchUrl: (stay) =>
      `https://www.hotels.com/Hotel-Search?destination=${encodeURIComponent(buildSearchQuery(stay))}`,
    affiliateParam: "affcid",
  },
  trip_com: {
    searchUrl: (stay) =>
      `https://www.trip.com/hotels/list?searchKeyword=${encodeURIComponent(buildSearchQuery(stay))}`,
    affiliateParam: "allianceid",
  },
  airbnb: {
    // Airbnb search URL pattern: /s/{query}/homes
    searchUrl: (stay) =>
      `https://www.airbnb.com/s/${encodeURIComponent(buildSearchQuery(stay))}/homes`,
    affiliateParam: "c",
  },
  jalan: {
    // JP catalogue — kanji query lands on the right region.
    searchUrl: (stay) =>
      `https://www.jalan.net/uw/uwp3000/uww3001init.do?keyword=${encodeURIComponent(buildSearchQuery(stay, { preferLocal: true }))}`,
    affiliateParam: "afid",
  },
  rakuten: {
    searchUrl: (stay) =>
      `https://travel.rakuten.co.jp/dsearch/?f_keyword=${encodeURIComponent(buildSearchQuery(stay, { preferLocal: true }))}`,
    affiliateParam: "scid",
  },
  tripadvisor: {
    // Tripadvisor's TAP partner programme uses server-side click tracking, not
    // a URL parameter — so no affiliateParam.
    searchUrl: (stay) =>
      `https://www.tripadvisor.com/Search?q=${encodeURIComponent(buildSearchQuery(stay))}`,
    affiliateParam: null,
  },
  official: {
    // Official sites have no search URL — they only ever come from the curated
    // `stay.website`. `discoverAll` cannot synthesise an official URL.
    searchUrl: () => "",
    affiliateParam: null,
  },
};

function injectAffiliate(provider: Provider, url: string, aid: string | null): string {
  if (!aid) return url;
  const rule = PROVIDER_RULES[provider];
  if (!rule.affiliateParam) return url;
  return appendIfMissing(url, rule.affiliateParam, aid);
}

// ── Public builder ──────────────────────────────────────────────────────────

export interface BuildBookingLinksOptions {
  /**
   * When true, build search URLs for every applicable provider (in addition
   * to curated). Defaults to false: only providers with a curated URL appear,
   * preserving Prompt 2.2 UI parity (a stay shows only the buttons the data
   * team intended).
   */
  discoverAll?: boolean;
  /**
   * Override affiliate IDs (primarily for tests). Unspecified providers fall
   * through to the env-driven `AFFILIATE_IDS`. Pass `null` to clear an id.
   */
  idsOverride?: Partial<Record<Provider, string | null>>;
}

/**
 * Build the booking URLs for a stay.
 *
 * Default mode (no `discoverAll`): returns ONLY providers whose curated URL
 * is present in the stay record (or, for `official`, `stay.website`).
 * Affiliate IDs (when set in env) are injected onto the curated URL.
 *
 * Discovery mode (`discoverAll: true`): also synthesises search URLs for
 * applicable providers without curated links, so every country-supported
 * provider appears in the result.
 *
 * Both modes filter out providers that don't serve the stay's country
 * (jalan/rakuten will never appear on an AU stay, even via `discoverAll`).
 */
export function buildBookingLinks(
  stay: Stay,
  options?: BuildBookingLinksOptions,
): Partial<Record<Provider, string>> {
  const ids = options?.idsOverride
    ? ({ ...AFFILIATE_IDS, ...options.idsOverride } as Record<Provider, string | null>)
    : AFFILIATE_IDS;
  const discoverAll = options?.discoverAll === true;

  const out: Partial<Record<Provider, string>> = {};
  for (const provider of PROVIDERS) {
    if (!PROVIDER_COUNTRIES[provider].includes(stay.country)) continue;

    const curated = curatedUrlFor(stay, provider);
    if (curated !== null) {
      out[provider] = injectAffiliate(provider, curated, ids[provider]);
      continue;
    }
    if (discoverAll) {
      // `official` has no search-URL fallback — skip even in discover mode.
      if (provider === "official") continue;
      const search = PROVIDER_RULES[provider].searchUrl(stay);
      out[provider] = injectAffiliate(provider, search, ids[provider]);
    }
  }
  return out;
}

/** Whether an affiliate ID is currently configured for a provider. */
export function hasAffiliateId(provider: Provider): boolean {
  return AFFILIATE_IDS[provider] !== null;
}

/**
 * Per-provider configuration status. `"active"` means we'll inject an
 * affiliate ID (or, for `official`, that the link works as-is); `"pending"`
 * means the link still works but doesn't earn — we're waiting on programme
 * approval.
 */
export function affiliateStatus(): Record<Provider, "active" | "pending"> {
  const out = {} as Record<Provider, "active" | "pending">;
  for (const id of PROVIDERS) {
    if (id === "official") {
      out[id] = "active"; // direct site — never needs an affiliate ID
    } else {
      out[id] = AFFILIATE_IDS[id] !== null ? "active" : "pending";
    }
  }
  return out;
}
