import { useEffect } from "react";
import { Car, ExternalLink } from "lucide-react";
import { REGION_COUNTRY, type CountryCode } from "@/regions";
import { track } from "@/lib/analytics";
import { pingPartnerEvent } from "@/lib/engagement";

// Europcar runs separate per-country sites and Awin's Convert-a-Link only
// rewrites the EXACT domain the advertiser is approved for. feelzlike's
// "Europcar_AU NZ" programme covers the AU and NZ sites, so we point each
// region at its local Europcar site (AU -> .com.au, NZ -> .co.nz) so the
// MasterTag can track the click. Any other country falls back to the global
// site, which simply stays an untracked (but still working) link.
const EUROPCAR_URL_BY_COUNTRY: Record<CountryCode, string> = {
  AU: "https://www.europcar.com.au/",
  NZ: "https://www.europcar.co.nz/",
  JP: "https://www.europcar.com/",
  CA: "https://www.europcar.com/",
  US: "https://www.europcar.com/",
};
const EUROPCAR_URL_FALLBACK = "https://www.europcar.com/";

export function europcarUrlForRegion(regionId: string): string {
  const country = REGION_COUNTRY[regionId];
  return (country && EUROPCAR_URL_BY_COUNTRY[country]) || EUROPCAR_URL_FALLBACK;
}

/**
 * Universal car-hire callout (Europcar). Shown on every town's Transport page
 * (generic + the custom AU region pages).
 *
 * It's a plain outbound link: when the visitor has granted `ads` consent the
 * Awin MasterTag (lib/awin) auto-converts the local Europcar link into a
 * tracked, commission-earning one - no per-link work here. Without
 * consent/approval it is just a normal link to Europcar, so it never breaks.
 *
 * The href is region-aware (see europcarUrlForRegion) because Awin's
 * Convert-a-Link only rewrites the exact Europcar country domain the
 * programme is approved for.
 */
export function CarHireCard({
  regionId,
  t,
  className,
}: {
  regionId: string;
  t: (en: string, ja?: string) => string;
  className?: string;
}) {
  useEffect(() => {
    pingPartnerEvent("partner_shown", "europcar");
  }, []);
  return (
    <a
      href={europcarUrlForRegion(regionId)}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => {
        pingPartnerEvent("partner_clicked", "europcar");
        track("book_car_hire", {
          category: "affiliate",
          data: {
            vendor: "europcar",
            region: regionId,
            ...(REGION_COUNTRY[regionId] ? { country: REGION_COUNTRY[regionId] } : {}),
          },
        });
      }}
      className={`group flex items-start gap-3 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-5 shadow-sm transition-colors hover:border-blue-300${className ? ` ${className}` : ""}`}
    >
      <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
        <Car className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold tracking-wider text-blue-700/80 uppercase">
          {t("Car hire", "レンタカー")}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <h3 className="font-display font-semibold text-foreground text-base">
            {t("Hire a car with Europcar", "Europcarでレンタカー")}
          </h3>
          <ExternalLink
            className="w-3.5 h-3.5 text-blue-600 opacity-70 group-hover:opacity-100"
            aria-hidden
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">
          {t(
            "Compare rates and book a rental car for your trip · airport or in-town pick-up. Feelzlike may earn a commission · it never costs you extra.",
            "旅行用レンタカーの料金を比較して予約 · 空港または市内で受け取り。Feelzlikeに手数料が発生する場合がありますが、追加料金はありません。",
          )}
        </p>
      </div>
    </a>
  );
}
