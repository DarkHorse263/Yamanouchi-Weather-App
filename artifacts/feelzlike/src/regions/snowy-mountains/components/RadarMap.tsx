import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const RadarMapInner = lazy(() => import("./RadarMap.inner"));

export type { RegionKey as RadarRegionKey } from "./RadarMap.inner";
export type { OfficialRadarSource, WindySource } from "@/lib/bom-radar";

export interface RadarMapProps {
  /** Map centre - defaults to Snowy Mountains. */
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ id: string; name: string; lat: number; lng: number }>;
  /** Drives the precip toggle label: "Snow" in winter, "Rain" in green season. */
  season?: "winter" | "green";
  /** Drives the Windy centre and Official radar source per region. */
  region?: import("./RadarMap.inner").RegionKey;
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
    <Suspense fallback={<MapFallback />}>
      <RadarMapInner {...props} />
    </Suspense>
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
