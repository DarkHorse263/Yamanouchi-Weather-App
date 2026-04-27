import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Video,
  Radar as RadarIcon,
  Car,
  Cable,
  Bus,
  ChevronLeft,
  Mountain,
} from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InstallPrompt } from "./InstallPrompt";

type NavItem = { path: string; icon: any; label: string };

const NAV_ITEMS: NavItem[] = [
  { path: "/",                 icon: Home,         label: "Weather" },
  { path: "/webcams",          icon: Video,        label: "Cams" },
  { path: "/radar",            icon: RadarIcon,    label: "Radar" },
  { path: "/road-conditions",  icon: Car,          label: "Roads" },
  { path: "/lift-status",      icon: Cable,        label: "Lifts" },
];

const SECONDARY_ITEMS: NavItem[] = [
  { path: "/bus-services",     icon: Bus,          label: "Bus Services" },
];

const RESORTS = [
  { path: "/location/thredbo",          label: "Thredbo" },
  { path: "/location/perisher",         label: "Perisher" },
  { path: "/location/charlottes-pass",  label: "Charlotte's Pass" },
  { path: "/location/jindabyne",        label: "Jindabyne" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const base = import.meta.env.BASE_URL;

  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar — refined dark column with editorial header */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-50 border-r border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="px-6 pt-6 pb-5">
          <a
            href="/"
            className="byline inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            All regions
          </a>
          <a href="/" className="block mt-4 mb-1.5">
            <span className="font-display font-medium text-2xl tracking-tight text-foreground italic">
              feelz<span className="text-primary not-italic font-semibold">like</span>
            </span>
          </a>
          <p className="font-display font-semibold text-base leading-tight text-foreground">
            Snowy Mountains
          </p>
          <p className="byline mt-1.5 text-muted-foreground/70">NSW · Australia</p>
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
                    ? "text-foreground bg-secondary/60"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
                )}
                <Icon className={cn("w-4 h-4 transition-colors", active ? "text-primary" : "")} />
                {item.label}
              </Link>
            );
          })}

          {SECONDARY_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium",
                  active
                    ? "text-foreground bg-secondary/60"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
                )}
                <Icon className={cn("w-4 h-4", active ? "text-primary" : "")} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-5 mt-3">
            <p className="px-3 byline text-muted-foreground/60 mb-1.5">Resorts</p>
            {RESORTS.map((r) => {
              const active = location === r.path;
              return (
                <Link
                  key={r.path}
                  href={r.path}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm",
                    active
                      ? "text-foreground bg-secondary/60 font-medium"
                      : "text-muted-foreground/80 hover:text-foreground hover:bg-secondary/30"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
                  )}
                  <Mountain className={cn("w-3.5 h-3.5", active ? "text-primary" : "opacity-50")} />
                  {r.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="px-6 pb-5 pt-3">
          <p className="byline text-muted-foreground/50">v0.2 · feelzlike</p>
        </div>
      </aside>

      {/* Mobile header — translucent so atmospheric heroes show through */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 z-40 flex items-center justify-between px-4 glass-strong">
        <a
          href="/"
          aria-label="Back to all regions"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="byline">Regions</span>
        </a>
        <a href="/" className="flex items-center">
          <span className="font-display font-medium text-base tracking-tight text-foreground italic">
            feelz<span className="text-primary not-italic font-semibold">like</span>
          </span>
        </a>
        <span className="byline text-muted-foreground/70">NSW</span>
      </header>

      {/* Main */}
      <main className="flex-1 md:ml-64 w-full min-h-screen pt-14 md:pt-0 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav — glass dock */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-strong pb-safe">
        <div className="flex justify-around items-center px-1 h-16">
          {[...NAV_ITEMS, ...SECONDARY_ITEMS].map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                  active ? "text-primary" : "text-muted-foreground/70"
                )}
              >
                {active && (
                  <span className="absolute top-1.5 w-8 h-0.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
                )}
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-semibold tracking-wider uppercase leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <InstallPrompt />
    </div>
  );
}
