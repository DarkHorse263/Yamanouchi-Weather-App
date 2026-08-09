import { useEffect } from "react";
import { Users, ExternalLink } from "lucide-react";
import { REGION_COUNTRY, type CountryCode } from "@/regions";
import { track } from "@/lib/analytics";
import { pingPartnerEvent } from "@/lib/engagement";

/**
 * Private-guide callout (GoWithGuide). Shown on town Explore pages
 * (generic TownExplore + Yamanouchi's custom explore).
 *
 * Same earning model as CarHireCard: a plain outbound link that the Awin
 * MasterTag's Convert-a-Link auto-rewrites into a tracked one when the
 * visitor has granted `ads` consent. Without consent/approval it stays a
 * normal working link, so it never breaks.
 *
 * Country-keyed destination so visitors land on their own country's tour
 * list rather than the generic homepage (all four paths curl-verified
 * Aug 2026).
 */
const GOWITHGUIDE_URL_BY_COUNTRY: Record<CountryCode, string> = {
  AU: "https://gowithguide.com/australia",
  NZ: "https://gowithguide.com/new-zealand",
  JP: "https://gowithguide.com/japan",
  CA: "https://gowithguide.com/canada",
  // GoWithGuide does not expose a US country landing page in the approved
  // destination set, so retain the working global destination as the US link.
  US: "https://gowithguide.com/",
};
const GOWITHGUIDE_URL_FALLBACK = "https://gowithguide.com/";

export function goWithGuideUrlForRegion(regionId: string): string {
  const country = REGION_COUNTRY[regionId];
  return (country && GOWITHGUIDE_URL_BY_COUNTRY[country]) || GOWITHGUIDE_URL_FALLBACK;
}

export function GuideToursCard({
  regionId,
  t,
  className,
}: {
  regionId: string;
  t: (en: string, ja?: string) => string;
  className?: string;
}) {
  useEffect(() => {
    pingPartnerEvent("partner_shown", "gowithguide");
  }, []);
  return (
    <a
      href={goWithGuideUrlForRegion(regionId)}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => {
        pingPartnerEvent("partner_clicked", "gowithguide");
        track("book_private_guide", {
          category: "affiliate",
          data: {
            vendor: "gowithguide",
            region: regionId,
            ...(REGION_COUNTRY[regionId] ? { country: REGION_COUNTRY[regionId] } : {}),
          },
        });
      }}
      className={`group flex items-start gap-3 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-5 shadow-sm transition-colors hover:border-blue-300${className ? ` ${className}` : ""}`}
    >
      <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
        <Users className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold tracking-wider text-blue-700/80 uppercase">
          {t("Private guides", "プライベートガイド")}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <h3 className="font-display font-semibold text-foreground text-base">
            {t("Book a local guide with GoWithGuide", "GoWithGuideで地元ガイドを予約")}
          </h3>
          <ExternalLink
            className="w-3.5 h-3.5 text-blue-600 opacity-70 group-hover:opacity-100"
            aria-hidden
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">
          {t(
            "Private tours and local guides for your trip · customisable itineraries. Feelzlike may earn a commission · it never costs you extra.",
            "旅行向けのプライベートツアーと地元ガイド · 行程はカスタマイズ可能。Feelzlikeに手数料が発生する場合がありますが、追加料金はありません。",
          )}
        </p>
      </div>
    </a>
  );
}
