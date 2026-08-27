import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@workspace/feelzlike-shell";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { CloudSun, Thermometer, Star } from "lucide-react";
import { useSeason } from "@workspace/feelzlike-shell";
import { useUnits } from "@/components/auth/UserPrefsProvider";

function MapResizer() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 150); }, [map]);
  return null;
}

type MapLayer = "radar" | "clouds" | "temp" | "snow" | "rain";

const WINTER_TABS: { key: MapLayer; label: string; labelJa: string }[] = [
  { key: "radar",  label: "Radar",     labelJa: "レーダー" },
  { key: "clouds", label: "Clouds",    labelJa: "雲" },
  { key: "temp",   label: "Temp (°C)", labelJa: "気温 (°C)" },
  { key: "snow",   label: "Snow",      labelJa: "積雪" },
];

const GREEN_TABS: { key: MapLayer; label: string; labelJa: string }[] = [
  { key: "radar",  label: "Radar",     labelJa: "レーダー" },
  { key: "clouds", label: "Clouds",    labelJa: "雲" },
  { key: "temp",   label: "Temp (°C)", labelJa: "気温 (°C)" },
  { key: "rain",   label: "Rain",      labelJa: "降水" },
];

const BASE_TILE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

interface RainViewerData {
  host: string;
  radar: { past: { path: string; time: number }[]; nowcast: { path: string; time: number }[] };
  satellite: { infrared: { path: string; time: number }[] };
}

