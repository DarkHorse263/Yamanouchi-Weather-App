import { Utensils, ExternalLink, Coffee, Beer, ShoppingBasket, Pizza } from "lucide-react";

import { useRegion, useLanguage, useBaseTown, LiveBadge, PageHeader } from "@workspace/feelzlike-shell";

import { EmptyStateCard } from "@/components/EmptyStateCard";

/**
 * TownEat - simplified Google Maps launch pad.
 *
 * Per the Apr 2026 product reset: "Under Eats have a link to Google Places
 * or a Google Restaurant Search locked for the area." We were maintaining
 * a curated 121-entry dataset with filters, sort-by-open-now, detail
 * sheets and locale-aware open-time logic. Useful, but not what the brief
 * asks for and brittle to keep current.
 *
 * What it is now: a hero "Open in Google Maps" CTA centred on the town,
 * plus a small grid of pre-filtered category searches (restaurants,
 * cafes, izakaya/bars, takeaway, supermarkets). Google Maps handles the
 * rest - they have better data than we'd ever curate.
 */

interface Category {
  key: string;
  query: string;
  labelEn: string;
  labelJa: string;
  Icon: typeof Utensils;
}

// Categories are region-aware so AU users don't see "izakaya" and JP users
// don't see "pubs". Both sets share restaurants/cafes/takeaway/groceries.
function categoriesForCountry(isJP: boolean): Category[] {
  const bars: Category = isJP
    ? { key: "bars", query: "bars and izakaya", labelEn: "Bars & izakaya", labelJa: "バー・居酒屋", Icon: Beer }
    : { key: "bars", query: "pubs and bars", labelEn: "Pubs & bars", labelJa: "パブ・バー", Icon: Beer };
  return [
    { key: "restaurants", query: "restaurants", labelEn: "Restaurants", labelJa: "レストラン", Icon: Utensils },
    { key: "cafes", query: "cafes", labelEn: "Cafes", labelJa: "カフェ", Icon: Coffee },
    bars,
    { key: "takeaway", query: "takeaway", labelEn: "Takeaway", labelJa: "テイクアウト", Icon: Pizza },
    { key: "supermarkets", query: "supermarkets", labelEn: "Supermarkets", labelJa: "スーパー", Icon: ShoppingBasket },
  ];
}

function googleMapsSearch(query: string, lat: number, lng: number): string {
  // Google Maps "search at coords" - `/maps/search/{query}/@lat,lng,zoom`
  // forces the result map to centre on the town, not the user's location.
  const q = encodeURIComponent(query);
  return `https://www.google.com/maps/search/${q}/@${lat},${lng},15z`;
}

export function TownEat() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();

  if (!town) {
    return (
      <div className="px-4 md:px-10 py-5 md:py-8 max-w-6xl mx-auto">
        <EmptyStateCard
          icon={Utensils}
          title={t("Pick a town first", "町を選んでください")}
          body={t(
            "Choose a base town from the picker to find food and drink nearby.",
            "上のピッカーから町を選ぶと、近くの食事・ドリンクを検索できます。",
          )}
        />
      </div>
    );
  }

  const townDisplayName = t(town.name, town.nameJa);
  const allFoodHref = googleMapsSearch(`food in ${town.name}`, town.lat, town.lng);
  const isJP = region.shortTag?.toUpperCase() === "JP";
  const categories = categoriesForCountry(isJP);
  const subtitleEn = isJP
    ? `Find restaurants, cafes, izakaya and supermarkets around ${townDisplayName} on Google Maps - opening hours, reviews and directions all live there.`
    : `Find restaurants, cafes, pubs and supermarkets around ${townDisplayName} on Google Maps - opening hours, reviews and directions all live there.`;
  const subtitleJa = isJP
    ? `${townDisplayName}周辺のレストラン・カフェ・居酒屋・スーパーをGoogleマップで検索 - 営業時間・レビュー・経路もそちらでご確認いただけます。`
    : `${townDisplayName}周辺のレストラン・カフェ・パブ・スーパーをGoogleマップで検索 - 営業時間・レビュー・経路もそちらでご確認いただけます。`;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="px-4 md:px-10 pt-4 md:pt-8">
        <PageHeader
          byline={`${region.name} · ${townDisplayName}`}
          title={t("Eat", "食事")}
          description={t(subtitleEn, subtitleJa)}
          badge={<LiveBadge tone="onDark" label={t("Google Maps", "Googleマップ")} />}
        />
      </div>

      {/* Hero "all food" CTA */}
      <section className="px-4 md:px-10 pt-4 md:pt-6">
        <a
          href={allFoodHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-br from-blue-600 to-blue-700 p-6 md:p-8 text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wider opacity-80 uppercase">
              {t("Everything to eat", "食事すべて")}
            </p>
            <p className="font-display font-semibold text-xl md:text-2xl mt-1.5">
              {t(`Open ${townDisplayName} on Google Maps`, `${townDisplayName}をGoogleマップで開く`)}
            </p>
          </div>
          <ExternalLink className="w-6 h-6 shrink-0 opacity-90 group-hover:opacity-100" aria-hidden />
        </a>
      </section>

      {/* Category grid */}
      <section className="px-4 md:px-10 pt-4 pb-8">
        <p className="text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase mb-3">
          {t("Or jump to a category", "カテゴリーで探す")}
        </p>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {categories.map(({ key, query, labelEn, labelJa, Icon }) => (
            <li key={key}>
              <a
                href={googleMapsSearch(`${query} in ${town.name}`, town.lat, town.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 text-blue-700 shrink-0" aria-hidden />
                  <span className="truncate">{t(labelEn, labelJa)}</span>
                </span>
                <ExternalLink className="w-4 h-4 text-muted-foreground/60 group-hover:text-blue-700" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
