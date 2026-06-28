import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OfficialRadarSource, WindySource } from "@/lib/bom-radar";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CloudSnow,
  CloudRain,
  Pause,
  Play,
  Map as MapIcon,
  Radio,
  Globe2,
  Wind,
  Thermometer,
  Radar,
  Snowflake,
  Droplet,
  Loader2,
  Layers,
  X,
  Maximize2,
  Crosshair,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RadarMapInnerProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ id: string; name: string; lat: number; lng: number }>;
  season?: "winter" | "green";
  region?: RegionKey;
  /**
   * Optional per-coordinate override for the Official + Expert sources. The
   * /near-you page hands us an arbitrary AU location's nearest BOM radar
   * (`official`, or null when none covers the point) and a Windy centre on the
   * user's own coords. When omitted, the curated per-region config is used and
   * region pages behave exactly as before.
   */
  location?: { official: OfficialRadarSource | null; windy: WindySource };
}

export type RegionKey =
  | "snowy-mountains"
  | "victorias-high-country"
  | "tasmania"
  | "yamanouchi"
  | "nozawa-onsen"
  | "iiyama"
  | "queenstown"
  | "wanaka"
  | "mt-hutt"
  | "ruapehu";
type ViewMode = "interactive" | "windy" | "official";

interface RegionConfig {
  windy: { lat: number; lon: number; zoom: number };
  official: {
    label: string;
    /**
     * Official source image (e.g. a BOM radar loop gif). BOM blocks direct
     * cross-site hotlinking, so OfficialView routes these through the
     * /api/bom-radar proxy. null = link-out only (JP/NZ).
     */
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
      attribution: "Bureau of Meteorology · IDR403 · 128 km",
    },
  },
  "victorias-high-country": {
    windy: { lat: -36.86, lon: 147.27, zoom: 9 },
    official: {
      label: "BOM Yarrawonga",
      imageUrl: "https://www.bom.gov.au/radar/IDR493.gif",
      href: "https://www.bom.gov.au/products/IDR493.loop.shtml",
      attribution: "Bureau of Meteorology · IDR493 · 128 km",
    },
  },
  tasmania: {
    windy: { lat: -41.54, lon: 147.67, zoom: 9 },
    official: {
      // Mt Koonya (Hobart) is the only BOM radar serving Tasmania. Ben
      // Lomond (the region's default town, in the NE) sits beyond the 128 km
      // loop, so use the 256 km product (IDR762) to keep the ski field on
      // the radar · the trade-off is slightly coarser detail near Hobart.
      label: "BOM Mt Koonya (Hobart)",
      imageUrl: "https://www.bom.gov.au/radar/IDR762.gif",
      href: "https://www.bom.gov.au/products/IDR762.loop.shtml",
      attribution: "Bureau of Meteorology · IDR762 · 256 km",
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
  "nozawa-onsen": {
    windy: { lat: 36.928, lon: 138.449, zoom: 10 },
    official: {
      label: "JMA Nagano",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:36.928/lon:138.449/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  iiyama: {
    windy: { lat: 36.873, lon: 138.366, zoom: 10 },
    official: {
      label: "JMA Nagano",
      imageUrl: null,
      href: "https://www.jma.go.jp/bosai/nowc/#zoom:10/lat:36.873/lon:138.366/colordepth:normal/elements:hrpns",
      attribution: "Japan Meteorological Agency · JMA",
    },
  },
  // NZ · MetService offers no simple hotlinkable radar gif (unlike BOM),
  // so imageUrl is null and the official view links out to the MetService
  // rain radar. Forecast data itself is Open-Meteo (see weatherSource).
  queenstown: {
    windy: { lat: -44.99, lon: 168.74, zoom: 10 },
    official: {
      label: "MetService rain radar",
      imageUrl: null,
      href: "https://www.metservice.com/maps-radar/rain-radar",
      attribution: "MetService · rain radar",
    },
  },
  wanaka: {
    windy: { lat: -44.73, lon: 168.99, zoom: 10 },
    official: {
      label: "MetService rain radar",
      imageUrl: null,
      href: "https://www.metservice.com/maps-radar/rain-radar",
      attribution: "MetService · rain radar",
    },
  },
  "mt-hutt": {
    windy: { lat: -43.55, lon: 171.59, zoom: 10 },
    official: {
      label: "MetService rain radar",
      imageUrl: null,
      href: "https://www.metservice.com/maps-radar/rain-radar",
      attribution: "MetService · rain radar",
    },
  },
  ruapehu: {
    windy: { lat: -39.32, lon: 175.50, zoom: 10 },
    official: {
      label: "MetService rain radar",
      imageUrl: null,
      href: "https://www.metservice.com/maps-radar/rain-radar",
      attribution: "MetService · rain radar",
    },
  },
};

const DEFAULT_ZOOM = 9;

// How many radar frames either side of the current one stay mounted.
// Keeping every frame mounted (~16) makes each zoom refetch all of them
// at once and blanks the map on mobile after a big zoom-out/in (surfaced
// by the "all of <country>" control); a small window keeps playback
// flash-free while cutting tile churn well over 2x.
const RADAR_WINDOW = 3;

interface PinSpec { id: string; name: string; lat: number; lng: number; accent: string }

// Per-region defaults: centre + pins. Used when the caller (e.g. the
// town weather page) doesn't pass an explicit center/markers. Previously
// the component always fell back to Snowy Mountains pins, which surfaced
// Perisher/Thredbo/Jindabyne on VHC and Japan pages.
const REGION_DEFAULTS: Record<RegionKey, { center: { lat: number; lng: number }; pins: PinSpec[] }> = {
  "snowy-mountains": {
    center: { lat: -36.42, lng: 148.42 },
    pins: [
      { id: "perisher", name: "Perisher", lat: -36.3717, lng: 148.4086, accent: "#f97316" },
      { id: "thredbo", name: "Thredbo", lat: -36.5054, lng: 148.3089, accent: "#f97316" },
      { id: "charlottes-pass", name: "Charlotte's Pass", lat: -36.4314, lng: 148.3297, accent: "#f97316" },
      { id: "selwyn", name: "Selwyn", lat: -35.8383, lng: 148.5267, accent: "#f97316" },
      { id: "jindabyne", name: "Jindabyne", lat: -36.4106, lng: 148.6206, accent: "#0ea5e9" },
    ],
  },
  "victorias-high-country": {
    center: { lat: -36.86, lng: 147.27 },
    pins: [
      { id: "mt-buller", name: "Mt Buller", lat: -37.1456, lng: 146.4391, accent: "#f97316" },
      { id: "mt-stirling", name: "Mt Stirling", lat: -37.1167, lng: 146.4500, accent: "#f97316" },
      { id: "falls-creek", name: "Falls Creek", lat: -36.8628, lng: 147.2778, accent: "#f97316" },
      { id: "mt-hotham", name: "Mt Hotham", lat: -36.9779, lng: 147.1361, accent: "#f97316" },
      { id: "lake-mountain", name: "Lake Mountain", lat: -37.5181, lng: 145.8983, accent: "#f97316" },
      { id: "mt-donna-buang", name: "Mt Donna Buang", lat: -37.6961, lng: 145.6989, accent: "#f97316" },
      { id: "mount-beauty", name: "Mount Beauty", lat: -36.7327, lng: 147.1696, accent: "#0ea5e9" },
      { id: "bright", name: "Bright", lat: -36.7300, lng: 146.9617, accent: "#0ea5e9" },
      { id: "mansfield", name: "Mansfield", lat: -37.0539, lng: 146.0894, accent: "#0ea5e9" },
    ],
  },
  tasmania: {
    center: { lat: -41.54, lng: 147.67 },
    pins: [
      { id: "ben-lomond", name: "Ben Lomond", lat: -41.5378, lng: 147.6736, accent: "#f97316" },
      { id: "ben-lomond-base", name: "Ben Lomond Base", lat: -41.5392, lng: 147.6486, accent: "#0ea5e9" },
      { id: "launceston", name: "Launceston", lat: -41.4332, lng: 147.1442, accent: "#0ea5e9" },
      { id: "hobart", name: "Hobart", lat: -42.8821, lng: 147.3272, accent: "#0ea5e9" },
    ],
  },
  yamanouchi: {
    center: { lat: 36.74, lng: 138.42 },
    pins: [
      { id: "shiga-kogen", name: "Shiga Kogen", lat: 36.7167, lng: 138.5083, accent: "#f97316" },
      { id: "ryuoo", name: "Ryuoo", lat: 36.7458, lng: 138.4283, accent: "#f97316" },
      { id: "kita-shiga", name: "Kita Shiga Kogen", lat: 36.7600, lng: 138.4750, accent: "#f97316" },
      { id: "yudanaka", name: "Yudanaka", lat: 36.7406, lng: 138.4222, accent: "#0ea5e9" },
      { id: "shibu", name: "Shibu Onsen", lat: 36.7367, lng: 138.4214, accent: "#0ea5e9" },
    ],
  },
  "nozawa-onsen": {
    center: { lat: 36.928, lng: 138.449 },
    pins: [
      { id: "nozawa-onsen", name: "Nozawa Onsen", lat: 36.9278, lng: 138.4486, accent: "#f97316" },
      { id: "nozawa-onsen-village", name: "Nozawa village", lat: 36.9219, lng: 138.4361, accent: "#0ea5e9" },
    ],
  },
  iiyama: {
    center: { lat: 36.873, lng: 138.366 },
    pins: [
      { id: "madarao", name: "Madarao", lat: 36.9056, lng: 138.2858, accent: "#f97316" },
      { id: "tangram", name: "Tangram", lat: 36.8917, lng: 138.2806, accent: "#f97316" },
      { id: "togari-onsen", name: "Togari Onsen", lat: 36.8722, lng: 138.4014, accent: "#f97316" },
      { id: "kijimadaira", name: "Kijimadaira", lat: 36.8639, lng: 138.4006, accent: "#f97316" },
      { id: "kijima-snow-park", name: "Kijima Snow Park", lat: 36.8556, lng: 138.4108, accent: "#f97316" },
      { id: "iiyama", name: "Iiyama City", lat: 36.852, lng: 138.366, accent: "#0ea5e9" },
    ],
  },
  queenstown: {
    center: { lat: -44.99, lng: 168.74 },
    pins: [
      { id: "coronet-peak", name: "Coronet Peak", lat: -44.9206, lng: 168.7361, accent: "#f97316" },
      { id: "the-remarkables", name: "The Remarkables", lat: -45.0556, lng: 168.8194, accent: "#f97316" },
      { id: "queenstown", name: "Queenstown", lat: -45.0312, lng: 168.6626, accent: "#0ea5e9" },
    ],
  },
  wanaka: {
    center: { lat: -44.73, lng: 168.99 },
    pins: [
      { id: "cardrona", name: "Cardrona", lat: -44.8741, lng: 168.9492, accent: "#f97316" },
      { id: "treble-cone", name: "Treble Cone", lat: -44.6311, lng: 168.8978, accent: "#f97316" },
      { id: "wanaka", name: "Wanaka", lat: -44.7032, lng: 169.1321, accent: "#0ea5e9" },
    ],
  },
  "mt-hutt": {
    center: { lat: -43.55, lng: 171.59 },
    pins: [
      { id: "mt-hutt", name: "Mt Hutt", lat: -43.4707, lng: 171.5306, accent: "#f97316" },
      { id: "methven", name: "Methven", lat: -43.6333, lng: 171.6500, accent: "#0ea5e9" },
    ],
  },
  ruapehu: {
    center: { lat: -39.32, lng: 175.50 },
    pins: [
      { id: "whakapapa", name: "Whakapapa", lat: -39.2547, lng: 175.5619, accent: "#f97316" },
      { id: "turoa", name: "Turoa", lat: -39.3072, lng: 175.5286, accent: "#f97316" },
      { id: "ohakune", name: "Ohakune", lat: -39.4181, lng: 175.3956, accent: "#0ea5e9" },
    ],
  },
};

// Which country each region sits in. Drives the cross-region grouping on
// the interactive map: from any Australian region you can see every
// Australian town + resort, and likewise within Japan. Kept local so the
// map stays self-contained · keep in step with REGION_COUNTRY in
// src/regions/index.ts.
type MapCountry = "AU" | "JP" | "NZ";
const REGION_COUNTRY: Record<RegionKey, MapCountry> = {
  "snowy-mountains": "AU",
  "victorias-high-country": "AU",
  tasmania: "AU",
  yamanouchi: "JP",
  "nozawa-onsen": "JP",
  iiyama: "JP",
  queenstown: "NZ",
  wanaka: "NZ",
  "mt-hutt": "NZ",
  ruapehu: "NZ",
};
const COUNTRY_LABEL: Record<MapCountry, string> = { AU: "australia", JP: "japan", NZ: "new zealand" };
const REGION_LABEL: Record<RegionKey, string> = {
  "snowy-mountains": "snowy mountains",
  "victorias-high-country": "victoria's high country",
  tasmania: "tasmania",
  yamanouchi: "yamanouchi",
  "nozawa-onsen": "nozawa onsen",
  iiyama: "iiyama",
  queenstown: "queenstown",
  wanaka: "wanaka",
  "mt-hutt": "mt hutt",
  ruapehu: "ruapehu",
};

interface CountryPin extends PinSpec {
  region: RegionKey;
  isCurrent: boolean;
}

// Every town + resort that shares a country with `region`, each tagged
// with its home region. Lets the map show neighbouring regions' pins (so
// you can browse Mt Buller while sitting on a Snowy Mountains page) and
// frame the whole country via the "show all" control.
function countryPinsFor(region: RegionKey): CountryPin[] {
  const country = REGION_COUNTRY[region];
  return (Object.keys(REGION_DEFAULTS) as RegionKey[])
    .filter((key) => REGION_COUNTRY[key] === country)
    .flatMap((key) =>
      REGION_DEFAULTS[key].pins.map((p) => ({
        ...p,
        region: key,
        isCurrent: key === region,
      })),
    );
}

// RainViewer is a free public weather-tile API: global precipitation
// radar (past 2hr + 30min nowcast). No API key required, CORS-friendly,
// ~256 KB per frame. The /weather-maps.json manifest tells us which
// frames exist and where to fetch the tiles from.
const RAINVIEWER_MANIFEST = "https://api.rainviewer.com/public/weather-maps.json";

interface RvFrame {
  time: number; // unix seconds
  path: string; // "/v2/radar/{ts}"
}
interface RvManifest {
  host: string;
  radar: { past: RvFrame[]; nowcast: RvFrame[] };
}

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
        <div style="width:14px;height:14px;border-radius:9999px;background:${accent};box-shadow:0 0 0 3px rgba(15,23,42,0.85),0 1px 4px rgba(0,0,0,0.6);"></div>
        <div style="margin-top:4px;padding:2px 8px;border-radius:9999px;background:rgba(15,23,42,0.92);color:#fff;font:600 11px/1.1 'DIN Pro','Inter',system-ui,sans-serif;white-space:nowrap;letter-spacing:0.01em;box-shadow:0 1px 4px rgba(0,0,0,0.4);">${label}</div>
      </div>
    `,
    iconSize: [80, 36],
    iconAnchor: [40, 7],
  });
}

// Build the pin icon cache from the region defaults so adding a region
// only requires editing REGION_DEFAULTS above. Caller-supplied markers
// (from the `markers` prop) fall back to a generic blue pin via
// makePinIcon at render time.
const PIN_ICONS: Record<string, L.DivIcon> = Object.fromEntries(
  Object.values(REGION_DEFAULTS).flatMap((r) =>
    r.pins.map((p) => [p.id, makePinIcon(p.name, p.accent)] as const),
  ),
);

function RecenterOnChange({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  // Pass primitive lat/lng/zoom as deps. Previously this took a tuple
  // `center=[lat,lng]` whose array identity changed on every parent
  // render, which fired `setView` continuously and snapped the map back
  // mid-pan/zoom · effectively breaking interaction. Now it only runs
  // when the actual coordinates change (e.g. user picks a new town).
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
  }, [map, lat, lng, zoom]);
  return null;
}

// RainViewer tile path:
//   {host}{path}/{size}/{z}/{x}/{y}/{color}/{smooth}_{snow}.png
// Color schemes documented at https://www.rainviewer.com/api.html.
//   color=6 = "NEXRAD Level-III" — full green→yellow→orange→red intensity
//            scale (more colours, closer to the BOM / Apple rain maps).
//   smooth=1 enables bilinear smoothing.
//   snow=1   tints sub-zero precip in cyan/white so snow vs rain is
//            visually distinguishable on the same layer.
// Retina-aware tile resolution. On high-DPI screens (most phones, where
// devicePixelRatio >= 2) the 256px radar tiles look noticeably blocky once
// Leaflet upscales them past the radar's native zoom. Pulling RainViewer's
// 512px source and letting the browser downsample it into the (default) 256
// CSS-px tile slot keeps the precip layer crisp on mobile without changing
// tile geometry · 1x desktops keep the lighter 256px tiles. (The dark basemap
// is already retina via Leaflet's {r} token; the RainViewer URL has no {r},
// so the size is picked here.)
const RADAR_TILE_PX =
  typeof window !== "undefined" && window.devicePixelRatio > 1 ? 512 : 256;

function radarTileUrl(host: string, path: string): string {
  return `${host}${path}/${RADAR_TILE_PX}/{z}/{x}/{y}/6/1_1.png`;
}

// --- click-to-load point readout (Open-Meteo) ---------------------------

interface ProbeData {
  tempVal: number;
  tempUnit: string;
  windVal: number;
  windDir: number;
  windUnit: string;
  snowVal: number;
  snowUnit: string;
  rainProb: number;
  rainUnit: string;
}

type PointLayer = "snowfall" | "wind" | "temp" | "rainRisk";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function compassDir(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

// Smooths the precip field once it's CSS-upscaled past its native zoom.
// RainViewer's mosaic carries real data only through z7 (z8+ is an empty
// placeholder · verified AU + JP), so at town zooms Leaflet stretches the
// coarse z7 tiles into hard blocks. We can't fetch finer radar, so we soften
// the upscaled field with a blur that grows with how far past native we are.
// The amount is written to a CSS custom property straight on the map
// container · a DOM write, not React state, so the animation frames never
// remount (which would reintroduce the tile-refetch flash). At or below the
// native zoom the blur is 0, leaving the wide "all of <country>" view crisp.
function RadarBlur({ nativeZoom }: { nativeZoom: number }) {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const apply = () => {
      const over = Math.max(0, map.getZoom() - nativeZoom);
      // A radar cell spans ~2^over screen-px once upscaled · blurring by a
      // little over half a cell merges the steps into a gradient. Capped so
      // deep zoom softens the blocks without fogging the whole field.
      const px = over === 0 ? 0 : Math.min(5, Math.pow(2, over) * 0.4);
      el.style.setProperty("--radar-blur", px === 0 ? "0px" : `${px.toFixed(2)}px`);
    };
    apply();
    map.on("zoomend", apply);
    return () => {
      map.off("zoomend", apply);
      el.style.removeProperty("--radar-blur");
    };
  }, [map, nativeZoom]);
  return null;
}

// Registers a single map click handler. Only fires when at least one
// point layer (snowfall/wind/temp/rain risk) is enabled · clicking with
// only precip radar on does nothing, matching the layer-panel intent.
function ClickProbe({ enabled, onPick }: { enabled: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (enabled) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// A dot at the clicked point with its readout popup. Auto-opens on mount;
// the parent remounts it (via key on coordinates) for each new click.
function ProbeMarker({
  lat,
  lng,
  children,
}: {
  lat: number;
  lng: number;
  children: React.ReactNode;
}) {
  const ref = useRef<L.CircleMarker>(null);
  useEffect(() => {
    ref.current?.openPopup();
  }, []);
  return (
    <CircleMarker
      ref={ref}
      center={[lat, lng]}
      radius={7}
      pathOptions={{ color: "#38bdf8", weight: 2, fillColor: "#0ea5e9", fillOpacity: 0.5 }}
    >
      <Popup className="feelzlike-probe-popup" minWidth={170}>
        {children}
      </Popup>
    </CircleMarker>
  );
}

function ReadoutRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-sky-300 shrink-0" />
      <span className="text-[11px] text-slate-300 flex-1">{label}</span>
      <span className="text-xs font-semibold text-white tabular-nums whitespace-nowrap">{value}</span>
    </div>
  );
}

// Captures the Leaflet map instance so out-of-map controls (the
// "show all" / "this region" buttons) can drive fitBounds / setView.
function CaptureMap({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

export default function RadarMapInner({
  center,
  zoom = DEFAULT_ZOOM,
  markers,
  season = "winter",
  region = "snowy-mountains",
  location,
}: RadarMapInnerProps) {
  const regionCfg = REGION_CONFIG[region];
  const regionDefaults = REGION_DEFAULTS[region];
  const effectiveCenter = center ?? regionDefaults.center;
  // When a `location` override is supplied (the /near-you page hands us an
  // arbitrary AU coordinate) its nearest-BOM-radar result and Windy centre win
  // over the curated per-region config. `official` may be null there · that
  // means "no BOM radar covers this point", so we hide the Official tab and
  // lead with the global Interactive radar. Region pages pass no `location`,
  // so effectiveOfficial/effectiveWindy collapse to the region config and
  // behaviour is unchanged.
  const effectiveOfficial: OfficialRadarSource | null = location
    ? location.official
    : regionCfg.official;
  const effectiveWindy: WindySource = location ? location.windy : regionCfg.windy;
  const showOfficialTab = effectiveOfficial != null;
  // Australian regions (and any covered /near-you point) lead with the Official
  // BOM radar · the locally trusted, sharper source · whenever an embeddable
  // image exists; every other case leads with the resilient Interactive view
  // (dark basemap + RainViewer radar, each rendering independently).
  const defaultView: ViewMode = effectiveOfficial?.imageUrl
    ? "official"
    : "interactive";
  const [view, setView] = useState<ViewMode>(defaultView);
  // Re-apply the default tab whenever the official SOURCE changes · a real
  // region switch, or the /near-you user searching a new place / GPS update ·
  // not just on region change (client-side nav can reuse the same mounted
  // instance). Keying on region + the official image/href means manual tab
  // picks persist while the source is stable, but a new source never inherits
  // a stale tab (e.g. an uncovered point keeping a prior point's "official",
  // or an AU page inheriting "interactive" from JP/NZ). Adjusting state during
  // render is React's recommended pattern here and avoids a wrong-tab flash.
  const sourceKey = `${region}:${effectiveOfficial?.imageUrl ?? effectiveOfficial?.href ?? "none"}`;
  const [prevSourceKey, setPrevSourceKey] = useState(sourceKey);
  if (sourceKey !== prevSourceKey) {
    setPrevSourceKey(sourceKey);
    setView(defaultView);
  }
  // Active Windy overlay · drives the Windy iframe's `overlay=` param.
  const [windyOverlay, setWindyOverlay] = useState<"snow" | "wind" | "temp" | "rain">(
    season === "winter" ? "snow" : "rain",
  );

  // Keep the Windy overlay default in step with the user's season toggle
  // (snow in winter, rain in green) so the Expert tab opens on the right
  // layer if the user navigates to it.
  useEffect(() => {
    setWindyOverlay(season === "winter" ? "snow" : "rain");
  }, [season]);

  const { manifest, loading, error } = useRainviewerManifest();
  const [frameIndex, setFrameIndex] = useState(0);
  // Default to PAUSED. Autoplay swaps tile layers every 700ms which
  // visibly fights leaflet's zoom-level retiling. Users can hit play.
  const [playing, setPlaying] = useState(false);

  // Weather Layers panel state. Precip Radar is the one layer lit on
  // load (the animated RainViewer field); the others are point readouts
  // that surface only when the user clicks a spot on the map.
  const [showPrecip, setShowPrecip] = useState(true);
  const [pointLayers, setPointLayers] = useState<Record<PointLayer, boolean>>({
    snowfall: false,
    wind: false,
    temp: false,
    rainRisk: false,
  });
  // Metric on by default · the rest of feelzlike is metric-first. Off
  // switches the click readouts to °F / mph / inch.
  const [metric, setMetric] = useState(true);

  // Layers panel collapses on small screens so it doesn't smother the
  // map · open by default on >=md, a tap-to-open chip on phones.
  const [panelOpen, setPanelOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );

  const [probe, setProbe] = useState<{ lat: number; lng: number } | null>(null);
  const [probeData, setProbeData] = useState<ProbeData | null>(null);
  const [probeLoading, setProbeLoading] = useState(false);
  const [probeError, setProbeError] = useState<string | null>(null);

  const tickRef = useRef<number | null>(null);

  const anyPointLayer =
    pointLayers.snowfall || pointLayers.wind || pointLayers.temp || pointLayers.rainRisk;

  function togglePoint(layer: PointLayer) {
    setPointLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }

  // Combined radar timeline: past frames followed by nowcast frames.
  const radarFrames = useMemo<RvFrame[]>(() => {
    if (!manifest) return [];
    return [...manifest.radar.past, ...manifest.radar.nowcast];
  }, [manifest]);

  const nowcastStart = manifest?.radar.past.length ?? 0;
  const isNowcast = frameIndex >= nowcastStart;

  // Animate radar at ~700ms per frame while precip is shown + playing.
  useEffect(() => {
    if (view !== "interactive") return;
    if (!playing || !showPrecip || radarFrames.length === 0) return;
    tickRef.current = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % radarFrames.length);
    }, 700);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [view, playing, showPrecip, radarFrames.length]);

  // Whenever the manifest refreshes, jump to the most recent observed
  // frame (end of past, just before nowcast) so the loop starts at "now".
  useEffect(() => {
    if (radarFrames.length > 0) {
      setFrameIndex(Math.max(0, nowcastStart - 1));
    }
  }, [radarFrames.length, nowcastStart]);

  // Drop the click readout when every point layer is switched off · there
  // is nothing left to show, so the dot + popup shouldn't linger.
  useEffect(() => {
    if (!anyPointLayer) {
      setProbe(null);
      setProbeData(null);
      setProbeError(null);
    }
  }, [anyPointLayer]);

  // Fetch point values from Open-Meteo for the clicked spot. Re-runs when
  // the user clicks a new point or flips the metric toggle (units change).
  useEffect(() => {
    if (!probe) return;
    let cancelled = false;
    setProbeLoading(true);
    setProbeError(null);
    const u = new URL("https://api.open-meteo.com/v1/forecast");
    u.searchParams.set("latitude", probe.lat.toFixed(4));
    u.searchParams.set("longitude", probe.lng.toFixed(4));
    u.searchParams.set("current", "temperature_2m,wind_speed_10m,wind_direction_10m");
    u.searchParams.set("daily", "snowfall_sum,precipitation_probability_max");
    u.searchParams.set("forecast_days", "1");
    u.searchParams.set("timezone", "auto");
    u.searchParams.set("temperature_unit", metric ? "celsius" : "fahrenheit");
    u.searchParams.set("wind_speed_unit", metric ? "kmh" : "mph");
    u.searchParams.set("precipitation_unit", metric ? "mm" : "inch");
    fetch(u.toString())
      .then((r) => {
        if (!r.ok) throw new Error(`open-meteo ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        const cu = d.current_units ?? {};
        const du = d.daily_units ?? {};
        setProbeData({
          tempVal: Math.round(d.current?.temperature_2m ?? NaN),
          tempUnit: cu.temperature_2m ?? "°",
          windVal: Math.round(d.current?.wind_speed_10m ?? NaN),
          windDir: d.current?.wind_direction_10m ?? 0,
          windUnit: cu.wind_speed_10m ?? "",
          snowVal: round1(d.daily?.snowfall_sum?.[0] ?? 0),
          snowUnit: du.snowfall_sum ?? "cm",
          rainProb: Math.round(d.daily?.precipitation_probability_max?.[0] ?? 0),
          rainUnit: du.precipitation_probability_max ?? "%",
        });
      })
      .catch((e) => {
        if (!cancelled) setProbeError(String(e));
      })
      .finally(() => {
        if (!cancelled) setProbeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [probe, metric]);

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const handleMapReady = useCallback((m: L.Map) => setMapInstance(m), []);

  // Pins span the whole country the current region sits in, so you can
  // browse neighbouring regions' towns + resorts without leaving the page.
  // Caller-passed markers (none today) still take precedence.
  const countryPins = useMemo(() => countryPinsFor(region), [region]);
  const pins = useMemo<CountryPin[]>(
    () =>
      markers
        ? markers.map((m) => ({ ...m, accent: "#0ea5e9", region, isCurrent: true }))
        : countryPins,
    [markers, countryPins, region],
  );
  const hasOtherRegions = useMemo(() => pins.some((p) => !p.isCurrent), [pins]);
  const country = REGION_COUNTRY[region];

  const showAllCountry = useCallback(() => {
    if (!mapInstance || pins.length === 0) return;
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
    mapInstance.fitBounds(bounds, { padding: [56, 56], maxZoom: 9, animate: true });
  }, [mapInstance, pins]);

  const focusCurrentRegion = useCallback(() => {
    if (!mapInstance) return;
    mapInstance.setView([effectiveCenter.lat, effectiveCenter.lng], zoom, { animate: true });
  }, [mapInstance, effectiveCenter.lat, effectiveCenter.lng, zoom]);
  const currentRadar = radarFrames[frameIndex];
  const stamp = currentRadar ? formatStamp(currentRadar.time) : null;
  const centerTuple: [number, number] = [effectiveCenter.lat, effectiveCenter.lng];

  // Windy embed URL — built per-region.
  const windyUrl = useMemo(() => {
    const params = new URLSearchParams({
      lat: String(effectiveWindy.lat),
      lon: String(effectiveWindy.lon),
      detailLat: String(effectiveWindy.lat),
      detailLon: String(effectiveWindy.lon),
      zoom: String(effectiveWindy.zoom),
      level: "surface",
      overlay: windyOverlay,
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
  }, [windyOverlay, effectiveWindy]);

  return (
    <div className="relative w-full h-[520px] md:h-[640px] bg-slate-900">
      {/* View switcher (top-left). Three modes: our interactive ski radar
          (default · dark map, weather layers, click-to-read points), Windy
          (rich multi-layer), and the official regional source. */}
      <div className="absolute top-3 left-3 z-[1000] flex gap-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-lg p-1">
        <TabPill active={view === "interactive"} onClick={() => setView("interactive")} icon={MapIcon} label="Interactive" />
        <TabPill active={view === "windy"} onClick={() => setView("windy")} icon={Globe2} label="Expert" />
        {showOfficialTab && (
          <TabPill active={view === "official"} onClick={() => setView("official")} icon={Radio} label="Official" />
        )}
      </div>

      {/* Cross-region framing · jump between the whole country's towns +
          resorts and the current region. Interactive view only, and only
          when there are neighbouring regions to show. */}
      {view === "interactive" && hasOtherRegions && (
        <div className="absolute top-16 left-3 z-[1000] flex gap-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-lg p-1">
          <button
            type="button"
            onClick={showAllCountry}
            title={`show all of ${COUNTRY_LABEL[country]}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 shrink-0" />
            <span className="lowercase">all of {COUNTRY_LABEL[country]}</span>
          </button>
          <button
            type="button"
            onClick={focusCurrentRegion}
            title="back to this region"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5 shrink-0" />
            <span className="sr-only sm:not-sr-only">this region</span>
          </button>
        </div>
      )}

      {view === "windy" && (
        <>
          {/* Overlay switcher placed BEFORE the iframe in DOM order so
              keyboard users hit the layer pills before tab-focus enters
              the third-party Windy frame (which can trap focus). */}
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg p-1">
            <ModePill active={windyOverlay === "snow"} onClick={() => setWindyOverlay("snow")} icon={CloudSnow} label="Snow" />
            <ModePill active={windyOverlay === "wind"} onClick={() => setWindyOverlay("wind")} icon={Wind} label="Wind" />
            <ModePill active={windyOverlay === "temp"} onClick={() => setWindyOverlay("temp")} icon={Thermometer} label="Temp" />
            <ModePill active={windyOverlay === "rain"} onClick={() => setWindyOverlay("rain")} icon={CloudRain} label="Radar" />
          </div>
          <iframe
            title="Expert weather map · snow, wind, temperature and radar"
            src={windyUrl}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </>
      )}

      {view === "official" && effectiveOfficial && (
        // key by the source URL so switching regions / locations remounts the
        // view and resets its internal `imgFailed` state.
        <OfficialView
          key={effectiveOfficial.imageUrl ?? effectiveOfficial.href}
          official={effectiveOfficial}
        />
      )}

      {view === "interactive" && (
        <MapContainer
          center={centerTuple}
          zoom={zoom}
          scrollWheelZoom
          zoomControl={false}
          className="absolute inset-0 w-full h-full"
          minZoom={4}
          maxZoom={12}
        >
          <RecenterOnChange lat={effectiveCenter.lat} lng={effectiveCenter.lng} zoom={zoom} />
          <CaptureMap onReady={handleMapReady} />
          <RadarBlur nativeZoom={7} />

          {/* Esri world hillshade · shaded relief gives the map its terrain
              feel (mountains read as ridges, not flat). Sits at the bottom;
              the light labelled basemap rides on top. */}
          <TileLayer
            attribution='Hillshade © <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={16}
          />

          {/* Light basemap (CARTO Voyager, free, no key, CDN-hosted). Light,
              labelled and geographic (towns, roads, water) so it reads like
              the BOM / Apple rain maps people compared us to · a clean, simple
              base the colour radar pops against. Slightly transparent so the
              hillshade terrain relief still bleeds through underneath. */}
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
            maxNativeZoom={19}
            opacity={0.92}
          />

          {/* Precipitation layers.
              Every frame is mounted once as its own persistent TileLayer and
              animation is driven purely by opacity · the active frame is
              visible, all others sit at opacity 0 (still loaded, just hidden).
              Previously we rendered a single TileLayer keyed by frame time,
              which forced React to unmount + remount the layer on every frame
              swap. A freshly mounted Leaflet layer starts blank and refetches
              all tiles, so each step flashed a gap before tiles arrived. Keying
              each frame by its own (stable) timestamp keeps it mounted for the
              layer's lifetime, so stepping is an instant opacity flip with no
              blank frame.
              maxNativeZoom: verified empirically (AU + JP, Jun 2026) that
              RainViewer's radar mosaic carries real data through z7 and
              returns a uniform placeholder PNG at z8+. We cap native fetches
              at z7 (the most detail available) and let Leaflet CSS-upscale
              that for higher zooms · going to z8 would swap real precip for
              blank placeholders. */}
          {showPrecip &&
            manifest &&
            radarFrames.map((frame, idx) => {
              // Only mount frames within a small window of the current one.
              // Neighbours stay mounted at opacity 0 so stepping playback is
              // flash-free, but we no longer carry all ~16 layers · that made
              // every zoom refetch 16 tile sets and blanked the map on mobile
              // after a big zoom-out/in. The window is CIRCULAR: playback wraps
              // (last → 0), so frame 0 must already be mounted when the current
              // frame is near the end · a linear window would flash on wrap.
              const linear = Math.abs(idx - frameIndex);
              const ring = Math.min(linear, radarFrames.length - linear);
              if (ring > RADAR_WINDOW) return null;
              const active = idx === frameIndex;
              const frameIsNowcast = idx >= nowcastStart;
              return (
                <TileLayer
                  key={`rad-${frame.time}`}
                  className="radar-fx"
                  url={radarTileUrl(manifest.host, frame.path)}
                  opacity={active ? (frameIsNowcast ? 0.65 : 0.85) : 0}
                  zIndex={active ? 401 : 400}
                  maxNativeZoom={7}
                  updateWhenZooming={false}
                  attribution=""
                />
              );
            })}

          <ClickProbe enabled={anyPointLayer} onPick={(lat, lng) => setProbe({ lat, lng })} />

          {probe && (
            <ProbeMarker key={`${probe.lat},${probe.lng}`} lat={probe.lat} lng={probe.lng}>
              <div className="min-w-[150px]">
                <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1.5 tabular-nums">
                  {probe.lat.toFixed(3)}, {probe.lng.toFixed(3)}
                </div>
                {probeLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-300 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> loading…
                  </div>
                ) : probeError ? (
                  <div className="text-xs text-amber-300 py-1">couldn't load · try again</div>
                ) : probeData ? (
                  <div className="space-y-1.5">
                    {pointLayers.snowfall && (
                      <ReadoutRow icon={Snowflake} label="snowfall · 24h" value={`${probeData.snowVal} ${probeData.snowUnit}`} />
                    )}
                    {pointLayers.temp && (
                      <ReadoutRow icon={Thermometer} label="temperature" value={`${probeData.tempVal}${probeData.tempUnit}`} />
                    )}
                    {pointLayers.wind && (
                      <ReadoutRow icon={Wind} label="wind" value={`${probeData.windVal} ${probeData.windUnit} ${compassDir(probeData.windDir)}`} />
                    )}
                    {pointLayers.rainRisk && (
                      <ReadoutRow icon={Droplet} label="rain risk" value={`${probeData.rainProb}%`} />
                    )}
                  </div>
                ) : null}
              </div>
            </ProbeMarker>
          )}

          {pins.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={PIN_ICONS[p.id] ?? makePinIcon(p.name, p.accent ?? "#0ea5e9")}
              opacity={p.isCurrent ? 1 : 0.78}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <span className="font-semibold">{p.name}</span>
                {!p.isCurrent && (
                  <span className="block text-[10px] font-medium text-slate-500 lowercase">
                    {REGION_LABEL[p.region]}
                  </span>
                )}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Weather Layers panel (top-right). Precip radar lit on load; the
          rest are point readouts surfaced on map click. Interactive only. */}
      {view === "interactive" && !panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-lg px-3 py-2 text-white"
          aria-label="Show weather layers"
        >
          <Layers className="w-4 h-4 text-sky-300" />
          <span className="text-xs font-bold lowercase">layers</span>
        </button>
      )}
      {view === "interactive" && panelOpen && (
        <div className="absolute top-3 right-3 z-[1000] w-64 max-w-[calc(100%-1.5rem)] rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-xl text-white">
          <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
            <h3 className="text-sm font-bold lowercase leading-tight">weather layers</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMetric((m) => !m)}
                className="flex items-center gap-1.5"
                aria-pressed={metric}
                aria-label="Toggle metric units"
              >
                <span className={cn("text-[10px] font-bold uppercase tracking-wide", metric ? "text-sky-300" : "text-slate-500")}>
                  metric
                </span>
                <Switch on={metric} />
              </button>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="md:hidden -mr-1 p-1 text-slate-400 hover:text-white"
                aria-label="Hide weather layers"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="px-2 pb-2 space-y-0.5">
            <LayerToggle
              icon={Radar}
              title="precip radar"
              desc="live animated precipitation from rainviewer · past 2h + 30min nowcast."
              active={showPrecip}
              onToggle={() => setShowPrecip((v) => !v)}
            />
            <LayerToggle
              icon={Snowflake}
              title="snowfall · 24h"
              desc="forecast snow in the next 24 hours. shown when you click any point."
              active={pointLayers.snowfall}
              onToggle={() => togglePoint("snowfall")}
            />
            <LayerToggle
              icon={Wind}
              title="wind speed"
              desc="10m wind speed and direction at the clicked point."
              active={pointLayers.wind}
              onToggle={() => togglePoint("wind")}
            />
            <LayerToggle
              icon={Thermometer}
              title="temperature"
              desc="2m air temperature at the clicked point."
              active={pointLayers.temp}
              onToggle={() => togglePoint("temp")}
            />
            <LayerToggle
              icon={Droplet}
              title="rain risk"
              desc="chance of liquid rain at the clicked point · the skier's nemesis."
              active={pointLayers.rainRisk}
              onToggle={() => togglePoint("rainRisk")}
            />
          </div>
          <div className="border-t border-white/10 px-3 py-2.5 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">map key</p>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "#0ea5e9" }} />
              <span className="text-[11px] text-slate-300">town · base for your stay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "#f97316" }} />
              <span className="text-[11px] text-slate-300">ski resort</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-white/40" />
              <span className="text-[11px] text-slate-300">dimmed pin · another region</span>
            </div>
          </div>
        </div>
      )}

      {/* Hint chip · only when a point layer is armed but nothing clicked
          yet, so users know the readout is a click away. */}
      {view === "interactive" && anyPointLayer && !probe && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-20 z-[1000] rounded-full bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-lg px-3 py-1.5 text-[11px] font-medium text-slate-200">
          click anywhere on the map to read values here
        </div>
      )}

      {/* Floating control bar (bottom): play/pause + timestamp + scrubber.
          Shown only when the precip radar layer is on. */}
      {view === "interactive" && showPrecip && (
        <div className="absolute left-3 right-3 bottom-3 z-[1000] rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-lg px-3 py-2 flex items-center gap-3 text-white">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            disabled={radarFrames.length === 0}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-500 text-white disabled:opacity-40"
            aria-label={playing ? "Pause radar animation" : "Play radar animation"}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wide text-slate-300 font-semibold flex items-center gap-2">
              {loading
                ? "loading radar…"
                : error
                  ? "radar unavailable"
                  : stamp
                    ? (
                        <>
                          <span className="tabular-nums">{stamp}</span>
                          {isNowcast && (
                            <span className="inline-flex items-center rounded-full bg-amber-400/20 text-amber-300 px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
                              FORECAST
                            </span>
                          )}
                        </>
                      )
                    : "no frames"}
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
              className="w-full mt-1 accent-sky-500"
              aria-label="Radar frame scrubber"
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            RainViewer · global radar
          </span>
        </div>
      )}
    </div>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 w-7 shrink-0 items-center rounded-full px-0.5 transition-colors",
        on ? "bg-sky-500" : "bg-slate-600",
      )}
      aria-hidden="true"
    >
      <span className={cn("h-3 w-3 rounded-full bg-white transition-transform", on ? "translate-x-3" : "translate-x-0")} />
    </span>
  );
}

function LayerToggle({
  icon: Icon,
  title,
  desc,
  active,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
        active ? "bg-white/10" : "hover:bg-white/5",
      )}
      aria-pressed={active}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", active ? "text-sky-300" : "text-slate-400")} />
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold text-white lowercase">{title}</span>
        <span className="block text-[10px] leading-snug text-slate-400 mt-0.5">{desc}</span>
      </span>
      <Switch on={active} />
    </button>
  );
}

// Dark-themed view tab (Interactive / Expert / Official) for the floating
// switcher over the dark basemap.
function TabPill({
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
      title={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors",
        active ? "bg-sky-500 text-white" : "text-slate-300 hover:bg-white/10",
      )}
      aria-pressed={active}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </button>
  );
}

// Light-themed pill · used for the Windy Expert overlay switcher, which
// floats over the (lighter) Windy iframe.
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
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
      )}
      aria-pressed={active}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// BOM blocks cross-site hotlinking of its radar imagery: a browser <img>
// pointed straight at www.bom.gov.au gets a 403 (the Referer isn't
// bom.gov.au). The api-server's /api/bom-radar proxy refetches it
// server-side with browser headers (verified 200 image/gif), so route BOM
// loop gifs through it. Any non-BOM official source (none today) passes
// through untouched; a proxy/BOM failure still trips the <img> onError and
// degrades to the same "open source" link-out.
const BOM_RADAR_GIF = /^https?:\/\/(?:www\.)?bom\.gov\.au\/radar\/(IDR\d+\.gif)$/;
function officialImageSrc(imageUrl: string): string {
  const m = imageUrl.match(BOM_RADAR_GIF);
  return m ? `/api/bom-radar?type=loop&file=${m[1]}` : imageUrl;
}

function OfficialView({ official }: { official: OfficialRadarSource }) {
  // Track upstream image failure (BOM/JMA blocks our request, gif 404,
  // network blip, etc.) so we can degrade gracefully to the same
  // "open source" link-out we show for non-embeddable regions, instead
  // of leaving the user with a broken image icon.
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="absolute inset-0 flex flex-col bg-slate-100">
      <div className="flex-1 grid place-items-center overflow-hidden p-4">
        {official.imageUrl && !imgFailed ? (
          <img
            src={officialImageSrc(official.imageUrl)}
            alt={official.label}
            className="max-h-full max-w-full object-contain"
            style={{ imageRendering: "pixelated" }}
            onError={() => setImgFailed(true)}
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
