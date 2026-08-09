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
  placeId,
  t,
}: {
  partner: TownPartner;
  /** Town id or region id · keys the UTM campaign and the click event. */
  placeId: string;
  t: (en: string, ja?: string) => string;
}) {
  return (
    <section className="mt-4">
      <a
        href={withPartnerUtm(partner.url, placeId, "listing")}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() =>
          track("partner_click", {
            category: "affiliate",
            data: { partner: partner.name, place: placeId, placement: "listing" },
          })
        }
        className="group flex items-center gap-5 rounded-[2rem] border-0 bg-white p-6 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,30,120,0.5)]"
      >
        <div className="shrink-0 w-14 h-14 rounded-2xl inline-flex items-center justify-center bg-[#F0F5FF] text-[#0055FF] group-hover:bg-[#0055FF] group-hover:text-white transition-colors duration-300">
          <Handshake className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          {/* Label wears the logo blue · matches TownPartnerAd. */}
          <p className="text-[12px] font-bold lowercase tracking-wider text-[#0055FF]">
            {t("Featured partner", "提携パートナー")}
            <span className="text-[#0055FF]/50 normal-case tracking-normal font-semibold">
              {" · "}
              {t(partner.kicker, partner.kickerJa)}
            </span>
          </p>
          <p className="font-display font-black text-xl tracking-tight text-[#0F172A] mt-1 lowercase">
            {t(partner.name, partner.nameJa)}
          </p>
          <p className="text-[14px] font-bold text-slate-500 mt-1 leading-snug lowercase">
            {t(partner.tagline, partner.taglineJa)}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 text-[14px] font-black lowercase text-[#0055FF]">
          {t(partner.cta, partner.ctaJa)}
          <ExternalLink className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
        </span>
      </a>
    </section>
  );
}
