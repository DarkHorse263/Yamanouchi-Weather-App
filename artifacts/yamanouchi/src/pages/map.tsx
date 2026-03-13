import { useGetMapData } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Snowflake, Ruler } from "lucide-react";

// Fix leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getColorForLevel = (level: string) => {
  switch (level) {
    case 'heavy': return '#E11D48'; // Destructive red
    case 'moderate': return '#F59E0B'; // Orange
    case 'light': return '#3B82F6'; // Blue
    case 'none':
    default: return '#94A3B8'; // Gray
  }
};

const createCustomIcon = (level: string, rank: number | null | undefined) => {
  const color = getColorForLevel(level);
  const isTop = rank === 1;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
      <path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/>
      ${isTop ? '<circle cx="18" cy="6" r="5" fill="#FBBF24" stroke="white" stroke-width="2"/>' : ''}
    </svg>
  `;
  
  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export default function MapView() {
  const { t } = useLanguage();
  const { data: markers, isLoading, error } = useGetMapData({ query: { refetchInterval: 600000 } });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading || !mounted) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;
  if (!markers) return null;

  // Center around Yamanouchi general area
  const center: [number, number] = [36.726, 138.452];

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-screen">
      <MapContainer 
        center={center} 
        zoom={12} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={[marker.lat, marker.lng]}
            icon={createCustomIcon(marker.snowLevel, marker.rank)}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <h3 className="font-bold text-lg text-mountain-dark mb-1 leading-tight">
                  {t(marker.name, marker.nameJa)}
                  {marker.rank === 1 && " 🥇"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">{t(marker.region, null)}</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <Snowflake className="w-3 h-3 text-blue-500 mx-auto" />
                    <span className="text-sm font-bold text-blue-700">{marker.snow24h ?? 0}</span>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded text-center">
                    <Ruler className="w-3 h-3 text-indigo-500 mx-auto" />
                    <span className="text-sm font-bold text-indigo-700">{marker.baseDepth ?? 0}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend Overlay */}
      <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          {t("Snow Level (24h)", "降雪レベル (24h)")}
        </h4>
        <div className="space-y-1.5 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span> {t("Heavy (>20cm)", "大雪 (>20cm)")}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span> {t("Moderate (10-20cm)", "中雪 (10-20cm)")}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span> {t("Light (<10cm)", "小雪 (<10cm)")}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-400"></span> {t("None", "なし")}
          </div>
        </div>
      </div>
    </div>
  );
}
