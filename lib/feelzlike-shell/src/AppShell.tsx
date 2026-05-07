import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Sun, Snowflake } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { useRegion } from "./RegionProvider";
import { useOptionalSeason } from "./SeasonProvider";
import { useLanguage } from "./LanguageProvider";
import { useBaseTown } from "./BaseTownProvider";
import { TownPicker } from "./TownPicker";
import { DEFAULT_TOWN_NAV, DEFAULT_MOUNTAIN_NAV, DEFAULT_REGION_NAV } from "./defaultNav";
import type { NavItem } from "./types";

const RESERVED_TOWN_SLUGS = new Set(["mountain", "mountains", "radar", "alerts", "resort"]);

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

export function AppShell({ children }: { children: ReactNode }) {
  const { region } = useRegion();
  const [location] = useLocation();
  const { towns, town: activeTown } = useBaseTown();

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
  type CombinedNavItem = {
    key: string;
    href: string;
    icon: NavItem["icon"];
    label: string;
    active: boolean;
  };
  const buildCombinedNav = (): CombinedNavItem[] => {
    const items: CombinedNavItem[] = [];
    const seen = new Set<string>();
    const pushTown = (path: string) => {
      const it = townNav.find((n) => n.path === path);
      if (!it || !navTown || seen.has(`t:${path}`)) return;
      seen.add(`t:${path}`);
      items.push({
        key: `t:${it.path}`,
        href: townHref(it.path),
        icon: it.icon,
        label: t(it.label, it.labelJa),
        active: isActiveTown(it.path),
      });
    };
    const pushMountain = (path: string) => {
      const it = mountainNav.find((n) => n.path === path);
      if (!it || seen.has(`m:${path}`)) return;
      seen.add(`m:${path}`);
      items.push({
        key: `m:${it.path}`,
        href: mountainHref(it.path),
        icon: it.icon,
        label: t(it.label, it.labelJa),
        active: isActiveMountain(it.path),
      });
    };
    pushTown("/");                  // Today
    pushMountain("/mountains");     // All mountains
    pushTown("/roads");             // Roads
    pushMountain("/radar");         // Radar
    pushTown("/transport");         // Transport
    pushTown("/stay");              // Stay
    pushTown("/eat");               // Eat
    pushTown("/explore");           // Explore
    pushMountain("/alerts");        // Alerts
    // Future-proofing: append anything we forgot to enumerate above.
    townNav.forEach((it) => pushTown(it.path));
    mountainNav.forEach((it) => pushMountain(it.path));
    return items;
  };
  const combinedNav = buildCombinedNav();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-50 border-r border-border bg-white overflow-y-auto">
        <div className="px-6 pt-6 pb-5">
          <Link
            href="~/"
            className="byline inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            All regions
          </Link>
          <Link href="/" className="block mt-4 mb-1.5">
            <img src={region.brand.wordmarkUrl} alt="feelzlike" className="h-8 w-auto" />
          </Link>
          <p className="font-display font-semibold text-base leading-tight text-foreground">
            {region.name}
          </p>
          <p className="byline mt-1.5 text-muted-foreground/80">{region.subtitle}</p>

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
          {/* REGION */}
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
            combinedNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium",
                    item.active
                      ? "text-primary bg-primary/8"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {item.active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
                  )}
                  <Icon className={cn("w-4 h-4 transition-colors", item.active ? "text-primary" : "")} />
                  {item.label}
                </Link>
              );
            })
          ) : (
            <p className="px-3 py-2 byline text-muted-foreground/60">
              {t("Pick a town to see options.", "町を選んでください")}
            </p>
          )}
        </nav>

        <div className="px-6 pb-5 pt-3">
          <p className="byline text-muted-foreground/60">{region.footer ?? "v0.4 · feelzlike"}</p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 glass-strong">
        <div className="h-14 flex items-center justify-between px-4">
          <Link
            href="~/"
            aria-label="Back to all regions"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="byline">{t("Regions", "地域")}</span>
          </Link>
          <Link href="/" className="flex items-center">
            <img src={region.brand.wordmarkUrl} alt="feelzlike" className="h-6 w-auto" />
          </Link>
          {towns.length > 0 ? (
            <TownPicker variant="compact" preserveSubpath />
          ) : (
            <span className="byline text-muted-foreground/80">{region.shortTag}</span>
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
          "flex-1 md:ml-64 w-full min-h-screen md:pt-0 pb-20 md:pb-0",
          (region.seasons || (region.language && region.language.locales.length > 1))
            ? "pt-24"
            : "pt-14",
        )}
      >
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

      {/* Mobile bottom nav: identical link order to the desktop sidebar
          (driven by `combinedNav`), horizontally scrollable so every entry
          is reachable on phones. */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-strong pb-safe">
        <div className="flex items-center px-1 h-16 overflow-x-auto hide-scrollbar">
          {(() => {
            return combinedNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center shrink-0 h-full gap-1 px-3 min-w-[64px] transition-all",
                    item.active ? "text-primary" : "text-muted-foreground/80",
                  )}
                >
                  {item.active && (
                    <span className="absolute top-1.5 w-8 h-0.5 rounded-full bg-primary" />
                  )}
                  <Icon className="w-4 h-4" />
                  <span className="text-[9px] font-semibold tracking-wider uppercase leading-none whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              );
            });
          })()}
        </div>
      </nav>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 pt-2 pb-2 byline text-muted-foreground/70">{children}</p>
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
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
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
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors",
          season === "winter"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Snowflake className="w-3 h-3" />
        {t("Winter", "冬")}
      </button>
      <button
        type="button"
        onClick={() => onChange("green")}
        aria-pressed={season === "green"}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors",
          season === "green"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sun className="w-3 h-3" />
        {t("Green", "緑")}
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
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {loc === "ja" ? "日本語" : "EN"}
        </button>
      ))}
    </div>
  );
}
