import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, ExternalLink } from "lucide-react";
import type { TownPartner } from "@/data/townPartners";

/**
 * Paid, disclosed partner AD BANNER on the town home page · the louder
 * sibling of TownPartnerCard. Sits directly under the town header and
 * rotates through the partner's messages every few seconds.
 *
 * Same honesty rules as every partner surface: only renders with an
 * active signed deal in data/townPartners.ts, the "Featured partner"
 * label is always visible, and the single outbound link carries
 * rel="sponsored". Weather, snow and road content are never touched.
 */
export function TownPartnerAd({
  partner,
  t,
}: {
  partner: TownPartner;
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

  return (
    <section className="mt-4">
      <a
        href={partner.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block rounded-2xl bg-gradient-to-r from-blue-800 via-blue-700 to-sky-600 p-5 md:px-6 transition-shadow hover:shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-11 h-11 rounded-xl inline-flex items-center justify-center bg-white/15 text-white">
            <Handshake className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-wider text-sky-200 uppercase">
              {t("Featured partner", "提携パートナー")}
              <span className="text-sky-200/70 normal-case tracking-normal font-semibold">
                {" · "}
                {t(partner.kicker, partner.kickerJa)}
              </span>
            </p>
            <p className="font-display font-semibold text-white mt-0.5">
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
                  className="absolute inset-x-0 text-sm text-sky-100/90 leading-5 truncate"
                >
                  {line ? t(line.en, line.ja) : null}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <span className="shrink-0 hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-800 group-hover:bg-sky-50 transition-colors">
            {t(partner.cta, partner.ctaJa)}
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </span>
        </div>
        {/* Mobile CTA · the pill above hides below sm to keep the row tight. */}
        <span className="sm:hidden mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-800">
          {t(partner.cta, partner.ctaJa)}
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </span>
      </a>
    </section>
  );
}
