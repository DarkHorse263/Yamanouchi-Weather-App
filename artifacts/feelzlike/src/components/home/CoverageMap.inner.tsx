import { useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "wouter";
import { track } from "@/lib/analytics";
import { REGIONS, REGION_BY_ID } from "@/regions";
import { REGION_DEFAULTS } from "@/regions/region-pins";

import { resolvePinRoute } from "./resolvePinRoute";

// The pins: towns (sky #0ea5e9), mountains (orange #f97316).
// Clicking deep-links to town/mountain page.

const PIN_ICONS: Record<string, L.DivIcon> = {};

function getPinIcon(label: string, accent: string, isClickable: boolean): L.DivIcon {
  const key = `${label}-${accent}-${isClickable}`;
  if (PIN_ICONS[key]) return PIN_ICONS[key];

  const cursorStyle = isClickable ? "cursor:pointer;" : "";

  const icon = L.divIcon({
    className: "feelzlike-coverage-pin",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;${cursorStyle}">
        <div style="width:12px;height:12px;border-radius:9999px;background:${accent};box-shadow:0 0 0 2px rgba(255,255,255,1),0 1px 4px rgba(0,0,0,0.3);"></div>
        <div style="margin-top:3px;padding:2px 6px;border-radius:9999px;background:rgba(255,255,255,0.95);color:#0F172A;font:600 10px/1.1 'DIN Pro','Inter',system-ui,sans-serif;white-space:nowrap;letter-spacing:0.01em;box-shadow:0 1px 4px rgba(0,0,0,0.15);">${label}</div>
      </div>
    `,
    iconSize: [80, 32],
    iconAnchor: [40, 6],
  });
  PIN_ICONS[key] = icon;
  return icon;
}


function FitBounds({ pins }: { pins: Array<{ lat: number; lng: number }> }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, pins]);
  return null;
}

export default function CoverageMapInner() {
  const [, setLocation] = useLocation();

  const allPins = useMemo(() => {
    // Collect all pins from REGION_DEFAULTS
    const pins: Array<{ id: string; name: string; lat: number; lng: number; accent: string; regionId: string }> = [];
    
    // Some regions share identical pins (like Tomamu between Furano and Tomamu regions)
    // We only want to plot unique locations
    const seen = new Set<string>();

    for (const [regionId, defaults] of Object.entries(REGION_DEFAULTS)) {
      // we need to make sure the region is actually in REGIONS (some might be inactive or testing)
      if (!REGION_BY_ID[regionId]) continue;
      
      for (const p of defaults.pins) {
        // approximate uniqueness by name/coords to avoid double pins
        const key = `${p.lat.toFixed(3)}_${p.lng.toFixed(3)}`;
        if (!seen.has(key)) {
          seen.add(key);
          pins.push({ ...p, regionId });
        }
      }
    }
    return pins;
  }, []);

  return (
    <div className="h-[400px] w-full bg-slate-100/50 md:h-[480px]">
      <MapContainer
        center={[20, 140]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        zoomControl={false}
        scrollWheelZoom={false}
        className="h-full w-full outline-none"
        style={{ background: "#e0e7ff" }} // sky-100 base for a clean, light look fitting bluebird palette
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={12}
        />
        {allPins.map((p) => {
          const regionConfig = REGION_BY_ID[p.regionId];
          const route = resolvePinRoute(regionConfig, p.id);
          const isClickable = route !== null;

          return (
            <Marker
              key={p.id + p.regionId}
              position={[p.lat, p.lng]}
              icon={getPinIcon(p.name, p.accent, isClickable)}
              eventHandlers={
                isClickable
                  ? {
                      click: () => {
                        track("coverage_map_pin_click", {
                          category: "navigation",
                          data: { town: p.id, region: p.regionId },
                        });
                        setLocation(route);
                      },
                    }
                  : undefined
              }
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} className="font-semibold">
                {p.name.toLowerCase()} &middot; {regionConfig?.name.toLowerCase()}
              </Tooltip>
            </Marker>
          );
        })}
        <FitBounds pins={allPins} />
      </MapContainer>
    </div>
  );
}
