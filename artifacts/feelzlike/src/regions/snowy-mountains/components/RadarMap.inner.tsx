import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, ImageOverlay, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RadarMapInnerProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ id: string; name: string; lat: number; lng: number }>;
}

const DEFAULT_CENTER = { lat: -36.42, lng: 148.42 };
const DEFAULT_ZOOM = 9;

const RESORT_PINS: Array<{ id: string; name: string; lat: number; lng: number }> = [
  { id: "perisher", name: "Perisher", lat: -36.3717, lng: 148.4086 },
  { id: "thredbo", name: "Thredbo", lat: -36.5054, lng: 148.3089 },
  { id: "charlottes-pass", name: "Charlotte's Pass", lat: -36.4314, lng: 148.3297 },
  { id: "selwyn", name: "Selwyn", lat: -35.8383, lng: 148.5267 },
  { id: "jindabyne", name: "Jindabyne", lat: -36.4106, lng: 148.6206 },
];

// IDR403 = Wagga Wagga 256 km radar.
// The PNG covers a square centred on the radar; we project that square
// into a lat/lng bounding box for Leaflet's ImageOverlay. BOM uses an
// azimuthal-equidistant projection, so the box is approximate (perfect
// at the centre, ~1-2% distortion at the edges) - well within tolerance
// for the Snowy Mountains, which sit ~50-150 km from the radar.
const RADAR = {
  id: "IDR403",
  centre: { lat: -35.1583, lng: 147.4575 }, // Wagga Wagga
  rangeKm: 256,
} as const;

function computeBounds(centre: { lat: number; lng: number }, rangeKm: number): L.LatLngBoundsExpression {
  const dlat = rangeKm / 111.32;
  const dlng = rangeKm / (111.32 * Math.cos((centre.lat * Math.PI) / 180));
  return [
    [centre.lat - dlat, centre.lng - dlng],
    [centre.lat + dlat, centre.lng + dlng],
  ];
}

const RADAR_BOUNDS = computeBounds(RADAR.centre, RADAR.rangeKm);

// BOM transparency layers stack underneath / over the radar PNG to give
// it geography. Order matters: background first, then topography, then
// (radar between), then locations + range + legend on top.
const TRANSPARENCY_BACKGROUND = `/api/bom-radar?type=transparency&file=${RADAR.id}.background.png`;
const TRANSPARENCY_TOPOGRAPHY = `/api/bom-radar?type=transparency&file=${RADAR.id}.topography.png`;
const TRANSPARENCY_LOCATIONS = `/api/bom-radar?type=transparency&file=${RADAR.id}.locations.png`;
const TRANSPARENCY_RANGE = `/api/bom-radar?type=transparency&file=${RADAR.id}.range.png`;

interface RadarFrame {
  ts: string;
  file: string;
  url: string;
}

function useRadarFrames() {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(`/api/bom-radar/frames?radar=${RADAR.id}&count=6`);
        if (!r.ok) throw new Error(`frames ${r.status}`);
        const data = await r.json();
        if (cancelled) return;
        setFrames(data.frames ?? []);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    // BOM publishes a new frame every 6 minutes; refresh the list every 5
    // min so we pick up the next one as soon as it lands.
    const id = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return { frames, loading, error };
}

