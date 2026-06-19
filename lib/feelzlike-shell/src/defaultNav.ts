import {
  Home,
  CloudSun,
  Car,
  Bus,
  BedDouble,
  UtensilsCrossed,
  Compass,
  Newspaper,
} from "lucide-react";
import type { NavItem } from "./types";

/** Sidebar items for the "In Town" section. Paths are RELATIVE to /:region/:town. */
export const DEFAULT_TOWN_NAV: NavItem[] = [
  { path: "/",          icon: Home,            label: "Today",            labelJa: "今日" },
  { path: "/weather",   icon: CloudSun,        label: "Weather forecast", labelJa: "天気予報" },
  { path: "/roads",     icon: Car,             label: "Roads & cams",     labelJa: "道路・カメラ" },
  { path: "/transport", icon: Bus,             label: "Transport",        labelJa: "交通" },
  { path: "/stay",      icon: BedDouble,       label: "Stay",             labelJa: "宿泊" },
  { path: "/eat",       icon: UtensilsCrossed, label: "Eat",              labelJa: "食事" },
  { path: "/explore",   icon: Compass,         label: "Explore",          labelJa: "観光" },
];

/**
 * Sidebar items for the "Mountains" section. Paths are RELATIVE to /:region,
 * EXCEPT globally-mounted routes flagged in AppShell's GLOBAL_MOUNTAIN_PATHS
 * (e.g. /news), which target App.tsx top-level pages via wouter's `~/` escape.
 *
 * May 2026 restructure: dropped /mountains and /radar (mountains accessed
 * inline from the Today page; radar embedded in /weather).
 */
export const DEFAULT_MOUNTAIN_NAV: NavItem[] = [
  // News · links to the best mountain, equipment and travel articles. Points
  // at the global /news page (curated feed + automated announcements). Shown
  // year-round (no season gate) and treated as a global path in AppShell so the
  // region router base doesn't rewrite it to /:region/news. Replaced the old
  // winter-only "Alerts" tab; the /:region/alerts route stays mounted in
  // RegionLayout for direct-URL access only.
  { path: "/news", icon: Newspaper, label: "News", labelJa: "ニュース" },
  // Premium hub hidden until we have traction · the /premium route stays
  // mounted in App.tsx (direct-URL only) but is no longer surfaced in nav.
  // Restore the { path: "/premium", icon: Sparkles, ... } item here (and the
  // Sparkles import above) to bring the premium tab back.
];

/**
 * Sidebar items for the "Region" section.
 * May 2026 footer reset: "Sources" moved into the homepage footer (combined
 * dropdown under About), so the sidebar Region group renders empty and is
 * hidden by AppShell. The /sources route stays mounted via the router.
 */
export const DEFAULT_REGION_NAV: NavItem[] = [];
