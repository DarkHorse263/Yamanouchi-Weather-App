import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Pause, Play } from "lucide-react";

interface RainViewerFrame {
  time: number;
  path: string;
}
interface RainViewerResponse {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RainViewerFrame[];
    nowcast: RainViewerFrame[];
  };
}

interface RadarMapInnerProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ id: string; name: string; lat: number; lng: number }>;
}

const DEFAULT_CENTER = { lat: -36.42, lng: 148.42 };

const BASEMAP_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const BASEMAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png";

function buildPinIcon(): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="
        width: 14px; height: 14px; border-radius: 50%;
        background: #38bdf8; border: 2px solid #ffffff;
        box-shadow: 0 0 0 2px rgba(56,189,248,0.35), 0 2px 4px rgba(0,0,0,0.4);
        transform: translate(-50%, -50%);
      "></div>`,
    className: "radar-mountain-marker",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function MapBootstrap() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

/**
 * Animated radar overlay backed by RainViewer (free, no key, sourced from BOM
 * for AU). RainViewer publishes a JSON manifest of the most recent ~13 frames
 * (every 10 min, last ~2 hrs) plus their tile URL templates. We swap the active
 * tile layer through the frames at ~2 fps.
 */
function RadarOverlay({
  frames,
  activeIdx,
  host,
}: {
  frames: RainViewerFrame[];
  activeIdx: number;
  host: string;
}) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);
  // Keep one cached layer per frame so toggling between them is instant after
  // the first pass through the loop. Without the cache we'd refetch tiles
  // every cycle (RainViewer tiles are cacheable but the http roundtrip flickers).
  const cacheRef = useRef<Map<string, L.TileLayer>>(new Map());

  useEffect(() => {
    const frame = frames[activeIdx];
    if (!frame) return;
    const key = frame.path;
    let layer = cacheRef.current.get(key);
    if (!layer) {
      // Color scheme 6 = "TheWeatherChannel"-ish blue→green→yellow→red ramp
      // that reads well on the dark basemap. smooth=1 + snow=1 enables the
      // snowflake mask for sub-zero echoes (used to be option 2 only).
      const url = `${host}${frame.path}/256/{z}/{x}/{y}/6/1_1.png`;
      layer = L.tileLayer(url, {
        opacity: 0.0,
        zIndex: 250,
        attribution: '&copy; <a href="https://www.rainviewer.com/api.html">RainViewer</a>',
      });
      cacheRef.current.set(key, layer);
      layer.addTo(map);
    }
    // Fade out previous, fade in new. Using opacity 0/0.85 keeps the basemap
    // legible while still letting the precipitation read.
    const previous = layerRef.current;
    if (previous && previous !== layer) previous.setOpacity(0);
    layer.setOpacity(0.85);
    layerRef.current = layer;
  }, [frames, activeIdx, host, map]);

  // Prune stale layers whenever the manifest rolls forward (every 5 min). Any
  // cached layer whose path is no longer in `frames` gets removed from the map
  // and dropped from the cache, preventing unbounded growth in long-lived
  // sessions.
  useEffect(() => {
    const validKeys = new Set(frames.map((f) => f.path));
    const cache = cacheRef.current;
    cache.forEach((layer, key) => {
      if (!validKeys.has(key)) {
        map.removeLayer(layer);
        cache.delete(key);
      }
    });
  }, [frames, map]);

  // Cleanup all cached layers on unmount.
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      cache.forEach((l) => map.removeLayer(l));
      cache.clear();
      layerRef.current = null;
    };
  }, [map]);

  return null;
}

export default function RadarMapInner({
  center = DEFAULT_CENTER,
  zoom = 8,
  markers = [],
}: RadarMapInnerProps) {
  const [data, setData] = useState<RainViewerResponse | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json: RainViewerResponse = await r.json();
        if (cancelled) return;
        setData(json);
        setActiveIdx(json.radar.past.length - 1);
        setLoadError(null);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load radar manifest";
        setLoadError(msg);
      }
    };
    load();
    // Refresh manifest every 5 min (frames roll every 10 min).
    const t = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const frames = useMemo(() => data?.radar.past ?? [], [data]);

  // Animation loop: ~500ms per frame, hold on the latest for ~1.4s so the
  // current state is visible at the end of each cycle.
  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const isLatest = activeIdx === frames.length - 1;
    const delay = isLatest ? 1400 : 500;
    const t = setTimeout(() => {
      setActiveIdx((i) => (i + 1) % frames.length);
    }, delay);
    return () => clearTimeout(t);
  }, [activeIdx, playing, frames.length]);

  const pinIcon = useMemo(() => buildPinIcon(), []);
  const activeFrame = frames[activeIdx];
  const frameTime = activeFrame ? new Date(activeFrame.time * 1000) : null;
  const isLatest = activeFrame && activeIdx === frames.length - 1;

  return (
    <div className="relative w-full h-[520px] md:h-[640px]">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        minZoom={5}
        maxZoom={11}
        scrollWheelZoom
        zoomControl
        attributionControl
        className="w-full h-full z-0 bg-slate-900"
      >
        <MapBootstrap />
        <TileLayer url={BASEMAP_URL} attribution={BASEMAP_ATTRIBUTION} />
        {data && frames.length > 0 ? (
          <RadarOverlay frames={frames} activeIdx={activeIdx} host={data.host} />
        ) : null}
        {/* Place names overlay sits on top of the radar so towns stay legible. */}
        <TileLayer url={LABELS_URL} zIndex={400} />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={pinIcon}>
            <Tooltip
              direction="top"
              offset={[0, -8]}
              opacity={1}
              className="!bg-slate-900/90 !text-white !border-0 !px-2 !py-1 !text-[11px] !rounded-md !shadow-md"
            >
              {m.name}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Time / play controls — overlaid bottom of the map. */}
      <div className="absolute z-[500] left-3 right-3 bottom-3 flex flex-col gap-2 pointer-events-none">
        {loadError ? (
          <div className="self-center bg-rose-950/90 border border-rose-500/40 text-rose-100 text-xs font-medium px-3 py-1.5 rounded-md pointer-events-auto">
            Radar unavailable: {loadError}
          </div>
        ) : null}
        <div className="bg-slate-950/85 backdrop-blur border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-3 pointer-events-auto shadow-lg">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors flex-shrink-0"
            aria-label={playing ? "Pause radar animation" : "Play radar animation"}
            disabled={frames.length === 0}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {frames.length > 0 ? (
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={activeIdx}
              onChange={(e) => {
                setPlaying(false);
                setActiveIdx(Number(e.target.value));
              }}
              className="flex-1 accent-sky-400 cursor-pointer"
              aria-label="Radar timeline"
            />
          ) : (
            <div className="flex-1 text-xs text-white/60">Loading frames…</div>
          )}

          <div className="text-[11px] tabular-nums text-white/85 min-w-[72px] text-right">
            {frameTime ? (
              <>
                <span className="text-white">{frameTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-white/55 ml-1">{isLatest ? "now" : ""}</span>
              </>
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
