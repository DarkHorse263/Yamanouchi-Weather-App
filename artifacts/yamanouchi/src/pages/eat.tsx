import { useGetDining } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Card, Badge, LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { useState } from "react";
import { MapPin, Clock, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

type FilterType = "all" | "restaurant" | "bar" | "cafe";

export default function Eat() {
  const { t } = useLanguage();
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  
  const { data, isLoading, error } = useGetDining({ 
    type: typeFilter === "all" ? undefined : typeFilter 
  } as any);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;

  const filters: { value: FilterType, label: string, labelJa: string }[] = [
    { value: "all", label: "All", labelJa: "すべて" },
    { value: "restaurant", label: "Restaurants", labelJa: "レストラン" },
    { value: "bar", label: "Bars", labelJa: "バー" },
    { value: "cafe", label: "Cafes", labelJa: "カフェ" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-mountain-dark">{t("Eat & Drink", "飲食")}</h1>
        <p className="text-muted-foreground mt-2">{t("Refuel after a long day on the mountain", "山での長い一日の後のエネルギー補給")}</p>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
              typeFilter === f.value 
                ? "bg-mountain-dark text-white" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t(f.label, f.labelJa)}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map((venue, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={venue.id}
          >
            <Card className="h-full flex flex-col p-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-40 bg-secondary relative overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}images/${venue.type === 'bar' ? 'bar' : 'restaurant'}.png`}
                  alt={venue.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                  <Badge variant="default" className="text-[10px] bg-white/20 text-white border-white/30 backdrop-blur">{venue.type}</Badge>
                  {venue.priceRange && <span className="font-bold text-white text-sm drop-shadow">{venue.priceRange}</span>}
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-mountain-dark mb-1 leading-tight">
                {t(venue.name, venue.nameJa)}
              </h3>
              
              {venue.cuisine && (
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                  {t(venue.cuisine, venue.cuisineJa)}
                </p>
              )}
              
              <p className="text-sm line-clamp-3 mb-4 text-mountain-dark/80 flex-1">
                {t(venue.description, venue.descriptionJa)}
              </p>
              
              <div className="space-y-2 mt-auto pt-4 border-t border-border text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary/70" />
                  <span className="line-clamp-1">{t(venue.address || venue.region, venue.addressJa || venue.region)}</span>
                </div>
                {venue.openingHours && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-orange-500/70" />
                    <span className="line-clamp-1">{venue.openingHours}</span>
                  </div>
                )}
                {venue.websiteUrl && (
                  <div className="flex items-start gap-2 mt-2">
                    <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 text-blue-500/70" />
                    <a href={venue.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                      Visit Website
                    </a>
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
