import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { RadarMap, type RadarMapProps } from "./RadarMap";

const RADAR_URL = "https://global-snow-radar.replit.app/";
const LOAD_TIMEOUT_MS = 12_000;

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
        src={RADAR_URL}
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
