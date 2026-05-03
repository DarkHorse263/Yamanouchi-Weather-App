import { useQuery } from "@tanstack/react-query";

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

async function fetchNearby(args: NearbyArgs): Promise<NearbyPlace[]> {
  const params = new URLSearchParams({
    lat: String(args.lat),
    lng: String(args.lng),
    radius: String(args.radius ?? 5000),
    kind: args.kind,
    max: String(args.max ?? 20),
  });
  const res = await fetch(apiUrl(`/places/nearby?${params.toString()}`));
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Places fetch failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { places: NearbyPlace[] };
  return data.places ?? [];
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
