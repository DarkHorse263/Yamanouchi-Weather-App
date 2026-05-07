import { motion } from "framer-motion";
import { Bed, ExternalLink } from "lucide-react";

import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";

import { EmptyStateCard } from "@/components/EmptyStateCard";
import {
  platformsForCountry,
  platformDeepLink,
  type CountryCode,
  type StayPlatformId,
} from "@/lib/places";

/**
 * TownStay — simplified affiliate-link card.
 *
 * Per the Apr 2026 product reset: "Under stays just have links to Booking
 * providers (make it simple). I'm going to become an affiliate of some of
 * them to help monetise."
 *
 * What this used to be: a 400-line page rendering a curated 228-entry stays
 * dataset with filters, map, sort-by-drive-time, and detail sheets. Pretty,
 * but expensive to maintain and at odds with the affiliate strategy.
 *
 * What it is now: a single card with one prominent button per booking
 * platform supported in the town's country, locked to the town's name +
 * region. AU towns get the global six (Booking, Airbnb, Agoda, Trip,
 * Hotels, Expedia); JP towns also get Rakuten Travel + Jalan. Affiliate
 * IDs (when configured via `VITE_*_AFFILIATE_ID` env vars in
 * `lib/affiliateLinks.ts`) are auto-injected so we earn from clicks.
 *
 * No data, no filters, no curation — just a dependable launch pad.
 */
export function TownStay() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();

  if (!town) {
    return (
      <div className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
        <EmptyStateCard
          icon={Bed}
          title={t("Pick a town first", "町を選んでください")}
          body={t(
            "Choose a base town from the picker to search availability nearby.",
            "上のピッカーから町を選ぶと、近くの宿泊施設を検索できます。",
          )}
        />
      </div>
    );
  }

  const country = (region.shortTag as CountryCode) ?? "JP";
  const townDisplayName = t(town.name, town.nameJa);
  const query = `${town.name}, ${region.name}`;
  const platforms = platformsForCountry(country);

  return (
    <div className="max-w-6xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-6 md:px-10 pt-8 md:pt-12"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">
              {region.name} · {townDisplayName}
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {t("Stay", "宿泊")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t(
                `Search availability around ${townDisplayName} on the major booking platforms. Each link is pre-filtered to the town.`,
                `${townDisplayName}周辺の宿泊施設を主要予約サイトで検索。各リンクは町名で事前検索済みです。`,
              )}
            </p>
          </div>
          <LiveBadge label={t("Live search", "ライブ検索")} />
        </div>
        <div className="rule mt-6" />
      </motion.header>

      <section className="px-6 md:px-10 pt-8 pb-16">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-6 md:p-8 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-blue-700/80 uppercase">
                {t("Search availability", "空室を検索")}
              </p>
              <p className="font-display font-semibold text-foreground text-lg md:text-xl mt-1 leading-snug">
                {query}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground/70">
              {platforms.length} {t("sites", "サイト")}
            </span>
          </div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {platforms.map((p) => (
              <li key={p.id}>
                <a
                  href={platformDeepLink(p.id, { query, lat: town.lat, lng: town.lng })}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  data-platform={p.id satisfies StayPlatformId}
                  className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ backgroundColor: p.brandColor, color: p.brandText }}
                >
                  <span className="truncate">{p.label}</span>
                  <ExternalLink className="w-4 h-4 opacity-80 group-hover:opacity-100" aria-hidden />
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-[11px] text-muted-foreground/70 leading-relaxed">
            {t(
              "Links open in a new tab on the booking platform's site. Feelzlike may earn a commission from bookings made through these links — it never costs you extra.",
              "リンクは予約サイトの別タブで開きます。これらのリンクからの予約はFeelzlikeに手数料が発生する場合がありますが、追加料金はありません。",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
