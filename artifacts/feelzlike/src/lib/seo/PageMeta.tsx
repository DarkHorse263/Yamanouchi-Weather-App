import { Helmet } from "react-helmet-async";

/**
 * Per-page meta tags + canonical + Open Graph + optional JSON-LD.
 *
 * Drop one of these at the top of every page component. The component
 * is intentionally minimal: title/description/canonical/og are nearly
 * always wanted, JSON-LD is opt-in via `jsonLd`.
 *
 * Canonicals & og:url are computed against the deployed origin (passed via
 * `VITE_PUBLIC_ORIGIN` at build time, falls back to window.location.origin
 * at runtime). This keeps the same component working in preview + prod.
 */

export interface PageMetaProps {
  title: string;
  description: string;
  /** Path beginning with "/" - gets joined to the public origin. */
  path?: string;
  /** Absolute or origin-relative URL of the social-share image. */
  image?: string;
  /** "website" (default), "article", "place", etc. */
  ogType?: string;
  /** When true, blocks search-engine indexing of this page. */
  noIndex?: boolean;
  /** Optional JSON-LD blob(s); see ./jsonLd.ts helpers. */
  jsonLd?: object | object[];
}

const SITE_NAME = "feelzlike";
const DEFAULT_OG_IMAGE = "/opengraph.jpg";

const CANONICAL_ORIGIN = "https://feelzlike.com";

function publicOrigin(): string {
  const env = (import.meta as { env?: { VITE_PUBLIC_ORIGIN?: string; PROD?: boolean } })
    .env;
  if (env?.VITE_PUBLIC_ORIGIN) return env.VITE_PUBLIC_ORIGIN.replace(/\/$/, "");
  // In production always declare the single canonical host so visitors arriving
  // via www.feelzlike.com still emit feelzlike.com canonicals (no duplicate index).
  if (env?.PROD) return CANONICAL_ORIGIN;
  if (typeof window !== "undefined") return window.location.origin;
  return CANONICAL_ORIGIN;
}

export function PageMeta({
  title,
  description,
  path,
  image,
  ogType = "website",
  noIndex = false,
  jsonLd,
}: PageMetaProps) {
  const origin = publicOrigin();
  const canonical = path ? `${origin}${path.startsWith("/") ? path : `/${path}`}` : undefined;
  const ogImage = (() => {
    const src = image || DEFAULT_OG_IMAGE;
    return src.startsWith("http") ? src : `${origin}${src.startsWith("/") ? src : `/${src}`}`;
  })();
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} - ${SITE_NAME}`;
  const ldArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph (Facebook, LinkedIn, Discord, iMessage) */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:image" content={ogImage} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {ldArray.map((blob, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(blob)}
        </script>
      ))}
    </Helmet>
  );
}
