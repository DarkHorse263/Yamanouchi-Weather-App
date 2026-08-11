import {
  Home,
  CloudSun,
  Car,
  Bus,
  BedDouble,
  UtensilsCrossed,
  Compass,
  CalendarDays,
  Sparkles,
  UserRound,
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
 * (e.g. /plan), which target App.tsx top-level pages via wouter's `~/` escape.
 *
 * May 2026 restructure: dropped /mountains and /radar (mountains accessed
 * inline from the Today page; radar embedded in /weather).
 */
export const DEFAULT_MOUNTAIN_NAV: NavItem[] = [
  // Compare mountains · side-by-side snow comparison; global path so AppShell
  // doesn't rewrite it to /:region/compare.
  { path: "/compare", icon: CalendarDays, label: "Compare mountains", labelJa: "山を比べる" },
  // Premium hub · lists what's premium and, during the launch promo, that it
  // is free for subscribers until 31 december 2026 (monthly & yearly plans
  // open after). Global path (root-escaped in AppShell) so the region router
  // base doesn't rewrite it to /:region/premium.
  { path: "/premium", icon: Sparkles, label: "Premium", labelJa: "プレミアム" },
  // Member account · alerts + details in one place. Global path (root-escaped
  // in AppShell) like /premium; signed-out visitors get the sign-up sheet.
  { path: "/account", icon: UserRound, label: "Account", labelJa: "アカウント" },
];

/**
 * Sidebar items for the "Region" section.
 * May 2026 footer reset: "Sources" moved into the homepage footer (combined
 * dropdown under About), so the sidebar Region group renders empty and is
 * hidden by AppShell. The /sources route stays mounted via the router.
 */
export const DEFAULT_REGION_NAV: NavItem[] = [];
