import { useLanguage } from "@/hooks/use-language";
import { Card, Badge } from "@/components/ui-elements";
import { useState } from "react";
import { MapPin, Clock, ExternalLink, Utensils } from "lucide-react";
import { motion } from "framer-motion";
import { DINING } from "@/data/seed-data";

type FilterType = "all" | "restaurant" | "bar" | "cafe";

function mapsUrl(lat: number | null, lng: number | null, name: string) {
  if (lat && lng) return `https://maps.google.com/?q=${lat},${lng}`;
  return `https://maps.google.com/?q=${encodeURIComponent(name + " Nagano Japan")}`;
}

function photoSrc(venue: { type: string; cuisine?: string | null }, base: string) {
  const { type, cuisine } = venue;
  const cuisineLower = (cuisine ?? "").toLowerCase();
  if (type === "cafe") return `${base}images/cafe-mountain.png`;
  if (type === "bar") {
    return `${base}images/${cuisineLower.includes("sake") ? "bar-sake" : "bar-apres"}.png`;
  }
  if (cuisineLower.includes("izakaya")) return `${base}images/restaurant-izakaya.png`;
  return `${base}images/restaurant-japanese.png`;
}

export default function Eat() {
  const { t } = useLanguage();
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");

  const filtered = DINING.filter(v =>
    typeFilter === "all" || v.type === typeFilter
  );

  const typeFilters: { value: FilterType; label: string; labelJa: string }[] = [
    { value: "all", label: "All", labelJa: "すべて" },
    { value: "restaurant", label: "Restaurants", labelJa: "レストラン" },
    { value: "bar", label: "Bars", labelJa: "バー" },
    { value: "cafe", label: "Cafes", labelJa: "カフェ" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground">{t("Eat & Drink", "飲食")}</h1>
        <p className="text-muted-foreground mt-1">{t("Dining across Nagano's ski regions", "長野県スキーエリアのダイニング")}</p>
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
        {filtered.map((venue, idx) => (
          <motion.div key={venue.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <Card className="h-full flex flex-col p-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-36 bg-secondary relative overflow-hidden">
                <img
                  src={photoSrc(venue, import.meta.env.BASE_URL)}
                  alt={venue.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2.5 left-3 right-3 flex justify-between items-end">
                  <Badge className="text-[10px] bg-white/20 text-white border-white/30 backdrop-blur capitalize">
                    {t(venue.type, null)}
                  </Badge>
                  {venue.priceRange && <span className="font-black text-white text-sm drop-shadow">{venue.priceRange}</span>}
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-foreground leading-snug mb-0.5">{t(venue.name, venue.nameJa)}</h3>
                {venue.cuisine && (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    {t(venue.cuisine, venue.cuisineJa)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-3">
                  {t(venue.description, venue.descriptionJa)}
                </p>

                <div className="space-y-1 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
                    <span className="line-clamp-1">{t(venue.address || venue.region, venue.addressJa || venue.region)}</span>
                  </div>
                  {venue.openingHours && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-orange-500/70 shrink-0" />
                      <span>{venue.openingHours}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-border mt-auto">
                  <a
                    href={mapsUrl(venue.lat, venue.lng, venue.name)}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" /> {t("Map", "地図")}
                  </a>
                  {venue.websiteUrl ? (
                    <a href={venue.websiteUrl} target="_blank" rel="noreferrer"
                      className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> {t("Website", "サイト")}
                    </a>
                  ) : (
                    <div className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-secondary/50 text-muted-foreground text-xs">
                      <Utensils className="w-3.5 h-3.5" /> {t("Dine in", "店内飲食")}
                    </div>
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
