import {
  Home,
  Mountain,
  Video,
  Car,
  Cable,
  Bus,
  BedDouble,
  UtensilsCrossed,
  Compass,
  AlertTriangle,
} from "lucide-react";
import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

export const iiyamaRegion: RegionConfig = {
  id: "iiyama",
  name: "Iiyama",
  subtitle: "Nagano · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en", "ja"] },
  nav: [
    { path: "/",          icon: Home,           label: "Today",     labelJa: "今日" },
    { path: "/mountains", icon: Mountain,       label: "Mountains", labelJa: "スキー場" },
    { path: "/cams",      icon: Video,          label: "Cams",      labelJa: "ライブ" },
    { path: "/roads",     icon: Car,            label: "Roads",     labelJa: "道路" },
    { path: "/lifts",     icon: Cable,          label: "Lifts",     labelJa: "リフト", season: "winter" },
    { path: "/transport", icon: Bus,            label: "Transport", labelJa: "交通", group: "secondary" },
    { path: "/stay",      icon: BedDouble,      label: "Stay",      labelJa: "宿泊", group: "secondary" },
    { path: "/eat",       icon: UtensilsCrossed,label: "Eat",       labelJa: "食事", group: "secondary" },
    { path: "/explore",   icon: Compass,        label: "Explore",   labelJa: "観光", group: "secondary" },
    { path: "/alerts",    icon: AlertTriangle,  label: "Alerts",    labelJa: "警報", group: "secondary" },
  ],
  resorts: [
    { path: "/resort/madarao",       label: "Madarao Kogen",   labelJa: "斑尾高原" },
    { path: "/resort/togari",        label: "Togari Onsen",    labelJa: "戸狩温泉" },
    { path: "/resort/nozawa-onsen",  label: "Nozawa Onsen",    labelJa: "野沢温泉" },
  ],
  footer: "v0.3 · feelzlike",
};