function useRainViewer() {
  const [data, setData] = useState<RainViewerData | null>(null);
  useEffect(() => {
    // Proxy through our backend (caches for 60s, keeps the third-party
    // host out of the browser CORS surface, lets us swap providers
    // without a frontend release). BASE_URL is e.g. "/yamanouchi/" so
    // the "/../api" trick resolves to "/api" regardless of region.
    const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/../api`.replace(/\/+$/, "");
    const url = `${apiBase}/radar/rainviewer`;
    const load = () =>
      fetch(url)
        .then(r => r.json())
        .then(setData)
        .catch(() => {});
    load();
    const iv = setInterval(load, 300000);
    return () => clearInterval(iv);
  }, []);
  return data;
}

function RadarOverlay({ host, frames }: { host: string; frames: { path: string; time: number }[] }) {
  const map = useMap();
  const layersRef = useRef<L.TileLayer[]>([]);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [frameIdx, setFrameIdx] = useState(frames.length - 1);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    layersRef.current.forEach(l => map.removeLayer(l));
    const newLayers = frames.map(f => {
      const url = `${host}${f.path}/256/{z}/{x}/{y}/6/1_1.png`;
      const layer = L.tileLayer(url, { opacity: 0, zIndex: 10, tileSize: 256 });
      layer.addTo(map);
      return layer;
    });
    layersRef.current = newLayers;
    if (newLayers.length > 0) {
      newLayers[newLayers.length - 1].setOpacity(0.7);
    }
    setFrameIdx(frames.length - 1);
    return () => { newLayers.forEach(l => map.removeLayer(l)); };
  }, [map, host, frames]);

  const showFrame = useCallback((idx: number) => {
    layersRef.current.forEach((l, i) => l.setOpacity(i === idx ? 0.7 : 0));
    setFrameIdx(idx);
  }, []);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    let current = frameIdx;
    const step = () => {
      current = (current + 1) % frames.length;
      showFrame(current);
      animRef.current = setTimeout(step, current === frames.length - 1 ? 2000 : 500);
    };
    animRef.current = setTimeout(step, current === frames.length - 1 ? 2000 : 500);
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [playing, frames.length, showFrame]);

  const ts = frames[frameIdx]?.time;
  const timeLabel = ts
    ? new Date(ts * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })
    : "";

  return (
    <div className="absolute bottom-2 left-2 right-2 z-[1000] flex items-center gap-2">
      <button
        onClick={() => setPlaying(p => !p)}
        className="bg-white/90 backdrop-blur rounded-lg px-2.5 py-1.5 text-xs font-bold shadow border border-slate-200 shrink-0"
      >
        {playing ? "⏸" : "▶️"}
      </button>
      <div className="flex-1 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 shadow border border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-500">{timeLabel} JST</span>
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={frameIdx}
            onChange={e => { setPlaying(false); showFrame(Number(e.target.value)); }}
            className="w-24 h-1 accent-blue-600"
          />
        </div>
      </div>
    </div>
  );
}

const OWM_LAYERS: Record<string, { layer: string; opacity: number }> = {
  clouds: { layer: "clouds_new", opacity: 0.7 },
  temp:   { layer: "temp_new",   opacity: 0.35 },
  snow:   { layer: "snow",       opacity: 0.8 },
  rain:   { layer: "precipitation_new", opacity: 0.7 },
};

interface CityTemp {
  key: string;
  name: string;
  nameJa: string;
  lat: number;
  lng: number;
  temp: number | null;
  weatherCode: number;
  wind: number;
}

const FEATURED_KEYS = new Set(["yamanouchi", "nagano", "hakuba", "nozawa", "myoko"]);


function tempColor(temp: number): { text: string; bg: string; border: string } {
  if (temp <= -10) return { text: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' };
  if (temp <= -5)  return { text: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' };
  if (temp <= 0)   return { text: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD' };
  if (temp <= 5)   return { text: '#059669', bg: '#ECFDF5', border: '#A7F3D0' };
  if (temp <= 15)  return { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
  if (temp <= 25)  return { text: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' };
  return { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };
}

function createCityTempLabel(city: CityTemp, isJa: boolean, windLabel: string) {
  if (city.temp === null) return null;
  const tc = tempColor(city.temp);
  const isFeatured = FEATURED_KEYS.has(city.key);
  const displayName = isJa ? city.nameJa : city.name;

  const html = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(8px);
      border: 1.5px solid ${isFeatured ? tc.text : tc.border};
      border-radius: 10px;
      padding: ${isFeatured ? '4px 8px 3px' : '3px 6px 2px'};
      font-family: system-ui, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.10);
      white-space: nowrap;
      transform: translate(-50%, -100%);
      min-width: ${isFeatured ? '64px' : '48px'};
    ">
      <span style="font-size:${isFeatured ? '9px' : '8px'};font-weight:${isFeatured ? '800' : '700'};color:#64748b;letter-spacing:0.3px;line-height:1;margin-bottom:1px;">
        ${displayName}
      </span>
      <span style="font-size:${isFeatured ? '16px' : '13px'};font-weight:900;color:${tc.text};line-height:1;">
        ${city.temp.toFixed(1)}°
      </span>
      ${isFeatured ? `<span style="font-size:8px;font-weight:600;color:#94a3b8;line-height:1;margin-top:1px;">${windLabel}</span>` : ''}
    </div>
    <div style="
      width:0;height:0;
      border-left:4px solid transparent;
      border-right:4px solid transparent;
      border-top:5px solid ${isFeatured ? tc.text : tc.border};
      margin:-1px auto 0;
    "></div>
  `;
  return L.divIcon({
    html,
    className: 'temp-label-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -45],
  });
}

function OverlaySwitcher({ activeLayer }: { activeLayer: MapLayer }) {
  const map = useMap();
  const owmRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (owmRef.current) {
      map.removeLayer(owmRef.current);
      owmRef.current = null;
    }
    const cfg = OWM_LAYERS[activeLayer];
    if (cfg) {
      const layer = L.tileLayer(
        `/api/weather-tile/${cfg.layer}/{z}/{x}/{y}`,
        { opacity: cfg.opacity, zIndex: 10 }
      );
      layer.addTo(map);
      owmRef.current = layer;
    }
    return () => {
      if (owmRef.current) {
        map.removeLayer(owmRef.current);
        owmRef.current = null;
      }
    };
  }, [map, activeLayer]);

  return null;
}

function TempZoomer() {
  const map = useMap();
  useEffect(() => {
    map.setView([36.5, 137.5], 6, { animate: true });
    return () => {};
  }, [map]);
  return null;
}

function ViewResetter({ activeLayer }: { activeLayer: MapLayer }) {
  const map = useMap();
  const prevLayer = useRef(activeLayer);
  useEffect(() => {
    if (prevLayer.current === "temp" && activeLayer !== "temp") {
      map.setView([36.5, 137.5], 6, { animate: true });
    }
    prevLayer.current = activeLayer;
  }, [activeLayer, map]);
  return null;
}

