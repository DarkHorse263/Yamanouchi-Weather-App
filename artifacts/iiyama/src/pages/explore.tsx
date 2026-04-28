import { useLanguage } from "@/hooks/use-language";
import { Card, Badge } from "@/components/ui-elements";
import { useState } from "react";
import { MapPin, Ticket, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { ATTRACTIONS } from "@/data/seed-data";

type FilterType = "all" | "onsen" | "culture" | "nature" | "activity";

export default function Explore() {
  const { t } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState<FilterType>("all");

  const filtered = categoryFilter === "all"
    ? ATTRACTIONS
    : ATTRACTIONS.filter(a => a.category === categoryFilter);

  const filters: { value: FilterType; label: string; labelJa: string }[] = [
    { value: "all", label: "All", labelJa: "すべて" },
    { value: "onsen", label: "Hot Springs", labelJa: "温泉" },
    { value: "culture", label: "Culture", labelJa: "文化" },
    { value: "nature", label: "Nature", labelJa: "自然" },
    { value: "activity", label: "Activities", labelJa: "アクティビティ" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground">{t("Explore Nagano", "長野を探索")}</h1>
        <p className="text-muted-foreground mt-1">{t("Attractions, onsen, culture and activities across the prefecture", "長野県全域の観光・温泉・文化・アクティビティ")}</p>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-5">
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
        {filtered.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="h-full flex flex-col p-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 relative flex items-center justify-center overflow-hidden">
                <span className="text-5xl">
                  {item.category === "onsen" ? "♨️" : item.category === "nature" ? "🌲" : item.category === "culture" ? "🏯" : "🎿"}
                </span>
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
  );
}