function makePinIcon(label: string, accent: string): L.DivIcon {
  return L.divIcon({
    className: "feelzlike-radar-pin",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
        <div style="width:14px;height:14px;border-radius:9999px;background:${accent};box-shadow:0 0 0 3px rgba(255,255,255,0.95),0 1px 4px rgba(0,0,0,0.4);"></div>
        <div style="margin-top:4px;padding:2px 8px;border-radius:9999px;background:rgba(15,23,42,0.92);color:#fff;font:600 11px/1.1 'Inter',system-ui,sans-serif;white-space:nowrap;letter-spacing:0.01em;box-shadow:0 1px 4px rgba(0,0,0,0.3);">${label}</div>
      </div>
    `,
    iconSize: [80, 36],
    iconAnchor: [40, 7],
  });
}

const PIN_ICONS: Record<string, L.DivIcon> = {
  jindabyne: makePinIcon("Jindabyne", "#0ea5e9"),
  perisher: makePinIcon("Perisher", "#f97316"),
  thredbo: makePinIcon("Thredbo", "#f97316"),
  "charlottes-pass": makePinIcon("Charlotte's Pass", "#a855f7"),
  selwyn: makePinIcon("Selwyn", "#10b981"),
};

function RadarLayers({ frames, frameIndex }: { frames: RadarFrame[]; frameIndex: number }) {
  // Pre-mount every frame at low/zero opacity. Switching opacity (rather
  // than adding/removing layers) keeps the WebGL textures cached so the
  // animation is smooth instead of flickering on each tick.
  return (
    <>
      {frames.map((f, i) => (
        <ImageOverlay
          key={f.ts}
          url={f.url}
          bounds={RADAR_BOUNDS}
          opacity={i === frameIndex ? 0.85 : 0}
          zIndex={400}
        />
      ))}
    </>
  );
}

function RecenterOnChange({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

export default function RadarMapInner({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers,
}: RadarMapInnerProps) {
  const { frames, loading, error } = useRadarFrames();
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const tickRef = useRef<number | null>(null);

  // Animate frames at ~600ms per step. Pause when the user toggles play.
  useEffect(() => {
    if (!playing || frames.length === 0) return;
    tickRef.current = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames.length);
    }, 600);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [playing, frames.length]);

  // Whenever the frame list refreshes, jump to the newest frame so users
  // always start the next loop from "now".
  useEffect(() => {
    if (frames.length > 0) setFrameIndex(frames.length - 1);
  }, [frames.length]);

  const pins = useMemo(() => markers ?? RESORT_PINS, [markers]);
  const currentFrame = frames[frameIndex];
  const stamp = currentFrame ? formatStamp(currentFrame.ts) : null;
  const centerTuple: [number, number] = [center.lat, center.lng];

  return (
    <div className="relative w-full h-[520px] md:h-[640px] bg-slate-100">
      <MapContainer
        center={centerTuple}
        zoom={zoom}
        scrollWheelZoom
        className="absolute inset-0 w-full h-full"
        // Constrain the world a bit so panning doesn't wander off Australia.
        minZoom={6}
        maxZoom={12}
      >
        <RecenterOnChange center={centerTuple} zoom={zoom} />

        {/* OpenTopoMap basemap — terrain + ski runs underneath the radar. */}
        <TileLayer
          attribution='© <a href="https://opentopomap.org">OpenTopoMap</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          subdomains={["a", "b", "c"]}
          maxNativeZoom={15}
        />

        {/* BOM transparency stack: background tint + topography go below the
            radar; locations + range rings sit above so they stay readable. */}
        <ImageOverlay url={TRANSPARENCY_BACKGROUND} bounds={RADAR_BOUNDS} opacity={0.2} zIndex={300} />
        <ImageOverlay url={TRANSPARENCY_TOPOGRAPHY} bounds={RADAR_BOUNDS} opacity={0.25} zIndex={350} />

        <RadarLayers frames={frames} frameIndex={frameIndex} />

        <ImageOverlay url={TRANSPARENCY_LOCATIONS} bounds={RADAR_BOUNDS} opacity={0.7} zIndex={500} />
        <ImageOverlay url={TRANSPARENCY_RANGE} bounds={RADAR_BOUNDS} opacity={0.4} zIndex={510} />

        {pins.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={PIN_ICONS[p.id] ?? makePinIcon(p.name, "#0ea5e9")}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <span className="font-semibold">{p.name}</span>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating control bar: play/pause + timestamp + frame scrubber. */}
      <div className="absolute left-3 right-3 bottom-3 z-[1000] rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg px-3 py-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={frames.length === 0}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold disabled:opacity-40"
          aria-label={playing ? "Pause radar animation" : "Play radar animation"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
            {loading
              ? "Loading BOM Wagga Wagga radar…"
              : error
                ? "Radar unavailable"
                : stamp
                  ? `Frame ${frameIndex + 1} / ${frames.length} · ${stamp}`
                  : "No recent frames"}
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, frames.length - 1)}
            value={frameIndex}
            onChange={(e) => {
              setPlaying(false);
              setFrameIndex(parseInt(e.target.value));
            }}
            disabled={frames.length === 0}
            className="w-full mt-1 accent-slate-900"
            aria-label="Radar frame scrubber"
          />
        </div>
        <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
          BOM IDR403 · 256 km
        </span>
      </div>
    </div>
  );
}

// "202605080230" → "08 May 02:30 UTC" rendered in local time.
function formatStamp(ts: string): string {
  if (ts.length !== 12) return ts;
  const yr = ts.slice(0, 4);
  const mo = ts.slice(4, 6);
  const da = ts.slice(6, 8);
  const hh = ts.slice(8, 10);
  const mm = ts.slice(10, 12);
  const iso = `${yr}-${mo}-${da}T${hh}:${mm}:00Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}
