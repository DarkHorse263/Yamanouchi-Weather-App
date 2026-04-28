import { useLanguage } from "@/hooks/use-language";
import { Card, Badge } from "@/components/ui-elements";
import { useState } from "react";
import { MapPin, Phone, Globe, Bath, CableCar } from "lucide-react";
import { motion } from "framer-motion";
import { ACCOMMODATION } from "@/data/seed-data";

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
        <p className="text-muted-foreground mt-1">{t("Accommodation across Nagano's ski regions", "長野県スキーエリアの宿泊施設")}</p>
      </div>

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

                <div className="flex gap-2 mt-auto pt-3 border-t border-border">
                  <a
                    href={mapsUrl(place.lat, place.lng, place.name)}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" /> {t("Map", "地図")}
                  </a>
                  {place.phone && (
                    <a href={`tel:${place.phone}`} className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 transition-colors">
                      <Phone className="w-3.5 h-3.5" /> {t("Call", "電話")}
                    </a>
                  )}
                  {place.websiteUrl && (
                    <a href={place.websiteUrl} target="_blank" rel="noreferrer"
                      className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
                      <Globe className="w-3.5 h-3.5" /> {t("Book", "予約")}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
