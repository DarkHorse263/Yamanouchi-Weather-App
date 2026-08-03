import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Leaf, Snowflake, ArrowLeft, Lock, ChevronDown, Compass } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { useRegion } from "./RegionProvider";
import { useOptionalSeason } from "./SeasonProvider";
import { useLanguage } from "./LanguageProvider";
import { useBaseTown } from "./BaseTownProvider";
import { TownPicker } from "./TownPicker";
import { DEFAULT_TOWN_NAV, DEFAULT_MOUNTAIN_NAV, DEFAULT_REGION_NAV } from "./defaultNav";
import { sectionAccentFor, mixSection } from "./sectionAccents";
import type { NavItem } from "./types";

const RESERVED_TOWN_SLUGS = new Set(["mountain", "mountains", "radar", "alerts", "resort", "premium"]);

interface ParsedScope {
  scope: "region" | "town" | "mountain";
  townId?: string;
  /** Path within the town, e.g. "/", "/stay" */
  townSubpath?: string;
}

function parseScope(location: string, townIds: Set<string>): ParsedScope {
  const path = location === "" ? "/" : location;
  if (path === "/") return { scope: "region" };

  // Mountain-scope routes
  if (
    path === "/mountains" ||
    path.startsWith("/mountains/") ||
    path.startsWith("/mountain/") ||
    path === "/radar" ||
    path === "/alerts" ||
    path.startsWith("/resort/") // legacy URL still maps to mountain scope
  ) {
    return { scope: "mountain" };
  }

  // Town-scope routes: /<townId>/...
  const parts = path.split("/").filter(Boolean);
  const first = parts[0];
  if (first && !RESERVED_TOWN_SLUGS.has(first) && townIds.has(first)) {
    const subpath = "/" + parts.slice(1).join("/");
    return {
      scope: "town",
      townId: first,
      townSubpath: subpath === "/" ? "/" : subpath.replace(/\/$/, ""),
    };
  }

  return { scope: "region" };
}

export type CombinedNavItem = {
  key: string;
  href: string;
  icon: NavItem["icon"];
  label: string;
  active: boolean;
  locked?: boolean;
  accent?: string;
  group?: "top" | "travel" | "bottom";
};

function MobileTravelMenu({
  items,
  t,
  open,
  onClose,
}: {
  items: CombinedNavItem[];
  t: any;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute bottom-[calc(100%+12px)] left-2 right-2 z-50 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t("Plan + Travel", "プラン・旅行")}
          </p>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200/50 text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2 space-y-1">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-150 text-[14px] font-bold lowercase",
                item.active
                  ? item.accent
                    ? ""
                    : "text-[#0055FF] bg-[#F0F5FF]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              style={
                item.active && item.accent
                  ? { color: item.accent, backgroundColor: mixSection(item.accent, 8) }
                  : undefined
              }
            >
              {item.active && (
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full",
                    item.accent ? "" : "bg-primary"
                  )}
                  style={item.accent ? { backgroundColor: item.accent } : undefined}
                />
              )}
              <item.icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  item.active && !item.accent ? "text-primary" : ""
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </>
  );
}

