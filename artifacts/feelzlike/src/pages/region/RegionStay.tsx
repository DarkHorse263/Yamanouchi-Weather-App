import { Bed, BedDouble, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { useRegion, useLanguage, LiveBadge, PageHeader } from "@workspace/feelzlike-shell";
import { useNearbyPlaces } from "@/lib/places";
import { StayPlatformBar } from "@/components/StayPlatformBar";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import { PageMeta } from "@/lib/seo/PageMeta";
import { itemListSchema, lodgingSchema } from "@/lib/seo/jsonLd";

type StayFilter = {
  value: string;
  label: string;
  labelJa: string;
  /** Regex matched (case-insensitive) against place name to keep it. `null` = "all". */
  match: RegExp | null;
};

const JP_FILTERS: StayFilter[] = [
  { value: "all", label: "All", labelJa: "すべて", match: null },
  { value: "hotel", label: "Hotels", labelJa: "ホテル", match: /\b(hotel|inn|resort)\b/i },
  { value: "ryokan", label: "Ryokan", labelJa: "旅館", match: /(ryokan|旅館|onsen|温泉)/i },
  { value: "guesthouse", label: "Guesthouses", labelJa: "ゲストハウス", match: /(guest\s?house|hostel|lodge|pension|民宿|ゲストハウス)/i },
];

const AU_FILTERS: StayFilter[] = [
  { value: "all", label: "All", labelJa: "すべて", match: null },
  { value: "hotel", label: "Hotels", labelJa: "ホテル", match: /\b(hotel|inn|resort)\b/i },
  { value: "motel", label: "Motels", labelJa: "モーテル", match: /\bmotel\b/i },
  { value: "apartment", label: "Apartments", labelJa: "アパートメント", match: /\b(apartment|apartments|apt)\b/i },
  { value: "unit", label: "Units", labelJa: "ユニット", match: /\b(unit|units|cabin|cabins|chalet|chalets|villa|villas|cottage|cottages|holiday\s?(park|home))\b/i },
];

function filtersForCountry(country: string): StayFilter[] {
  return country.toUpperCase() === "JP" ? JP_FILTERS : AU_FILTERS;
}

/**
 * Region-wide accommodation page used as a default for any region whose
 * router does not provide its own Stay component. Uses Google Places centered
 * on the region's reference point and offers multi-platform booking comparison.
 */
export function RegionStay() {
  const { region } = useRegion();
  const { t } = useLanguage();

  // Use the first base town as a reference centre for the region.
  const center = region.baseTowns?.[0];

  const query = useNearbyPlaces(
    center
      ? { lat: center.lat, lng: center.lng, radius: 12000, kind: "stay", max: 24 }
      : null,
  );

  const country = region.shortTag ?? "";
  const filters = filtersForCountry(country);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const active = filters.find((f) => f.value === activeFilter) ?? filters[0];

  const allPlaces = query.data ?? [];
  const places = active.match
    ? allPlaces.filter((p) => active.match!.test(p.name))
    : allPlaces;

  const stayPageUrl = `https://feelzlike.com/${region.id}/stay`;

  const lodgingNodes = allPlaces.map((p) =>
    lodgingSchema({
      name: p.name,
      ...(p.photoUrl ? { image: p.photoUrl } : {}),
      ...(p.lat != null && p.lng != null ? { latLng: { lat: p.lat, lng: p.lng } } : {}),
      ...(p.address ? { addressLocality: p.address.split(",")[0] } : {}),
      addressCountry: country || undefined,
    }),
  );

  const listNode = allPlaces.length > 0
    ? itemListSchema({
        name: `Stays in ${region.name}`,
        url: stayPageUrl,
        description: `Hotels, lodges and apartments across ${region.name}.`,
        items: allPlaces.map((p) => ({ name: p.name })),
      })
    : null;

  return (
    <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
      <PageMeta
        title={t(`${region.name} - where to stay`, `${region.name}の宿泊`)}
        description={t(
          `Hotels, lodges and apartments across ${region.name}. Compare prices across the major booking sites.`,
          `${region.name}のホテル・ロッジ・アパートメント。主要予約サイトで価格を比較。`,
        )}
        path={`/${region.id}/stay`}
        jsonLd={listNode ? [listNode, ...lodgingNodes] : undefined}
      />
      <PageHeader
        byline={region.name}
        title={t("Stay", "宿泊")}
        description={t(
          `Hotels, lodges and apartments across ${region.name}. Compare prices across the major booking sites.`,
          `${region.name}のホテル・ロッジ・アパートメント。主要予約サイトで価格を比較。`,
        )}
        badge={<LiveBadge tone="onDark" label={query.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />}
      />
      <div className="mb-6" />

      <div className="mb-5">
        <StayPlatformBar
          variant="banner"
          country={country}
          query={region.name}
          lat={center?.lat}
          lng={center?.lng}
        />
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 mb-5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
              activeFilter === f.value
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t(f.label, f.labelJa)}
          </button>
        ))}
      </div>

      {query.isError && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-foreground">
            {t("Couldn't load nearby stays.", "周辺の宿泊施設を読み込めませんでした。")}{" "}
            <span className="text-muted-foreground">{(query.error as Error)?.message}</span>
          </p>
        </div>
      )}

      {query.isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {!query.isLoading && places.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((p) => (
            <article key={p.id} className="rounded-2xl border border-border bg-white overflow-hidden hover:border-primary/40 hover:shadow-md transition-all flex flex-col">
              {p.photoUrl ? (
                <div className="aspect-[16/9] bg-secondary overflow-hidden">
                  <img src={p.photoUrl} alt={p.name} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-secondary flex items-center justify-center">
                  <BedDouble className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-display font-semibold text-base text-foreground leading-tight">{p.name}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {p.rating !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {p.rating.toFixed(1)}
                      {p.ratingCount !== undefined && <span className="text-muted-foreground/60">({p.ratingCount})</span>}
                    </span>
                  )}
                  {p.address && (
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{p.address.split(",")[0]}</span>
                    </span>
                  )}
                </div>
                <div className="mt-auto pt-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {t("Compare prices", "価格を比較")}
                  </p>
                  <StayPlatformBar
                    variant="card"
                    country={country}
                    query={`${p.name} ${region.name}`}
                    lat={p.lat ?? center?.lat}
                    lng={p.lng ?? center?.lng}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!query.isLoading && !query.isError && places.length === 0 && (
        <EmptyStateCard
          icon={Bed}
          title={t("Stays launching this week", "宿泊リスト、今週公開")}
          body={
            country.toUpperCase() === "JP"
              ? t(
                  `We're curating hand-picked hotels, ryokan and lodges across ${region.name}. In the meantime, the booking-site shortcuts above will get you straight to availability.`,
                  `${region.name}のホテル・旅館・ロッジを厳選中です。上の予約サイトから空室状況を直接確認できます。`,
                )
              : t(
                  `We're curating hand-picked hotels, motels, lodges and apartments across ${region.name}. In the meantime, the booking-site shortcuts above will get you straight to availability.`,
                  `${region.name}のホテル・モーテル・ロッジ・アパートメントを厳選中です。上の予約サイトから空室状況を直接確認できます。`,
                )
          }
          eta={t("ETA: Next 7 days", "公開予定：7日以内")}
        />
      )}
    </div>
  );
}
