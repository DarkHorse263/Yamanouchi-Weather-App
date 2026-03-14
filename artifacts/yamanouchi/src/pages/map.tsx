import { useGetMapData } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { LoadingScreen, ErrorScreen } from "@/components/ui-elements";
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

const LEVEL_COLORS: Record<string, string> = {
  heavy: '#E11D48',
  moderate: '#F59E0B',
  light: '#3B82F6',
  none: '#94A3B8',
};

const createCustomIcon = (level: string, isTop: boolean, count?: number) => {
  const color = LEVEL_COLORS[level] ?? LEVEL_COLORS.none;
  const size = count && count > 1 ? 40 : 28;
  const svg = count && count > 1 ? `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="20" y="25" font-size="14" font-weight="bold" text-anchor="middle" fill="white" font-family="sans-serif">${count}</text>
    </svg>` : `
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

type MapMarker = {
  id: string; name: string; nameJa: string | null; region: string;
  lat: number; lng: number; snow24h: number | null;
  baseDepth: number | null; rank: number | null; snowLevel: string;
};

type RegionGroup = {
  region: string; lat: number; lng: number;
  markers: MapMarker[]; topSnow: number; level: string;
};

// Region center points — used as cluster anchor
const REGION_CENTERS: Record<string, [number, number]> = {
  'Shiga Kogen': [36.800, 138.510],
  'Ryuoo':       [36.779, 138.474],
  'Yomase':      [36.789, 138.411],
};

// ---- Auto-fit controller ----
// Fits the Leaflet map to the given lat/lng points with padding, whenever `points` changes.
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
  const { data: markers, isLoading, error } = useGetMapData({ query: { refetchInterval: 1800000 } });
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;
  if (!markers) return null;

  const regionGroups: RegionGroup[] = Object.entries(
    (markers as MapMarker[]).reduce((acc, m) => {
      if (!acc[m.region]) acc[m.region] = [];
      acc[m.region].push(m);
      return acc;
    }, {} as Record<string, MapMarker[]>)
  ).map(([region, resorts]) => {
    const center = REGION_CENTERS[region] ?? [resorts[0].lat, resorts[0].lng];
    const topSnow = Math.max(...resorts.map(r => r.snow24h ?? 0));
    const level = topSnow > 15 ? 'heavy' : topSnow > 5 ? 'moderate' : topSnow > 0 ? 'light' : 'none';
    return { region, lat: center[0], lng: center[1], markers: resorts, topSnow, level };
  });

  const selectedMarkers = selectedRegion
    ? (markers as MapMarker[]).filter(m => m.region === selectedRegion)
    : null;

  // Points to fit: all region centres in overview, selected resort pins when drilled in
  const fitPoints: [number, number][] = selectedMarkers
    ? selectedMarkers.map(m => [m.lat, m.lng] as [number, number])
    : regionGroups.map(g => [g.lat, g.lng] as [number, number]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-screen">
      <MapContainer
        center={[36.760, 138.420]}
        zoom={10}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <FitBoundsController points={fitPoints} />

        {/* Region cluster markers */}
        {!selectedRegion && regionGroups.map((group) => (
          <Marker
            key={group.region}
            position={[group.lat, group.lng]}
            icon={createCustomIcon(group.level, false, group.markers.length)}
            eventHandlers={{ click: () => setSelectedRegion(group.region) }}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <h3 className="font-bold text-lg mb-1">{group.region}</h3>
                <p className="text-xs text-gray-500 mb-2">{group.markers.length} {t("resorts", "スキー場")}</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <div className="text-xs text-blue-500 font-bold">{t("New Snow 24h", "24h降雪")}</div>
                    <div className="text-sm font-black text-blue-700">{group.topSnow} cm</div>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded text-center">
                    <div className="text-xs text-indigo-500 font-bold">{t("Resorts", "スキー場数")}</div>
                    <div className="text-sm font-black text-indigo-700">{group.markers.length}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRegion(group.region)}
                  className="w-full text-xs bg-primary text-white rounded-lg py-1.5 font-bold"
                >
                  {t("View resorts", "スキー場を表示")}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Individual resort markers */}
        {selectedMarkers && selectedMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={createCustomIcon(marker.snowLevel, marker.rank === 1)}
          >
            <Popup>
              <div className="p-3 min-w-[180px]">
                <h3 className="font-bold text-base text-gray-800 leading-tight mb-1">
                  {t(marker.name, marker.nameJa)}{marker.rank === 1 ? " 🥇" : ""}
                </h3>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <div className="bg-blue-50 p-1.5 rounded text-center">
                    <div className="text-[9px] text-blue-500 font-bold uppercase">{t("24h Snow", "24h降雪")}</div>
                    <div className="text-sm font-black text-blue-700">{marker.snow24h ?? 0} cm</div>
                  </div>
                  <div className="bg-indigo-50 p-1.5 rounded text-center">
                    <div className="text-[9px] text-indigo-500 font-bold uppercase">{t("Base", "積雪")}</div>
                    <div className="text-sm font-black text-indigo-700">{marker.baseDepth ?? 0} cm</div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Region filter pills */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {selectedRegion ? (
          <button
            onClick={() => setSelectedRegion(null)}
            className="bg-white/95 backdrop-blur shadow-lg border border-white/50 text-xs font-bold px-3 py-2 rounded-full text-primary flex items-center gap-1"
          >
            ← {t("All Regions", "全エリア")}
          </button>
        ) : (
          regionGroups.map(g => (
            <button
              key={g.region}
              onClick={() => setSelectedRegion(g.region)}
              className="bg-white/95 backdrop-blur shadow-lg border border-white/50 text-xs font-bold px-3 py-2 rounded-full text-gray-700 flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLORS[g.level] }} />
              {g.region}
            </button>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-20 md:bottom-4 left-4 z-20 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          {t("Snow (24h)", "降雪 (24h)")}
        </h4>
        <div className="space-y-1.5 text-xs font-medium">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-600" /> {t(">15cm Heavy", ">15cm 大雪")}</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /> {t("5–15cm", "5〜15cm")}</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> {t("<5cm Light", "<5cm 小雪")}</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-400" /> {t("None", "なし")}</div>
        </div>
      </div>

      {/* Tap hint */}
      {!selectedRegion && (
        <div className="absolute bottom-20 md:bottom-4 right-4 z-20 bg-primary/90 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
          {t("Tap region to zoom in", "エリアをタップして拡大")}
        </div>
      )}
    </div>
  );
}