export function AppShell({
  children,
  isTownNavAvailable,
}: {
  children: ReactNode;
  /**
   * Optional per-town content gate. Return false to hide a town-nav item
   * whose destination has no content yet (so people don't tap into empty
   * "coming soon" pages). Defaults to showing everything.
   */
  isTownNavAvailable?: (path: string, townId: string) => boolean;
}) {
  const { region } = useRegion();
  const [location] = useLocation();
  const { towns, town: activeTown } = useBaseTown();
  // Mobile bottom-nav "plan" menu open state. Must live at the component top
  // level (not inside the render IIFE) so the hook order is safe.
  const [travelOpen, setTravelOpen] = useState(false);

  // Publish the mobile bottom-nav height as a CSS variable so bottom-anchored
  // overlays (consent banner, install prompt) can sit ABOVE the nav instead of
  // covering it. Pages without AppShell (e.g. home) get the 0px default.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--mobile-bottom-nav",
      "calc(4rem + env(safe-area-inset-bottom))",
    );
    return () => {
      root.style.removeProperty("--mobile-bottom-nav");
    };
  }, []);

  // MUST be called unconditionally - a previous `region.seasons ? useSeason() : null`
  // pattern violated the Rules of Hooks and silently broke the season toggle.
  const maybeSeason = useOptionalSeason();
  const seasonCtx = region.seasons ? maybeSeason : null;
  const lang = useLanguage();
  const t = (en: string, ja?: string) => lang.t(en, ja);

  const townIdSet = new Set(towns.map((tn) => tn.id));
  const parsed = parseScope(location, townIdSet);

  // The town used for building town-section nav links: prefer URL, then provider
  const navTown = parsed.townId
    ? towns.find((tn) => tn.id === parsed.townId)
    : activeTown;

  const regionNav: NavItem[] = region.navOverrides?.region ?? DEFAULT_REGION_NAV;
  const townNavRaw: NavItem[] = region.navOverrides?.town ?? DEFAULT_TOWN_NAV;
  const mountainNavRaw: NavItem[] = region.navOverrides?.mountain ?? DEFAULT_MOUNTAIN_NAV;

  const filterBySeason = (items: NavItem[]) =>
    items.filter((it) => !it.season || !seasonCtx || seasonCtx.season === it.season);

  const townNav = filterBySeason(townNavRaw);
  const mountainNav = filterBySeason(mountainNavRaw);

  // Build absolute (region-relative) hrefs for each scope's items
  const townHref = (subpath: string) => {
    if (!navTown) return "/";
    const clean = subpath === "/" ? "" : subpath;
    return `/${navTown.id}${clean}`;
  };
  const regionHref = (path: string) => path; // already region-relative
  const mountainHref = (path: string) => path;
  // Some "mountain-scope" entries are actually globally-mounted routes
  // (mounted by App.tsx BEFORE the /:region catch-all). The region's
  // <WouterRouter base="/{region.id}"> would otherwise rewrite their
  // hrefs to /:region/<path> and bounce them through TownLayout's
  // unknown-town redirect. The `~/` prefix is wouter's documented
  // escape that pins navigation to the app root.
  const GLOBAL_MOUNTAIN_PATHS = new Set(["/premium", "/plan", "/account"]);
  const isGlobalMountainPath = (p: string) => GLOBAL_MOUNTAIN_PATHS.has(p);

  const isActiveTown = (subpath: string) =>
    parsed.scope === "town" &&
    navTown?.id === parsed.townId &&
    (subpath === "/"
      ? parsed.townSubpath === "/" || parsed.townSubpath === ""
      : parsed.townSubpath === subpath ||
        (parsed.townSubpath ?? "").startsWith(`${subpath}/`));

  const isActiveRegion = (path: string) =>
    path === "/" ? parsed.scope === "region" : location === path;

  const isActiveMountain = (path: string) => {
    if (path === "/mountains")
      return location === "/mountains" || location.startsWith("/mountains/");
    return location === path || location.startsWith(`${path}/`);
  };

  // Single source of truth for the combined town+mountain link order, used by
  // both the desktop sidebar and the mobile bottom nav so they never drift.
  const buildCombinedNav = (): CombinedNavItem[] => {
    const items: CombinedNavItem[] = [];
    const seen = new Set<string>();
    const pushTown = (path: string, group: "top" | "travel" | "bottom" = "top") => {
      const it = townNav.find((n) => n.path === path);
      if (!it || !navTown || seen.has(`t:${path}`)) return;
      if (isTownNavAvailable && !isTownNavAvailable(it.path, navTown.id)) return;
      seen.add(`t:${path}`);
      items.push({
        key: `t:${it.path}`,
        href: townHref(it.path),
        icon: it.icon,
        label: t(it.label, it.labelJa),
        active: isActiveTown(it.path),
        accent: sectionAccentFor(it.path),
        group,
      });
    };
    const pushMountain = (path: string, group: "top" | "travel" | "bottom" = "bottom") => {
      const it = mountainNav.find((n) => n.path === path);
      if (!it || seen.has(`m:${path}`)) return;
      seen.add(`m:${path}`);
      const href = isGlobalMountainPath(it.path)
        ? `~${it.path}`
        : mountainHref(it.path);
      items.push({
        key: `m:${it.path}`,
        href,
        icon: it.icon,
        label: t(it.label, it.labelJa),
        active: isActiveMountain(it.path),
        locked: false,
        accent: sectionAccentFor(it.path),
        group,
      });
    };

    pushTown("/", "top");                  // Today
    pushTown("/weather", "top");           // Weather forecast
    pushTown("/roads", "top");             // Roads & cams
    
    pushTown("/transport", "travel");      // Transport
    pushTown("/stay", "travel");           // Stay
    pushTown("/eat", "travel");            // Eat
    pushTown("/explore", "travel");        // Explore
    pushMountain("/plan", "travel");       // Trip planner
    
    pushMountain("/premium", "bottom");    // Premium hub
    pushMountain("/account", "bottom");    // Member account
    
    townNav.forEach((it) => pushTown(it.path, "top"));
    mountainNav.forEach((it) => pushMountain(it.path, "bottom"));
    return items;
  };
  const combinedNav = buildCombinedNav();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-50 border-r border-border bg-white text-[#0F172A] overflow-y-auto">
        <div className="px-6 pt-6 pb-5">
          <Link
            href="~/"
            className="text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 text-slate-500 hover:text-[#0055FF] transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            All regions
          </Link>
          <Link href="/" className="block mt-4 mb-1.5">
            <img src={region.brand.wordmarkUrl} alt="feelzlike" className="h-8 w-auto" />
          </Link>
          <p className="font-display font-semibold text-base leading-tight text-card-foreground">
            {region.name}
          </p>
          <p className="byline mt-1.5 text-slate-500/80">{region.subtitle}</p>

          {(region.seasons || (region.language && region.language.locales.length > 1)) && (
            <div className="mt-4 flex items-center gap-2">
              {region.seasons && seasonCtx && (
                <SeasonPill
                  season={seasonCtx.season}
                  onChange={seasonCtx.setSeason}
                  t={t}
                />
              )}
              {region.language && region.language.locales.length > 1 && (
                <LangPill
                  locales={region.language.locales}
                  current={lang.language}
                  onChange={lang.setLanguage}
                />
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 pb-4 space-y-0.5">
          {/* REGION - rendered only if the region exposes any region-scope
              items. May 2026: "Sources" moved into the homepage footer, so
              for default regions this section is empty and we suppress the
              header entirely (otherwise the sidebar shows a stray "Region"
              label with nothing under it). */}
          {regionNav.length > 0 && (
            <>
              <SectionLabel>{t("Region", "地域")}</SectionLabel>
              {regionNav.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  href={regionHref(item.path)}
                  active={isActiveRegion(item.path)}
                  t={t}
                />
              ))}
            </>
          )}

          {/* TOWN PICKER + COMBINED NAV
              May 2026 (round 2): the desktop sidebar used to be split into
              "In town" and "Mountains" sections. Users wanted the same
              decision-flow ordering on every screen, so we collapsed both
              sections into a single flat list driven by `combinedNav`,
              identical to the mobile bottom nav. */}
          {towns.length > 0 && (
            <>
              <div className="rule mx-3 my-3" />
              <div className="px-3 mb-2">
                <TownPicker variant="sidebar" preserveSubpath />
              </div>
            </>
          )}
          {navTown || combinedNav.some((c) => c.key.startsWith("m:")) ? (
            <>
              {combinedNav.filter((c) => c.group === "top").map((item) => (
                <SidebarNavItem key={item.key} item={item} />
              ))}
              
              <SidebarTravelGroup 
                items={combinedNav.filter((c) => c.group === "travel")} 
                t={t} 
              />
              
              {combinedNav.filter((c) => c.group === "bottom").map((item) => (
                <SidebarNavItem key={item.key} item={item} />
              ))}
            </>
          ) : (
            <p className="px-3 py-2 byline text-slate-500/60">
              {t("Pick a town to see options.", "町を選んでください")}
            </p>
          )}
        </nav>

        <div className="px-6 pb-5 pt-3">
          <p className="byline text-slate-500/60">{region.footer ?? "v0.4 · feelzlike"}</p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 glass-strong border-b border-white/10">
        <div className="h-14 flex items-center justify-between px-4">
          <Link
            href="~/"
            aria-label="Back to all regions"
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t("Regions", "地域")}</span>
          </Link>
          <Link href="/" className="flex items-center">
            {/* If the wordmark is dark, it needs to be white. But we can't easily filter it if it's an img, unless we use css invert or it's already white */}
            <img src={region.brand.wordmarkUrl} alt="feelzlike" className="h-6 w-auto brightness-0 invert" />
          </Link>
          {towns.length > 0 ? (
            <TownPicker variant="compact" preserveSubpath />
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">{region.shortTag}</span>
          )}
        </div>
        {(region.seasons || (region.language && region.language.locales.length > 1)) && (
          <div className="flex items-center justify-end gap-2 px-4 pb-2 -mt-1">
            {region.seasons && seasonCtx && (
              <SeasonPill
                season={seasonCtx.season}
                onChange={seasonCtx.setSeason}
                t={t}
              />
            )}
            {region.language && region.language.locales.length > 1 && (
              <LangPill
                locales={region.language.locales}
                current={lang.language}
                onChange={lang.setLanguage}
              />
            )}
          </div>
        )}
      </header>

      {/* Main */}
      <main
        className={cn(
          "flex-1 md:ml-64 w-full md:w-[calc(100%-16rem)] min-h-[100dvh] md:pt-0 pb-20 md:pb-0 transition-colors duration-500",
          seasonCtx?.season === "green" ? "bg-[#059669]" : "bg-[#0055FF]",
          (region.seasons || (region.language && region.language.locales.length > 1))
            ? "pt-24"
            : "pt-14",
        )}
      >
        {/* Back bar - shown on any "feature" subpage (a town subpage other
            than the town home, or a mountain-scope page). Clicking prefers
            browser history (so users return to the exact prior position),
            and falls back to a sensible parent route when there's no
            history entry to pop (e.g. deep-linked load). */}
        <BackBar parsed={parsed} t={t} />
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

      {/* Mobile bottom nav: grouped Plan + Travel menu + top/bottom items */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-strong pb-safe">
        <div className="flex items-center justify-around px-2 h-16 relative">
          {(() => {
            const topItems = combinedNav.filter((c) => c.group === "top");
            const travelItems = combinedNav.filter((c) => c.group === "travel");
            const bottomItems = combinedNav.filter((c) => c.group === "bottom");
            
            // "Account" and "Premium"
            // Usually we show: Today, Weather, Roads, [Plan], Premium, Account
            // Let's filter top to just top 3 to be safe, but combinedNav already limits.
            
            const renderItem = (item: CombinedNavItem) => {
              const Icon = item.icon;
              const activeAccent = item.active && item.accent ? mixSection(item.accent, 35) : undefined;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  style={activeAccent ? { color: activeAccent } : undefined}
                  className={cn(
                    "relative flex flex-col items-center justify-center shrink-0 h-full gap-1 min-w-[56px] transition-all flex-1",
                    item.active
                      ? activeAccent
                        ? ""
                        : "text-white"
                      : "text-white/70 hover:text-white",
                  )}
                >
                  {item.active && (
                    <span
                      className={cn(
                        "absolute top-1 w-8 h-0.5 rounded-full",
                        activeAccent ? "" : "bg-primary",
                      )}
                      style={activeAccent ? { backgroundColor: activeAccent } : undefined}
                    />
                  )}
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-semibold tracking-wider uppercase leading-none whitespace-nowrap inline-flex items-center gap-1">
                    {/* first word only · full labels like "weather forecast" overflow the narrow tab */}
                    {item.label.split(" ")[0]}
                  </span>
                </Link>
              );
            };

            const isTravelActive = travelItems.some(it => it.active);

            return (
              <>
                <AnimatePresence>
                  <MobileTravelMenu
                    items={travelItems}
                    t={t}
                    open={travelOpen}
                    onClose={() => setTravelOpen(false)}
                  />
                </AnimatePresence>
                
                {topItems.map(renderItem)}
                
                {travelItems.length > 0 && (
                  <button
                    onClick={() => setTravelOpen(!travelOpen)}
                    className={cn(
                      "relative flex flex-col items-center justify-center shrink-0 h-full gap-1 min-w-[56px] transition-all flex-1",
                      isTravelActive || travelOpen ? "text-white" : "text-white/70 hover:text-white"
                    )}
                  >
                    {isTravelActive && !travelOpen && (
                      <span className="absolute top-1 w-8 h-0.5 rounded-full bg-white/50" />
                    )}
                    <Compass className={cn("w-5 h-5 mb-0.5 transition-transform", travelOpen ? "scale-110" : "")} />
                    <span className="text-[9px] font-semibold tracking-wider uppercase leading-none whitespace-nowrap inline-flex items-center gap-1">
                      {t("Plan", "プラン")}
                    </span>
                  </button>
                )}

                {bottomItems.filter(i => i.key.includes("account")).map(renderItem)}
              </>
            );
          })()}
        </div>
      </nav>

    </div>
  );
}

