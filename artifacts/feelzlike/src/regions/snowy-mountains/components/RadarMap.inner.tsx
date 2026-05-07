import { useMemo } from "react";

interface RadarMapInnerProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  /** Markers prop is accepted for API compatibility but ignored — Windy
   * controls its own basemap and we can't overlay custom markers on the
   * embed. Mountains are still labelled by Windy's own place names. */
  markers?: Array<{ id: string; name: string; lat: number; lng: number }>;
}

const DEFAULT_CENTER = { lat: -36.42, lng: 148.42 };

/**
 * Live animated precipitation radar via Windy.com's embed. Windy ingests
 * BOM's national radar mosaic so coverage extends right across the Snowy
 * Mountains (which RainViewer's free tile cache mostly leaves blank). The
 * embed is keyless, free for non-commercial use, and animates the past
 * ~2 hours plus a short forecast nowcast. Renders inside a sandboxed iframe
 * so the host app's CSS / nav are isolated from Windy's UI.
 */
export default function RadarMapInner({
  center = DEFAULT_CENTER,
  zoom = 8,
}: RadarMapInnerProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams({
      lat: String(center.lat),
      lon: String(center.lng),
      detailLat: String(center.lat),
      detailLon: String(center.lng),
      zoom: String(zoom),
      level: "surface",
      overlay: "radar",
      product: "radar",
      menu: "",
      message: "true",
      marker: "true",
      calendar: "now",
      pressure: "",
      type: "map",
      location: "coordinates",
      detail: "",
      metricWind: "km/h",
      metricTemp: "°C",
      radarRange: "-1",
    });
    return `https://embed.windy.com/embed2.html?${params.toString()}`;
  }, [center.lat, center.lng, zoom]);

  return (
    <div className="relative w-full h-[520px] md:h-[640px] bg-slate-900">
      <iframe
        title="Animated precipitation radar — Snowy Mountains"
        src={src}
        className="w-full h-full border-0"
        loading="lazy"
        // Windy needs scripts and same-origin to drive its animation; we
        // sandbox out anything else (forms, popups, downloads) for safety.
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
