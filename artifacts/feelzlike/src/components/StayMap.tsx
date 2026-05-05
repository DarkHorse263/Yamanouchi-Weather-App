import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

import type { Stay } from "@/types/stayEat";
import { cn } from "@/lib/utils";

// Lazy-load the heavy map module. This keeps the leaflet runtime + react-leaflet
// out of the initial JS bundle until a page actually mounts the map. The dynamic
// import resolves the default export of `StayMap.inner.tsx`.
const StayMapInner = lazy(() => import("@/components/StayMap.inner"));

export interface StayMapProps {
  /** Stays to render as markers. Already-filtered set from the parent page. */
  stays: Stay[];
  /**
   * Snake_case curated key of today's #1 mountain (e.g. `thredbo`, `shiga_kogen`).
   * Markers are colour-bucketed by drive_min_to_each_mountain[topMountainDriveKey].
   * Pass `null` to fall back to drive_min_to_nearest_mountain on each stay.
   */
  topMountainDriveKey?: string | null;
  /**
   * Whether to render mobile chrome (hidden zoom controls, bottom-anchored
   * locate). When omitted, the inner component auto-detects via useIsMobile().
   */
  isMobile?: boolean;
  /** Pass-through className for sizing/layout overrides. */
  className?: string;
  /**
   * Centre to use when no stay has lat/lng. Pass the town's centroid here
   * (from `RegionConfig.towns[].lat/lng`); without it, an empty geo-stays set
   * renders at `[0,0]` (mid-Atlantic ocean).
   */
  fallbackCenter?: { lat: number; lng: number } | null;
}

/** Lazy-loaded Suspense wrapper around the leaflet map. */
export function StayMap(props: StayMapProps) {
  return (
    <Suspense fallback={<MapFallback isMobile={props.isMobile} className={props.className} />}>
      <StayMapInner {...props} />
    </Suspense>
  );
}

function MapFallback({ isMobile, className }: { isMobile?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full bg-slate-100",
        "h-[calc(100vh-4rem)] md:h-[80vh]",
        "md:rounded-2xl md:overflow-hidden md:border md:border-border",
        className,
      )}
      aria-busy
      aria-live="polite"
      data-mobile={isMobile ? "1" : "0"}
    >
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading map…
        </div>
      </div>
    </div>
  );
}

export default StayMap;
