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
  MountainSnow,
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white border-r border-border z-50 shadow-sm">
        <div className="p-6">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            All regions
          </a>
          <a href="/" className="block mb-2">
            <img
              src={`${base}branding/wordmark-colour.png`}
              alt="feelzlike"
              className="h-10 w-auto"
            />
          </a>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Snowy Mountains
          </p>
          <p className="text-[10px] text-slate-400 mt-1">NSW · Australia</p>
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 mt-2 border-t border-border/60">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Resorts
            </p>
            {RESORTS.map((r) => {
              const active = location === r.path;
              return (
                <Link
                  key={r.path}
                  href={r.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <MountainSnow className="w-4 h-4 opacity-70" />
                  {r.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 inset-x-0 h-16 glass z-40 flex items-center justify-between px-4 border-b border-border/40 bg-white/95 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <a
            href="/"
            aria-label="Back to all regions"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </a>
          <a href="/" className="flex items-center gap-2">
            <img
              src={`${base}branding/wordmark-colour.png`}
              alt="feelzlike"
              className="h-6 w-auto"
            />
          </a>
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/70">
          Snowy Mtns
        </span>
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
        <div className="flex justify-around items-center px-1 h-16">
          {[...NAV_ITEMS, ...SECONDARY_ITEMS].map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-1 rounded-lg transition-all",
                  active ? "bg-primary/10" : ""
                )}>
                  <Icon className={cn("w-4 h-4", active ? "" : "opacity-60")} />
                </div>
                <span className={cn(
                  "text-[9px] font-bold tracking-tight leading-none",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
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
