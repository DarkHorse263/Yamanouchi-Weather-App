import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { Bed, Utensils, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import Stay from "./stay";
import Eat from "./eat";
import Explore from "./explore";

type Tab = "stay" | "eat" | "explore";

const TABS: { id: Tab; label: string; labelJa: string; icon: typeof Bed }[] = [
  { id: "stay",    label: "Stay",    labelJa: "宿泊", icon: Bed },
  { id: "eat",     label: "Eat",     labelJa: "食事", icon: Utensils },
  { id: "explore", label: "Explore", labelJa: "観光", icon: Compass },
];

export default function Guide() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("stay");

  useEffect(() => {
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab") as Tab | null;
    if (tab && TABS.find(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Tab Bar */}
      <div className="sticky top-16 md:top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 pt-4 pb-0">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-black text-mountain-dark mb-3">
            {t("Visitor Guide", "観光ガイド")}
          </h1>
          <div className="flex gap-1">
            {TABS.map(({ id, label, labelJa, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-all",
                  activeTab === id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {t(label, labelJa)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content — each sub-page handles its own padding/layout */}
      <div className="flex-1 pt-2">
        {activeTab === "stay"    && <Stay    embedded />}
        {activeTab === "eat"     && <Eat     embedded />}
        {activeTab === "explore" && <Explore embedded />}
      </div>
    </div>
  );
}
