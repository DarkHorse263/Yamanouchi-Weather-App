import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  MountainSnow, 
  Map as MapIcon, 
  CloudSnow, 
  BellRing, 
  Bed, 
  Utensils, 
  Compass,
  Menu,
  X
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home", labelJa: "ホーム" },
  { path: "/resorts", icon: MountainSnow, label: "Resorts", labelJa: "スキー場" },
  { path: "/map", icon: MapIcon, label: "Map", labelJa: "マップ" },
  { path: "/outlook", icon: CloudSnow, label: "Outlook", labelJa: "予報" },
  { path: "/alerts", icon: BellRing, label: "Alerts", labelJa: "アラート" },
  { path: "/stay", icon: Bed, label: "Stay", labelJa: "宿泊" },
  { path: "/eat", icon: Utensils, label: "Eat", labelJa: "食事" },
  { path: "/explore", icon: Compass, label: "Explore", labelJa: "観光" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white border-r border-border z-50 shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-display font-black text-mountain-dark tracking-tight leading-tight">
            Yamanouchi<br/><span className="text-primary text-xl">Intelligence</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto hide-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {t(item.label, item.labelJa)}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border mt-auto">
          <div className="flex bg-secondary p-1 rounded-lg">
            <button
              onClick={() => setLanguage("en")}
              className={cn(
                "flex-1 py-1.5 text-sm font-bold rounded-md transition-all",
                language === "en" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("ja")}
              className={cn(
                "flex-1 py-1.5 text-sm font-bold rounded-md transition-all",
                language === "ja" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              日本語
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 inset-x-0 h-16 glass z-40 flex items-center justify-between px-4">
        <h1 className="text-xl font-display font-black text-mountain-dark tracking-tight">
          Yamanouchi <span className="text-primary">Intel</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-secondary p-0.5 rounded-md border border-border">
            <button
              onClick={() => setLanguage("en")}
              className={cn(
                "px-2 py-1 text-xs font-bold rounded-sm transition-all",
                language === "en" ? "bg-white shadow-sm text-primary" : "text-muted-foreground"
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("ja")}
              className={cn(
                "px-2 py-1 text-xs font-bold rounded-sm transition-all",
                language === "ja" ? "bg-white shadow-sm text-primary" : "text-muted-foreground"
              )}
            >
              JA
            </button>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-mountain-dark bg-secondary rounded-full"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu (For items that don't fit in bottom bar) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-30 pt-16 bg-white/95 backdrop-blur-xl"
          >
            <nav className="p-4 space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 font-bold text-lg",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "bg-secondary/50 text-mountain-dark"
                    )}
                  >
                    <Icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-muted-foreground")} />
                    {t(item.label, item.labelJa)}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 w-full min-h-screen pt-16 md:pt-0 pb-24 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar (Primary actions only) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 glass border-t border-white/20 pb-safe z-40">
        <div className="flex justify-around items-center px-2 h-16">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/10" : ""
                )}>
                  <Icon className={cn("w-5 h-5", isActive ? "fill-primary/20" : "")} />
                </div>
                <span className="text-[10px] font-bold tracking-tight">
                  {t(item.label, item.labelJa)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
