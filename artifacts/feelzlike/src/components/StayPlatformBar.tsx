import { ExternalLink } from "lucide-react";
import {
  platformsForCountry,
  platformDeepLink,
  type CountryCode,
  type StayPlatformId,
} from "@/lib/places";
import { cjLinkFor } from "@/lib/cj";
import { useConsent, canUseAds } from "@/lib/consent";
import { track } from "@/lib/analytics";

interface Props {
  query: string;
  lat?: number;
  lng?: number;
  country: CountryCode;
  /** Region id, used to resolve region-keyed deep links (e.g. trivago). */
  region?: string;
  variant?: "banner" | "row" | "card";
  only?: StayPlatformId[];
  affiliateId?: string;
  className?: string;
}

export function StayPlatformBar({
  query,
  lat,
  lng,
  country,
  region,
  variant = "row",
  only,
  affiliateId,
  className = "",
}: Props) {
  const { choices } = useConsent();
  const all = platformsForCountry(country);
  const selected = only ? all.filter((p) => only.includes(p.id)) : all;
  // CJ tracking is only applied to advertisers we're approved for (see lib/cj)
  // and only once the visitor has granted `ads` consent; otherwise we serve the
  // plain OTA link unchanged (it still works, it just doesn't earn).
  const adsOk = canUseAds(choices);
  // Resolve each platform's link once, dropping any whose underlying destination
  // is empty (e.g. trivago for a region with no verified area page) so we never
  // render a dead button. Filter on the plain URL, not the CJ-wrapped href.
  const links = selected
    .map((p) => {
      const plainUrl = platformDeepLink(p.id, { query, lat, lng, region, affiliateId });
      const href = (adsOk && cjLinkFor(p.id, plainUrl, { sid: region })) || plainUrl;
      return { p, href, plainUrl };
    })
    .filter((x) => x.plainUrl.length > 0);

  // One booking-intent event per outbound OTA click · consent-gated in the
  // analytics layer, so it's a no-op until the visitor accepts analytics.
  const trackBook = (platform: StayPlatformId) =>
    track("book_accommodation", {
      category: "affiliate",
      data: { platform, country, ...(region ? { region } : {}) },
    });

  if (variant === "banner") {
    return (
      <div className={`rounded-2xl border border-border bg-gradient-to-br from-blue-50 via-white to-amber-50/30 p-5 ${className}`}>
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Search availability</p>
            <p className="font-display font-semibold text-foreground text-base mt-0.5 leading-snug">
              {query}
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground/70">{links.length} sites</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map(({ p, href }) => (
            <a
              key={p.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackBook(p.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-transform hover:scale-[1.03] hover:shadow-sm"
              style={{ backgroundColor: p.brandColor, color: p.brandText }}
            >
              {p.short}
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`flex flex-wrap items-center gap-1 ${className}`}>
        {links.map(({ p, href }) => (
          <a
            key={p.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            title={p.label}
            onClick={() => trackBook(p.id)}
            className="inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] font-bold transition-opacity hover:opacity-85"
            style={{ backgroundColor: p.brandColor, color: p.brandText }}
          >
            {p.short}
          </a>
        ))}
      </div>
    );
  }

  // row (default)
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {links.map(({ p, href }) => (
        <a
          key={p.id}
          href={href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => trackBook(p.id)}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-opacity hover:opacity-85"
          style={{ backgroundColor: p.brandColor, color: p.brandText }}
        >
          {p.short}
        </a>
      ))}
    </div>
  );
}
