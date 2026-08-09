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

export interface MountainLink {
  /** Stable id, used in URL: /:region/mountain/:id */
  id: string;
  name: string;
  nameJa?: string;
  /** Optional summit/base elevation for card display */
  elevationM?: number;
  /** Short tagline shown on the region overview card */
  blurb?: string;
  blurbJa?: string;
  /** Optional hero image url for the card */
  imageUrl?: string;
  /** Official mountain/resort website URL */
  websiteUrl?: string;
  /**
   * Official resort snow report / conditions page (human page, NOT a feed).
   * Curl-verified before adding - resort URLs rot when sites restructure.
   * When absent the UI falls back to the plain official-site link only.
   */
  snowReportUrl?: string;
  /**
   * Official resort lift status / lift report page (human page, NOT a feed).
   * Curl-verified before adding - resort URLs rot when sites restructure.
   * When absent the lift card falls back to snowReportUrl, then websiteUrl.
   */
  liftStatusUrl?: string;
  /** Approximate base/centroid latitude - single source of truth for journey/Today's call. */
  lat?: number;
  /** Approximate base/centroid longitude. */
  lng?: number;
  /** Optional parent mountain id when this entry is a sub-area of a larger ski area. */
  parentId?: string;
  /** True if the mountain has substantial beginner terrain + green runs from base. */
  beginner_friendly?: boolean;
  /** True if the mountain is steep / mostly black-diamond / not for newcomers. */
  expert_only?: boolean;
  /** True if the mountain runs ski school + magic carpet + crèche. */
  kids_lessons?: boolean;
  /** True if the mountain operates a terrain park (jumps / rails / pipe). */
  terrain_park?: boolean;
  /** True if the mountain has lift-served side-country / gated backcountry. */
  backcountry_access?: boolean;
  /** True if the mountain is primarily a snow play / tobogganing area
   *  (no chairlift downhill skiing). E.g. Lake Mountain, Mt Donna Buang. */
  snow_play_only?: boolean;
  /** True if the mountain's main offering is cross-country / nordic skiing
   *  rather than alpine downhill. E.g. Mt Stirling, Lake Mountain. */
  nordic_focus?: boolean;
  /** True if the mountain operates in the green season (chairlift-served
   *  walks, MTB, alpine activities). Used to keep showing the resort in the
   *  TownHome mountains panel after the snow lifts close. E.g. Thredbo. */
  summerOpen?: boolean;
  /**
   * Weather Unlocked Ski Resort Forecast resort id. Populates the
   * top/mid/base elevation-banded forecast panel on mountain detail pages.
   * Look up via the Weather Unlocked dashboard "My Resorts" or their
   * resort directory. Leave undefined to hide the panel for that mountain.
   */
  weatherUnlockedId?: number;
}

/** Scope a NavItem belongs to. Determines which sidebar section renders it. */
export type NavScope = "region" | "town" | "mountain";

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

export interface TourismLink {
  /** Display label, e.g. "Snowy Mountains – Destination NSW" */
  label: string;
  /** Optional Japanese label */
  labelJa?: string;
  /** Outbound URL */
  url: string;
  /** Optional one-liner shown beneath the title */
  blurb?: string;
  blurbJa?: string;
  /** Optional grouping, e.g. "Tourism", "Resorts", "Transport" */
  category?: string;
  categoryJa?: string;
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
  /** Mountain ids accessible from this town. Used to scope roads/cams/transport. */
  nearbyMountainIds?: string[];
}

/**
 * RegionConfig — the data shape for every region (Snowy Mountains, Yamanouchi,
 * Victoria's High Country, etc).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ HARD RULE — every region must be TOWNS-FIRST, MOUNTAINS-HANG-OFF.    │
 * │                                                                      │
 * │ The region home (/:region/) is a town picker. Each town card         │
 * │ surfaces the mountain(s) that town serves. Mountain detail is        │
 * │ reached *via* a town, never as a flat top-level resort list.         │
 * │                                                                      │
 * │ This is the basis of the entire app's information architecture and   │
 * │ user mental model — never lead with a mountains grid on a region     │
 * │ home, even if the region only has one mountain. Confirm with the     │
 * │ user before deviating.                                               │
 * │                                                                      │
 * │ Practically that means every new region MUST populate `baseTowns`    │
 * │ with each town's `nearbyMountainIds` set so the region home can      │
 * │ render town → mountain mappings.                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Reference implementations: `artifacts/feelzlike/src/regions/snowy-mountains.ts`
 * and `.../yamanouchi.ts`.
 */
export interface RegionConfig {
  /** Stable id, e.g. "snowy-mountains". Used for URL path and localStorage. */
  id: string;
  /** Display name, e.g. "Snowy Mountains" */
  name: string;
  /** Subtitle, e.g. "NSW · Australia" */
  subtitle: string;
  /** Short tag, e.g. "NSW" - used in mobile chrome corner */
  shortTag: string;
  /** Brand assets */
  brand: RegionBrand;
  /** Legacy flat nav (still consumed by some pages; new code uses navOverrides). */
  nav?: NavItem[];
  /** Resort quick-links shown beneath nav (legacy; superseded by `mountains`). */
  resorts: ResortLink[];
  /** Mountains in this region. Used for the region overview cards and `/:region/mountain/:id`. */
  mountains?: MountainLink[];
  /**
   * Optional curated list of top-level mountain group names shown on the
   * country home card (e.g. Yamanouchi rolls 22 sub-resorts up to
   * "Shiga Kogen · Ryuoo · Yomase"). When omitted, the card falls back to
   * the raw `mountains` array. Strings only · these are display labels,
   * not links.
   */
  summaryMountains?: string[];
  /** Optional per-scope nav overrides. If absent, sensible defaults are used. */
  navOverrides?: Partial<Record<NavScope, NavItem[]>>;
  /** Localisation; omit if region is single-language English */
  language?: RegionLanguagePack;
  /** Whether the region supports the winter↔green toggle in chrome */
  seasons?: boolean;
  /**
   * Earth hemisphere the region sits in. Drives season auto-detection
   * (south → Jun-Sep is winter; north → Dec-Mar is winter). Defaults to
   * "north" when omitted, so AU regions MUST set this explicitly.
   */
  hemisphere?: "north" | "south";
  /** Base towns where guests typically stay. First entry is the default. */
  baseTowns?: BaseTown[];
  /** Optional version/footer string */
  footer?: string;
  /**
   * Outbound tourism / official-info links rendered on the region's
   * Explore page. Replaces the old live-Google-Places picker - the brief
   * was clear: just point people at the local tourism authorities.
   */
  tourismLinks?: TourismLink[];
  /**
   * Short label for the weather data source(s) used by this region. Surfaces
   * in the small UpdateStamp pill on the Today hub so JP pages don't credit
   * BOM and AU pages don't credit JMA. Default fallback is "Open-Meteo".
   */
  weatherSource?: {
    label: string;
    labelJa?: string;
  };
  /** Road conditions data source for this region. Drives the TownRoads page. */
  roadsSource?: {
    /** Display name of the source authority (e.g. "Live Traffic NSW"). */
    label: string;
    /** Japanese label, if applicable. */
    labelJa?: string;
    /** Public URL where users can see the official map / advisories. */
    url: string;
    /**
     * Whether our backend currently returns live road data for this region.
     * If false, the UI shows an honest "coming soon" panel instead of pretending.
     */
    dataAvailable: boolean;
  };
}
