import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from "react";
import { captureException } from "@sentry/react";
import { Loader2, RefreshCw } from "lucide-react";

const RadarMapInner = lazy(() => import("./RadarMap.inner"));

export type { RegionKey as RadarRegionKey } from "@/regions/region-pins";
export type { OfficialRadarSource, WindySource } from "@/lib/bom-radar";

export interface RadarMapProps {
  /** Map centre - defaults to Snowy Mountains. */
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ id: string; name: string; lat: number; lng: number }>;
  /** Drives the precip toggle label: "Snow" in winter, "Rain" in green season. */
  season?: "winter" | "green";
  /** Drives the Windy centre and Official radar source per region. */
  region?: import("@/regions/region-pins").RegionKey;
  /**
   * Per-coordinate override for the Official + Expert sources (e.g. /near-you
   * hands us an arbitrary AU location's nearest BOM radar, or null when none
   * covers the point). When omitted, the per-region config is used.
   */
  location?: {
    official: import("@/lib/bom-radar").OfficialRadarSource | null;
    windy: import("@/lib/bom-radar").WindySource;
  };
}

export function RadarMap(props: RadarMapProps) {
  return (
    <RadarErrorBoundary>
      <Suspense fallback={<MapFallback />}>
        <RadarMapInner {...props} />
      </Suspense>
    </RadarErrorBoundary>
  );
}

/**
 * Contains radar failures to the radar box. The map is code-split
 * (`lazy(() => import("./RadarMap.inner"))`); a failed chunk load (a stale
 * build after a deploy, a flaky network) or a render error inside the map
 * would otherwise bubble to the top-level boundary and blank the whole
 * weather page. Here it degrades to a compact "reload to try again" panel
 * while every other forecast section above stays visible. A hard reload is
 * used because a cached rejected dynamic import won't re-fetch on a soft
 * remount.
 */
class RadarErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[radar] failed to load", error, info);
    // Still report to Sentry · the radar is the prime suspect for the
    // "something broke up the mountain" full-page crash, so we want these
    // now-contained failures visible to confirm the root cause.
    captureException(error, {
      tags: { area: "radar" },
      extra: { componentStack: info.componentStack },
    });
  }
  render(): ReactNode {
    if (this.state.hasError) return <RadarErrorFallback />;
    return this.props.children;
  }
}

function RadarErrorFallback() {
  return (
    <div className="relative w-full h-[520px] md:h-[640px] bg-slate-900/80 grid place-items-center px-6 text-center">
      <div className="max-w-xs">
        <p className="text-sm font-semibold text-white">radar unavailable</p>
        <p className="mt-1 text-xs text-white/60">
          the live radar could not load · the rest of the forecast above is up to date.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> reload to try again
        </button>
      </div>
    </div>
  );
}

function MapFallback() {
  return (
    <div className="relative w-full h-[520px] md:h-[640px] bg-slate-900/80 grid place-items-center">
      <div className="flex items-center gap-2 text-sm text-white/70">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading radar…
      </div>
    </div>
  );
}

export default RadarMap;
