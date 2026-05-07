import {
  Home,
  Car,
  Bus,
  BedDouble,
  UtensilsCrossed,
  Compass,
  Mountain,
  Cable,
  AlertTriangle,
  Radar as RadarIcon,
  Database,
} from "lucide-react";
import type { NavItem } from "./types";

/** Sidebar items for the "In Town" section. Paths are RELATIVE to /:region/:town. */
export const DEFAULT_TOWN_NAV: NavItem[] = [
  { path: "/",          icon: Home,            label: "Today",     labelJa: "今日" },
  { path: "/roads",     icon: Car,             label: "Roads",     labelJa: "道路" },
  { path: "/transport", icon: Bus,             label: "Transport", labelJa: "交通" },
  { path: "/stay",      icon: BedDouble,       label: "Stay",      labelJa: "宿泊" },
  { path: "/eat",       icon: UtensilsCrossed, label: "Eat",       labelJa: "食事" },
  { path: "/explore",   icon: Compass,         label: "Explore",   labelJa: "観光" },
];

/** Sidebar items for the "Mountains" section. Paths are RELATIVE to /:region. */
export const DEFAULT_MOUNTAIN_NAV: NavItem[] = [
  // "Today's call" was retired in the Apr 2026 reset (live data wasn't
  // ready to back the verdict UI). The route is gone — keep this nav list
  // free of dead paths.
  { path: "/mountains",       icon: Mountain,      label: "All mountains", labelJa: "スキー場一覧" },
  { path: "/mountains/lifts", icon: Cable,         label: "Lifts",         labelJa: "リフト", season: "winter" },
  { path: "/radar",           icon: RadarIcon,     label: "Radar",         labelJa: "気象レーダー" },
  { path: "/alerts",          icon: AlertTriangle, label: "Alerts",        labelJa: "警報" },
];

/**
 * Sidebar items for the "Region" section (shown above town/mountain sections).
 * Paths are RELATIVE to /:region.
 *
 * Note: the old "Region overview" entry was dropped when `/` was repointed to
 * redirect into the first base town (`baseTowns[0]`). The Region section now
 * surfaces region-wide context like the data-source attribution page.
 */
export const DEFAULT_REGION_NAV: NavItem[] = [
  { path: "/sources", icon: Database, label: "Sources", labelJa: "データ出典" },
];
