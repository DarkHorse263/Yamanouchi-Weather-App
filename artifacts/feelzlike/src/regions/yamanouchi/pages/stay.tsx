import { useGetAccommodation } from "@workspace/api-client-react";
import { useLanguage } from "@workspace/feelzlike-shell";
import { useSeason } from "@workspace/feelzlike-shell";
import { PageMeta } from "@/lib/seo/PageMeta";
import { LoadingScreen, ErrorScreen } from "../components/ui-elements";
import { useState } from "react";
import { MapPin, Phone, Bath, CableCar, Mountain, Search, Star, ExternalLink, BedDouble, Hotel, Home, Building2, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useYamanouchiBooking } from "../lib/booking";
import { StayPlatformBar } from "@/components/StayPlatformBar";
import { useNearbyPlaces } from "@/lib/places";
import { itemListSchema, lodgingSchema } from "@/lib/seo/jsonLd";

const YAMANOUCHI_CENTER = { lat: 36.7437, lng: 138.4214 };

type LocationTab = "mountain" | "town";
type FilterType = "all" | "hotel" | "ryokan" | "guesthouse";

const ON_MOUNTAIN = ["Shiga Kogen", "Ryuoo", "Yomase"];

const WINTER_MOUNTAIN_AREAS = [
  { region: "Shiga Kogen", label: "Shiga Kogen", labelJa: "志賀高原", desc: "21 linked ski areas · ~100 hotels", descJa: "21スキー場連結 · 約100軒", url: "https://www.shigakogen.gr.jp/english/index.html" },
  { region: "Ryuoo", label: "Ryuoo Ski Park", labelJa: "竜王スキーパーク", desc: "Japan's highest gondola", descJa: "日本最高所のゴンドラ", url: "https://www.ryuoo.com/en/" },
  { region: "Yomase", label: "Yomase Onsen Ski Area", labelJa: "夜間瀬温泉スキー場", desc: "Family ski area with onsen village", descJa: "温泉街のファミリースキー場", url: null },
];

const GREEN_MOUNTAIN_AREAS = [
  { region: "Shiga Kogen", label: "Shiga Kogen", labelJa: "志賀高原", desc: "Highland hiking & alpine nature · ~100 hotels", descJa: "高原ハイキングと高山自然 · 約100軒", url: "https://www.shigakogen.gr.jp/english/index.html" },
  { region: "Ryuoo", label: "Ryuoo Mountain Park", labelJa: "竜王マウンテンパーク", desc: "SORA Terrace & cloud sea views", descJa: "SORAテラスと雲海", url: "https://www.ryuoo.com/en/" },
  { region: "Yomase", label: "Yomase Onsen", labelJa: "夜間瀬温泉", desc: "Quiet onsen village in the mountains", descJa: "山あいの静かな温泉村", url: null },
];

const TOWN_AREAS = [
  { region: "Yudanaka", label: "Yudanaka Onsen", labelJa: "湯田中温泉", desc: "Hot spring town & Snow Monkey gateway", descJa: "温泉街・スノーモンキー玄関口" },
  { region: "Shibu Onsen", label: "Shibu Onsen", labelJa: "渋温泉", desc: "Historic hot spring village · ~30 ryokan", descJa: "歴史ある温泉村 · 約30軒の旅館" },
];

const TYPE_ICON: Record<string, LucideIcon> = { hotel: Hotel, ryokan: Building2, guesthouse: Home };

function mapsUrl(lat: number | null, lng: number | null, name: string) {
  if (lat && lng) return `https://maps.google.com/?q=${lat},${lng}`;
  return `https://maps.google.com/?q=${encodeURIComponent(name + " Yamanouchi Nagano Japan")}`;
}

