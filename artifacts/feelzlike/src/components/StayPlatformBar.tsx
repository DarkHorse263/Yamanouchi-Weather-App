import { ExternalLink } from "lucide-react";
import {
  platformsForCountry,
  platformDeepLink,
  type CountryCode,
  type StayPlatformId,
} from "@/lib/places";

interface Props {
  query: string;
  lat?: number;
  lng?: number;
  country: CountryCode;
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
  variant = "row",
  only,
  affiliateId,
  className = "",
}: Props) {
  const all = platformsForCountry(country);
  const platforms = only ? all.filter((p) => only.includes(p.id)) : all;

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
          <span className="text-[11px] text-muted-foreground/70">{platforms.length} sites</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {platforms.map((p) => (
            <a
              key={p.id}
              href={platformDeepLink(p.id, { query, lat, lng, affiliateId })}
              target="_blank"
              rel="noopener noreferrer sponsored"
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
        {platforms.map((p) => (
          <a
            key={p.id}
            href={platformDeepLink(p.id, { query, lat, lng, affiliateId })}
            target="_blank"
            rel="noopener noreferrer sponsored"
            title={p.label}
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
      {platforms.map((p) => (
        <a
          key={p.id}
          href={platformDeepLink(p.id, { query, lat, lng, affiliateId })}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-opacity hover:opacity-85"
          style={{ backgroundColor: p.brandColor, color: p.brandText }}
        >
          {p.short}
        </a>
      ))}
    </div>
  );
}
