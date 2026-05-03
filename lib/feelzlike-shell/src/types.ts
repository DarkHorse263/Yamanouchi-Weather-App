import type { ComponentType } from "react";

export type Season = "winter" | "green";
export type Language = "en" | "ja";

export interface NavItem {
  /** Path relative to region base, e.g. "/" or "/cams" */
  path: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  labelJa?: string;
  /** Show only in this season; omit to always show */
  season?: Season;
  /** Group: primary = top of sidebar, secondary = below primary, mobile = bottom nav */
  group?: "primary" | "secondary";
}

export interface ResortLink {
  /** Path relative to region base, e.g. "/resort/thredbo" */
  path: string;
  label: string;
  labelJa?: string;
}

export interface RegionBrand {
  /** Wordmark image URL (resolved by the consuming app's Vite alias) */
  wordmarkUrl: string;
  /** Optional region accent color override (HSL string for --primary) */
  primaryHsl?: string;
}

export interface RegionLanguagePack {
  /** Locales this region supports. First entry is the default. */
  locales: Language[];
}

export interface BaseTown {
  /** Stable id, e.g. "jindabyne". Used for persistence and Places filtering. */
  id: string;
  /** Display name, e.g. "Jindabyne" */
  name: string;
  /** Optional Japanese name */
  nameJa?: string;
  /** Centroid latitude, used to centre Places searches */
  lat: number;
  /** Centroid longitude */
  lng: number;
  /** Radius in metres for Places searches around the town */
  radiusM?: number;
  /** Short one-line tagline shown beneath the picker */
  blurb?: string;
  /** Optional JP tagline */
  blurbJa?: string;
}

export interface RegionConfig {
  /** Stable id, e.g. "snowy-mountains". Used for URL path and localStorage. */
  id: string;
  /** Display name, e.g. "Snowy Mountains" */
  name: string;
  /** Subtitle, e.g. "NSW · Australia" */
  subtitle: string;
  /** Short tag, e.g. "NSW" — used in mobile chrome corner */
  shortTag: string;
  /** Brand assets */
  brand: RegionBrand;
  /** Sidebar nav items (region defines which it wants) */
  nav: NavItem[];
  /** Resort quick-links shown beneath nav */
  resorts: ResortLink[];
  /** Localisation; omit if region is single-language English */
  language?: RegionLanguagePack;
  /** Whether the region supports the winter↔green toggle in chrome */
  seasons?: boolean;
  /** Base towns where guests typically stay. First entry is the default. */
  baseTowns?: BaseTown[];
  /** Optional version/footer string */
  footer?: string;
}
