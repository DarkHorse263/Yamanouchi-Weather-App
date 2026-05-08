import {
  Home,
  CloudSun,
  Car,
  Bus,
  BedDouble,
  UtensilsCrossed,
  Compass,
  AlertTriangle,
  Database,
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
  { path: "/alerts", icon: AlertTriangle, label: "Alerts", labelJa: "警報" },
];

/**
 * Sidebar items for the "Region" section (shown above town/mountain sections).
 * Paths are RELATIVE to /:region.
 */
export const DEFAULT_REGION_NAV: NavItem[] = [
  { path: "/sources", icon: Database, label: "Sources", labelJa: "データ出典" },
];
