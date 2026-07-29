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

/** Returns the ordered list of platforms to surface for a given country/region tag. */
export function platformsForCountry(country: CountryCode): StayPlatform[] {
  const base: StayPlatformId[] = ["booking", "airbnb", "agoda", "trip", "hotels", "expedia"];
  const isJapan = country === "JP" || country === "JPN" || country === "Japan";
  const ids = isJapan
    ? [...base, "rakuten" as StayPlatformId, "jalan" as StayPlatformId, "trivago" as StayPlatformId]
    : base;
  return ids.map((id) => STAY_PLATFORMS[id]);
}

// trivago is a metasearch (price-comparison) site, not an OTA with a free-text
// search deep link - its result pages are keyed by an internal area id
// ("locid"), so we can't build a trivago link from the query string the way we
// do for the OTAs. Instead we map each region to its verified trivago area page.
// This plain trivago.jp URL is the *destination*; trivago earns via CJ - the
// stay pages wrap it in cjLinkFor("trivago", ...) (lib/cj.ts), which redirects
// to this page through CJ's "Evergreen" deep link under our approved trivago JP
// programme. A region with no entry here resolves to "" in platformDeepLink, and
// callers skip the button (no dead link).
//
//   yamanouchi = Yamanouchi-machi (Nagano), trivago locid 200-70117. Covers
//   Yudanaka, Shibu Onsen and the Yomase/Shiga Kogen onsen-ski towns. Verified
//   June 2026 to resolve to the real stays (Yorozuya, Koishiya, Shiga Kogen
//   Prince Hotel, ...). Add a region's verified locid here before its stay pages
//   can show a trivago button.
const TRIVAGO_DESTINATIONS: Record<string, string> = {
  yamanouchi: "https://www.trivago.jp/en-US/odr/hotels-yamanouchi-japan?search=200-70117",
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
      const au = ["AU", "AUS", "Australia", "NSW", "VIC", "TAS"].includes(opts.country ?? "");
      const nz = opts.country === "NZ" || opts.country === "NZL" || opts.country === "New Zealand";
      const host = au || nz ? "www.expedia.com.au" : "www.expedia.com";
      return `https://${host}/Hotel-Search?destination=${q}`;
    }
    case "rakuten":
      return `https://travel.rakuten.com/hotelinfo/search/?f_keyword=${q}`;
    case "jalan":
      return `https://www.jalan.net/uw/uwp2011/uww2011init.do?keyword=${q}`;
    case "trivago":
      // No free-text deep link: resolve the region to its verified trivago area
      // page, or "" when we have none (callers skip the button). This is the
      // plain destination; CJ tracking is added by the caller via cjLinkFor.
      return TRIVAGO_DESTINATIONS[opts.region ?? ""] ?? "";
  }
}