export default function Stay({ embedded = false }: { embedded?: boolean }) {
  const { t } = useLanguage();
  const { isWinter } = useSeason();
  const [tab, setTab] = useState<LocationTab>("mountain");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const booking = useYamanouchiBooking();
  const MOUNTAIN_AREAS = isWinter ? WINTER_MOUNTAIN_AREAS : GREEN_MOUNTAIN_AREAS;

  const { data: all, isLoading, error } = useGetAccommodation({} as any);

  const nearbyQuery = useNearbyPlaces({
    lat: YAMANOUCHI_CENTER.lat,
    lng: YAMANOUCHI_CENTER.lng,
    radius: 8000,
    kind: "stay",
    max: 24,
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;

  const filtered = (all ?? []).filter(p =>
    typeFilter === "all" || p.type === typeFilter
  );

  const mountain = filtered.filter(p => ON_MOUNTAIN.includes(p.region));
  const town = filtered.filter(p => !ON_MOUNTAIN.includes(p.region));

  const allCurated = all ?? [];
  const livePlaces = nearbyQuery.data ?? [];

  const curatedLodgingNodes = allCurated.map((p) =>
    lodgingSchema({
      name: p.name,
      ...(p.websiteUrl ? { url: p.websiteUrl } : {}),
      ...(p.lat != null && p.lng != null ? { latLng: { lat: p.lat, lng: p.lng } } : {}),
      ...(p.address ? { addressLocality: p.address } : {}),
      addressCountry: "JP",
      ...(p.priceRange ? { priceRange: p.priceRange } : {}),
    }),
  );

  const liveLodgingNodes = livePlaces.map((p) =>
    lodgingSchema({
      name: p.name,
      ...(p.photoUrl ? { image: p.photoUrl } : {}),
      ...(p.lat != null && p.lng != null ? { latLng: { lat: p.lat, lng: p.lng } } : {}),
      ...(p.address ? { addressLocality: p.address.split(",")[0] } : {}),
      addressCountry: "JP",
    }),
  );

  const allLodgingNodes = [...curatedLodgingNodes, ...liveLodgingNodes];
  const allListItems = [
    ...allCurated.map((p) => ({ name: p.name, ...(p.websiteUrl ? { url: p.websiteUrl } : {}) })),
    ...livePlaces.map((p) => ({ name: p.name })),
  ];

  const stayPageUrl = "https://feelzlike.com/yamanouchi/stay";

  const listNode = allListItems.length > 0
    ? itemListSchema({
        name: "Where to Stay in Yamanouchi",
        url: stayPageUrl,
        description: "Accommodation in Yamanouchi, Nagano · hotels, ryokan and guesthouses across Shiga Kogen, Ryuoo, Yudanaka and Shibu Onsen.",
        items: allListItems,
      })
    : null;

  const typeFilters: { value: FilterType; label: string; labelJa: string }[] = [
    { value: "all", label: "All", labelJa: "すべて" },
    { value: "hotel", label: "Hotels", labelJa: "ホテル" },
    { value: "ryokan", label: "Ryokan", labelJa: "旅館" },
    { value: "guesthouse", label: "Guesthouses", labelJa: "ゲストハウス" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4 pb-24">
      {!embedded && (
        <PageMeta
          title={t("Yamanouchi - where to stay", "山ノ内の宿泊")}
          description={t(
            isWinter
              ? "Hotels, ryokan and guesthouses in Yamanouchi and Shiga Kogen. Ski-in lodges, hot spring ryokan and town stays all in one place."
              : "Hotels, ryokan and guesthouses in Yamanouchi. Mountain resorts, hot spring ryokan and town stays for summer hiking.",
            isWinter
              ? "山ノ内・志賀高原のホテル・旅館・ゲストハウス。スキーインロッジ・温泉旅館・町の宿をまとめて比較。"
              : "山ノ内のホテル・旅館・ゲストハウス。夏のハイキングに便利な山岳リゾート・温泉旅館・町の宿。",
          )}
          path="/yamanouchi/stay"
        />
      )}
      {!embedded && (
        <>
          <PageMeta
            title="Where to Stay in Yamanouchi"
            description="Accommodation in Yamanouchi, Nagano · hotels, ryokan and guesthouses across Shiga Kogen, Ryuoo, Yudanaka and Shibu Onsen. Compare prices across 9 booking sites."
            path="/yamanouchi/stay"
            jsonLd={listNode ? [listNode, ...allLodgingNodes] : undefined}
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground">{t("Where to Stay", "宿泊施設")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t("Accommodation in Yamanouchi · Compare 9 booking sites", "山ノ内町の宿泊施設 · 9つの予約サイトで比較")}</p>
          </div>

          <StayPlatformBar
            variant="banner"
            country="JP"
            region="yamanouchi"
            query="Yamanouchi, Nagano, Japan"
            lat={YAMANOUCHI_CENTER.lat}
            lng={YAMANOUCHI_CENTER.lng}
          />
        </>
      )}

      {/* Location tabs */}
      <div className="flex rounded-xl bg-secondary p-1 gap-1">
        {([["mountain", "On Mountain", "山の上"], ["town", "In Town", "町内"]] as const).map(([v, en, ja]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
              tab === v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(en, ja)}
          </button>
        ))}
      </div>

      {/* Type filters */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
        {typeFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
              typeFilter === f.value
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t(f.label, f.labelJa)}
          </button>
        ))}
      </div>

      {/* ON MOUNTAIN */}
      {tab === "mountain" && (
        <div className="space-y-5">
          {MOUNTAIN_AREAS.map(area => {
            const places = mountain.filter(p => p.region === area.region);
            if (places.length === 0) return null;
            return (
              <section key={area.region}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                      <Mountain className="w-4 h-4 text-primary" />
                      {t(area.label, area.labelJa)}
                    </h2>
                    <p className="text-xs text-muted-foreground">{t(area.desc, area.descJa)}</p>
                  </div>
                  <a href={booking.regionUrl(area.region)} target="_blank" rel="noopener noreferrer sponsored"
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline shrink-0">
                    <Search className="w-3 h-3" /> {t("Search area", "エリア検索")}
                  </a>
                </div>
                <PlaceList places={places} t={t} isWinter={isWinter} />
              </section>
            );
          })}
          {mountain.length === 0 && <EmptyState t={t} />}
        </div>
      )}

      {/* IN TOWN */}
      {tab === "town" && (
        <div className="space-y-5">
          {TOWN_AREAS.map(area => {
            const places = town.filter(p => p.region === area.region);
            if (places.length === 0) return null;
            return (
              <section key={area.region}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-black text-foreground">
                      {t(area.label, area.labelJa)}
                    </h2>
                    <p className="text-xs text-muted-foreground">{t(area.desc, area.descJa)}</p>
                  </div>
                  <a href={booking.regionUrl(area.region)} target="_blank" rel="noopener noreferrer sponsored"
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline shrink-0">
                    <Search className="w-3 h-3" /> {t("Search area", "エリア検索")}
                  </a>
                </div>
                <PlaceList places={places} t={t} isWinter={isWinter} />
              </section>
            );
          })}
          {town.length === 0 && <EmptyState t={t} />}
        </div>
      )}

      {/* Google Places - live discovery across all of Yamanouchi */}
      <GooglePlacesStaySection t={t} data={nearbyQuery.data} isLoading={nearbyQuery.isLoading} error={nearbyQuery.error} />
    </div>
  );
}

