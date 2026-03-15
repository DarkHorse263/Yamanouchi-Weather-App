import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MountainSnow,
  Map as MapIcon,
  CloudSnow,
  BookOpen,
  Video,
  Bus,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/",           icon: Home,         label: "Home",      labelJa: "ホーム" },
  { path: "/resorts",    icon: MountainSnow, label: "Resorts",   labelJa: "スキー場" },
  { path: "/map",        icon: MapIcon,      label: "Map",       labelJa: "マップ" },
  { path: "/outlook",    icon: CloudSnow,    label: "Outlook",   labelJa: "予報" },
  { path: "/cams",       icon: Video,        label: "Cams",      labelJa: "カメラ" },
  { path: "/transport",  icon: Bus,          label: "Transport", labelJa: "交通" },
  { path: "/guide",      icon: BookOpen,     label: "Guide",     labelJa: "ガイド" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white border-r border-border z-50 shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-display font-black text-mountain-dark tracking-tight leading-tight">
            Yamanouchi<br /><span className="text-primary text-xl">Intelligence</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto hide-scrollbar">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
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

        <div className="p-6 border-t border-border mt-auto">
          <div className="flex bg-secondary p-1 rounded-lg">
            {(["en", "ja"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  "flex-1 py-1.5 text-sm font-bold rounded-md transition-all",
                  language === lang ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {lang === "en" ? "EN" : "日本語"}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 inset-x-0 h-16 glass z-40 flex items-center justify-between px-4 border-b border-border/40">
        <h1 className="text-xl font-display font-black text-mountain-dark tracking-tight">
          Yamanouchi <span className="text-primary">Intel</span>
        </h1>
        <div className="flex bg-secondary p-0.5 rounded-md border border-border">
          {(["en", "ja"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-sm transition-all",
                language === lang ? "bg-white shadow-sm text-primary" : "text-muted-foreground"
              )}
            >
              {lang === "en" ? "EN" : "JA"}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
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

      {/* Mobile Bottom Nav — 7 tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-border/60 pb-safe z-40">
        <div className="flex justify-around items-center px-1 h-14">
          {NAV_ITEMS.map((item) => {
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
                  "text-[9px] font-bold tracking-tight leading-none",
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
