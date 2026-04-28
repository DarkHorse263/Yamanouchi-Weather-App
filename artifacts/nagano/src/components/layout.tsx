import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ChevronLeft } from "lucide-react";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home", labelJa: "ホーム" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white border-r border-border z-50">
        <div className="px-6 pt-6 pb-5">
          <a
            href="/"
            className="byline inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            {t("All regions", "全地域")}
          </a>
          <a href="/" className="block mt-4 mb-1.5">
            <img src={wordmark} alt="feelzlike" className="h-8 w-auto" />
          </a>
          <p className="font-display font-semibold text-base leading-tight text-foreground">
            {t("Nagano Prefecture", "長野県")}
          </p>
          <p className="byline mt-1.5 text-muted-foreground/80">
            {t("Coming soon", "近日公開")}
          </p>
        </div>

        <div className="rule mx-6" />

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto hide-scrollbar">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium",
                  active
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
                )}
                <Icon className={cn("w-4 h-4", active ? "text-primary" : "")} />
                {t(item.label, item.labelJa)}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 pb-5 pt-3 border-t border-border">
          <div className="flex bg-secondary p-1 rounded-lg">
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
          <img src={wordmark} alt="feelzlike" className="h-6 w-auto" />
        </a>
        <div className="flex bg-secondary p-0.5 rounded-md border border-border">
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

      <main className="flex-1 md:ml-64 w-full min-h-screen pt-16 md:pt-0 pb-6 md:pb-0">
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
    </div>
  );
}
