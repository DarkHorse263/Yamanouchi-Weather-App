import { useGetResorts, useGetMapData } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { useSeason } from "@/hooks/use-season";
import { LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { HourlyTimeline } from "@/components/hourly-timeline";
import { ExternalLink, CalendarDays, BedDouble, Layers, ChevronDown, ChevronUp, TreePine } from "lucide-react";
import { motion } from "framer-motion";
import { bookingRegionUrl } from "@/lib/booking";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SNOW_LEVELS = {
  heavy:    { color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' },
  moderate: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  light:    { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  none:     { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
};

const REGION_COLORS: Record<string, string> = {
  'Shiga Kogen': '#6366F1',
  'Ryuoo':       '#0EA5E9',
  'Yomase':      '#10B981',
};

const REGION_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  'Shiga Kogen': [[36.785, 138.500], [36.845, 138.555]],
  'Ryuoo':       [[36.770, 138.460], [36.795, 138.490]],
  'Yomase':      [[36.780, 138.400], [36.800, 138.425]],
};

const BASE_TILES = {
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attr: '&copy; OSM &copy; CARTO',
    label: 'Map',
  },
  terrain: {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
    attr: '&copy; Stamen &copy; OSM',
    label: 'Terrain',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri',
    label: 'Satellite',
  },
};

type TileKey = keyof typeof BASE_TILES;

function shortResortName(name: string): string {
  return name
    .replace(/^Shiga Kogen\s+/i, '')
    .replace(/\s+(Ski Area|Ski Park|Onsen Ski Area|Ski Resort)$/i, '')
    .trim();
}

const createSnowLabel = (name: string, snow24h: number | null, baseDepth: number | null, snowLevel: string, regionColor: string, rank: number | null) => {
  const level = SNOW_LEVELS[snowLevel as keyof typeof SNOW_LEVELS] ?? SNOW_LEVELS.none;
  const short = shortResortName(name);
  const displayName = short.length > 14 ? short.slice(0, 13) + '…' : short;
  const snowVal = snow24h ?? 0;
  const isTop = rank === 1;

  const html = `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      gap: 3px;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(8px);
      border: 1.5px solid ${isTop ? '#F59E0B' : 'rgba(0,0,0,0.08)'};
      border-left: 3px solid ${regionColor};
      border-radius: 6px;
      padding: 2px 5px 2px 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.05);
      white-space: nowrap;
      transform: translate(-50%, -100%);
      cursor: pointer;
    ">
      <span style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        border-radius: 4px;
        background: ${level.bg};
        font-size: 9px;
        font-weight: 800;
        color: ${level.color};
        flex-shrink: 0;
        padding: 0 2px;
      ">${snowVal}</span>
      <span style="
        font-size: 9px;
        font-weight: 600;
        color: #475569;
        line-height: 1.1;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: -0.01em;
      ">${displayName}</span>
    </div>
    <div style="
      width: 0; height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 4px solid rgba(255,255,255,0.95);
      margin: -1px auto 0;
      filter: drop-shadow(0 1px 1px rgba(0,0,0,0.06));
    "></div>
  `;

  return L.divIcon({
    html,
    className: 'snow-label-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -30],
  });
};

const GREEN_POIS = [
  { name: "Jigokudani Monkey Park", nameJa: "地獄谷野猿公苑", lat: 36.7332, lng: 138.4621, type: "wildlife", icon: "🐒" },
  { name: "SORA Terrace", nameJa: "SORAテラス", lat: 36.7892, lng: 138.4750, type: "viewpoint", icon: "☁️" },
  { name: "Shiga Kogen Marshlands", nameJa: "志賀高原湿原", lat: 36.8050, lng: 138.5200, type: "hiking", icon: "🥾" },
  { name: "Shibu Onsen", nameJa: "渋温泉", lat: 36.7462, lng: 138.4325, type: "onsen", icon: "♨️" },
  { name: "Yudanaka Onsen", nameJa: "湯田中温泉", lat: 36.7444, lng: 138.4148, type: "onsen", icon: "♨️" },
  { name: "Ryuoo Gondola", nameJa: "竜王ゴンドラ", lat: 36.7850, lng: 138.4855, type: "viewpoint", icon: "🚡" },
  { name: "Kumanoyu Hiking", nameJa: "熊の湯ハイキング", lat: 36.8100, lng: 138.5280, type: "hiking", icon: "🥾" },
  { name: "Yokoteyama Summit", nameJa: "横手山山頂", lat: 36.8155, lng: 138.5340, type: "hiking", icon: "⛰️" },
];

const createPoiIcon = (icon: string) => {
  const html = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: white;
      border: 2px solid #059669;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-size: 16px;
      transform: translate(-50%, -50%);
      cursor: pointer;
    ">${icon}</div>
  `;
  return L.divIcon({
    html,
    className: 'poi-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -20],
  });
};

type MapMarker = {
  id: string; name: string; nameJa: string | null; region: string;
  lat: number; lng: number; snow24h: number | null;
  baseDepth: number | null; rank: number | null; snowLevel: string;
};

function FitBoundsController({ target }: { target: [[number, number], [number, number]] | [number, number][] | null }) {
  const map = useMap();
  const prevKey = useRef("");

  useEffect(() => {
    if (!target) return;
    const key = JSON.stringify(target);
    if (key === prevKey.current) return;
    prevKey.current = key;
    const bounds = L.latLngBounds(target as [number, number][]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [target, map]);

  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 150); }, [map]);
  return null;
}

function TileSwitcher({ active, onChange }: { active: TileKey; onChange: (k: TileKey) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute top-4 right-4 z-20">
      <button
        onClick={() => setOpen(!open)}
        className="bg-white/95 backdrop-blur shadow-lg border border-white/50 rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-bold text-slate-700"
      >
        <Layers className="w-3.5 h-3.5" />
        {BASE_TILES[active].label}
      </button>
      {open && (
        <div className="mt-1 bg-white/95 backdrop-blur shadow-lg border border-white/50 rounded-xl overflow-hidden">
          {(Object.keys(BASE_TILES) as TileKey[]).map(key => (
            <button
              key={key}
              onClick={() => { onChange(key); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${
                key === active ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {BASE_TILES[key].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({ isWinter, t }: { isWinter: boolean; t: (en: string, ja: string) => string }) {
  const [open, setOpen] = useState(false);
  const regions = ['Shiga Kogen', 'Ryuoo', 'Yomase'];

  if (!isWinter) return null;

  return (
    <div className="absolute bottom-4 left-4 z-20">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-white/90 backdrop-blur-md shadow-sm border border-slate-200/60 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 hover:bg-white transition-colors"
        >
          <ChevronUp className="w-3 h-3" />
          {t("Legend", "凡例")}
        </button>
      ) : (
        <div className="bg-white/90 backdrop-blur-md shadow-sm border border-slate-200/60 rounded-lg overflow-hidden" style={{ minWidth: 130 }}>
          <button
            onClick={() => setOpen(false)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold text-slate-500"
          >
            <span>{t("Legend", "凡例")}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <div className="px-2.5 pb-2 border-t border-slate-100/80 pt-1.5">
            <div className="flex items-center gap-3 mb-1.5">
              {[
                { level: 'heavy' as const, label: '15+' },
                { level: 'moderate' as const, label: '5–15' },
                { level: 'light' as const, label: '<5' },
                { level: 'none' as const, label: '0' },
              ].map(({ level, label }) => {
                const s = SNOW_LEVELS[level];
                return (
                  <div key={level} className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded text-center text-[7px] font-bold leading-3" style={{ background: s.bg, color: s.color }}>
                      {level === 'heavy' ? '20' : level === 'moderate' ? '8' : level === 'light' ? '3' : '0'}
                    </span>
                    <span className="text-[8px] text-slate-400">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2.5">
              {regions.map(r => (
                <div key={r} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: REGION_COLORS[r] }} />
                  <span className="text-[8px] text-slate-500 font-medium">{r === 'Shiga Kogen' ? 'Shiga' : r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function safeTime(raw: string | null | undefined): string {
  if (!raw) return "Live";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "Live";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch { return "Live"; }
}

function ResortMap() {
  const { t } = useLanguage();
  const { isWinter } = useSeason();
  const { data: markers, isLoading } = useGetMapData({ query: { refetchInterval: 1800000, enabled: isWinter } });
  const [zoomTarget, setZoomTarget] = useState<[[number, number], [number, number]] | [number, number][] | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [tileKey, setTileKey] = useState<TileKey>('voyager');

  const regions = ['Shiga Kogen', 'Ryuoo', 'Yomase'];

  if (isWinter && isLoading) return <div className="h-80 rounded-2xl bg-slate-100 animate-pulse" />;

  const allMarkers = isWinter ? (markers as MapMarker[] ?? []) : [];
  const allPoints: [number, number][] = allMarkers.length > 0
    ? allMarkers.map(m => [m.lat, m.lng])
    : GREEN_POIS.map(p => [p.lat, p.lng]);
  const fitTarget = zoomTarget ?? allPoints;

  function handleRegionPill(region: string) {
    if (activeRegion === region) {
      setActiveRegion(null);
      setZoomTarget(allPoints);
    } else {
      setActiveRegion(region);
      setZoomTarget(REGION_BOUNDS[region]);
    }
  }

  const tile = BASE_TILES[tileKey];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: 380 }}>
      <MapContainer
        center={[36.800, 138.500]}
        zoom={12}
        className="w-full h-full z-0"
        zoomControl={true}
        attributionControl={false}
      >
        <MapResizer />
        <TileLayer
          attribution={tile.attr}
          url={tile.url}
          key={tileKey}
        />
        <FitBoundsController target={fitTarget} />

        {isWinter && allMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={createSnowLabel(
              marker.name,
              marker.snow24h,
              marker.baseDepth,
              marker.snowLevel,
              REGION_COLORS[marker.region] ?? '#6366F1',
              marker.rank,
            )}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: REGION_COLORS[marker.region] }} />
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: REGION_COLORS[marker.region] }}>
                    {marker.region}
                  </span>
                  {marker.rank === 1 && <span className="text-xs ml-auto">⭐ #1</span>}
                </div>
                <h3 className="font-black text-sm text-slate-800 leading-tight mb-2.5">
                  {t(marker.name, marker.nameJa ?? marker.name)}
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg p-2 text-center" style={{ background: (SNOW_LEVELS[marker.snowLevel as keyof typeof SNOW_LEVELS] ?? SNOW_LEVELS.none).bg }}>
                    <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: (SNOW_LEVELS[marker.snowLevel as keyof typeof SNOW_LEVELS] ?? SNOW_LEVELS.none).color }}>
                      {t("24h Snow", "24h降雪")}
                    </div>
                    <div className="text-base font-black mt-0.5" style={{ color: (SNOW_LEVELS[marker.snowLevel as keyof typeof SNOW_LEVELS] ?? SNOW_LEVELS.none).color }}>
                      {marker.snow24h ?? 0}<span className="text-[10px] font-semibold ml-0.5">cm</span>
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider">{t("Base", "積雪")}</div>
                    <div className="text-base font-black text-indigo-700 mt-0.5">
                      {marker.baseDepth ?? 0}<span className="text-[10px] font-semibold ml-0.5">cm</span>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {!isWinter && GREEN_POIS.map((poi) => (
          <Marker
            key={poi.name}
            position={[poi.lat, poi.lng]}
            icon={createPoiIcon(poi.icon)}
          >
            <Popup>
              <div className="p-3 min-w-[180px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{poi.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">{poi.type}</span>
                </div>
                <h3 className="font-black text-sm text-slate-800 leading-tight">
                  {t(poi.name, poi.nameJa)}
                </h3>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {isWinter && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          <button
            onClick={() => { setActiveRegion(null); setZoomTarget(allPoints); }}
            className={`backdrop-blur shadow-lg border text-[11px] font-bold px-2.5 py-1.5 rounded-full transition-all ${
              activeRegion === null
                ? "bg-slate-800 text-white border-slate-700"
                : "bg-white/95 border-white/50 text-gray-600"
            }`}
          >
            {t("All", "全体")}
          </button>
          {regions.map(region => (
            <button
              key={region}
              onClick={() => handleRegionPill(region)}
              className={`backdrop-blur shadow-lg border text-[11px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-all ${
                activeRegion === region
                  ? "bg-slate-800 text-white border-slate-700"
                  : "bg-white/95 border-white/50 text-gray-600"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: REGION_COLORS[region] }} />
              {region}
            </button>
          ))}
        </div>
      )}

      {!isWinter && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-emerald-600/90 backdrop-blur text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <TreePine className="w-3.5 h-3.5" />
            {t("Green Season Points of Interest", "グリーンシーズン観光スポット")}
          </div>
        </div>
      )}

      <TileSwitcher active={tileKey} onChange={setTileKey} />
      <Legend isWinter={isWinter} t={t} />
    </div>
  );
}

