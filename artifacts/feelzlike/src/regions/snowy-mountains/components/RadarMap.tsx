import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const RadarMapInner = lazy(() => import("./RadarMap.inner"));

export interface RadarMapProps {
  /** Map centre - defaults to Snowy Mountains. */
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ id: string; name: string; lat: number; lng: number }>;
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
