import { useGetAttractions } from "@workspace/api-client-react";
import { useLanguage } from "@workspace/feelzlike-shell";
import { Card, Badge, LoadingScreen, ErrorScreen } from "../components/ui-elements";
import { useState } from "react";
import { MapPin, Ticket, Clock, ExternalLink, Map, Expand } from "lucide-react";
import { motion } from "framer-motion";

type FilterType = "all" | "onsen" | "culture" | "nature" | "activity";

export default function Explore({ embedded = false }: { embedded?: boolean }) {
  const { t } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState<FilterType>("all");
  const [mapExpanded, setMapExpanded] = useState(false);

  const { data, isLoading, error } = useGetAttractions({
    category: categoryFilter === "all" ? undefined : categoryFilter,
  } as any);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;

  const filters: { value: FilterType; label: string; labelJa: string }[] = [
    { value: "all", label: "All", labelJa: "すべて" },
    { value: "onsen", label: "Hot Springs", labelJa: "温泉" },
    { value: "culture", label: "Culture", labelJa: "文化" },
    { value: "nature", label: "Nature", labelJa: "自然" },
    { value: "activity", label: "Activities", labelJa: "アクティビティ" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground">{t("Explore Yamanouchi", "山ノ内を探索")}</h1>
          <p className="text-muted-foreground mt-1">{t("Every hotel, restaurant, onsen and attraction - all in one place", "ホテル・レストラン・温泉・観光スポットをまとめて検索")}</p>
        </div>
      )}

      {/* Official Interactive Map */}
      <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
        {/* Map header */}
        <div className="flex items-center justify-between px-4 py-3 bg-foreground text-background">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-primary" />
            <div>
              <p className="font-bold text-sm leading-tight">{t("Official Yamanouchi Digital Map", "山ノ内町公式デジタルマップ")}</p>
              <p className="text-[10px] text-white/60">{t("All registered businesses • Powered by Yamanouchi Tourism Bureau", "全登録施設 • 山ノ内まちづくり観光局公式")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMapExpanded(v => !v)}
              className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Expand className="w-3 h-3" />
              {mapExpanded ? t("Collapse", "縮小") : t("Expand", "拡大")}
            </button>
            <a
              href="https://platinumaps.jp/d/yamanouchi?culture=en"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {t("Full screen", "全画面")}
            </a>
          </div>
        </div>

        {/* Category quick-links inside the map bar */}
        <div className="flex gap-2 px-4 py-2 glass-strong overflow-x-auto hide-scrollbar text-white/80 text-xs">
          {[
            { label: t("🏨 Stay", "🏨 宿泊"), url: "https://platinumaps.jp/d/yamanouchi?culture=en&c=stay" },
            { label: t("🍜 Eat", "🍜 飲食"), url: "https://platinumaps.jp/d/yamanouchi?culture=en&c=eat" },
            { label: t("♨️ Onsen", "♨️ 温泉"), url: "https://platinumaps.jp/d/yamanouchi?culture=en&c=onsen" },
            { label: t("🎿 Ski", "🎿 スキー"), url: "https://platinumaps.jp/d/yamanouchi?culture=en&c=ski" },
            { label: t("🐒 Monkeys", "🐒 野猿"), url: "https://platinumaps.jp/d/yamanouchi?culture=en&c=nature" },
          ].map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="whitespace-nowrap font-bold hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/10"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* The iframe */}
        <div
          className="transition-all duration-500 ease-in-out"
          style={{ height: mapExpanded ? "70vh" : "420px" }}
        >
          <iframe
            src="https://platinumaps.jp/d/yamanouchi?culture=en"
            className="w-full h-full border-0"
            title={t("Yamanouchi Digital Map", "山ノ内町デジタルマップ")}
            loading="lazy"
            allow="geolocation"
          />
        </div>

        {/* Footer note */}
        <div className="px-4 py-2 bg-secondary/50 text-[10px] text-muted-foreground text-center">
          {t(
            "Map data © Yamanouchi Tourism Bureau · Use the category links above to filter by type",
            "地図データ © 山ノ内まちづくり観光局 · 上のカテゴリリンクで絞り込み"
          )}
        </div>
      </div>

      {/* Curated Highlights section */}
      {data && data.length > 0 && (
        <div>
          <h2 className="text-xl font-black text-foreground mb-1">{t("Curated Highlights", "おすすめスポット")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("Hand-picked attractions from our local team", "地元チームが厳選した観光スポット")}</p>

          <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-4">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setCategoryFilter(f.value)}
                className={`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
                  categoryFilter === f.value
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {t(f.label, f.labelJa)}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full flex flex-col p-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 relative flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-5xl">
                        {item.category === "onsen" ? "♨️" : item.category === "nature" ? "🌲" : item.category === "culture" ? "🏯" : "🎿"}
                      </span>
                    )}
                    <Badge
                      variant="default"
                      className="absolute top-3 right-3 glass-strong text-foreground shadow-sm capitalize"
                    >
                      {item.category}
                    </Badge>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1 leading-tight">
                      {t(item.name, item.nameJa)}
                    </h3>
                    <p className="text-sm line-clamp-3 mb-4 text-muted-foreground flex-1">
                      {t(item.description, item.descriptionJa)}
                    </p>

                    <div className="space-y-1.5 pt-3 border-t border-border text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                        <span className="line-clamp-1">{t(item.address || item.region, item.addressJa || item.region)}</span>
                      </div>
                      {item.openingHours && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-orange-500" />
                          <span>{item.openingHours}</span>
                        </div>
                      )}
                      {item.admissionFee && (
                        <div className="flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          <span>{t(item.admissionFee, null)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
