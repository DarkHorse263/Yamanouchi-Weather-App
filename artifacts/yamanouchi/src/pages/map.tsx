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
  heavy:    '#E11D48',
  moderate: '#F59E0B',
  light:    '#3B82F6',
  none:     '#94A3B8',
};

const REGION_COLORS: Record<string, string> = {
  'Shiga Kogen': '#6366F1',
  'Ryuoo':       '#0EA5E9',
  'Yomase':      '#10B981',
};

// Bounding boxes to zoom to when a region pill is tapped
const REGION_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  'Shiga Kogen': [[36.780, 138.490], [36.825, 138.540]],
  'Ryuoo':       [[36.770, 138.475], [36.800, 138.510]],
  'Yomase':      [[36.775, 138.415], [36.810, 138.455]],
};

const createResortIcon = (snowLevel: string, regionColor: string, isTop: boolean) => {
  const snowColor = LEVEL_COLORS[snowLevel] ?? LEVEL_COLORS.none;
  const size = 26;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 26 34">
      <path d="M13 0C7.477 0 3 4.477 3 10c0 7.5 10 22 10 22S23 17.5 23 10C23 4.477 18.523 0 13 0z"
        fill="${regionColor}" stroke="white" stroke-width="2"/>
      <circle cx="13" cy="10" r="5" fill="${snowColor}" stroke="white" stroke-width="1.5"/>
      ${isTop ? '<circle cx="21" cy="3" r="4.5" fill="#FBBF24" stroke="white" stroke-width="1.5"/>' : ''}
    </svg>`;
  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize:   [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
};

type MapMarker = {
  id: string; name: string; nameJa: string | null; region: string;
  lat: number; lng: number; snow24h: number | null;
  baseDepth: number | null; rank: number | null; snowLevel: string;
};

// Fits the map to given bounds whenever `target` changes
function FitBoundsController({ target }: { target: [[number, number], [number, number]] | [number, number][] | null }) {
  const map = useMap();
  const prevKey = useRef("");

  useEffect(() => {
    if (!target) return;
    const key = JSON.stringify(target);
    if (key === prevKey.current) return;
    prevKey.current = key;
    const bounds = L.latLngBounds(target as [number, number][]);
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 14 });
  }, [target, map]);

  return null;
}

export default function MapView() {
  const { t } = useLanguage();
  const { data: markers, isLoading, error } = useGetMapData({ query: { refetchInterval: 1800000 } });
  const [zoomTarget, setZoomTarget] = useState<[[number, number], [number, number]] | [number, number][] | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  if (isLoading) return <LoadingScreen />;
  if (error)    return <ErrorScreen message={(error as any)?.message || "Network error"} />;
  if (!markers) return null;

  const allMarkers = markers as MapMarker[];

  // Initial fit — all resorts
  const allPoints: [number, number][] = allMarkers.map(m => [m.lat, m.lng]);
  const fitTarget = zoomTarget ?? allPoints;

  const regions = ['Shiga Kogen', 'Ryuoo', 'Yomase'];

  function handleRegionPill(region: string) {
    if (activeRegion === region) {
      setActiveRegion(null);
      setZoomTarget(allPoints);
    } else {
      setActiveRegion(region);
      setZoomTarget(REGION_BOUNDS[region]);
    }
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-screen">
      <MapContainer
        center={[36.790, 138.480]}
        zoom={11}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <FitBoundsController target={fitTarget} />

        {allMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={createResortIcon(
              marker.snowLevel,
              REGION_COLORS[marker.region] ?? '#6366F1',
              marker.rank === 1,
            )}
          >
            <Popup>
              <div className="p-3 min-w-[180px]">
                <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5"
                   style={{ color: REGION_COLORS[marker.region] }}>
                  {marker.region}
                </p>
                <h3 className="font-bold text-base text-gray-800 leading-tight mb-2">
                  {t(marker.name, marker.nameJa ?? marker.name)}
                  {marker.rank === 1 ? " 🥇" : ""}
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
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

      {/* Region zoom pills */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {regions.map(region => (
          <button
            key={region}
            onClick={() => handleRegionPill(region)}
            className={`backdrop-blur shadow-lg border text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1.5 transition-all ${
              activeRegion === region
                ? "bg-slate-800 text-white border-slate-700"
                : "bg-white/95 border-white/50 text-gray-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: REGION_COLORS[region] }} />
            {region}
          </button>
        ))}
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
        <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1.5 text-xs font-medium">
          {regions.map(r => (
            <div key={r} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: REGION_COLORS[r] }} />
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-20 md:bottom-4 right-4 z-20 bg-primary/90 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
        {t("Tap marker for details", "マーカーをタップ")}
      </div>
    </div>
  );
}
