import { useQuery } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";

export interface NearbyPlace {
  id: string;
  name: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: number;
  primaryType?: string;
  address?: string;
  lat?: number;
  lng?: number;
  photoUrl?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  openNow?: boolean;
}

export type PlaceKind = "stay" | "eat" | "explore";

interface NearbyArgs {
  lat: number;
  lng: number;
  radius?: number;
  kind: PlaceKind;
  max?: number;
}

const API = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/../api`.replace(/\/+$/, "");

function apiUrl(path: string): string {
  // BASE_URL is "/snowy-mountains/" or similar; api is hosted at "/api/" by the api-server
  // Use absolute path so the request hits the proxy at /api/* regardless of base
  return `/api${path}`;
}

function distMeters(a: { lat: number; lng: number }, b: { lat?: number; lng?: number }): number {
  if (b.lat === undefined || b.lng === undefined) return Number.POSITIVE_INFINITY;
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function fetchNearby(args: NearbyArgs): Promise<NearbyPlace[]> {
  const params = new URLSearchParams({
    lat: String(args.lat),
    lng: String(args.lng),
    radius: String(args.radius ?? 5000),
    kind: args.kind,
    max: String(args.max ?? 20),
  });
  const url = apiUrl(`/places/nearby?${params.toString()}`);
  let res: Response;
  try {
    res = await fetch(url);
  } catch (networkErr) {
    // Network-level failure (offline, DNS, CORS pre-flight blocked, etc.)
    Sentry.addBreadcrumb({
      category: "places",
      level: "error",
      message: "places.fetch.network_error",
      data: { kind: args.kind, lat: args.lat, lng: args.lng },
    });
    Sentry.captureException(networkErr, {
      tags: { feature: "places", kind: args.kind, source: "fetchNearby" },
    });
    throw networkErr;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Places fetch failed (${res.status}): ${body.slice(0, 200)}`);
    Sentry.addBreadcrumb({
      category: "places",
      level: "error",
      message: "places.fetch.http_error",
      data: { kind: args.kind, status: res.status, body: body.slice(0, 200) },
    });
    Sentry.captureException(err, {
      tags: { feature: "places", kind: args.kind, status: String(res.status), source: "fetchNearby" },
    });
    throw err;
  }
  const data = (await res.json()) as { places: NearbyPlace[] };
  const places = data.places ?? [];

  // Re-rank AND hard-cap by requested radius. Google's Places API often returns
  // results well outside the requested radius (especially for thinly-populated
  // areas), which causes adjacent towns like Yudanaka ↔ Shibu Onsen (~600m apart)
  // to surface near-identical lists. We drop anything beyond `radius * 1.05`
  // (5% slack for geocoding noise) and then sort closest-first.
  const centre = { lat: args.lat, lng: args.lng };
  const cap = (args.radius ?? 5000) * 1.05;
  return places
    .map((p, i) => ({ p, d: distMeters(centre, p), i }))
    .filter((x) => x.d <= cap)
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map((x) => x.p);
}

