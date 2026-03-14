import { useLanguage } from "@/hooks/use-language";
import { Card } from "@/components/ui-elements";
import { HourlyTimeline } from "@/components/hourly-timeline";
import { Snowflake, Ruler, ThermometerSnowflake, Wind, CalendarDays, ExternalLink, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { getSeededResorts, type Resort } from "@/data/resorts";

type SortKey = "name" | "snow24h" | "baseDepth" | "elevation" | "temp";

const SORT_OPTIONS: { key: SortKey; label: string; labelJa: string }[] = [
  { key: "snow24h", label: "New Snow", labelJa: "新雪" },
  { key: "baseDepth", label: "Base Depth", labelJa: "積雪深" },
  { key: "elevation", label: "Elevation", labelJa: "標高" },
  { key: "name", label: "Name", labelJa: "名前" },
  { key: "temp", label: "Temperature", labelJa: "気温" },
];

function sortResorts(resorts: Resort[], sortKey: SortKey): Resort[] {
  const sorted = [...resorts];
  switch (sortKey) {
    case "snow24h":
      return sorted.sort((a, b) => b.snow24h - a.snow24h);
    case "baseDepth":
      return sorted.sort((a, b) => b.baseDepth - a.baseDepth);
    case "elevation":
      return sorted.sort((a, b) => b.elevation - a.elevation);
    case "temp":
      return sorted.sort((a, b) => a.temp - b.temp);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

export default function Resorts() {
  const { t } = useLanguage();
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("snow24h");

  const resorts = useMemo(() => getSeededResorts(), []);

  const regionList = useMemo(() => {
    const map = new Map<string, string>();
    resorts.forEach(r => { if (!map.has(r.region)) map.set(r.region, r.regionJa); });
    return Array.from(map.entries());
  }, [resorts]);

  const filtered = regionFilter === "all" ? resorts : resorts.filter(r => r.region === regionFilter);
  const sorted = useMemo(() => sortResorts(filtered, sortKey), [filtered, sortKey]);

  const grouped = sorted.reduce((acc, resort) => {
    const region = resort.region;
    if (!acc[region]) acc[region] = [];
    acc[region].push(resort);
    return acc;
  }, {} as Record<string, typeof resorts>);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-mountain-dark">{t("Ski Resorts", "スキー場")}</h1>
        <p className="text-muted-foreground mt-2">{t("All 80 Nagano Prefecture ski resorts", "長野県の全80スキー場")}</p>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
        <button
          onClick={() => setRegionFilter("all")}
          className={`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
            regionFilter === "all"
              ? "bg-mountain-dark text-white"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          {t("All Regions", "全エリア")} ({resorts.length})
        </button>
        {regionList.map(([name, nameJa]) => (
          <button
            key={name}
            onClick={() => setRegionFilter(name)}
            className={`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
              regionFilter === name
                ? "bg-mountain-dark text-white"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t(name, nameJa)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <ArrowUpDown className="w-3.5 h-3.5" />
          {t("Sort by", "並べ替え")}:
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                sortKey === opt.key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {t(opt.label, opt.labelJa)}
            </button>
          ))}
        </div>
      </div>

      <HourlyTimeline />

      {Object.entries(grouped).map(([region, regionResorts], regionIdx) => (
        <div key={region} className="space-y-4">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2 border-b border-border pb-2">
            {t(region, regionResorts[0]?.regionJa)}
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {regionResorts.length} {t("resorts", "スキー場")}
            </span>
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {regionResorts.map((resort, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(regionIdx * 0.05 + idx * 0.03, 0.5) }}
                key={resort.id}
              >
                <Card className="h-full flex flex-col hover:border-primary/40 transition-colors duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-mountain-dark leading-tight">
                        {t(resort.name, resort.nameJa)}
                      </h3>
                      <p className="text-xs text-muted-foreground">{resort.elevation}m</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl text-center flex flex-col justify-center">
                      <Snowflake className="w-3.5 h-3.5 text-blue-500 mx-auto mb-1" />
                      <div className="text-sm font-black text-blue-700">{resort.snow24h}</div>
                      <div className="text-[9px] font-bold text-blue-500 uppercase">{t("24h", "24h")}</div>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-xl text-center flex flex-col justify-center">
                      <Ruler className="w-3.5 h-3.5 text-indigo-500 mx-auto mb-1" />
                      <div className="text-sm font-black text-indigo-700">{resort.baseDepth}</div>
                      <div className="text-[9px] font-bold text-indigo-500 uppercase">{t("Base", "積雪")}</div>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-2 rounded-xl text-center flex flex-col justify-center">
                      <ThermometerSnowflake className="w-3.5 h-3.5 text-red-500 mx-auto mb-1" />
                      <div className="text-sm font-black text-red-700">{resort.temp}</div>
                      <div className="text-[9px] font-bold text-red-500 uppercase">{t("Temp", "気温")}</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl text-center flex flex-col justify-center">
                      <Wind className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
                      <div className="text-sm font-black text-emerald-700">{resort.wind}</div>
                      <div className="text-[9px] font-bold text-emerald-500 uppercase">{t("Wind", "風速")}</div>
                    </div>
                  </div>

                  {resort.snowTomorrow > 0 && (
                    <div className="mt-auto bg-orange-50 border border-orange-200 rounded-lg p-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-orange-700 font-bold">
                        <CalendarDays className="w-4 h-4" />
                        {t("Tomorrow", "明日")}
                      </div>
                      <div className="font-black text-orange-600">
                        +{resort.snowTomorrow} cm
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-border">
                    {resort.websiteUrl && (
                      <a
                        href={resort.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t("Official Website", "公式サイト")}
                      </a>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
