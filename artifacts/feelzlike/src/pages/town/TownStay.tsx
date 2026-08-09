import { Bed, ExternalLink, MapPin } from "lucide-react";

import { useRegion, useLanguage, useBaseTown, LiveBadge, PageHeader, useOptionalSeason, cn } from "@workspace/feelzlike-shell";
import { PageMeta } from "@/lib/seo/PageMeta";

import { EmptyStateCard } from "@/components/EmptyStateCard";
import {
  platformsForCountry,
  platformDeepLink,
  type CountryCode,
  type StayPlatformId,
} from "@/lib/places";
import { cjLinkFor } from "@/lib/cj";
import { useConsent, canUseAds } from "@/lib/consent";

/**
 * Region-specific local accommodation providers, shown above the global
 * OTA grid. These are direct/independent operators visitors usually
 * can't find on Booking/Agoda - community-run booking pages, regional
 * tourism boards, etc. Keep the list short: this is a curated callout,
 * not a directory.
 */
interface LocalStayProvider {
  name: string;
  url: string;
  blurbEn: string;
  blurbJa: string;
}

const LOCAL_STAY_PROVIDERS: Record<string, LocalStayProvider[]> = {
  "snowy-mountains": [
    {
      name: "Snowy Mountains Accommodation",
      url: "https://snowymountainsaccommodation.au/",
      blurbEn: "Independent regional booking site - Jindabyne, Thredbo, Perisher and surrounds.",
      blurbJa: "地元独立予約サイト - ジンダバイン・スレッドボー・ペリッシャー周辺。",
    },
  ],
  "victorias-high-country": [
    {
      name: "Visit Victoria's High Country",
      url: "https://www.victoriashighcountry.com.au/accommodation",
      blurbEn: "Official regional tourism directory - Mansfield, Bright, Mount Beauty and the alpine villages.",
      blurbJa: "公式地域観光ディレクトリ - マンスフィールド、ブライト、マウントビューティーとアルパインビレッジ。",
    },
  ],
};

/**
 * TownStay - simplified affiliate-link card.
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
 * No data, no filters, no curation - just a dependable launch pad.
 */
export function TownStay() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const { choices } = useConsent();
  const seasonCtx = useOptionalSeason();

  if (!town) {
    return (
      <div className="px-4 md:px-10 py-5 md:py-8 max-w-6xl mx-auto">
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
  const localProviders = LOCAL_STAY_PROVIDERS[region.id] ?? [];
  // CJ tracking is only applied to advertisers we're approved for (see lib/cj),
  // and only once the visitor has granted `ads` consent. Otherwise we serve the
  // plain OTA search link unchanged - it still works, it just doesn't earn.
  const adsOk = canUseAds(choices);
  // Resolve each platform's link once, dropping any that resolve to an empty URL
  // (e.g. trivago for a region with no verified area page) so we never render a
  // dead button. trivago (JP) earns via CJ using the Evergreen deep link, which
  // redirects to the region-specific trivago page (see TRIVAGO_DESTINATIONS).
  const stayLinks = platforms
    .map((p) => {
      const plainUrl = platformDeepLink(p.id, {
        query,
        lat: town.lat,
        lng: town.lng,
        region: region.id,
        country,
      });
      const href =
        (adsOk && cjLinkFor(p.id, plainUrl, { sid: `${region.id}_${town.id}` })) || plainUrl;
      return { platform: p, href, plainUrl };
    })
    .filter((x) => x.plainUrl.length > 0);

  return (
    <div className={cn("min-h-[100dvh] pb-8 transition-colors duration-500", seasonCtx?.season === "green" ? "bg-[#059669]" : "bg-[#0055FF]")}>
      <div className="max-w-6xl mx-auto">
        <PageMeta
        title={t(`${town.name} - where to stay`, `${town.name}の宿泊`)}
        description={t(
          `Search hotels, lodges and apartments in ${town.name}, ${region.name} across the major booking platforms.`,
          `${region.name}・${townDisplayName}のホテル・ロッジ・アパートを主要予約サイトで比較。`,
        )}
        path={`/${region.id}/${town.id}/stay`}
      />
      <div className="px-4 md:px-10 pt-4 md:pt-8">
        <PageHeader
          byline={`${region.name} · ${townDisplayName}`}
          title={t("Stay", "宿泊")}
          description={t(
            `Search availability around ${townDisplayName} on the major booking platforms. Each link is pre-filtered to the town.`,
            `${townDisplayName}周辺の宿泊施設を主要予約サイトで検索。各リンクは町名で事前検索済みです。`,
          )}
          badge={<LiveBadge tone="onDark" label={t("Live search", "ライブ検索")} />}
        />
      </div>

      {localProviders.length > 0 && (
        <section className="px-4 md:px-10 pt-4 md:pt-6">
          <div className="rounded-2xl border border-blue-200 bg-white p-5 md:p-6 shadow-sm">
            <p className="text-[11px] font-bold tracking-wider text-blue-700/80 uppercase">
              {t("Local provider", "地元プロバイダー")}
            </p>
            <ul className="mt-3 space-y-3">
              {localProviders.map((p) => (
                <li key={p.url}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-display font-semibold text-foreground text-sm md:text-base">
                          {p.name}
                        </p>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600 opacity-70 group-hover:opacity-100" aria-hidden />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">
                        {t(p.blurbEn, p.blurbJa)}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="px-4 md:px-10 pt-4 pb-8">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-6 md:p-8 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-blue-700/80 uppercase">
                {t("Search availability", "空室を検索")}
              </p>
              <p className="font-display font-semibold text-foreground text-lg md:text-xl mt-1 leading-snug">
                {query}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground/70">
              {stayLinks.length} {t("sites", "サイト")}
            </span>
          </div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {stayLinks.map(({ platform: p, href }) => (
              <li key={p.id}>
                <a
                  href={href}
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

          <p className="mt-4 text-[11px] text-muted-foreground/70 leading-relaxed">
            {t(
              "Links open in a new tab on the booking platform's site. Feelzlike may earn a commission from bookings made through these links - it never costs you extra.",
              "リンクは予約サイトの別タブで開きます。これらのリンクからの予約はFeelzlikeに手数料が発生する場合がありますが、追加料金はありません。",
            )}
          </p>
        </div>
      </section>
    </div>
    </div>
  );
}
