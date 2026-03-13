import { useGetAttractions } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Card, Badge, LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { useState } from "react";
import { MapPin, Ticket, Clock } from "lucide-react";
import { motion } from "framer-motion";

type FilterType = "all" | "onsen" | "culture" | "nature" | "activity" | "shopping";

export default function Explore() {
  const { t } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState<FilterType>("all");
  
  const { data, isLoading, error } = useGetAttractions({ 
    category: categoryFilter === "all" ? undefined : categoryFilter 
  } as any);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;

  const filters: { value: FilterType, label: string, labelJa: string }[] = [
    { value: "all", label: "All", labelJa: "すべて" },
    { value: "onsen", label: "Hot Springs", labelJa: "温泉" },
    { value: "culture", label: "Culture", labelJa: "文化" },
    { value: "nature", label: "Nature", labelJa: "自然" },
    { value: "activity", label: "Activities", labelJa: "アクティビティ" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-mountain-dark">{t("Explore", "観光")}</h1>
        <p className="text-muted-foreground mt-2">{t("Discover the magic of Yamanouchi beyond the slopes", "ゲレンデ以外の山ノ内町の魅力")}</p>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setCategoryFilter(f.value)}
            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
              categoryFilter === f.value 
                ? "bg-mountain-dark text-white" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t(f.label, f.labelJa)}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map((item, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={item.id}
          >
            <Card className="h-full flex flex-col p-0 overflow-hidden group">
               {/* 
                 {/*  stock images used properly here if we had them, but since we rely on DB URLs, 
                      we just render a nice placeholder if none exists 
                 */}
              <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 relative flex items-center justify-center">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                ) : (
                  <span className="text-4xl">{item.category === 'onsen' ? '♨️' : item.category === 'nature' ? '🌲' : '🏯'}</span>
                )}
                <Badge variant="default" className="absolute top-3 right-3 bg-white/90 backdrop-blur text-mountain-dark shadow-sm">
                  {item.category}
                </Badge>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-mountain-dark mb-2 leading-tight">
                  {t(item.name, item.nameJa)}
                </h3>
                
                <p className="text-sm line-clamp-3 mb-4 text-mountain-dark/80 flex-1">
                  {t(item.description, item.descriptionJa)}
                </p>
                
                <div className="space-y-2 mt-auto pt-4 border-t border-border text-sm text-muted-foreground bg-secondary/30 p-3 rounded-xl">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 text-primary" />
                    <span className="line-clamp-1">{t(item.address || item.region, item.addressJa || item.region)}</span>
                  </div>
                  {item.openingHours && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 shrink-0 text-primary" />
                      <span className="line-clamp-1">{item.openingHours}</span>
                    </div>
                  )}
                  {item.admissionFee && (
                    <div className="flex items-start gap-2">
                      <Ticket className="w-4 h-4 shrink-0 text-primary" />
                      <span className="line-clamp-1">{t(item.admissionFee, null)}</span>
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