function SidebarNavItem({ item }: { item: CombinedNavItem }) {
  const Icon = item.icon;
  const activeAccent = item.active ? item.accent : undefined;
  return (
    <Link
      href={item.href}
      style={
        activeAccent
          ? { color: activeAccent, backgroundColor: mixSection(activeAccent, 8) }
          : undefined
      }
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-[14px] font-bold lowercase",
        item.active
          ? activeAccent
            ? ""
            : "text-[#0055FF] bg-[#F0F5FF]"
          : "text-slate-500 hover:bg-[#F0F5FF] hover:text-[#0055FF]",
      )}
    >
      {item.active && (
        <span
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full",
            activeAccent ? "" : "bg-primary",
          )}
          style={activeAccent ? { backgroundColor: activeAccent } : undefined}
        />
      )}
      <Icon
        className={cn(
          "w-4 h-4 transition-colors",
          item.active && !activeAccent ? "text-primary" : "",
        )}
      />
      <span className="inline-flex items-center gap-1.5">
        {item.label}
        {item.locked && <Lock className="w-3 h-3 opacity-60" aria-label="Premium" />}
      </span>
    </Link>
  );
}

function SidebarTravelGroup({ items, t }: { items: CombinedNavItem[]; t: any }) {
  const hasActive = items.some((it) => it.active);
  const [open, setOpen] = useState(hasActive);
  
  // Auto-expand if a child route becomes active (e.g. via deep link or mobile nav click)
  useEffect(() => {
    if (hasActive) {
      setOpen(true);
    }
  }, [hasActive]);
  
  if (items.length === 0) return null;
  
  return (
    <div className="mt-2 mb-2 border-t border-slate-100 pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Compass className="w-3 h-3" />
          {t("Plan + Travel", "プラン・旅行")}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open ? "rotate-180" : "")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-1 pb-1 space-y-0.5">
              {items.map((item) => (
                <SidebarNavItem key={item.key} item={item} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BackBar({
  parsed,
  t,
}: {
  parsed: ParsedScope;
  t: (en: string, ja?: string) => string;
}) {
  const [, setLocation] = useLocation();
  const season = useOptionalSeason();
  // Show on mountain-scope pages and town subpages (but not the town home).
  const show =
    parsed.scope === "mountain" ||
    (parsed.scope === "town" && parsed.townSubpath && parsed.townSubpath !== "/");
  if (!show) return null;

  // Fallback parent if there's no history to pop (deep link).
  const fallback =
    parsed.scope === "town" && parsed.townId ? `/${parsed.townId}` : "/";

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      setLocation(fallback);
    }
  };

  return (
    <div
      className={cn(
        "sticky top-14 md:top-0 z-30 backdrop-blur-md border-b border-white/20",
        // Match the seasonal PageHeader surface so the bar doesn't clash
        // with emerald green-season pages.
        season?.season === "green" ? "bg-emerald-700/95" : "bg-[#0055FF]/95",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-2.5 md:py-3">
        <a
          href={fallback}
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-bold lowercase text-white hover:text-white/80 transition-colors px-3 py-2 -ml-2 rounded-xl hover:bg-white/10 active:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          {t("Back", "戻る")}
        </a>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 pt-2 pb-2 byline text-slate-500/70">{children}</p>
  );
}

function NavLink({
  item,
  href,
  active,
  t,
}: {
  item: NavItem;
  href: string;
  active: boolean;
  t: (en: string, ja?: string) => string;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium",
        active
          ? "text-primary bg-primary/8"
          : "text-slate-500 hover:bg-secondary hover:text-white",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
      )}
      <Icon className={cn("w-4 h-4 transition-colors", active ? "text-primary" : "")} />
      {t(item.label, item.labelJa)}
    </Link>
  );
}

function SeasonPill({
  season,
  onChange,
  t,
}: {
  season: "winter" | "green";
  onChange: (s: "winter" | "green") => void;
  t: (en: string, ja?: string) => string;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border p-0.5 bg-white">
      <button
        type="button"
        onClick={() => onChange("winter")}
        aria-pressed={season === "winter"}
        aria-label={t("Switch to winter view", "冬季表示に切替")}
        title={t("Winter season", "冬季シーズン")}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors",
          season === "winter"
            ? "bg-foreground text-background"
            : "text-slate-500 hover:text-white",
        )}
      >
        <Snowflake className="w-3 h-3" />
        {t("Winter", "冬")}
      </button>
      <button
        type="button"
        onClick={() => onChange("green")}
        aria-pressed={season === "green"}
        aria-label={t("Switch to green-season view", "グリーンシーズン表示に切替")}
        title={t("Green season (spring, summer, autumn)", "グリーンシーズン (春・夏・秋)")}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors",
          season === "green"
            ? "bg-foreground text-background"
            : "text-slate-500 hover:text-white",
        )}
      >
        <Leaf className="w-3 h-3" />
        {t("Green", "グリーン")}
      </button>
    </div>
  );
}

function LangPill({
  locales,
  current,
  onChange,
}: {
  locales: Array<"en" | "ja">;
  current: "en" | "ja";
  onChange: (l: "en" | "ja") => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border p-0.5 bg-white">
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => onChange(loc)}
          aria-pressed={current === loc}
          className={cn(
            "px-2 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors",
            current === loc
              ? "bg-foreground text-background"
              : "text-slate-500 hover:text-white",
          )}
        >
          {loc === "ja" ? "日本語" : "EN"}
        </button>
      ))}
    </div>
  );
}