export default function Resorts() {
  const { t } = useLanguage();
  const { isWinter } = useSeason();
  const { data: resorts, isLoading, error } = useGetResorts({ query: { refetchInterval: 1800000, enabled: isWinter } });

  if (isWinter && isLoading) return <LoadingScreen />;
  if (isWinter && error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;

  const grouped = isWinter && resorts ? resorts.reduce((acc, resort) => {
    const region = resort.region;
    if (!acc[region]) acc[region] = [];
    acc[region].push(resort);
    return acc;
  }, {} as Record<string, typeof resorts>) : {};

  const maxBase = isWinter && resorts ? Math.max(...resorts.map(r => r.baseDepth ?? 0), 1) : 1;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">

      <div className="mb-5">
        <h1 className="text-3xl font-black text-slate-900">
          {isWinter ? t("Ski Resorts", "スキー場") : t("Activities & Spots", "アクティビティ・スポット")}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isWinter
            ? t("Live conditions · Yamanouchi areas", "山ノ内町全エリアのライブ状況")
            : t("Green season highlights · Yamanouchi", "グリーンシーズンの見どころ · 山ノ内町")
          }
        </p>
      </div>

      <div className="mb-6">
        <ResortMap />
      </div>

      {isWinter && (
        <>
          <div className="mb-6">
            <HourlyTimeline lastUpdatedAt={resorts[0]?.sourceUpdatedAt} />
          </div>

          <div className="space-y-8">
            {Object.entries(grouped).map(([region, regionResorts], regionIdx) => (
              <div key={region}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                    {t(region, regionResorts[0]?.regionJa)}
                  </h2>
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {regionResorts.length} {t("resorts", "スキー場")}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {regionResorts.map((resort, idx) => {
                    const base = resort.baseDepth ?? 0;
                    const basePct = maxBase > 0 ? Math.round((base / maxBase) * 100) : 0;

                    return (
                      <motion.div
                        key={resort.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (regionIdx * 0.06) + (idx * 0.04) }}
                        className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 hover:border-blue-200 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {t(resort.name, resort.nameJa)}
                          </h3>
                          {resort.rank === 1 && <span className="shrink-0 text-base">🥇</span>}
                        </div>

                        <div className="grid grid-cols-4 text-center">
                          <div>
                            <p className="text-base font-black text-blue-600">{resort.snow24h ?? 0}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">24h cm</p>
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-800">{resort.baseDepth ?? 0}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Base cm</p>
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-700">{resort.temp ?? '—'}°</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Temp °C</p>
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-500">{resort.wind ?? '—'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Wind km/h</p>
                          </div>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-1">
                          <div
                            className="h-1 rounded-full bg-blue-400 transition-all duration-500"
                            style={{ width: `${basePct}%` }}
                          />
                        </div>

                        {resort.snowTomorrow !== null && resort.snowTomorrow > 0 && (
                          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-1.5 text-blue-600">
                              <CalendarDays className="w-3 h-3" />
                              <span className="text-xs font-bold">{t("Tomorrow", "明日")}</span>
                            </div>
                            <span className="text-xs font-black text-blue-700">+{resort.snowTomorrow} cm</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                          <div className="flex items-center gap-3">
                            {resort.websiteUrl && (
                              <a
                                href={resort.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                {t("Website", "公式")}
                              </a>
                            )}
                            <a
                              href={bookingRegionUrl(resort.region)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <BedDouble className="w-2.5 h-2.5" />
                              {t("Stay Nearby", "周辺宿泊")}
                            </a>
                          </div>
                          <span className="text-[9px] text-slate-300 font-medium tabular-nums">
                            {safeTime(resort.sourceUpdatedAt)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
