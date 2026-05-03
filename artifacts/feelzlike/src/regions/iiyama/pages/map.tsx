import { useLanguage } from "@workspace/feelzlike-shell";
import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getSeededResorts, type Resort } from "../data/resorts";

const defaultProto = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown };
delete defaultProto._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LEVEL_COLORS: Record<string, string> = {
  heavy: '#E11D48',
  moderate: '#F59E0B',
  light: '#3B82F6',
  none: '#94A3B8',
};

function getSnowLevel(snow24h: number): string {
  if (snow24h > 15) return 'heavy';
  if (snow24h > 5) return 'moderate';
  if (snow24h > 0) return 'light';
  return 'none';
}

const createCustomIcon = (level: string, isTop: boolean) => {
  const color = LEVEL_COLORS[level] ?? LEVEL_COLORS.none;
  const size = 28;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 36">
      <path d="M14 0C8.477 0 4 4.477 4 10c0 7.5 10 22 10 22S24 17.5 24 10c0-5.523-4.477-10-10-10z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="10" r="4" fill="white"/>
      ${isTop ? '<circle cx="22" cy="4" r="5" fill="#FBBF24" stroke="white" stroke-width="1.5"/>' : ''}
    </svg>`;
  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

function FitBoundsController({ points }: { points: [number, number][] }) {
  const map = useMap();
  const prevKey = useRef("");

  useEffect(() => {
    if (points.length === 0) return;
    const key = points.map(p => p.join(",")).join("|");
    if (key === prevKey.current) return;
    prevKey.current = key;

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 14 });
  }, [points, map]);

  return null;
}

export default function MapView() {
  const { t } = useLanguage();
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const resorts = useMemo(() => getSeededResorts(), []);

  const topResort = useMemo(() => {
    return [...resorts].sort((a, b) => b.snow24h - a.snow24h)[0];
  }, [resorts]);

  const regions = useMemo(() => {
    const regionMap = new Map<string, { level: string; nameJa: string }>();
    const grouped: Record<string, Resort[]> = {};
    resorts.forEach(r => {
      if (!grouped[r.region]) grouped[r.region] = [];
      grouped[r.region].push(r);
    });
    Object.entries(grouped).forEach(([region, rs]) => {
      const topSnow = Math.max(...rs.map(r => r.snow24h));
      regionMap.set(region, { level: getSnowLevel(topSnow), nameJa: rs[0].regionJa });
    });
    return regionMap;
  }, [resorts]);

  const visibleResorts = regionFilter === "all"
    ? resorts
    : resorts.filter(r => r.region === regionFilter);

  const fitPoints: [number, number][] = visibleResorts.map(r => [r.lat, r.lng] as [number, number]);

  const regionNames = Array.from(regions.keys());

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-screen">
      <MapContainer
        center={[36.23, 138.18]}
        zoom={8}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <FitBoundsController points={fitPoints} />

        {visibleResorts.map((resort) => {
          const level = getSnowLevel(resort.snow24h);
          const isTop = resort.id === topResort?.id;
          return (
            <Marker
              key={resort.id}
              position={[resort.lat, resort.lng]}
              icon={createCustomIcon(level, isTop)}
            >
              <Popup>
                <div className="p-3 min-w-[200px]">
                  <h3 className="font-bold text-base text-gray-800 leading-tight mb-0.5">
                    {t(resort.name, resort.nameJa)}
                  </h3>
                  <p className="text-xs text-gray-500 mb-0.5">{t(resort.region, resort.regionJa)}</p>
                  <p className="text-xs text-gray-400 mb-2">{t("Elevation", "標高")} {resort.elevation}m</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-blue-50 p-1.5 rounded text-center">
                      <div className="text-[9px] text-blue-500 font-bold uppercase">{t("24h Snow", "24h降雪")}</div>
                      <div className="text-sm font-black text-blue-700">{resort.snow24h} cm</div>
                    </div>
                    <div className="bg-indigo-50 p-1.5 rounded text-center">
                      <div className="text-[9px] text-indigo-500 font-bold uppercase">{t("Base", "積雪")}</div>
                      <div className="text-sm font-black text-indigo-700">{resort.baseDepth} cm</div>
                    </div>
                    <div className="bg-red-50 p-1.5 rounded text-center">
                      <div className="text-[9px] text-red-500 font-bold uppercase">{t("Temp", "気温")}</div>
                      <div className="text-sm font-black text-red-700">{resort.temp}°C</div>
                    </div>
                    <div className="bg-emerald-50 p-1.5 rounded text-center">
                      <div className="text-[9px] text-emerald-500 font-bold uppercase">{t("Wind", "風速")}</div>
                      <div className="text-sm font-black text-emerald-700">{resort.wind} km/h</div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 flex-wrap justify-center max-w-[90vw]">
        <button
          onClick={() => setRegionFilter("all")}
          className={`backdrop-blur shadow-lg border text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1.5 transition-colors ${
            regionFilter === "all"
              ? "bg-primary text-white border-primary"
              : "bg-white/95 border-white/50 text-gray-700"
          }`}
        >
          {t("All", "全て")} ({resorts.length})
        </button>
        {regionNames.map(name => {
          const info = regions.get(name)!;
          return (
            <button
              key={name}
              onClick={() => setRegionFilter(regionFilter === name ? "all" : name)}
              className={`backdrop-blur shadow-lg border text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1.5 transition-colors ${
                regionFilter === name
                  ? "bg-primary text-white border-primary"
                  : "bg-white/95 border-white/50 text-gray-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLORS[info.level] }} />
              {t(name, info.nameJa)}
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-20 md:bottom-4 left-4 z-20 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          {t("Snow (24h)", "降雪 (24h)")}
        </h4>
        <div className="space-y-1.5 text-xs font-medium">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-600" /> {t(">15cm Heavy", ">15cm 大雪")}</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /> {t("5-15cm", "5〜15cm")}</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> {t("<5cm Light", "<5cm 小雪")}</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-400" /> {t("None", "なし")}</div>
        </div>
      </div>

      <div className="absolute bottom-20 md:bottom-4 right-4 z-20 bg-primary/90 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
        {visibleResorts.length} {t("resorts shown", "スキー場表示中")}
      </div>
    </div>
  );
}