export default function MapView() {
  const { t, language: lang } = useLanguage();
  const u = useUnits();
  const { isWinter } = useSeason();
  const [activeLayer, setActiveLayer] = useState<MapLayer>("radar");
  const tabs = isWinter ? WINTER_TABS : GREEN_TABS;

  useEffect(() => {
    if (!isWinter && activeLayer === "snow") setActiveLayer("rain");
    if (isWinter && activeLayer === "rain") setActiveLayer("snow");
  }, [isWinter]);

  const { data: japanTemps } = useQuery<{ cities: CityTemp[]; updatedAt: string }>({
    queryKey: ["japan-temps"],
    queryFn: async () => {
      const res = await fetch("/api/japan-temps");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 600000,
  });

  const cities = japanTemps?.cities ?? [];
  const showTemp = activeLayer === "temp" && cities.length > 0;

  const rv = useRainViewer();
  const frames = useMemo(() => {
    if (!rv) return [];
    return [...(rv.radar?.past || []), ...(rv.radar?.nowcast || [])];
  }, [rv]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-screen">
      <MapContainer
        center={[36.5, 137.5]}
        zoom={6}
        minZoom={4}
        maxZoom={13}
        className="w-full h-full z-0"
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <MapResizer />
        <TileLayer url={BASE_TILE} />
        <OverlaySwitcher activeLayer={activeLayer} />
        <ViewResetter activeLayer={activeLayer} />
        {activeLayer === "radar" && rv && frames.length > 0 && (
          <RadarOverlay host={rv.host} frames={frames} />
        )}
        {showTemp && <TempZoomer />}
        {showTemp && cities.map(city => {
          const icon = createCityTempLabel(city, lang === "ja", `${u.wind(city.wind)} ${u.windUnit}`);
          if (!icon || city.temp === null) return null;
          const tc = tempColor(city.temp);
          const isFeatured = FEATURED_KEYS.has(city.key);
          return (
            <Marker
              key={city.key}
              position={[city.lat, city.lng]}
              icon={icon}
              zIndexOffset={isFeatured ? 1000 : 0}
            >
              <Popup>
                <div className="p-3 min-w-[170px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-bold text-slate-700">
                      {lang === "ja" ? city.nameJa : city.name}
                    </span>
                    {isFeatured && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <div className="rounded-lg p-2 text-center" style={{ background: tc.bg }}>
                      <div className="text-[9px] font-bold uppercase" style={{ color: tc.text }}>{t("Temp", "気温")}</div>
                      <div className="text-base font-black" style={{ color: tc.text }}>{city.temp.toFixed(1)}°</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">{t("Wind", "風")}</div>
                      <div className="text-base font-black text-slate-700">{u.wind(city.wind)}<span className="text-[10px] ml-0.5">{u.windUnit}</span></div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-white/95 backdrop-blur-md shadow-lg border border-white/50 rounded-full p-1 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveLayer(tab.key)}
              className={`text-[11px] font-bold py-1.5 px-3 rounded-full transition-all whitespace-nowrap ${
                activeLayer === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {t(tab.label, tab.labelJa)}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute top-16 left-4 z-20 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-white/50 px-3 py-2 flex items-center gap-2">
        {showTemp ? <Thermometer className="w-4 h-4 text-orange-500" /> : <CloudSun className="w-4 h-4 text-primary" />}
        <div>
          <p className="text-xs font-bold text-slate-700">
            {showTemp ? t("Live Temperatures", "現在の気温") : t("Japan Weather", "日本の天気")}
          </p>
          <p className="text-[9px] text-slate-400">
            {showTemp
              ? t(`${cities.length} cities · Tap for details`, `${cities.length}都市 · タップで詳細`)
              : t("Pinch to zoom · Drag to pan", "ピンチでズーム · ドラッグで移動")}
          </p>
        </div>
      </div>

      <div className="absolute bottom-20 md:bottom-4 right-4 z-20 bg-white/90 backdrop-blur text-slate-500 text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-md">
        {t("OpenStreetMap · RainViewer · OWM", "OpenStreetMap · RainViewer · OWM")}
      </div>
    </div>
  );
}
