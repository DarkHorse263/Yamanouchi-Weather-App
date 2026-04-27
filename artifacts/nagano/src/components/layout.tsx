import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MountainSnow,
  Map as MapIcon,
  CloudSnow,
  Video,
  BedDouble,
  UtensilsCrossed,
  Compass,
  BellRing,
  ChevronLeft,
} from "lucide-react";
import wordmarkSnow from "@assets/feelzlike_WordMarque_colour_160426_1777272466909.png";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/",        icon: Home,         label: "Home",    labelJa: "ホーム" },
  { path: "/resorts", icon: MountainSnow, label: "Resorts", labelJa: "スキー場" },
  { path: "/map",     icon: MapIcon,      label: "Map",     labelJa: "マップ" },
  { path: "/outlook", icon: CloudSnow,    label: "Outlook", labelJa: "予報" },
  { path: "/cams",    icon: Video,        label: "Cams",    labelJa: "カメラ" },
];

const SIDEBAR_EXTRA = [
  { path: "/alerts",  icon: BellRing,         label: "Alerts",  labelJa: "アラート" },
  { path: "/stay",    icon: BedDouble,        label: "Stay",    labelJa: "宿泊" },
  { path: "/eat",     icon: UtensilsCrossed,  label: "Eat",     labelJa: "飲食" },
  { path: "/explore", icon: Compass,          label: "Explore", labelJa: "観光" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  const allNavItems = [...NAV_ITEMS, ...SIDEBAR_EXTRA];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-background/80 backdrop-blur-xl border-r border-border/60 z-50">
        <div className="px-6 pt-6 pb-5">
          <a
            href="/"
            className="byline inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            {t("All regions", "全地域")}
          </a>
          <a href="/" className="block mt-4 mb-1.5">
            <span className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-white/10 shadow-sm">
              <img src={wordmarkSnow} alt="feelzlike" className="h-6 w-auto" />
            </span>
          </a>
          <p className="font-display font-semibold text-base leading-tight text-foreground">
            {t("Nagano Prefecture", "長野県")}
          </p>
          <p className="byline mt-1.5 text-muted-foreground/70">
            {t("80 Ski Resorts · Japan", "80スキー場 · 日本")}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto hide-scrollbar">
          {allNavItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
                {t(item.label, item.labelJa)}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 pb-5 mt-auto">
          <div className="flex bg-secondary/50 p-1 rounded-lg border border-white/5">
            {(["en", "ja"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                  language === lang ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {lang === "en" ? "EN" : "日本語"}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <header className="md:hidden fixed top-0 inset-x-0 h-14 glass-strong z-40 flex items-center justify-between px-4">
        <a
          href="/"
          aria-label={t("Back to all regions", "全地域へ戻る")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="byline">{t("Regions", "戻る")}</span>
        </a>
        <a href="/" className="flex items-center">
          <span className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-white/95 backdrop-blur-md border border-white/10 shadow-sm">
            <img src={wordmarkSnow} alt="feelzlike" className="h-4 w-auto" />
          </span>
        </a>
        <div className="flex bg-secondary/50 p-0.5 rounded-md border border-white/10">
          {(["en", "ja"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold rounded-sm transition-all",
                language === lang ? "bg-foreground text-background" : "text-muted-foreground"
              )}
            >
              {lang === "en" ? "EN" : "JA"}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 md:ml-64 w-full min-h-screen pt-16 md:pt-0 pb-24 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 glass-strong pb-safe z-40">
        <div className="flex justify-around items-center px-1 h-16">
          {allNavItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-1 rounded-lg transition-all duration-200",
                  active ? "bg-primary/10" : ""
                )}>
                  <Icon className={cn("w-4 h-4", active ? "" : "opacity-60")} />
                </div>
                <span className={cn(
                  "text-[8px] font-bold tracking-tight leading-none",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
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
