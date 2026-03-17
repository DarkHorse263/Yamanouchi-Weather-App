import { useGetAccommodation } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Card, Badge, LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { useState } from "react";
import { MapPin, Phone, Globe, Bath, CableCar, ExternalLink, Mountain, Search } from "lucide-react";
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

function mapsUrl(lat: number | null, lng: number | null, name: string) {
  if (lat && lng) return `https://maps.google.com/?q=${lat},${lng}`;
  return `https://maps.google.com/?q=${encodeURIComponent(name + " Yamanouchi Nagano Japan")}`;
}

const ON_MOUNTAIN_REGIONS = ["Shiga Kogen", "Ryuoo"];

const HOTEL_MOUNTAIN_IMGS = ["hotel-ski.png", "hotel-mountain-lodge.png", "chalet-snow.png"];
const HOTEL_TOWN_IMGS = ["hotel-town.png", "hotel.png"];
const RYOKAN_MOUNTAIN_IMGS = ["ryokan-exterior.png", "ryokan-room.png"];
const RYOKAN_TOWN_IMGS = ["ryokan-onsen.png", "ryokan-historic.png"];
const GUESTHOUSE_MOUNTAIN_IMGS = ["guesthouse-cozy.png", "chalet-snow.png"];
const GUESTHOUSE_TOWN_IMGS = ["guesthouse-backpacker.png", "guesthouse-cozy.png"];

function nameHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function photoSrc(place: { name: string; type: string; region: string; featured?: boolean }, base: string) {
  const { name, type, region } = place;
  const isMountain = ON_MOUNTAIN_REGIONS.includes(region);
  const h = nameHash(name);

  let pool: string[];
  if (type === "ryokan") {
    pool = isMountain ? RYOKAN_MOUNTAIN_IMGS : RYOKAN_TOWN_IMGS;
  } else if (type === "guesthouse") {
    pool = isMountain ? GUESTHOUSE_MOUNTAIN_IMGS : GUESTHOUSE_TOWN_IMGS;
  } else {
    pool = isMountain ? HOTEL_MOUNTAIN_IMGS : HOTEL_TOWN_IMGS;
  }

  return `${base}images/${pool[h % pool.length]}`;
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {!embedded && (
        <>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-mountain-dark">{t("Where to Stay", "宿泊施設")}</h1>
            <p className="text-muted-foreground mt-1">{t("Find the perfect basecamp in Yamanouchi", "山ノ内町の完璧なベースキャンプを見つける")}</p>
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
                <p className="text-lg font-black mt-0.5">{t("Search Hotels in Yamanouchi", "山ノ内町のホテルを検索")}</p>
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
        <div className="space-y-8">
          {MOUNTAIN_AREAS.map(area => {
            const places = mountain.filter(p => p.region === area.region);
            if (places.length === 0) return null;
            return (
              <section key={area.region}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black text-mountain-dark flex items-center gap-2">
                      <Mountain className="w-5 h-5 text-primary" />
                      {t(area.label, area.labelJa)}
                    </h2>
                    <p className="text-sm text-muted-foreground">{t(area.desc, area.descJa)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <a href={bookingRegionUrl(area.region)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                      <Search className="w-3 h-3" /> Booking.com
                    </a>
                    {area.url && (
                      <a href={area.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                        <ExternalLink className="w-3 h-3" /> {t("Resort site", "リゾートサイト")}
                      </a>
                    )}
                  </div>
                </div>
                <PlaceGrid places={places} t={t} />
              </section>
            );
          })}
          {mountain.length === 0 && <EmptyState t={t} />}
        </div>
      )}

      {/* IN TOWN */}
      {tab === "town" && (
        <div className="space-y-8">
          {TOWN_AREAS.map(area => {
            const places = town.filter(p => p.region === area.region);
            if (places.length === 0) return null;
            return (
              <section key={area.region}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black text-mountain-dark">
                      {area.emoji} {t(area.label, area.labelJa)}
                    </h2>
                    <p className="text-sm text-muted-foreground">{t(area.desc, area.descJa)}</p>
                  </div>
                  <a href={bookingRegionUrl(area.region)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline shrink-0">
                    <Search className="w-3 h-3" /> Booking.com
                  </a>
                </div>
                <PlaceGrid places={places} t={t} />
              </section>
            );
          })}
          {town.length === 0 && <EmptyState t={t} />}
        </div>
      )}
    </div>
  );
}

function PlaceGrid({ places, t }: { places: any[]; t: (en: string, ja: string | null) => string; }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {places.map((place, idx) => (
        <motion.div key={place.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
          <Card className="h-full flex flex-col p-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            {/* Photo */}
            <div className="h-44 bg-secondary relative overflow-hidden">
              <img
                src={photoSrc(place, import.meta.env.BASE_URL)}
                alt={place.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              {place.featured && (
                <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md shadow">
                  {t("Featured", "おすすめ")}
                </div>
              )}
              <div className="absolute bottom-3 right-3 flex gap-1.5">
                {place.onsenAvailable && (
                  <span title={t("Onsen", "温泉")} className="bg-white/90 backdrop-blur text-blue-600 p-1.5 rounded-full shadow-sm">
                    <Bath className="w-3.5 h-3.5" />
                  </span>
                )}
                {place.skiInSkiOut && (
                  <span title={t("Ski-in / Ski-out", "スキーイン・アウト")} className="bg-white/90 backdrop-blur text-primary p-1.5 rounded-full shadow-sm">
                    <CableCar className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-2">
                <Badge variant="outline" className="text-[10px] capitalize">{t(place.type, null)}</Badge>
                {place.priceRange && <span className="font-black text-emerald-600 text-sm">{place.priceRange}</span>}
              </div>
              <h3 className="font-bold text-mountain-dark leading-snug mb-1">{t(place.name, place.nameJa)}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
                {t(place.address || place.region, place.addressJa || place.region)}
              </p>
              <p className="text-sm text-mountain-dark/80 line-clamp-2 flex-1 mb-4">
                {t(place.description, place.descriptionJa)}
              </p>

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-3 border-t border-border">
                <a
                  href={mapsUrl(place.lat, place.lng, place.name)}
                  target="_blank" rel="noreferrer"
                  className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-secondary text-mountain-dark font-bold text-xs hover:bg-secondary/80 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" /> {t("Map", "地図")}
                </a>
                {place.phone && (
                  <a href={`tel:${place.phone}`} className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-secondary text-mountain-dark font-bold text-xs hover:bg-secondary/80 transition-colors">
                    <Phone className="w-3.5 h-3.5" /> {t("Call", "電話")}
                  </a>
                )}
                <a
                  href={bookingSearchUrl(place.name + " Yamanouchi Japan")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
                >
                  <Search className="w-3.5 h-3.5" /> {t("Book", "予約")}
                </a>
              </div>
            </div>
          </Card>
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