function GooglePlacesStaySection({
  t,
  data,
  isLoading,
  error,
}: {
  t: (en: string, ja: string | null) => string;
  data: ReturnType<typeof useNearbyPlaces>["data"];
  isLoading: boolean;
  error: Error | null | undefined;
}) {
  const places = data ?? [];

  return (
    <section className="pt-4">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-primary" />
            {t("More stays nearby", "周辺の宿泊施設")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("Live results from Google · compare across 9 booking sites", "Googleからのライブ結果 · 9つの予約サイトで比較")}
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
          {isLoading ? t("Loading", "読込中") : `${places.length} ${t("places", "件")}`}
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
          {t("Couldn't load nearby stays.", "周辺の宿泊施設を読み込めませんでした。")}
        </div>
      )}

      {isLoading && (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && places.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {places.map((p) => (
            <article key={p.id} className="rounded-xl border border-border bg-white overflow-hidden flex">
              {p.photoUrl ? (
                <img
                  src={p.photoUrl}
                  alt={p.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-28 h-auto object-cover shrink-0"
                />
              ) : (
                <div className="w-28 bg-secondary flex items-center justify-center shrink-0">
                  <BedDouble className="w-6 h-6 text-muted-foreground/40" />
                </div>
              )}
              <div className="p-3 flex-1 min-w-0 flex flex-col">
                <h3 className="font-bold text-sm text-foreground leading-tight truncate">{p.name}</h3>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                  {p.rating !== undefined && (
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {p.rating.toFixed(1)}
                      {p.ratingCount !== undefined && <span className="text-muted-foreground/60">({p.ratingCount})</span>}
                    </span>
                  )}
                  {p.address && <span className="truncate">{p.address.split(",")[0]}</span>}
                </div>
                <div className="mt-auto pt-2">
                  <StayPlatformBar
                    variant="card"
                    country="JP"
                    region="yamanouchi"
                    query={`${p.name} Yamanouchi`}
                    lat={p.lat ?? YAMANOUCHI_CENTER.lat}
                    lng={p.lng ?? YAMANOUCHI_CENTER.lng}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PlaceList({ places, t, isWinter = true }: { places: any[]; t: (en: string, ja: string | null) => string; isWinter?: boolean }) {
  const booking = useYamanouchiBooking();
  return (
    <div className="space-y-2">
      {places.map((place, idx) => (
        <motion.div
          key={place.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(idx * 0.04, 0.35) }}
        >
          <a
            href={booking.searchUrl(place.name + " Yamanouchi Japan")}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block bg-white border border-slate-200 rounded-xl p-3.5 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-start gap-3">
              {/* Type icon */}
              <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                {(() => {
                  const Icon = TYPE_ICON[place.type] || Hotel;
                  return <Icon className="w-4 h-4 text-slate-600" />;
                })()}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">
                    {t(place.name, place.nameJa)}
                  </h3>
                  {place.featured && (
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{t(place.address || place.region, place.addressJa || place.region)}</span>
                </p>

                <p className="text-xs text-slate-600 line-clamp-1 mb-2">
                  {t(place.description, place.descriptionJa)}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                    {t(place.type, null)}
                  </span>
                  {place.priceRange && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {place.priceRange}
                    </span>
                  )}
                  {place.onsenAvailable && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Bath className="w-2.5 h-2.5" /> {t("Onsen", "温泉")}
                    </span>
                  )}
                  {place.skiInSkiOut && isWinter && (
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <CableCar className="w-2.5 h-2.5" /> {t("Ski-in/out", "直結")}
                    </span>
                  )}
                </div>
              </div>

              {/* Book CTA */}
              <div className="shrink-0 flex flex-col items-center gap-1 ml-1">
                <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg group-hover:bg-blue-700 transition-colors shadow-sm">
                  {t("Book", "予約")}
                </div>
                <span className="text-[8px] text-blue-700 font-bold">Booking.com</span>
              </div>
            </div>

            {/* Quick actions row */}
            <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-100 ml-9">
              <span
                onClick={(e) => { e.preventDefault(); window.open(mapsUrl(place.lat, place.lng, place.name), "_blank"); }}
                className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-2.5 h-2.5" /> {t("Map", "地図")}
              </span>
              {place.phone && (
                <span
                  onClick={(e) => { e.preventDefault(); window.open(`tel:${place.phone}`); }}
                  className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                >
                  <Phone className="w-2.5 h-2.5" /> {t("Call", "電話")}
                </span>
              )}
              {place.websiteUrl && (
                <span
                  onClick={(e) => { e.preventDefault(); window.open(place.websiteUrl, "_blank"); }}
                  className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-2.5 h-2.5" /> {t("Website", "公式")}
                </span>
              )}
            </div>
          </a>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ t }: { t: (en: string, ja: string) => string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      {t("No places found matching your filters.", "フィルターに一致する場所が見つかりません。")}
    </div>
  );
}
