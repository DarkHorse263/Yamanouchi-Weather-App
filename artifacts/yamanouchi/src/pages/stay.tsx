import { useGetAccommodation } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Card, Badge, LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { useState } from "react";
import { MapPin, Phone, Globe, Bath, CableCar } from "lucide-react";
import { motion } from "framer-motion";

type FilterType = "all" | "hotel" | "ryokan" | "guesthouse" | "apartment";

export default function Stay() {
  const { t } = useLanguage();
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  
  const { data, isLoading, error } = useGetAccommodation({ 
    type: typeFilter === "all" ? undefined : typeFilter 
  } as any); // using any here to bypass strict generated type checking if all isn't technically supported in query

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;

  const filters: { value: FilterType, label: string }[] = [
    { value: "all", label: "All" },
    { value: "hotel", label: "Hotels" },
    { value: "ryokan", label: "Ryokan" },
    { value: "guesthouse", label: "Guesthouses" },
    { value: "apartment", label: "Apartments" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-mountain-dark">{t("Where to Stay", "宿泊施設")}</h1>
        <p className="text-muted-foreground mt-2">{t("Find the perfect basecamp in Yamanouchi", "山ノ内町の完璧なベースキャンプを見つける")}</p>
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
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map((place, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={place.id}
          >
            <Card className="h-full flex flex-col p-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-48 bg-secondary relative overflow-hidden">
                {place.imageUrl ? (
                  <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200">
                    <span className="text-slate-400 text-4xl">🏨</span>
                  </div>
                )}
                {place.featured && (
                  <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-black uppercase px-2 py-1 rounded-md shadow-md">
                    Featured
                  </div>
                )}
                <div className="absolute bottom-3 right-3 flex gap-1">
                  {place.onsenAvailable && (
                    <div className="bg-white/90 backdrop-blur text-blue-600 p-1.5 rounded-full shadow-sm" title="Onsen Available">
                      <Bath className="w-4 h-4" />
                    </div>
                  )}
                  {place.skiInSkiOut && (
                    <div className="bg-white/90 backdrop-blur text-primary p-1.5 rounded-full shadow-sm" title="Ski-in / Ski-out">
                      <CableCar className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-[10px]">{place.type}</Badge>
                  {place.priceRange && <span className="font-bold text-emerald-600">{place.priceRange}</span>}
                </div>
                
                <h3 className="text-xl font-bold text-mountain-dark mb-1">
                  {t(place.name, place.nameJa)}
                </h3>
                
                <p className="text-sm text-muted-foreground flex items-start gap-1.5 mb-3">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  <span className="line-clamp-1">{t(place.address || place.region, place.addressJa || place.region)}</span>
                </p>
                
                <p className="text-sm line-clamp-3 mb-4 text-mountain-dark/80">
                  {t(place.description, place.descriptionJa)}
                </p>
                
                <div className="mt-auto pt-4 border-t border-border flex gap-3">
                  {place.phone && (
                    <a href={`tel:${place.phone}`} className="flex-1 flex justify-center items-center gap-2 py-2 rounded-xl bg-secondary text-mountain-dark font-bold text-sm hover:bg-secondary/80 transition-colors">
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  )}
                  {place.websiteUrl && (
                    <a href={place.websiteUrl} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-2 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
                      <Globe className="w-4 h-4" /> Book
                    </a>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
        {data?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No accommodation found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
