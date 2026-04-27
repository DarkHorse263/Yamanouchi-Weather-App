import { useGetDining } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Card, Badge, LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { useState } from "react";
import { MapPin, Clock, ExternalLink, Utensils, Mountain } from "lucide-react";
import { motion } from "framer-motion";

type LocationTab = "mountain" | "town";
type FilterType = "all" | "restaurant" | "bar" | "cafe";

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

function photoSrc(venue: { type: string; region: string; cuisine?: string | null }, base: string) {
  const { type, region, cuisine } = venue;
  const cuisineLower = (cuisine ?? "").toLowerCase();
  if (type === "cafe") return `${base}images/cafe-mountain.png`;
  if (type === "bar") {
    return `${base}images/${cuisineLower.includes("sake") || cuisineLower.includes("日本酒") ? "bar-sake" : "bar-apres"}.png`;
  }
  if (type === "restaurant") {
    if (ON_MOUNTAIN_REGIONS.includes(region)) return `${base}images/restaurant-ski-lodge.png`;
    if (cuisineLower.includes("izakaya") || cuisineLower.includes("居酒屋")) return `${base}images/restaurant-izakaya.png`;
    return `${base}images/restaurant-japanese.png`;
  }
  return `${base}images/restaurant.png`;
}

export default function Eat({ embedded = false }: { embedded?: boolean }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<LocationTab>("mountain");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");

  const { data: all, isLoading, error } = useGetDining({} as any);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;

  const filtered = (all ?? []).filter(v =>
    typeFilter === "all" || v.type === typeFilter
  );

  const mountain = filtered.filter(v => ON_MOUNTAIN.includes(v.region));
  const town = filtered.filter(v => !ON_MOUNTAIN.includes(v.region));

  const typeFilters: { value: FilterType; label: string; labelJa: string }[] = [
    { value: "all", label: "All", labelJa: "すべて" },
    { value: "restaurant", label: "Restaurants", labelJa: "レストラン" },
    { value: "bar", label: "Bars", labelJa: "バー" },
    { value: "cafe", label: "Cafes", labelJa: "カフェ" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground">{t("Eat & Drink", "飲食")}</h1>
          <p className="text-muted-foreground mt-1">{t("Refuel after a long day on the mountain", "山での長い一日の後のエネルギー補給")}</p>
        </div>
      )}

      {/* Location tabs */}
      <div className="flex rounded-xl bg-secondary p-1 gap-1">
        {([["mountain", "⛷️ On Mountain", "⛷️ 山の上"], ["town", "🏘️ In Town", "🏘️ 町内"]] as const).map(([v, en, ja]) => (
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
        <div className="space-y-8">
          {MOUNTAIN_AREAS.map(area => {
            const venues = mountain.filter(v => v.region === area.region);
            if (venues.length === 0) return null;
            return (
              <section key={area.region}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                      <Mountain className="w-5 h-5 text-primary" />
                      {t(area.label, area.labelJa)}
                    </h2>
                    <p className="text-sm text-muted-foreground">{t(area.desc, area.descJa)}</p>
                  </div>
                  {area.url && (
                    <a href={area.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0">
                      <ExternalLink className="w-3 h-3" /> {t("Resort site", "リゾートサイト")}
                    </a>
                  )}
                </div>
                <VenueGrid venues={venues} t={t} />
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
            const venues = town.filter(v => v.region === area.region);
            if (venues.length === 0) return null;
            return (
              <section key={area.region}>
                <div className="mb-4">
                  <h2 className="text-xl font-black text-foreground">
                    {area.emoji} {t(area.label, area.labelJa)}
                  </h2>
                  <p className="text-sm text-muted-foreground">{t(area.desc, area.descJa)}</p>
                </div>
                <VenueGrid venues={venues} t={t} />
              </section>
            );
          })}
          {town.length === 0 && <EmptyState t={t} />}
        </div>
      )}
    </div>
  );
}

function VenueGrid({ venues, t }: { venues: any[]; t: (en: string, ja: string | null) => string }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {venues.map((venue, idx) => (
        <motion.div key={venue.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
          <Card className="h-full flex flex-col p-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            {/* Photo */}
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

            {/* Body */}
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

              {/* Meta */}
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

              {/* Actions */}
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
  );
}

function EmptyState({ t }: { t: (en: string, ja: string) => string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      {t("No venues found matching your filters.", "フィルターに一致する場所が見つかりません。")}
    </div>
  );
}
