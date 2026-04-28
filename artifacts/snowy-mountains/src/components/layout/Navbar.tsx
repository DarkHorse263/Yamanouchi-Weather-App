import { Link, useLocation } from "wouter";
import { MountainSnow, ThermometerSun, Camera, Car, Cable, Radar, Bus, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  icon: typeof ThermometerSun;
  external?: boolean;
}

const PRIMARY_TABS: NavItem[] = [
  { href: "/", label: "Weather", icon: ThermometerSun },
  { href: "/webcams", label: "Webcams", icon: Camera },
  { href: "/radar", label: "Radar", icon: Radar },
  { href: "/road-conditions", label: "Roads", icon: Car },
];

const MORE_ITEMS: NavItem[] = [
  { href: "/location/thredbo", label: "Thredbo", icon: MountainSnow },
  { href: "/location/perisher", label: "Perisher", icon: MountainSnow },
  { href: "/location/charlottes-pass", label: "Charlotte's Pass", icon: MountainSnow },
  { href: "/location/selwyn", label: "Selwyn", icon: MountainSnow },
  { href: "/location/jindabyne", label: "Jindabyne", icon: MountainSnow },
  { href: "/lift-status", label: "Lifts", icon: Cable },
  { href: "https://www.coomacoaches.com.au", label: "Bus Services", icon: Bus, external: true },
];

function isTabActive(tabHref: string, location: string): boolean {
  if (tabHref === "/") return location === "/";
  return location.startsWith(tabHref);
}

function isMoreActive(location: string): boolean {
  return MORE_ITEMS.some(item => !item.external && location === item.href);
}

export function Navbar() {
  const [location] = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location]);

  useEffect(() => {
    if (isMoreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMoreOpen]);

  const moreActive = isMoreActive(location);

  return (
    <>
      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <h3 className="font-display font-bold text-lg">More</h3>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="px-3 pb-4 space-y-1">
                {MORE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = !item.external && location === item.href;
                  if (item.external) {
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-colors hover:bg-muted text-foreground"
                      >
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span>{item.label}</span>
                        <span className="ml-auto text-xs text-muted-foreground">External</span>
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
           style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-stretch justify-around h-[4.5rem] max-w-lg mx-auto">
          {PRIMARY_TABS.map((item) => {
            const Icon = item.icon;
            const active = isTabActive(item.href, location);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative"
              >
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={cn(
                  "w-[22px] h-[22px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-[10px] font-semibold tracking-wide transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative"
          >
            {moreActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <MoreHorizontal className={cn(
              "w-[22px] h-[22px] transition-colors",
              moreActive || isMoreOpen ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-[10px] font-semibold tracking-wide transition-colors",
              moreActive || isMoreOpen ? "text-primary" : "text-muted-foreground"
            )}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
