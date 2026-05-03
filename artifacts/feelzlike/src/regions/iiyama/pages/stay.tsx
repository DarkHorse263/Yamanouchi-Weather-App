import { useLanguage } from "@workspace/feelzlike-shell";
import { Card, Badge } from "../components/ui-elements";
import { useState } from "react";
import { MapPin, Phone, Globe, Bath, CableCar, BedDouble, Star } from "lucide-react";
import { motion } from "framer-motion";
import { ACCOMMODATION } from "../data/seed-data";
import { StayPlatformBar } from "@/components/StayPlatformBar";
import { useNearbyPlaces } from "@/lib/places";

const IIYAMA_CENTER = { lat: 36.851, lng: 138.366 };

type FilterType = "all" | "hotel" | "ryokan" | "guesthouse";

function mapsUrl(lat: number | null, lng: number | null, name: string) {
  if (lat && lng) return `https://maps.google.com/?q=${lat},${lng}`;
  return `https://maps.google.com/?q=${encodeURIComponent(name + " Nagano Japan")}`;
}

function photoSrc(place: { type: string; region: string; featured?: boolean }, base: string) {
  const { type, featured } = place;
  if (type === "ryokan") return `${base}images/${featured ? "ryokan-exterior" : "ryokan-room"}.png`;
  if (type === "guesthouse") return `${base}images/guesthouse-cozy.png`;
  return `${base}images/hotel-ski.png`;
}

export default function Stay() {
  const { t } = useLanguage();
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");

  const filtered = ACCOMMODATION.filter(p =>
    typeFilter === "all" || p.type === typeFilter
  );

  const typeFilters: { value: FilterType; label: string; labelJa: string }[] = [
    { value: "all", label: "All", labelJa: "すべて" },
    { value: "hotel", label: "Hotels", labelJa: "ホテル" },
    { value: "ryokan", label: "Ryokan", labelJa: "旅館" },
    { value: "guesthouse", label: "Guesthouses", labelJa: "ゲストハウス" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground">{t("Where to Stay", "宿泊施設")}</h1>
        <p className="text-muted-foreground mt-1">{t("Accommodation across Nagano's ski regions · Compare 8 booking sites", "長野県スキーエリアの宿泊施設 · 8つの予約サイトで比較")}</p>
      </div>

      <StayPlatformBar
        variant="banner"
        country="JP"
        query="Iiyama, Nagano, Japan"
        lat={IIYAMA_CENTER.lat}
        lng={IIYAMA_CENTER.lng}
      />

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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((place, idx) => (
          <motion.div key={place.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <Card className="h-full flex flex-col p-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
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

              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="outline" className="text-[10px] capitalize">{t(place.type, null)}</Badge>
                  {place.priceRange && <span className="font-black text-emerald-600 text-sm">{place.priceRange}</span>}
                </div>
                <h3 className="font-bold text-foreground leading-snug mb-1">{t(place.name, place.nameJa)}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
                  {t(place.address || place.region, place.addressJa || place.region)}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">
                  {t(place.description, place.descriptionJa)}
                </p>

                <div className="mt-auto pt-3 border-t border-border space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {t("Compare prices", "価格を比較")}
                  </p>
                  <StayPlatformBar
                    variant="card"
                    country="JP"
                    query={`${place.name} ${place.region} Nagano Japan`}
                    lat={place.lat ?? IIYAMA_CENTER.lat}
                    lng={place.lng ?? IIYAMA_CENTER.lng}
                  />
                  <div className="flex gap-2 pt-1">
                    <a
                      href={mapsUrl(place.lat, place.lng, place.name)}
                      target="_blank" rel="noreferrer"
                      className="flex-1 flex justify-center items-center gap-1.5 py-1.5 rounded-md bg-secondary text-foreground font-bold text-[11px] hover:bg-secondary/80 transition-colors"
                    >
                      <MapPin className="w-3 h-3" /> {t("Map", "地図")}
                    </a>
                    {place.phone && (
                      <a href={`tel:${place.phone}`} className="flex-1 flex justify-center items-center gap-1.5 py-1.5 rounded-md bg-secondary text-foreground font-bold text-[11px] hover:bg-secondary/80 transition-colors">
                        <Phone className="w-3 h-3" /> {t("Call", "電話")}
                      </a>
                    )}
                    {place.websiteUrl && (
                      <a href={place.websiteUrl} target="_blank" rel="noreferrer"
                        className="flex-1 flex justify-center items-center gap-1.5 py-1.5 rounded-md bg-secondary text-foreground font-bold text-[11px] hover:bg-secondary/80 transition-colors">
                        <Globe className="w-3 h-3" /> {t("Site", "公式")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Google Places — live discovery across all of Iiyama */}
      <GooglePlacesStaySection t={t} />
    </div>
  );
}

function GooglePlacesStaySection({ t }: { t: (en: string, ja: string | null) => string }) {
  const { data, isLoading, error } = useNearbyPlaces({
    lat: IIYAMA_CENTER.lat,
    lng: IIYAMA_CENTER.lng,
    radius: 10000,
    kind: "stay",
    max: 24,
  });

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
            {t("Live results from Google · compare across 8 booking sites", "Googleからのライブ結果 · 8つの予約サイトで比較")}
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && places.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    query={`${p.name} Iiyama Nagano`}
                    lat={p.lat ?? IIYAMA_CENTER.lat}
                    lng={p.lng ?? IIYAMA_CENTER.lng}
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
