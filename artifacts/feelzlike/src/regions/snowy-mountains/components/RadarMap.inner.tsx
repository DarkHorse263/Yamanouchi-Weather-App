import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Cloud, CloudSnow, CloudRain, Layers, Pause, Play, Map as MapIcon, Radio, Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadarMapInnerProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ id: string; name: string; lat: number; lng: number }>;
  season?: "winter" | "green";
  region?: RegionKey;
}

type RegionKey = "snowy-mountains" | "vhc" | "yamanouchi";
type ViewMode = "interactive" | "windy" | "official";

interface RegionConfig {
  windy: { lat: number; lon: number; zoom: number };
  official: {
    label: string;
    /** Direct image URL we hotlink (e.g. BOM radar gif). null = link-out only. */
    imageUrl: string | null;
    /** Page URL for "open source" link. */
    href: string;
    attribution: string;
  };
}

const REGION_CONFIG: Record<RegionKey, RegionConfig> = {
  "snowy-mountains": {
    windy: { lat: -36.42, lon: 148.42, zoom: 9 },
    official: {
      label: "BOM Captain's Flat",
      imageUrl: "https://www.bom.gov.au/radar/IDR403.gif",
      href: "https://www.bom.gov.au/products/IDR403.loop.shtml",
      attribution: "Bureau of Meteorology · IDR403 · 256 km",
    },
  },
  vhc: {
    windy: { lat: -36.86, lon: 147.27, zoom: 9 },
    official: {
      label: "BOM Yarrawonga",
      imageUrl: "https://www.bom.gov.au/radar/IDR49.gif",
      href: "https://www.bom.gov.au/products/IDR49.loop.shtml",
      attribution: "Bureau of Meteorology · IDR49 · 256 km",
    },
  },
  yamanouchi: {
    windy: { lat: 36.74, lon: 138.42, zoom: 9 },
    official: {
      label: "JMA Nagano",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:9/lat:36.74/lon:138.42/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
};

const DEFAULT_CENTER = { lat: -36.42, lng: 148.42 };
const DEFAULT_ZOOM = 9;

const RESORT_PINS: Array<{ id: string; name: string; lat: number; lng: number }> = [
  { id: "perisher", name: "Perisher", lat: -36.3717, lng: 148.4086 },
  { id: "thredbo", name: "Thredbo", lat: -36.5054, lng: 148.3089 },
  { id: "charlottes-pass", name: "Charlotte's Pass", lat: -36.4314, lng: 148.3297 },
  { id: "selwyn", name: "Selwyn", lat: -35.8383, lng: 148.5267 },
  { id: "jindabyne", name: "Jindabyne", lat: -36.4106, lng: 148.6206 },
];

// RainViewer is a free public weather-tile API: global precipitation
// radar (past 2hr + 30min nowcast) and Himawari/GOES infrared satellite
// imagery (clouds). No API key required, CORS-friendly, ~256 KB per
// frame. The /weather-maps.json manifest tells us which frames exist
// and where to fetch the tiles from.
const RAINVIEWER_MANIFEST = "https://api.rainviewer.com/public/weather-maps.json";

interface RvFrame {
  time: number; // unix seconds
  path: string; // "/v2/radar/{ts}" or "/v2/satellite/{ts}"
}
interface RvManifest {
  host: string;
  radar: { past: RvFrame[]; nowcast: RvFrame[] };
  satellite: { infrared: RvFrame[] };
}

type LayerMode = "all" | "clouds" | "precip";

function useRainviewerManifest() {
  const [manifest, setManifest] = useState<RvManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(RAINVIEWER_MANIFEST, { cache: "no-store" });
        if (!r.ok) throw new Error(`manifest ${r.status}`);
        const data = (await r.json()) as RvManifest;
        if (cancelled) return;
        setManifest(data);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    // RainViewer publishes a new radar frame every ~10 min. Refresh the
    // manifest at the same cadence so we always have the latest nowcast.
    const id = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return { manifest, loading, error };
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

function RecenterOnChange({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

// RainViewer tile path:
//   {host}{path}/{size}/{z}/{x}/{y}/{color}/{smooth}_{snow}.png
// Color schemes documented at https://www.rainviewer.com/api.html.
//   color=2 = "Universal Blue" — clean blue/green gradient, reads well
//             on a topo basemap.
//   smooth=1 enables bilinear smoothing.
//   snow=1   tints sub-zero precip in cyan/white so snow vs rain is
//            visually distinguishable on the same layer.
function radarTileUrl(host: string, path: string): string {
  return `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;
}
// Satellite (infrared) — color=0 = greyscale clouds, smooth=0, snow=0.
function satelliteTileUrl(host: string, path: string): string {
  return `${host}${path}/256/{z}/{x}/{y}/0/0_0.png`;
}

export default function RadarMapInner({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers,
  season = "winter",
  region = "snowy-mountains",
}: RadarMapInnerProps) {
  const regionCfg = REGION_CONFIG[region];
  const [view, setView] = useState<ViewMode>("interactive");
  const { manifest, loading, error } = useRainviewerManifest();
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [mode, setMode] = useState<LayerMode>("all");
  const tickRef = useRef<number | null>(null);

  // Combined radar timeline: past frames followed by nowcast frames.
  // Past = solid history, nowcast = predicted next 30 min (rendered
  // with a subtle dashed-look opacity so users know it's a forecast).
  const radarFrames = useMemo<RvFrame[]>(() => {
    if (!manifest) return [];
    return [...manifest.radar.past, ...manifest.radar.nowcast];
  }, [manifest]);

  const nowcastStart = manifest?.radar.past.length ?? 0;
  const isNowcast = frameIndex >= nowcastStart;

  // Latest satellite frame — clouds change slowly enough that animating
  // them adds little; we just show the freshest infrared image.
  const latestSatellite = useMemo<RvFrame | null>(() => {
    const list = manifest?.satellite.infrared ?? [];
    return list.length > 0 ? list[list.length - 1] : null;
  }, [manifest]);

  // Animate radar at ~700ms per frame, pause longer on the latest
  // observed frame so the "now" moment is readable before nowcast loops.
  useEffect(() => {
    if (view !== "interactive") return;
    if (!playing || radarFrames.length === 0 || mode === "clouds") return;
    tickRef.current = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % radarFrames.length);
    }, 700);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [view, playing, radarFrames.length, mode]);

  // Whenever the manifest refreshes, jump to the most recent observed
  // frame (end of past, just before nowcast) so the loop starts at "now".
  useEffect(() => {
    if (radarFrames.length > 0) {
      setFrameIndex(Math.max(0, nowcastStart - 1));
    }
  }, [radarFrames.length, nowcastStart]);

  const pins = useMemo(() => markers ?? RESORT_PINS, [markers]);
  const currentRadar = radarFrames[frameIndex];
  const stamp = currentRadar ? formatStamp(currentRadar.time) : null;
  const centerTuple: [number, number] = [center.lat, center.lng];

  const showRadar = mode === "all" || mode === "precip";
  const showClouds = mode === "all" || mode === "clouds";

  // Season-aware labels: same precip data, but in winter we frame it
  // as "snow" because that's what users care about on the mountain.
  const precipLabel = season === "winter" ? "Snow" : "Rain";
  const PrecipIcon = season === "winter" ? CloudSnow : CloudRain;

  // Windy embed URL — built per-region. Snow overlay in winter, rain in green.
  const windyUrl = useMemo(() => {
    const overlay = season === "winter" ? "snow" : "rain";
    const params = new URLSearchParams({
      lat: String(regionCfg.windy.lat),
      lon: String(regionCfg.windy.lon),
      detailLat: String(regionCfg.windy.lat),
      detailLon: String(regionCfg.windy.lon),
      zoom: String(regionCfg.windy.zoom),
      level: "surface",
      overlay,
      product: "ecmwf",
      menu: "",
      message: "true",
      marker: "",
      calendar: "now",
      type: "map",
      location: "coordinates",
      metricWind: "default",
      metricTemp: "default",
      radarRange: "-1",
    });
    return `https://embed.windy.com/embed2.html?${params.toString()}`;
  }, [season, regionCfg.windy]);

  return (
    <div className="relative w-full h-[520px] md:h-[640px] bg-slate-100">
      {/* View switcher (top-left). Three modes: our interactive leaflet
          (default, with resort pins + nowcast), Windy (rich multi-layer),
          and the official regional source (BOM gif, JMA link, etc). */}
      <div className="absolute top-3 left-3 z-[1000] flex gap-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg p-1">
        <ModePill
          active={view === "interactive"}
          onClick={() => setView("interactive")}
          icon={MapIcon}
          label="Interactive"
        />
        <ModePill
          active={view === "windy"}
          onClick={() => setView("windy")}
          icon={Globe2}
          label="Windy"
        />
        <ModePill
          active={view === "official"}
          onClick={() => setView("official")}
          icon={Radio}
          label="Official"
        />
      </div>

      {view === "windy" && (
        <iframe
          title="Windy weather map"
          src={windyUrl}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      )}

      {view === "official" && (
        <OfficialView official={regionCfg.official} />
      )}

      {view === "interactive" && (
      <MapContainer
        center={centerTuple}
        zoom={zoom}
        scrollWheelZoom
        className="absolute inset-0 w-full h-full"
        minZoom={5}
        maxZoom={12}
      >
        <RecenterOnChange center={centerTuple} zoom={zoom} />

        {/* Topographic basemap: ski runs, contour lines, rivers. */}
        <TileLayer
          attribution='© <a href="https://opentopomap.org">OpenTopoMap</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          subdomains={["a", "b", "c"]}
          maxNativeZoom={15}
        />

        {/* Cloud layer (infrared satellite). Sits below precip so storm
            cells stay crisp on top of the cloud field.
            maxNativeZoom: RainViewer satellite tops out around z=6;
            past that the API returns a "Zoom Level Not Supported"
            placeholder PNG. Capping native zoom makes Leaflet upscale
            its z=6 tiles instead of requesting bad ones. */}
        {showClouds && manifest && latestSatellite && (
          <TileLayer
            key={`sat-${latestSatellite.time}`}
            url={satelliteTileUrl(manifest.host, latestSatellite.path)}
            opacity={mode === "clouds" ? 0.75 : 0.55}
            zIndex={300}
            maxNativeZoom={4}
            attribution=""
          />
        )}

        {/* Precipitation layer.
            maxNativeZoom: RainViewer's global radar mosaic only has real
            data through z≈6 in the southern hemisphere (and similar in
            most regions outside dense NA/EU radar coverage). Past that
            their server returns a "Zoom Level Not Supported" placeholder
            PNG that visually destroys the map. Capping native zoom at 6
            tells Leaflet to fetch the z=6 tile and CSS-upscale it for
            higher zooms, which is correct behaviour for a low-res field. */}
        {showRadar && manifest && currentRadar && (
          <TileLayer
            key={`rad-${currentRadar.time}`}
            url={radarTileUrl(manifest.host, currentRadar.path)}
            opacity={isNowcast ? 0.65 : 0.85}
            zIndex={400}
            maxNativeZoom={6}
            attribution=""
          />
        )}

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
      )}

      {/* Floating layer toggles (top-right). Three pills with icons +
          short labels — fits cleanly on mobile too. Only relevant for
          the interactive leaflet view. */}
      {view === "interactive" && (
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg p-1">
        <ModePill
          active={mode === "all"}
          onClick={() => setMode("all")}
          icon={Layers}
          label="Overall"
        />
        <ModePill
          active={mode === "clouds"}
          onClick={() => setMode("clouds")}
          icon={Cloud}
          label="Clouds"
        />
        <ModePill
          active={mode === "precip"}
          onClick={() => setMode("precip")}
          icon={PrecipIcon}
          label={precipLabel}
        />
      </div>
      )}

      {/* Floating control bar (bottom): play/pause + timestamp + scrubber.
          Hidden in clouds-only mode since there's nothing to animate. */}
      {view === "interactive" && mode !== "clouds" && (
        <div className="absolute left-3 right-3 bottom-3 z-[1000] rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg px-3 py-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            disabled={radarFrames.length === 0}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white disabled:opacity-40"
            aria-label={playing ? "Pause radar animation" : "Play radar animation"}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold flex items-center gap-2">
              {loading
                ? "Loading radar…"
                : error
                  ? "Radar unavailable"
                  : stamp
                    ? (
                        <>
                          <span className="tabular-nums">{stamp}</span>
                          {isNowcast && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
                              FORECAST
                            </span>
                          )}
                        </>
                      )
                    : "No frames"}
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, radarFrames.length - 1)}
              value={frameIndex}
              onChange={(e) => {
                setPlaying(false);
                setFrameIndex(parseInt(e.target.value));
              }}
              disabled={radarFrames.length === 0}
              className="w-full mt-1 accent-slate-900"
              aria-label="Radar frame scrubber"
            />
          </div>
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
            RainViewer · global radar
          </span>
        </div>
      )}
    </div>
  );
}

function ModePill({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100",
      )}
      aria-pressed={active}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function OfficialView({ official }: { official: RegionConfig["official"] }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-slate-100">
      <div className="flex-1 grid place-items-center overflow-hidden p-4">
        {official.imageUrl ? (
          <img
            src={official.imageUrl}
            alt={official.label}
            className="max-h-full max-w-full object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <div className="text-center max-w-sm px-4">
            <p className="text-sm text-slate-700 font-semibold mb-2">
              {official.label}
            </p>
            <p className="text-xs text-slate-500 mb-4">
              This source can't be embedded directly. Open it in a new tab to
              see the official live radar.
            </p>
            <a
              href={official.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white text-xs font-semibold px-4 py-2 hover:bg-slate-800"
            >
              Open {official.label}
            </a>
          </div>
        )}
      </div>
      <div className="absolute left-3 right-3 bottom-3 z-[1000] rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg px-3 py-2 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-600 font-medium truncate">
          Source · {official.attribution}
        </div>
        <a
          href={official.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 whitespace-nowrap"
        >
          Open source →
        </a>
      </div>
    </div>
  );
}

function formatStamp(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}
