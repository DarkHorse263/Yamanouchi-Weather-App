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
  tasmania:                  { lat: -41.54,  lon: 147.67,  zoom: 9 },
  yamanouchi:                { lat: 36.74,   lon: 138.42,  zoom: 9 },
  "nozawa-onsen":            { lat: 36.928,  lon: 138.449, zoom: 10 },
  iiyama:                    { lat: 36.873,  lon: 138.366, zoom: 10 },
};

// Only the US, Liberia and Myanmar use imperial units by convention.
// We detect from navigator.language (e.g. "en-US", "en-LR", "my-MM");
// everything else gets metric. SSR/Node fallback returns metric.
const IMPERIAL_COUNTRIES = new Set(["US", "LR", "MM"]);
function regionFromTag(tag: string): string | null {
  if (!tag) return null;
  // Prefer Intl.Locale for BCP47-correct region extraction (handles
  // script subtags like `zh-Hant-US`). Fall back to a naive parse if
  // the runtime doesn't support it or the tag is malformed.
  try {
    const region = new Intl.Locale(tag).region;
    if (region) return region.toUpperCase();
  } catch {
    /* fall through */
  }
  const parts = tag.split("-");
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (/^[A-Za-z]{2}$/.test(part)) return part.toUpperCase();
    if (/^\d{3}$/.test(part)) return part;
  }
  return null;
}
function preferredUnits(): "imperial" | "metric" {
  if (typeof navigator === "undefined") return "metric";
  const langs: readonly string[] = navigator.languages?.length
    ? navigator.languages
    : [navigator.language ?? ""];
  for (const tag of langs) {
    const region = regionFromTag(tag);
    if (!region) continue;
    return IMPERIAL_COUNTRIES.has(region) ? "imperial" : "metric";
  }
  return "metric";
}

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
  // lat/lon/zoom/units from URLSearchParams. Units follow the visitor's
  // browser locale - imperial for US/Liberia/Myanmar, metric everywhere
  // else (covers AU + JP natively, plus the rest of the world).
  const radarUrl = useMemo(() => {
    const view = props.region ? REGION_VIEW[props.region] : null;
    if (!view) return RADAR_BASE_URL;
    const params = new URLSearchParams({
      lat: String(view.lat),
      lon: String(view.lon),
      zoom: String(view.zoom),
      units: preferredUnits(),
    });
    return `${RADAR_BASE_URL}?${params.toString()}`;
  }, [props.region]);
  // Ref guard so a late-firing timeout callback that was already
  // queued before `onLoad` cleared the timer cannot flip us into
  // the fallback after a successful load.
  const settledRef = useRef(false);

  // When the URL changes (region switch), reset lifecycle state so
  // the remounted iframe gets a fresh spinner, fresh timeout, and
  // its onLoad/onError can fire again. Without this reset the iframe
  // keyed remount would still see settledRef=true and loaded=true
  // from the previous region, disabling spinner + fallback.
  useEffect(() => {
    settledRef.current = false;
    setLoaded(false);
    setErrored(false);
  }, [radarUrl]);

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
  }, [loaded, errored, radarUrl]);

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
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
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
