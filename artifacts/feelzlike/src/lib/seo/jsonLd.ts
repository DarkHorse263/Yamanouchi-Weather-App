/**
 * JSON-LD schema.org generators. Pass the result(s) into <PageMeta jsonLd={...} />.
 *
 * Schema types we expose:
 *  - WebSite + SearchAction (homepage)
 *  - Organization (homepage / footer)
 *  - Place (mountains, towns)
 *  - LodgingBusiness (curated stays)
 *  - Restaurant / FoodEstablishment (curated eats)
 *  - BreadcrumbList (region/town navigation)
 *
 * Keep these light — only fields we have honest data for. Don't fabricate
 * ratings, prices, or addresses.
 */

const SITE_URL = "https://feelzlike.com";
const SITE_NAME = "feelzlike";

export interface PlaceLatLng {
  lat: number;
  lng: number;
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    description:
      "Mountain weather, lift status, road conditions, live cams and curated stays/eats across the world's snow regions.",
  };
}

export function placeSchema(args: {
  name: string;
  url: string;
  description?: string;
  latLng?: PlaceLatLng;
  addressCountry?: string;
  addressRegion?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: args.name,
    url: args.url,
    ...(args.description ? { description: args.description } : {}),
    ...(args.latLng
      ? { geo: { "@type": "GeoCoordinates", latitude: args.latLng.lat, longitude: args.latLng.lng } }
      : {}),
    ...(args.addressCountry || args.addressRegion
      ? {
          address: {
            "@type": "PostalAddress",
            ...(args.addressCountry ? { addressCountry: args.addressCountry } : {}),
            ...(args.addressRegion ? { addressRegion: args.addressRegion } : {}),
          },
        }
      : {}),
  };
}

export function lodgingSchema(args: {
  name: string;
  url: string;
  description?: string;
  image?: string;
  latLng?: PlaceLatLng;
  addressLocality?: string;
  addressCountry?: string;
  priceRange?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: args.name,
    url: args.url,
    ...(args.description ? { description: args.description } : {}),
    ...(args.image ? { image: args.image } : {}),
    ...(args.latLng
      ? { geo: { "@type": "GeoCoordinates", latitude: args.latLng.lat, longitude: args.latLng.lng } }
      : {}),
    ...(args.addressLocality || args.addressCountry
      ? {
          address: {
            "@type": "PostalAddress",
            ...(args.addressLocality ? { addressLocality: args.addressLocality } : {}),
            ...(args.addressCountry ? { addressCountry: args.addressCountry } : {}),
          },
        }
      : {}),
    ...(args.priceRange ? { priceRange: args.priceRange } : {}),
  };
}

export function restaurantSchema(args: {
  name: string;
  url: string;
  servesCuisine?: string;
  description?: string;
  image?: string;
  latLng?: PlaceLatLng;
  addressLocality?: string;
  addressCountry?: string;
  priceRange?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: args.name,
    url: args.url,
    ...(args.servesCuisine ? { servesCuisine: args.servesCuisine } : {}),
    ...(args.description ? { description: args.description } : {}),
    ...(args.image ? { image: args.image } : {}),
    ...(args.latLng
      ? { geo: { "@type": "GeoCoordinates", latitude: args.latLng.lat, longitude: args.latLng.lng } }
      : {}),
    ...(args.addressLocality || args.addressCountry
      ? {
          address: {
            "@type": "PostalAddress",
            ...(args.addressLocality ? { addressLocality: args.addressLocality } : {}),
            ...(args.addressCountry ? { addressCountry: args.addressCountry } : {}),
          },
        }
      : {}),
    ...(args.priceRange ? { priceRange: args.priceRange } : {}),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
