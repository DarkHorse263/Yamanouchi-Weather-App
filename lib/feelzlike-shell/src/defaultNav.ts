import {
  Home,
  CloudSun,
  Car,
  Bus,
  BedDouble,
  UtensilsCrossed,
  Compass,
  AlertTriangle,
  Sparkles,
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
 * Sidebar items for the "Mountains" section. Paths are RELATIVE to /:region.
 *
 * May 2026 restructure: dropped /mountains and /radar (mountains accessed
 * inline from the Today page; radar embedded in /weather). Alerts is the
 * only remaining mountain-scope nav entry and is gated behind a paywall.
 */
export const DEFAULT_MOUNTAIN_NAV: NavItem[] = [
  // Powder alerts only make sense in snow season — sidebar/bottom-nav hides
  // the row entirely when the active region is in green season (the
  // shell's `filterBySeason` does the work).
  { path: "/alerts", icon: AlertTriangle, label: "Alerts", labelJa: "警報", season: "winter" },
  // Premium hub · year-round (lists alerts + every gated feature, handles
  // tier status and the preview/upgrade CTA). Route is globally mounted
  // (`/premium`) so it shows from any region/town context.
  { path: "/premium", icon: Sparkles, label: "Premium", labelJa: "プレミアム" },
];

/**
 * Sidebar items for the "Region" section.
 * May 2026 footer reset: "Sources" moved into the homepage footer (combined
 * dropdown under About), so the sidebar Region group renders empty and is
 * hidden by AppShell. The /sources route stays mounted via the router.
 */
export const DEFAULT_REGION_NAV: NavItem[] = [];
