import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MountainSnow,
  CloudSun,
  BookOpen,
  Video,
  Bus,
  BedDouble,
  TreePine,
  Snowflake,
  Leaf,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useSeason } from "@/hooks/use-season";
import { cn } from "@/lib/utils";

type NavItem = { path: string; icon: any; label: string; labelJa: string };

const WINTER_NAV: NavItem[] = [
  { path: "/home",       icon: Home,         label: "Home",      labelJa: "ホーム" },
  { path: "/resorts",    icon: MountainSnow, label: "Resorts",   labelJa: "スキー場" },
  { path: "/map",        icon: CloudSun,     label: "Weather",   labelJa: "天気" },
  { path: "/cams",       icon: Video,        label: "Cams",      labelJa: "カメラ" },
  { path: "/stay",       icon: BedDouble,    label: "Stay",      labelJa: "宿泊" },
  { path: "/transport",  icon: Bus,          label: "Transport", labelJa: "交通" },
  { path: "/guide",      icon: BookOpen,     label: "Guide",     labelJa: "ガイド" },
];

const GREEN_NAV: NavItem[] = [
  { path: "/home",       icon: Home,         label: "Home",      labelJa: "ホーム" },
  { path: "/activities", icon: TreePine,     label: "Activities", labelJa: "アクティビティ" },
  { path: "/map",        icon: CloudSun,     label: "Weather",   labelJa: "天気" },
  { path: "/cams",       icon: Video,        label: "Cams",      labelJa: "カメラ" },
  { path: "/stay",       icon: BedDouble,    label: "Stay",      labelJa: "宿泊" },
  { path: "/transport",  icon: Bus,          label: "Transport", labelJa: "交通" },
  { path: "/guide",      icon: BookOpen,     label: "Guide",     labelJa: "ガイド" },
];

function SeasonToggle({ compact = false }: { compact?: boolean }) {
  const { season, setSeason } = useSeason();
  const { t } = useLanguage();
  return (
    <div className={cn("flex p-0.5 rounded-full border", season === "winter" ? "bg-blue-50 border-blue-200" : "bg-emerald-50 border-emerald-200")}>
      <button
        onClick={() => setSeason("winter")}
        aria-label={t("Winter season", "冬シーズン")}
        aria-pressed={season === "winter"}
        className={cn(
          "flex items-center gap-1 py-1 rounded-full transition-all text-xs font-bold",
          compact ? "px-2" : "px-3",
          season === "winter"
            ? "bg-white shadow-sm text-blue-700"
            : "text-slate-400 hover:text-slate-600"
        )}
      >
        <Snowflake className="w-3 h-3" />
        {!compact && <span>{t("Winter", "冬")}</span>}
      </button>
      <button
        onClick={() => setSeason("green")}
        aria-label={t("Green season", "グリーンシーズン")}
        aria-pressed={season === "green"}
        className={cn(
          "flex items-center gap-1 py-1 rounded-full transition-all text-xs font-bold",
          compact ? "px-2" : "px-3",
          season === "green"
            ? "bg-white shadow-sm text-emerald-700"
            : "text-slate-400 hover:text-slate-600"
        )}
      >
        <Leaf className="w-3 h-3" />
        {!compact && <span>{t("Green", "夏")}</span>}
      </button>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { isWinter } = useSeason();

  const NAV_ITEMS = isWinter ? WINTER_NAV : GREEN_NAV;

  const isActive = (path: string) =>
    path === "/home" ? location === "/home" : location.startsWith(path);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white border-r border-border z-50 shadow-sm">
        <div className="p-6">
          <Link href="/welcome" className="block mb-2">
            <img
              src={`${import.meta.env.BASE_URL}branding/wordmark-colour.png?v=3`}
              alt="feelzlike"
              className="h-10 w-auto"
            />
          </Link>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Yamanouchi Town</p>
          <div className="mt-3">
            <SeasonToggle />
          </div>
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
                    ? isWinter ? "bg-primary/10 text-primary" : "bg-emerald-50 text-emerald-700"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", active ? (isWinter ? "text-primary" : "text-emerald-600") : "text-muted-foreground")} />
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
        <Link href="/welcome" className="flex items-center gap-2">
          <img
            src={`${import.meta.env.BASE_URL}branding/wordmark-colour.png?v=3`}
            alt="feelzlike"
            className="h-6 w-auto"
          />
        </Link>
        <div className="flex items-center gap-2">
          <SeasonToggle compact />
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

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-border/60 pb-safe z-40">
        <div className="flex justify-around items-center px-0.5 h-14">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200",
                  active ? (isWinter ? "text-primary" : "text-emerald-600") : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-0.5 rounded-lg transition-all duration-200",
                  active ? (isWinter ? "bg-primary/10" : "bg-emerald-50") : ""
                )}>
                  <Icon className={cn("w-3.5 h-3.5", active ? "" : "opacity-60")} />
                </div>
                <span className={cn(
                  "text-[8px] font-bold tracking-tight leading-none",
                  active ? (isWinter ? "text-primary" : "text-emerald-600") : "text-muted-foreground"
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
