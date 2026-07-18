import { Handshake, ExternalLink } from "lucide-react";
import { withPartnerUtm, type TownPartner } from "@/data/townPartners";
import { track } from "@/lib/analytics";

/**
 * Paid, disclosed partner card on the town home page.
 *
 * Rendered ONLY when the town has an active signed deal in
 * data/townPartners.ts. The "Featured partner" label is always visible
 * and the outbound link is rel="sponsored" · this card sells prominence
 * for the partner's own services and never touches weather, snow or
 * road content.
 */
export function TownPartnerCard({
  partner,
  townId,
  t,
}: {
  partner: TownPartner;
  townId: string;
  t: (en: string, ja?: string) => string;
}) {
  return (
    <section className="mt-3">
      <a
        href={withPartnerUtm(partner.url, townId, "listing")}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() =>
          track("partner_click", {
            category: "affiliate",
            data: { partner: partner.name, town: townId, placement: "listing" },
          })
        }
        className="group flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 transition-all hover:shadow-md hover:border-blue-300"
      >
        <div className="shrink-0 w-11 h-11 rounded-xl inline-flex items-center justify-center bg-blue-100 text-blue-700">
          <Handshake className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-wider text-blue-700 uppercase">
            {t("Featured partner", "提携パートナー")}
            <span className="text-blue-700/50 normal-case tracking-normal font-semibold">
              {" · "}
              {t(partner.kicker, partner.kickerJa)}
            </span>
          </p>
          <p className="font-display font-semibold text-foreground mt-0.5">
            {t(partner.name, partner.nameJa)}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
            {t(partner.tagline, partner.taglineJa)}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
          {t(partner.cta, partner.ctaJa)}
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </span>
      </a>
    </section>
  );
}