export function useNearbyPlaces(args: NearbyArgs | null) {
  return useQuery({
    queryKey: args
      ? ["places-nearby", args.kind, args.lat, args.lng, args.radius ?? 5000, args.max ?? 20]
      : ["places-nearby", "disabled"],
    queryFn: () => fetchNearby(args!),
    enabled: args !== null,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

/** Build a Booking.com deep-link for a hotel by name + town coordinates. */
export function bookingDeepLink(opts: {
  query: string;
  lat?: number;
  lng?: number;
  affiliateId?: string;
}): string {
  const params = new URLSearchParams({ ss: opts.query });
  if (opts.lat !== undefined) params.set("latitude", String(opts.lat));
  if (opts.lng !== undefined) params.set("longitude", String(opts.lng));
  if (opts.affiliateId) params.set("aid", opts.affiliateId);
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

// ============================================================
// Multi-platform stay search - Booking.com + Airbnb + Agoda +
// Trip.com + Hotels.com + Expedia, plus JP-only Rakuten & Jalan
// ============================================================

export type StayPlatformId =
  | "booking"
  | "airbnb"
  | "agoda"
  | "trip"
  | "hotels"
  | "expedia"
  | "rakuten"
  | "jalan"
  | "trivago";

export interface StayPlatform {
  id: StayPlatformId;
  label: string;
  short: string;
  brandColor: string;
  brandText: string;
}

export const STAY_PLATFORMS: Record<StayPlatformId, StayPlatform> = {
  booking: { id: "booking", label: "Booking.com",     short: "Booking",  brandColor: "#003580", brandText: "#ffffff" },
  airbnb:  { id: "airbnb",  label: "Airbnb",          short: "Airbnb",   brandColor: "#FF385C", brandText: "#ffffff" },
  agoda:   { id: "agoda",   label: "Agoda",           short: "Agoda",    brandColor: "#5392F9", brandText: "#ffffff" },
  trip:    { id: "trip",    label: "Trip.com",        short: "Trip.com", brandColor: "#287DFA", brandText: "#ffffff" },
  hotels:  { id: "hotels",  label: "Hotels.com",      short: "Hotels",   brandColor: "#D32F2F", brandText: "#ffffff" },
  expedia: { id: "expedia", label: "Expedia",         short: "Expedia",  brandColor: "#FFC72C", brandText: "#1f1f1f" },
  rakuten: { id: "rakuten", label: "Rakuten Travel",  short: "Rakuten",  brandColor: "#BF0000", brandText: "#ffffff" },
  jalan:   { id: "jalan",   label: "Jalan",           short: "Jalan",    brandColor: "#FF6E00", brandText: "#ffffff" },
  trivago: { id: "trivago", label: "trivago",         short: "trivago",  brandColor: "#007CC3", brandText: "#ffffff" },
};

/** Region tag - accepts country/region codes. "JP" adds Rakuten + Jalan + trivago; everything else is western only. */
export type CountryCode = string;

// Country-tag helpers. `country` at the call sites is `region.shortTag`, and
// AU regions carry STATE tags (NSW / VIC / TAS, never "AU") while Canadian
// regions carry PROVINCE tags (AB / BC / QC, never "CA" - "CA" is California).
// Same trap as the Expedia domain switch below: match the real tags.
const AU_TAGS = ["AU", "AUS", "Australia", "NSW", "VIC", "TAS", "ACT"];
const NZ_TAGS = ["NZ", "NZL", "New Zealand"];
const CANADA_TAGS = ["AB", "BC", "QC"];
// US region shortTags are STATE codes (like AU's NSW/VIC/TAS). This is every
// state code currently used by a region file - keep it in sync when a region
// in a NEW state is added, or that state's stay pages silently miss the
// trivago button even after its TRIVAGO_DESTINATIONS entry exists.
const US_TAGS = [
  "US", "USA",
  "AK", "AZ", "CA", "CO", "CT", "ID", "MA", "ME", "MI", "MN", "MT", "NC",
  "NH", "NJ", "NM", "NV", "NY", "OR", "PA", "SD", "UT", "VA", "VT", "WA",
  "WI", "WV", "WY",
];
function isAu(country?: string): boolean { return AU_TAGS.includes(country ?? ""); }
function isNz(country?: string): boolean { return NZ_TAGS.includes(country ?? ""); }
function isCanada(country?: string): boolean { return CANADA_TAGS.includes(country ?? ""); }
function isUs(country?: string): boolean { return US_TAGS.includes(country ?? ""); }

/** Returns the ordered list of platforms to surface for a given country/region tag. */
export function platformsForCountry(country: CountryCode): StayPlatform[] {
  const base: StayPlatformId[] = ["booking", "airbnb", "agoda", "trip", "hotels", "expedia"];
  const isJapan = country === "JP" || country === "JPN" || country === "Japan";
  if (isJapan) {
    return [...base, "rakuten" as StayPlatformId, "jalan" as StayPlatformId, "trivago" as StayPlatformId]
      .map((id) => STAY_PLATFORMS[id]);
  }
  // AU / NZ / Canada / USA also get trivago (Awin programmes approved Aug 2026;
  // Trivago USA approved 12 Aug 2026). The button only renders for regions with
  // a verified TRIVAGO_DESTINATIONS entry - callers drop platforms whose deep
  // link resolves to "".
  if (isAu(country) || isNz(country) || isCanada(country) || isUs(country)) {
    return [...base, "trivago" as StayPlatformId].map((id) => STAY_PLATFORMS[id]);
  }
  return base.map((id) => STAY_PLATFORMS[id]);
}

// trivago is a metasearch (price-comparison) site, not an OTA with a free-text
// search deep link - its result pages are keyed by an internal area id
// ("locid"), so we can't build a trivago link from the query string the way we
// do for the OTAs. Instead we map each region to its verified trivago area page.
// A region with no entry here resolves to "" in platformDeepLink, and callers
// skip the button (no dead link).
//
// TWO NETWORKS, ONE PER DOMAIN (never both for the same merchant):
//   - JP (trivago.jp): earns via CJ - the stay pages wrap the plain URL in
//     cjLinkFor("trivago", ...) (lib/cj.ts, Evergreen deep link, trivago JP
//     programme). cj.ts only wraps trivago.jp destinations.
//   - AU / NZ / Canada / USA: earn via the Awin trivago AU / NZ / Canada / USA
//     programmes (AU/NZ/CA approved 4-6 Aug 2026, USA approved 12 Aug 2026)
//     through Convert-a-Link, which auto-rewrites PLAIN links on the EXACT
//     approved country domain. So these entries MUST stay plain
//     trivago.com.au / trivago.co.nz / trivago.ca / trivago.com URLs - do NOT
//     CJ-wrap them and do NOT move them to another domain.
//     (trivago moved its programme from CJ to Awin in Aug 2026 - the Awin
//     welcome emails warn that links left on old-network tracking earn
//     nothing, which is why only lib/cj.ts's trivago.jp allowlist stays CJ.)
//
//   yamanouchi = Yamanouchi-machi (Nagano), trivago locid 200-70117. Covers
//   Yudanaka, Shibu Onsen and the Yomase/Shiga Kogen onsen-ski towns. Verified
//   June 2026 to resolve to the real stays (Yorozuya, Koishiya, Shiga Kogen
//   Prince Hotel, ...). Add a region's verified locid here before its stay pages
//   can show a trivago button.
//
//   The AU/NZ/CA entries below are each region's main accommodation hub town
//   (the area page also lists surrounding villages). Every URL curl-verified
//   Aug 2026 to resolve to that destination's real stays page on the exact
//   country domain (invalid locids bounce to the trivago homepage).
const TRIVAGO_DESTINATIONS: Record<string, string> = {
  // JP (CJ)
  yamanouchi: "https://www.trivago.jp/en-US/odr/hotels-yamanouchi-japan?search=200-70117",
  // AU (Awin · trivago.com.au)
  "snowy-mountains": "https://www.trivago.com.au/en-AU/odr/hotels-jindabyne-australia?search=200-54582",
  "victorias-high-country": "https://www.trivago.com.au/en-AU/odr/hotels-bright-australia?search=200-54960",
  tasmania: "https://www.trivago.com.au/en-AU/odr/hotels-launceston-australia?search=200-54902",
  // NZ (Awin · trivago.co.nz)
  queenstown: "https://www.trivago.co.nz/en-NZ/odr/hotels-queenstown-new-zealand?search=200-61352",
  wanaka: "https://www.trivago.co.nz/en-NZ/odr/hotels-wanaka-new-zealand?search=200-61370",
  ruapehu: "https://www.trivago.co.nz/en-NZ/odr/hotels-ohakune-new-zealand?search=200-61279",
  "mt-hutt": "https://www.trivago.co.nz/en-NZ/odr/hotels-methven-new-zealand?search=200-61392",
  // Canada (Awin · trivago.ca)
  whistler: "https://www.trivago.ca/en-CA/odr/hotels-whistler-canada?search=200-34612",
  vancouver: "https://www.trivago.ca/en-CA/odr/hotels-vancouver-canada?search=200-34603",
  okanagan: "https://www.trivago.ca/en-CA/odr/hotels-kelowna-canada?search=200-34620",
  "powder-highway": "https://www.trivago.ca/en-CA/odr/hotels-revelstoke-canada?search=200-34661",
  "banff-lake-louise": "https://www.trivago.ca/en-CA/odr/hotels-banff-canada?search=200-34508",
  canmore: "https://www.trivago.ca/en-CA/odr/hotels-canmore-canada?search=200-34584",
  jasper: "https://www.trivago.ca/en-CA/odr/hotels-jasper-canada?search=200-34557",
  "quebec-laurentians": "https://www.trivago.ca/en-CA/odr/hotels-mont-tremblant-canada?search=200-53804",
  "quebec-eastern-townships": "https://www.trivago.ca/en-CA/odr/hotels-bromont-canada?search=200-52766",
  "quebec-charlevoix": "https://www.trivago.ca/en-CA/odr/hotels-sainte-anne-de-beaupr%C3%A9-canada?search=200-63493",
  // USA (Awin · trivago.com) - the 7 flagship US regions, keyed to each
  // region's main accommodation hub town. Every URL curl-verified 16 Aug 2026
  // to stay on its destination page (invalid locids redirect to the homepage).
  "summit-county": "https://www.trivago.com/en-US/odr/hotels-breckenridge-colorado?search=200-14282",
  "vail-valley": "https://www.trivago.com/en-US/odr/hotels-vail-colorado?search=200-14304",
  "aspen-snowmass": "https://www.trivago.com/en-US/odr/hotels-aspen-colorado?search=200-14277",
  "park-city": "https://www.trivago.com/en-US/odr/hotels-park-city-utah?search=200-14954",
  "north-lake-tahoe": "https://www.trivago.com/en-US/odr/hotels-truckee-california?search=200-41089",
  "south-lake-tahoe": "https://www.trivago.com/en-US/odr/hotels-south-lake-tahoe-california?search=200-14275",
  "stowe-smugglers-notch": "https://www.trivago.com/en-US/odr/hotels-stowe-vermont?search=200-14971",
};

/** Build a deep-link search URL for any supported platform. Region-keyed
 *  platforms (trivago) need `opts.region`; country-keyed platforms (expedia)
 *  need `opts.country` - pass the same tag given to platformsForCountry. */
export function platformDeepLink(
  platform: StayPlatformId,
  opts: { query: string; lat?: number; lng?: number; region?: string; country?: string; affiliateId?: string },
): string {
  const q = encodeURIComponent(opts.query);
  switch (platform) {
    case "booking": {
      const params = new URLSearchParams({ ss: opts.query, lang: "en-us" });
      if (opts.lat !== undefined) params.set("latitude", String(opts.lat));
      if (opts.lng !== undefined) params.set("longitude", String(opts.lng));
      if (opts.affiliateId) params.set("aid", opts.affiliateId);
      return `https://www.booking.com/searchresults.html?${params.toString()}`;
    }
    case "airbnb":
      return `https://www.airbnb.com/s/${q}/homes`;
    case "agoda":
      return `https://www.agoda.com/search?q=${q}`;
    case "trip":
      return `https://www.trip.com/hotels/?searchKeyword=${q}`;
    case "hotels":
      return `https://www.hotels.com/Hotel-Search?destination=${q}`;
    case "expedia": {
      // Expedia earns via the Awin "Expedia AU" programme (approved July
      // 2026) using the MasterTag's Convert-a-Link, which only rewrites the
      // EXACT approved domain - expedia.com.au (same rule as Europcar).
      // AU and NZ therefore link to expedia.com.au (tracked; the AU site
      // serves NZ stays too). Everything else keeps global expedia.com,
      // which works for visitors but is untracked - do NOT point other
      // countries at .com.au just to earn; the domain must fit the visitor.
      // NOTE: `country` is a region shortTag, and AU regions carry STATE tags
      // (NSW / VIC / TAS), never "AU" - match those, not just country codes.
      const host = isAu(opts.country) || isNz(opts.country) ? "www.expedia.com.au" : "www.expedia.com";
      return `https://${host}/Hotel-Search?destination=${q}`;
    }
    case "rakuten":
      return `https://travel.rakuten.com/hotelinfo/search/?f_keyword=${q}`;
    case "jalan":
      return `https://www.jalan.net/uw/uwp2011/uww2011init.do?keyword=${q}`;
    case "trivago":
      // No free-text deep link: resolve the region to its verified trivago area
      // page, or "" when we have none (callers skip the button). This is the
      // plain destination. JP entries get CJ tracking added by the caller via
      // cjLinkFor (which only wraps trivago.jp); AU/NZ/CA/US entries MUST go
      // out as-is - Awin Convert-a-Link rewrites the plain country-domain link.
      return TRIVAGO_DESTINATIONS[opts.region ?? ""] ?? "";
  }
}
