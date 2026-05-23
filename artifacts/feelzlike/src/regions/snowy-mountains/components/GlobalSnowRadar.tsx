import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { RadarMap, type RadarMapProps, type RadarRegionKey } from "./RadarMap";

const RADAR_BASE_URL = "https://global-snow-radar.replit.app/";
const LOAD_TIMEOUT_MS = 12_000;

// Per-region centre + zoom passed to the radar app via its documented
// URLSearchParams contract (lat/lon/zoom/units). Mirrors the windy
// coords used by the local RadarMap so the iframe opens in the right
// country every time, regardless of where the radar app last left off.
const REGION_VIEW: Record<RadarRegionKey, { lat: number; lon: number; zoom: number }> = {
  "snowy-mountains":         { lat: -36.42,  lon: 148.42,  zoom: 9 },
  "victorias-high-country":  { lat: -36.86,  lon: 147.27,  zoom: 9 },
  yamanouchi:                { lat: 36.74,   lon: 138.42,  zoom: 9 },
  "nozawa-onsen":            { lat: 36.928,  lon: 138.449, zoom: 10 },
  iiyama:                    { lat: 36.873,  lon: 138.366, zoom: 10 },
};

/**
 * GlobalSnowRadar
 *
 * Primary radar surface for all regions. Embeds the standalone
 * Global Snow Radar app (deployed separately on Replit) as an
 * iframe. If the iframe fails to load within LOAD_TIMEOUT_MS or
 * emits an error, we automatically fall back to the legacy
 * RainViewer/Windy `<RadarMap />` so users never see a blank
 * panel.
 *
 * Props mirror RadarMapProps so this is a drop-in replacement.
 */
export function GlobalSnowRadar(props: RadarMapProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Build a region-aware URL so the iframe opens centered on the
  // country/region the user is currently viewing. The radar app reads
  // lat/lon/zoom/units from URLSearchParams.
  const radarUrl = useMemo(() => {
    const view = props.region ? REGION_VIEW[props.region] : null;
    if (!view) return RADAR_BASE_URL;
    const params = new URLSearchParams({
      lat: String(view.lat),
      lon: String(view.lon),
      zoom: String(view.zoom),
      units: "metric",
    });
    return `${RADAR_BASE_URL}?${params.toString()}`;
  }, [props.region]);
  // Ref guard so a late-firing timeout callback that was already
  // queued before `onLoad` cleared the timer cannot flip us into
  // the fallback after a successful load.
  const settledRef = useRef(false);

  useEffect(() => {
    if (loaded || errored) return;
    timerRef.current = window.setTimeout(() => {
      if (settledRef.current) return;
      settledRef.current = true;
      setErrored(true);
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [loaded, errored]);

  if (errored) {
    return <RadarMap {...props} />;
  }

  return (
    <div className="relative w-full h-[520px] md:h-[640px] bg-slate-900">
      {!loaded && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-slate-900/80 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading radar{"\u2026"}
          </div>
        </div>
      )}
      <iframe
        key={radarUrl}
        src={radarUrl}
        title="Global Snow Radar"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full border-0"
        onLoad={() => {
          if (settledRef.current) return;
          settledRef.current = true;
          if (timerRef.current !== null) window.clearTimeout(timerRef.current);
          setLoaded(true);
        }}
        onError={() => {
          if (settledRef.current) return;
          settledRef.current = true;
          setErrored(true);
        }}
      />
    </div>
  );
}

export default GlobalSnowRadar;
