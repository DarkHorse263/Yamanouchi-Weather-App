import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, ExternalLink } from "lucide-react";
import { withPartnerUtm, type TownPartner } from "@/data/townPartners";
import { track } from "@/lib/analytics";

/**
 * Paid, disclosed partner AD BANNER on the town home page · the louder
 * sibling of TownPartnerCard. Sits directly under the town header and
 * rotates through the partner's messages every few seconds. When the
 * deal includes `brand`, the banner wears the partner's own colours and
 * logo so it reads like their ad.
 *
 * Same honesty rules as every partner surface: only renders with an
 * active signed deal in data/townPartners.ts, the "Featured partner"
 * label is always visible (whatever the branding), and the single
 * outbound link carries rel="sponsored". Weather, snow and road
 * content are never touched.
 */
export function TownPartnerAd({
  partner,
  townId,
  t,
}: {
  partner: TownPartner;
  townId: string;
  t: (en: string, ja?: string) => string;
}) {
  const lines = useMemo(() => {
    const en = [partner.tagline, ...(partner.messages ?? [])];
    const ja = [partner.taglineJa, ...(partner.messagesJa ?? [])];
    return en.map((line, i) => ({ en: line, ja: ja[i] }));
  }, [partner]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (lines.length <= 1) return;
    // Respect reduced-motion preference · pin the tagline instead of rotating.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setIndex((v) => (v + 1) % lines.length);
    }, 4500);
    return () => clearInterval(id);
  }, [lines.length]);

  const line = lines[index] ?? lines[0];

  const brand = partner.brand;
  const dark = !brand || brand.theme === "dark";

  const bannerStyle = brand
    ? { background: `linear-gradient(90deg, ${brand.bgFrom}, ${brand.bgTo})` }
    : undefined;
  const ctaStyle = brand
    ? {
        backgroundColor: brand.ctaBg,
        color: brand.ctaText,
        border: brand.ctaBorder ? `1.5px solid ${brand.ctaBorder}` : undefined,
      }
    : undefined;

  const labelClass = dark ? "text-white/75" : "text-slate-600";
  const nameClass = dark ? "text-white" : "text-slate-900";
  const lineClass = dark ? "text-white/85" : "text-slate-700";

  const cta = (extra: string) => (
    <span
      className={`${extra} items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-opacity group-hover:opacity-90 ${
        brand ? "" : "bg-white text-blue-800"
      }`}
      style={ctaStyle}
    >
      {t(partner.cta, partner.ctaJa)}
      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
    </span>
  );

  return (
    <section className="mt-4">
      <a
        href={withPartnerUtm(partner.url, townId, "ad")}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() =>
          track("partner_click", {
            category: "affiliate",
            data: { partner: partner.name, town: townId, placement: "ad" },
          })
        }
        className={`group block rounded-2xl p-5 md:px-6 transition-shadow hover:shadow-lg ${
          brand
            ? "border border-slate-200/60"
            : "bg-gradient-to-r from-blue-800 via-blue-700 to-sky-600"
        }`}
        style={bannerStyle}
      >
        <div className="flex items-center gap-4">
          {brand?.logo ? (
            <span className="shrink-0 inline-flex items-center justify-center rounded-xl bg-white px-2.5 py-2 shadow-sm">
              <img
                src={brand.logo}
                alt={brand.logoAlt ?? t(partner.name, partner.nameJa)}
                className="h-9 w-auto max-w-[120px] object-contain"
                loading="lazy"
              />
            </span>
          ) : (
            <span
              className={`shrink-0 w-11 h-11 rounded-xl inline-flex items-center justify-center ${
                dark ? "bg-white/15 text-white" : "bg-slate-900/5 text-slate-700"
              }`}
            >
              <Handshake className="w-5 h-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-bold tracking-wider uppercase ${labelClass}`}>
              {t("Featured partner", "提携パートナー")}
              <span className="normal-case tracking-normal font-semibold opacity-80">
                {" · "}
                {t(partner.kicker, partner.kickerJa)}
              </span>
            </p>
            <p className={`font-display font-semibold mt-0.5 ${nameClass}`}>
              {t(partner.name, partner.nameJa)}
            </p>
            <div className="relative mt-0.5 h-5 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute inset-x-0 text-sm leading-5 truncate ${lineClass}`}
                >
                  {line ? t(line.en, line.ja) : null}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          {cta("shrink-0 hidden sm:inline-flex")}
        </div>
        {/* Mobile CTA · the pill above hides below sm to keep the row tight. */}
        {cta("sm:hidden mt-3 inline-flex")}
      </a>
    </section>
  );
}
