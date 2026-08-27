import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "wouter";
import { track } from "@/lib/analytics";
import { REGIONS, REGION_BY_ID, REGION_COUNTRY, type CountryCode } from "@/regions";
import { REGION_DEFAULTS } from "@/regions/region-pins";
import {
  japanPrefectureOptions,
  prefectureIdsForJapanPin,
  primaryPrefectureForJapanRegion,
  type JapanPrefecture,
} from "@/regions/japan-prefectures";

import { resolvePinRoute } from "./resolvePinRoute";
import { coveragePinKey, dedupeCoveragePins } from "./coveragePinKey";

// The pins: towns (sky #0ea5e9), mountains (orange #f97316).
// Clicking deep-links to town/mountain page.
//
// The map is Pacific-centred: western-hemisphere longitudes are shifted by
// +360 so Canada sits to the RIGHT of Japan/Australia instead of wrapping
// the world (which used to open on an empty Africa view on mobile and show
// a second, pinless copy of each continent on desktop). maxBounds keeps
// panning inside the single populated copy of the world.

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

/** Shift western-hemisphere longitudes east so everything sits on one Pacific-centred canvas. */
function pacificLng(lng: number): number {
  return lng < 0 ? lng + 360 : lng;
}

interface CoveragePin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  accent: string;
  regionId: string;
  country: CountryCode;
  prefectureIds?: string[];
}

function boundsOf(pins: Array<{ lat: number; lng: number }>): L.LatLngBounds {
  return L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
}

/**
 * Region defaults retain deliberately curated town pins. Catalogue mountains
 * are projected from the same immutable REGIONS registry as search/routing,
 * so new published regions need no hand-maintained pin table.
 */
export const COVERAGE_PINS: CoveragePin[] = (() => {
  const pins: CoveragePin[] = [];
  const seen = new Set<string>();
  const add = (pin: CoveragePin) => {
    const key = `${pin.lat.toFixed(3)}_${pin.lng.toFixed(3)}`;
    if (seen.has(key)) return;
    seen.add(key);
    pins.push(pin);
  };

  for (const [regionId, defaults] of Object.entries(REGION_DEFAULTS)) {
    if (!REGION_BY_ID[regionId]) continue;
    const country = REGION_COUNTRY[regionId];
    if (!country) continue;
    for (const pin of defaults.pins) {
      add({
        ...pin,
        lng: pacificLng(pin.lng),
        regionId,
        country,
        prefectureIds: country === "JP"
          ? prefectureIdsForJapanPin(regionId, pin.id)
          : undefined,
      });
    }
  }
  for (const region of REGIONS) {
    const country = REGION_COUNTRY[region.id];
    if (!country) continue;
    for (const mountain of region.mountains ?? []) {
      if (mountain.lat == null || mountain.lng == null) continue;
      add({
        id: mountain.id,
        name: mountain.name,
        lat: mountain.lat,
        lng: pacificLng(mountain.lng),
        accent: "#f97316",
        regionId: region.id,
        country,
        prefectureIds: country === "JP"
          ? prefectureIdsForJapanPin(region.id, mountain.id)
          : undefined,
      });
    }
  }
  return dedupeCoveragePins(pins);
})();

function FlyTo({ pins, focus }: { pins: CoveragePin[]; focus: CountryCode | "ALL" }) {
  const map = useMap();
  useEffect(() => {
    const subset = focus === "ALL" ? pins : pins.filter((p) => p.country === focus);
    if (subset.length === 0) return;
    map.flyToBounds(boundsOf(subset), { padding: [30, 30], duration: 0.8, maxZoom: 7 });
  }, [map, pins, focus]);
  return null;
}

const COUNTRY_CHIPS: Array<{ code: CountryCode | "ALL"; label: string }> = [
  { code: "ALL", label: "world" },
  { code: "AU", label: "australia" },
  { code: "NZ", label: "new zealand" },
  { code: "JP", label: "japan" },
  { code: "CA", label: "canada" },
  { code: "US", label: "united states" },
];

export default function CoverageMapInner() {
  const [, setLocation] = useLocation();
  const [focus, setFocus] = useState<CountryCode | "ALL">("ALL");
  const [prefectureId, setPrefectureId] = useState("all");

  const japanPrefectures = japanPrefectureOptions(
    REGIONS
      .filter((region) => REGION_COUNTRY[region.id] === "JP")
      .map((region) => region.id),
  );
  const visiblePins = focus === "JP" && prefectureId !== "all"
    ? COVERAGE_PINS.filter((pin) => pin.prefectureIds?.includes(prefectureId))
    : COVERAGE_PINS;

  const handleFocus = (code: CountryCode | "ALL") => {
    setFocus(code);
    if (code !== "JP") setPrefectureId("all");
    track("coverage_map_country_focus", { category: "navigation", data: { country: code } });
  };

  return (
    <div className="relative h-[400px] w-full bg-slate-100/50 md:h-[480px]">
      <MapContainer
        center={[0, 210]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        zoomControl={false}
        scrollWheelZoom={false}
        worldCopyJump={false}
        maxBounds={[[-58, 90], [78, 330]]}
        maxBoundsViscosity={1.0}
        className="h-full w-full outline-none"
        style={{ background: "#e0e7ff" }} // sky-100 base for a clean, light look fitting bluebird palette
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={12}
        />
        {visiblePins.map((p) => {
          const regionConfig = REGION_BY_ID[p.regionId];
          const route = resolvePinRoute(regionConfig, p.id);
          const isClickable = route !== null;

          return (
            <Marker
              key={coveragePinKey(p)}
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
        <ZoomControl position="bottomright" />
        <FlyTo pins={visiblePins} focus={focus} />
      </MapContainer>

      {/* Country quick-jump chips */}
      <div
        className="absolute left-3 top-3 z-[1001] flex flex-wrap gap-1.5"
        role="group"
        aria-label="jump to a country"
      >
        {COUNTRY_CHIPS.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => handleFocus(c.code)}
            data-testid={`button-map-focus-${c.code.toLowerCase()}`}
            className={`rounded-full px-3 py-1 text-[11px] font-bold lowercase shadow-sm transition-colors ${
              focus === c.code
                ? "bg-[#0055FF] text-white"
                : "bg-white/95 text-slate-700 hover:bg-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {focus === "JP" && (
        <label className="absolute right-3 top-[76px] z-[1001] rounded-lg bg-white/95 px-2.5 py-2 shadow-sm md:top-3">
          <span className="sr-only">filter Japan map by prefecture</span>
          <select
            value={prefectureId}
            onChange={(event) => setPrefectureId(event.target.value)}
            className="max-w-[170px] bg-transparent text-[11px] font-bold text-slate-700 outline-none"
            aria-label="filter Japan map by prefecture"
          >
            <option value="all">all prefectures</option>
            {japanPrefectures.map((prefecture: JapanPrefecture) => (
              <option key={prefecture.id} value={prefecture.id}>
                {prefecture.name} · {prefecture.nameJa}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1001] flex items-center gap-3 rounded-full bg-white/95 px-3 py-1.5 shadow-sm">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold lowercase text-slate-700">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f97316] ring-2 ring-white" aria-hidden />
          mountains &amp; resorts
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold lowercase text-slate-700">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0ea5e9] ring-2 ring-white" aria-hidden />
          base towns
        </span>
      </div>
    </div>
  );
}
