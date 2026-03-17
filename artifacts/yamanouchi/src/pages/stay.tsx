import { useGetAccommodation } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { useState } from "react";
import { MapPin, Phone, Bath, CableCar, Mountain, Search, Star, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { bookingSearchUrl, bookingRegionUrl, bookingGeneralUrl } from "@/lib/booking";

type LocationTab = "mountain" | "town";
type FilterType = "all" | "hotel" | "ryokan" | "guesthouse";

const ON_MOUNTAIN = ["Shiga Kogen", "Ryuoo"];

const MOUNTAIN_AREAS = [
  { region: "Shiga Kogen", label: "Shiga Kogen", labelJa: "志賀高原", desc: "21 linked ski areas", descJa: "21スキー場連結", url: "https://www.shigakogen.co.jp/english/" },
  { region: "Ryuoo", label: "Ryuoo Ski Park", labelJa: "竜王スキーパーク", desc: "Japan's highest gondola", descJa: "日本最高所のゴンドラ", url: "https://www.ryuoo.com/en/" },
];

const TOWN_AREAS = [
  { region: "Yudanaka", label: "Yudanaka", labelJa: "湯田中", desc: "Hot spring town & Snow Monkey gateway", descJa: "温泉街・スノーモンキー玄関口", emoji: "♨️" },
  { region: "Shibu Onsen", label: "Shibu Onsen", labelJa: "渋温泉", desc: "Historic hot spring village", descJa: "歴史ある温泉村", emoji: "🏮" },
  { region: "Sano", label: "Sano", labelJa: "佐野", desc: "Jigokudani Monkey Park area", descJa: "地獄谷野猿公苑エリア", emoji: "🐒" },
  { region: "Yomase", label: "Yomase", labelJa: "夜間瀬", desc: "Onsen ski town", descJa: "温泉スキータウン", emoji: "⛷️" },
];

const TYPE_EMOJI: Record<string, string> = { hotel: "🏨", ryokan: "🏯", guesthouse: "🏠" };

function mapsUrl(lat: number | null, lng: number | null, name: string) {
  if (lat && lng) return `https://maps.google.com/?q=${lat},${lng}`;
  return `https://maps.google.com/?q=${encodeURIComponent(name + " Yamanouchi Nagano Japan")}`;
}

export default function Stay({ embedded = false }: { embedded?: boolean }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<LocationTab>("mountain");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");

  const { data: all, isLoading, error } = useGetAccommodation({} as any);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;

  const filtered = (all ?? []).filter(p =>
    typeFilter === "all" || p.type === typeFilter
  );

  const mountain = filtered.filter(p => ON_MOUNTAIN.includes(p.region));
  const town = filtered.filter(p => !ON_MOUNTAIN.includes(p.region));

  const typeFilters: { value: FilterType; label: string; labelJa: string }[] = [
    { value: "all", label: "All", labelJa: "すべて" },
    { value: "hotel", label: "Hotels", labelJa: "ホテル" },
    { value: "ryokan", label: "Ryokan", labelJa: "旅館" },
    { value: "guesthouse", label: "Guesthouses", labelJa: "ゲストハウス" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-5 pb-24">
      {!embedded && (
        <>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-mountain-dark">{t("Where to Stay", "宿泊施設")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t("Accommodation in Yamanouchi · Book via Booking.com", "山ノ内町の宿泊施設 · Booking.comで予約")}</p>
          </div>

          <a
            href={bookingGeneralUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Booking.com</p>
                <p className="text-lg font-black mt-0.5">{t("Search All Hotels", "すべてのホテルを検索")}</p>
                <p className="text-xs text-blue-200 mt-1">{t("Hotels, ryokans & guesthouses · Best price guarantee", "ホテル・旅館・ゲストハウス · 最低価格保証")}</p>
              </div>
              <Search className="w-8 h-8 text-white/80 group-hover:scale-110 transition-transform shrink-0 ml-3" />
            </div>
          </a>
        </>
      )}

      {/* Location tabs */}
      <div className="flex rounded-xl bg-secondary p-1 gap-1">
        {([["mountain", "⛷️ On Mountain", "⛷️ 山の上"] , ["town", "🏘️ In Town", "🏘️ 町内"]] as const).map(([v, en, ja]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
              tab === v ? "bg-white shadow text-mountain-dark" : "text-muted-foreground hover:text-mountain-dark"
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
                ? "bg-mountain-dark text-white"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t(f.label, f.labelJa)}
          </button>
        ))}
      </div>

      {/* ON MOUNTAIN */}
      {tab === "mountain" && (
        <div className="space-y-6">
          {MOUNTAIN_AREAS.map(area => {
            const places = mountain.filter(p => p.region === area.region);
            if (places.length === 0) return null;
            return (
              <section key={area.region}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-black text-mountain-dark flex items-center gap-2">
                      <Mountain className="w-4 h-4 text-primary" />
                      {t(area.label, area.labelJa)}
                    </h2>
                    <p className="text-xs text-muted-foreground">{t(area.desc, area.descJa)}</p>
                  </div>
                  <a href={bookingRegionUrl(area.region)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline shrink-0">
                    <Search className="w-3 h-3" /> {t("Search area", "エリア検索")}
                  </a>
                </div>
                <PlaceList places={places} t={t} />
              </section>
            );
          })}
          {mountain.length === 0 && <EmptyState t={t} />}
        </div>
      )}

      {/* IN TOWN */}
      {tab === "town" && (
        <div className="space-y-6">
          {TOWN_AREAS.map(area => {
            const places = town.filter(p => p.region === area.region);
            if (places.length === 0) return null;
            return (
              <section key={area.region}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-black text-mountain-dark">
                      {area.emoji} {t(area.label, area.labelJa)}
                    </h2>
                    <p className="text-xs text-muted-foreground">{t(area.desc, area.descJa)}</p>
                  </div>
                  <a href={bookingRegionUrl(area.region)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline shrink-0">
                    <Search className="w-3 h-3" /> {t("Search area", "エリア検索")}
                  </a>
                </div>
                <PlaceList places={places} t={t} />
              </section>
            );
          })}
          {town.length === 0 && <EmptyState t={t} />}
        </div>
      )}
    </div>
  );
}

function PlaceList({ places, t }: { places: any[]; t: (en: string, ja: string | null) => string }) {
  return (
    <div className="space-y-2">
      {places.map((place, idx) => (
        <motion.div
          key={place.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04 }}
        >
          <a
            href={bookingSearchUrl(place.name + " Yamanouchi Japan")}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white border border-slate-200 rounded-xl p-3.5 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-start gap-3">
              {/* Type icon */}
              <div className="text-2xl mt-0.5 shrink-0">
                {TYPE_EMOJI[place.type] || "🏨"}
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
                  {place.skiInSkiOut && (
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
                <span className="text-[8px] text-blue-500 font-bold">Booking.com</span>
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
