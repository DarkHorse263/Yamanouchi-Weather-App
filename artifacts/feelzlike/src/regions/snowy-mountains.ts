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
  Radar as RadarIcon,
} from "lucide-react";
import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

export const snowyMountainsRegion: RegionConfig = {
  id: "snowy-mountains",
  name: "Snowy Mountains",
  subtitle: "NSW · Australia",
  shortTag: "NSW",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  nav: [
    { path: "/",          icon: Home,           label: "Today" },
    { path: "/mountains", icon: Mountain,       label: "Mountains" },
    { path: "/cams",      icon: Video,          label: "Cams" },
    { path: "/roads",     icon: Car,            label: "Roads" },
    { path: "/lifts",     icon: Cable,          label: "Lifts", season: "winter" },
    { path: "/radar",     icon: RadarIcon,      label: "Radar" },
    { path: "/transport", icon: Bus,            label: "Transport", group: "secondary" },
    { path: "/stay",      icon: BedDouble,      label: "Stay",      group: "secondary" },
    { path: "/eat",       icon: UtensilsCrossed,label: "Eat",       group: "secondary" },
    { path: "/explore",   icon: Compass,        label: "Explore",   group: "secondary" },
    { path: "/alerts",    icon: AlertTriangle,  label: "Alerts",    group: "secondary" },
  ],
  resorts: [
    { path: "/resort/thredbo",   label: "Thredbo" },
    { path: "/resort/perisher",  label: "Perisher" },
    { path: "/resort/jindabyne", label: "Jindabyne" },
    { path: "/resort/selwyn",    label: "Selwyn" },
  ],
  footer: "v0.3 · feelzlike",
};
