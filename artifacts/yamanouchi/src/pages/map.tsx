import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { CloudSun } from "lucide-react";

function MapResizer() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 150); }, [map]);
  return null;
}

type MapLayer = "radar" | "clouds" | "temp" | "snow";

const MAP_TABS: { key: MapLayer; label: string; labelJa: string }[] = [
  { key: "radar",  label: "Radar",     labelJa: "レーダー" },
  { key: "clouds", label: "Clouds",    labelJa: "雲" },
  { key: "temp",   label: "Temp (°C)", labelJa: "気温 (°C)" },
  { key: "snow",   label: "Snow",      labelJa: "積雪" },
];

const BASE_TILE = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

interface RainViewerData {
  host: string;
  radar: { past: { path: string; time: number }[]; nowcast: { path: string; time: number }[] };
  satellite: { infrared: { path: string; time: number }[] };
}

function useRainViewer() {
  const [data, setData] = useState<RainViewerData | null>(null);
  useEffect(() => {
    const load = () =>
      fetch("https://api.rainviewer.com/public/weather-maps.json")
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
};

interface TempStation {
  key: string;
  name: string;
  nameJa: string;
  lat: number;
  lng: number;
  elevation: number;
  type: "mountain" | "town";
}

const TEMP_STATIONS: TempStation[] = [
  { key: "shiga",     name: "Shiga Kogen",  nameJa: "志賀高原", lat: 36.805,  lng: 138.520, elevation: 1800, type: "mountain" },
  { key: "ryuoo",     name: "Ryuoo",        nameJa: "竜王",     lat: 36.789,  lng: 138.486, elevation: 1100, type: "mountain" },
  { key: "yomase",    name: "Yomase",       nameJa: "夜間瀬",   lat: 36.790,  lng: 138.430, elevation: 900,  type: "mountain" },
  { key: "yamanouchi",name: "Yamanouchi",    nameJa: "山ノ内町", lat: 36.745,  lng: 138.415, elevation: 600,  type: "town" },
  { key: "nakano",    name: "Nakano",       nameJa: "中野市",   lat: 36.742,  lng: 138.368, elevation: 350,  type: "town" },
];

function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2)  return "⛅";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

function tempColor(temp: number): { text: string; bg: string; border: string } {
  if (temp <= -10) return { text: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' };
  if (temp <= -5)  return { text: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' };
  if (temp <= 0)   return { text: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD' };
  if (temp <= 5)   return { text: '#059669', bg: '#ECFDF5', border: '#A7F3D0' };
  if (temp <= 15)  return { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
  if (temp <= 25)  return { text: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' };
  return { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };
}

function createTempLabel(station: TempStation, temp: number, wind: number, emoji: string) {
  const tc = tempColor(temp);
  const isMtn = station.type === "mountain";
  const html = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: white;
      border: 2px solid ${tc.border};
      border-radius: 10px;
      padding: 4px 8px 3px;
      font-family: system-ui, sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.12);
      white-space: nowrap;
      transform: translate(-50%, -100%);
      min-width: 60px;
      cursor: pointer;
    ">
      <span style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:0.5px;line-height:1;margin-bottom:2px;">
        ${isMtn ? '⛰️' : '🏘️'} ${station.name}
      </span>
      <span style="font-size:18px;font-weight:900;color:${tc.text};line-height:1;">
        ${temp.toFixed(1)}°
      </span>
      <span style="font-size:9px;font-weight:600;color:#94a3b8;line-height:1;margin-top:1px;">
        ${emoji} ${wind} km/h
      </span>
    </div>
    <div style="
      width:0;height:0;
      border-left:5px solid transparent;
      border-right:5px solid transparent;
      border-top:6px solid ${tc.border};
      margin:-1px auto 0;
    "></div>
  `;
  return L.divIcon({
    html,
    className: 'temp-label-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -58],
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

interface TempReading {
  station: TempStation;
  temp: number;
  wind: number;
  weatherCode: number;
}

function TempZoomer() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(TEMP_STATIONS.map(s => [s.lat, s.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 });
    return () => {
      map.setView([36.5, 137.5], 6, { animate: true });
    };
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
  const { t } = useLanguage();
  const [activeLayer, setActiveLayer] = useState<MapLayer>("radar");

  const { data: outlookData } = useQuery({
    queryKey: ["weather-outlook"],
    queryFn: async () => {
      const res = await fetch("/api/weather-outlook");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 600000,
  });

  const tempReadings: TempReading[] = useMemo(() => {
    if (!outlookData) return [];
    const readings: TempReading[] = [];
    const stationMap: Record<string, { temp: number; wind: number; weatherCode: number }> = {};
    for (const m of outlookData.mountains || []) {
      const key = m.region.toLowerCase().replace(/\s+/g, '');
      stationMap[key === 'shigakogen' ? 'shiga' : key] = { temp: m.temp, wind: m.wind, weatherCode: m.weatherCode };
    }
    for (const tw of outlookData.towns || []) {
      stationMap[tw.location.toLowerCase().replace(/\s+/g, '')] = { temp: tw.temp, wind: tw.wind, weatherCode: tw.weatherCode };
    }
    for (const station of TEMP_STATIONS) {
      const match = stationMap[station.key];
      if (match) {
        readings.push({ station, temp: match.temp, wind: match.wind, weatherCode: match.weatherCode });
      }
    }
    return readings;
  }, [outlookData]);

  const rv = useRainViewer();
  const frames = useMemo(() => {
    if (!rv) return [];
    return [...(rv.radar?.past || []), ...(rv.radar?.nowcast || [])];
  }, [rv]);

  const showTemp = activeLayer === "temp" && tempReadings.length > 0;

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
        {showTemp && tempReadings.map(({ station, temp, wind, weatherCode }) => (
          <Marker
            key={station.key}
            position={[station.lat, station.lng]}
            icon={createTempLabel(station, temp, wind, weatherEmoji(weatherCode))}
          >
            <Popup>
              <div className="p-3 min-w-[160px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">{station.type === "mountain" ? "⛰️" : "🏘️"}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {station.name}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">{station.elevation}m elevation</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg p-2 text-center" style={{ background: tempColor(temp).bg }}>
                    <div className="text-[9px] font-bold uppercase" style={{ color: tempColor(temp).text }}>Temp</div>
                    <div className="text-base font-black" style={{ color: tempColor(temp).text }}>{temp.toFixed(1)}°</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Wind</div>
                    <div className="text-base font-black text-slate-700">{wind}<span className="text-[10px] ml-0.5">km/h</span></div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-white/95 backdrop-blur-md shadow-lg border border-white/50 rounded-full p-1 flex gap-1">
          {MAP_TABS.map(tab => (
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
        <CloudSun className="w-4 h-4 text-primary" />
        <div>
          <p className="text-xs font-bold text-slate-700">{t("Japan Weather", "日本の天気")}</p>
          <p className="text-[9px] text-slate-400">{t("Pinch to zoom · Drag to pan", "ピンチでズーム · ドラッグで移動")}</p>
        </div>
      </div>

      <div className="absolute bottom-20 md:bottom-4 right-4 z-20 bg-white/90 backdrop-blur text-slate-500 text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-md">
        {t("OpenStreetMap · RainViewer · OWM", "OpenStreetMap · RainViewer · OWM")}
      </div>
    </div>
  );
}
