import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink, LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StayDetailSheet } from "@/components/StayCard";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  buildBookingLinks,
  PROVIDER_LABELS,
  type Provider,
} from "@/lib/affiliateLinks";
import type { Stay } from "@/types/stayEat";

// Stay["type"] is a discriminated-union enum and not exported as a named
// alias; derive it locally for the per-type icon map below.
type StayType = Stay["type"];
import { cn } from "@/lib/utils";

// Tile sources. OSM is the default (no key). Cartocdn voyager is what the rest
// of the app uses elsewhere — same look. Mapbox kicks in if a token is set in
// VITE_MAPBOX_TOKEN; we never crash if the token is missing — we silently fall
// back to the OSM voyager tiles.
const FALLBACK_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const FALLBACK_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const MAPBOX_TOKEN: string | undefined =
  (import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_MAPBOX_TOKEN ?? undefined;
const MAPBOX_TILE_URL = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
  : null;

// Bucket drive-min into 4 colour bands per playbook spec.
type DriveBucket = "green" | "yellow" | "orange" | "red" | "gray";

function bucketDriveMin(min: number | null | undefined): DriveBucket {
  if (typeof min !== "number" || !Number.isFinite(min)) return "gray";
  if (min <= 15) return "green";
  if (min <= 30) return "yellow";
  if (min <= 45) return "orange";
  return "red";
}

const BUCKET_COLOR: Record<DriveBucket, { fill: string; ring: string; label: string }> = {
  green:  { fill: "#16a34a", ring: "#bbf7d0", label: "≤15 min" },
  yellow: { fill: "#ca8a04", ring: "#fef08a", label: "15–30 min" },
  orange: { fill: "#ea580c", ring: "#fed7aa", label: "30–45 min" },
  red:    { fill: "#dc2626", ring: "#fecaca", label: "45+ min" },
  gray:   { fill: "#64748b", ring: "#e2e8f0", label: "Drive time unknown" },
};

// Pick a per-stay drive minute to colour-code by. The "topMountainDriveKey"
// param is the snake_case curated key (e.g. `thredbo`, `shiga_kogen`) of
// today's #1 mountain — passed in from the page that owns Today's Call. If the
// stay has a value for that key in `drive_min_to_each_mountain`, use it;
// otherwise we fall back to `drive_min_to_nearest_mountain`. If neither exists
// the marker is gray.
function driveMinFor(stay: Stay, topKey: string | null): number | null {
  if (topKey) {
    const each = stay.drive_min_to_each_mountain;
    const direct = each ? each[topKey] : undefined;
    if (typeof direct === "number") return direct;
  }
  if (typeof stay.drive_min_to_nearest_mountain === "number") {
    return stay.drive_min_to_nearest_mountain;
  }
  return null;
}

// Pretty-print the topMountainDriveKey for the popover row.
function prettyMountainName(key: string): string {
  return key
    .split(/[-_]/)
    .map((p) => (p.length === 0 ? p : p[0].toUpperCase() + p.slice(1)))
    .join(" ");
}

// Per-type icon → an inline SVG path that renders inside the divIcon HTML.
// Keep these tiny and recognisable at 14px.
const TYPE_PATHS: Record<StayType, string> = {
  hotel:      "M3 21h18M5 21V8h14v13M9 12h2M9 16h2M13 12h2M13 16h2",
  ryokan:     "M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6",
  lodge:      "M3 21h18M5 21V11l7-7 7 7v10M9 21v-5h6v5",
  apartment:  "M5 21h14V3H5zM9 7h2M9 11h2M9 15h2M13 7h2M13 11h2M13 15h2M9 21v-3h6v3",
  airbnb:     "M3 21h18M5 21V11l7-7 7 7v10M9 21v-5h6v5",
  hostel:     "M3 21h18M5 21V8h14v13M9 12h6M9 16h6",
  motel:      "M3 21h18M5 21V8h14v13M9 12h2M13 12h2M9 16h2M13 16h2",
  cabin:      "M3 21h18M5 21V11l7-7 7 7v10M9 21v-6h6v6",
  bnb:        "M3 21h18M5 21V8h14v13M9 12h6",
  minshuku:   "M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6",
  guesthouse: "M3 21h18M5 21V8h14v13M9 12h6M9 16h6",
  resort:     "M3 21h18M5 21V8h14v13M9 12h2M9 16h2M13 12h2M13 16h2",
};

// Build a Leaflet divIcon for a single stay marker — coloured pin with the
// type icon punched in white. Using divIcon (HTML) instead of L.icon (raster
// PNG) means we don't need any image files; the colour ring + svg redraws
// crisp at any zoom.
function buildStayIcon(stay: Stay, bucket: DriveBucket): L.DivIcon {
  const { fill, ring } = BUCKET_COLOR[bucket];
  const svgPath = TYPE_PATHS[stay.type] ?? TYPE_PATHS.hotel;
  const html = `
    <div style="
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${fill};
      border: 3px solid ${ring};
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
      position: relative;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="${svgPath}" />
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: "stay-map-marker",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -18],
  });
}

// Special icon for the user's location pulse.
function buildUserLocationIcon(): L.DivIcon {
  const html = `
    <div style="
      width: 18px; height: 18px; border-radius: 50%;
      background: #2563eb; border: 3px solid #ffffff;
      box-shadow: 0 0 0 4px rgba(37,99,235,0.25), 0 2px 6px rgba(0,0,0,0.25);
      transform: translate(-50%, -50%);
    "></div>
  `;
  return L.divIcon({
    html, className: "stay-map-user-marker",
    iconSize: [0, 0], iconAnchor: [0, 0], popupAnchor: [0, -10],
  });
}

// Component that runs inside <MapContainer> so it has the map context. Calls
// invalidateSize after mount (avoids the "grey tile" issue when the container
// size isn't known at first paint), and fits bounds to the markers.
function MapBootstrap({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      if (bounds) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }, 120);
    return () => clearTimeout(t);
  }, [map, bounds]);
  return null;
}

// PriceBand — tiny inline copy so we don't need to extend StayCard's exports.
// `band` is the curated `"$" | "$$" | "$$$" | "$$$$"` string; we convert via
// .length so the dot rendering uses a numeric count.
function PriceBand({ band }: { band: "$" | "$$" | "$$$" | "$$$$" | null }) {
  if (band == null) return null;
  const filled = Math.max(0, Math.min(4, band.length));
  const dots = [0, 1, 2, 3];
  return (
    <span
      role="img"
      aria-label={`Price band ${filled} of 4`}
      className="inline-flex items-center gap-0.5"
    >
      {dots.map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < filled ? "bg-foreground" : "bg-foreground/20",
          )}
        />
      ))}
    </span>
  );
}

// Resolve the primary booking link for the popover "Book" button. Pulls from
// the same `buildBookingLinks` helper as StayCard so affiliate IDs and
// country-coverage rules are applied uniformly. Order matches the major-OTA
// preference (Booking → Agoda → Expedia → Hotels.com → Trip.com → Airbnb →
// Jalan → Rakuten); `tripadvisor` is skipped (discovery surface, low booking
// intent), and `official` is the final fallback if nothing else is available.
const POPOVER_PROVIDER_ORDER: readonly Provider[] = [
  "booking_com",
  "agoda",
  "expedia",
  "hotels_com",
  "trip_com",
  "airbnb",
  "jalan",
  "rakuten",
];

function primaryBookingHref(stay: Stay): { href: string; label: string } | null {
  const links = buildBookingLinks(stay);
  for (const id of POPOVER_PROVIDER_ORDER) {
    const url = links[id];
    if (typeof url === "string" && url.length > 0) {
      return { href: url, label: PROVIDER_LABELS[id] };
    }
  }
  if (links.official) return { href: links.official, label: PROVIDER_LABELS.official };
  return null;
}

// Compute distance using the haversine formula (km). Used by the "Locate me"
// flow to recolour markers from the user's actual position. We translate km
// to "drive minutes" with a coarse 0.8 km/min heuristic (≈48 km/h average for
// alpine/town roads) — good enough for relative bucketing, with a clearly
// different visual styling so users know it's an estimate.
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const KM_TO_MIN_HEURISTIC = 1 / 0.8; // ≈ 1.25 min per km

export interface StayMapInnerProps {
  stays: Stay[];
  topMountainDriveKey?: string | null;
  /**
   * If omitted, the component auto-detects via `useIsMobile()` (768px). Pass
   * an explicit boolean only when overriding for tests / SSR / canvas demos.
   */
  isMobile?: boolean;
  className?: string;
  /**
   * Centre to use when no stay has lat/lng. Pass the town's centroid here
   * (from `RegionConfig.towns[].lat/lng`); the component does NOT fall back
   * to anything sensible otherwise — without it, an empty geo-stays set
   * renders at `[0,0]` (mid-Atlantic ocean).
   */
  fallbackCenter?: { lat: number; lng: number } | null;
}

export default function StayMapInner({
  stays,
  topMountainDriveKey = null,
  isMobile: isMobileProp,
  className,
  fallbackCenter = null,
}: StayMapInnerProps) {
  // Auto-detect mobile when prop is omitted; explicit prop wins for tests.
  const isMobileAuto = useIsMobile();
  const isMobile = isMobileProp ?? isMobileAuto;
  // Filter to stays with valid coords. Stays without lat/lng are silently
  // skipped from the map but remain in the parent list (handled outside).
  const geoStays = useMemo(
    () =>
      stays.filter(
        (s): s is Stay & { lat: number; lng: number } =>
          typeof s.lat === "number" && typeof s.lng === "number",
      ),
    [stays],
  );

  // Compute centroid from stays[]. If no stays have coords, fall back to the
  // provided fallbackCenter, then to a generic [0,0] (zoomed out).
  const center = useMemo<L.LatLngExpression>(() => {
    if (geoStays.length === 0) {
      if (fallbackCenter) return [fallbackCenter.lat, fallbackCenter.lng];
      return [0, 0];
    }
    const lat = geoStays.reduce((acc, s) => acc + s.lat, 0) / geoStays.length;
    const lng = geoStays.reduce((acc, s) => acc + s.lng, 0) / geoStays.length;
    return [lat, lng];
  }, [geoStays, fallbackCenter]);

  // Auto-fit bounds when stays change.
  const bounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    if (geoStays.length < 2) return null;
    return geoStays.map((s) => [s.lat, s.lng] as [number, number]);
  }, [geoStays]);

  // Locate-me state. We track an isMounted ref so the geolocation callbacks
  // (which fire async, up to ~10s after the click) don't call setState on an
  // unmounted component if the user navigates away mid-request.
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const handleLocate = () => {
    if (!("geolocation" in navigator)) {
      setLocateError("Geolocation not supported by this browser");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isMountedRef.current) return;
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        if (!isMountedRef.current) return;
        setLocating(false);
        setLocateError(err.message || "Couldn't get your location");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  // Recolour markers when user location is known. We compute estimated minutes
  // from the user's position to each stay using haversine + a coarse 0.8 km/min
  // heuristic (clearly an estimate, not a routed drive time).
  const buckets = useMemo(() => {
    return geoStays.map((s) => {
      const min = userPos
        ? haversineKm(userPos, { lat: s.lat, lng: s.lng }) * KM_TO_MIN_HEURISTIC
        : driveMinFor(s, topMountainDriveKey);
      return { stay: s, min, bucket: bucketDriveMin(min) };
    });
  }, [geoStays, userPos, topMountainDriveKey]);

  // Sheet state for "View details" — only one open at a time. Driven by stayId
  // so the Sheet content is always for the most recently clicked marker.
  const [openStayId, setOpenStayId] = useState<string | null>(null);
  const openStay = useMemo(
    () => geoStays.find((s) => s.id === openStayId) ?? null,
    [geoStays, openStayId],
  );

  // The tile config — Mapbox if token is present, OSM/Carto otherwise. We
  // always emit OSM attribution because Mapbox styles still mostly use OSM
  // data underneath.
  const tileUrl = MAPBOX_TILE_URL ?? FALLBACK_TILE_URL;
  const tileAttribution = MAPBOX_TILE_URL
    ? '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    : FALLBACK_TILE_ATTRIBUTION;

  return (
    <div
      className={cn(
        "relative w-full",
        // Mobile: full-bleed, viewport-minus-header height. Desktop: 80vh.
        "h-[calc(100vh-4rem)] md:h-[80vh]",
        // Round corners on desktop only — full-bleed on mobile is intentional.
        "md:rounded-2xl md:overflow-hidden md:border md:border-border",
        className,
      )}
    >
      <MapContainer
        center={center}
        zoom={geoStays.length === 0 ? 4 : 12}
        minZoom={3}
        maxZoom={18}
        zoomControl={!isMobile}
        scrollWheelZoom
        attributionControl
        className="w-full h-full z-0"
      >
        <MapBootstrap bounds={bounds} />
        <TileLayer url={tileUrl} attribution={tileAttribution} />

        {buckets.map(({ stay, min, bucket }, idx) => {
          const icon = buildStayIcon(stay, bucket);
          const primary = primaryBookingHref(stay);
          const minRounded = typeof min === "number" ? Math.round(min) : null;
          // Composite key: stay.id is the primary key, but the curated dataset
          // has a small number of cross-town duplicate IDs in JP (a property
          // listed in two adjacent towns). Falling back to index makes the
          // map robust to data drift without masking the upstream issue.
          const markerKey = `${stay.id}-${idx}`;
          const driveLabel = userPos
            ? minRounded !== null
              ? `~${minRounded} min from you (estimate)`
              : "Distance unknown"
            : minRounded !== null
              ? `${minRounded} min ${
                  topMountainDriveKey
                    ? `→ ${prettyMountainName(topMountainDriveKey)}`
                    : "to nearest mountain"
                }`
              : "Drive time unknown";
          return (
            <Marker key={markerKey} position={[stay.lat, stay.lng]} icon={icon}>
              <Popup minWidth={220} maxWidth={260}>
                <div className="font-sans">
                  {/* Photo strip — only the first photo, since the popup is
                      tight. Fall back to a coloured placeholder. */}
                  <div className="h-24 w-full overflow-hidden rounded-md bg-slate-100 mb-2">
                    {stay.photos[0] ? (
                      <img
                        src={stay.photos[0]}
                        alt={stay.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-slate-400 text-[10px] uppercase tracking-wider">
                        No photo
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase"
                      style={{ background: BUCKET_COLOR[bucket].ring, color: BUCKET_COLOR[bucket].fill }}
                    >
                      {stay.type}
                    </span>
                    <PriceBand band={stay.price_band} />
                  </div>

                  <h3 className="font-display text-sm font-bold leading-tight">
                    {stay.name}
                  </h3>
                  {stay.name_local ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{stay.name_local}</p>
                  ) : null}

                  <p className="text-[11px] text-foreground/70 mt-1.5 tabular-nums">
                    {driveLabel}
                  </p>

                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setOpenStayId(stay.id)}
                    >
                      View details
                    </Button>
                    {primary ? (
                      <a
                        href={primary.href}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        aria-label={`Book ${stay.name} on ${primary.label}`}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground hover:opacity-85"
                      >
                        Book <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userPos ? (
          <Marker position={[userPos.lat, userPos.lng]} icon={buildUserLocationIcon()}>
            <Popup>
              <div className="font-sans text-[11px]">
                <strong>You are here</strong>
                <br />
                Markers recoloured by est. distance from you.
              </div>
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>

      {/* Locate-me button. Top-right (desktop) / bottom-left (mobile) so it
          doesn't fight with the zoom controls or the system bottom nav. */}
      <div
        className={cn(
          "absolute z-[400] flex flex-col items-end gap-1.5",
          isMobile ? "left-3 bottom-24" : "right-3 top-3",
        )}
      >
        <Button
          size="sm"
          variant="secondary"
          className="h-9 px-3 shadow-md"
          onClick={handleLocate}
          disabled={locating}
          aria-label="Use my location to recolour markers"
        >
          <LocateFixed className={cn("h-4 w-4 mr-1.5", locating && "animate-spin")} />
          {locating ? "Locating…" : userPos ? "Re-locate" : "Locate me"}
        </Button>
        {locateError ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 text-[10px] font-medium px-2 py-1 rounded-md max-w-[200px]">
            {locateError}
          </div>
        ) : null}
      </div>

      {/* Legend */}
      <div className="absolute z-[400] left-3 top-3 bg-white/95 backdrop-blur rounded-lg shadow-md border border-border px-2.5 py-1.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Drive time {userPos ? "from you" : topMountainDriveKey ? `→ ${prettyMountainName(topMountainDriveKey)}` : "(nearest mountain)"}
        </div>
        <div className="flex items-center gap-2 text-[10px] tabular-nums">
          {(["green", "yellow", "orange", "red"] as DriveBucket[]).map((b) => (
            <div key={b} className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: BUCKET_COLOR[b].fill }}
              />
              <span>{BUCKET_COLOR[b].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state overlay if no geo-coded stays. */}
      {geoStays.length === 0 ? (
        <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur rounded-xl border border-border px-4 py-3 shadow-md text-sm text-muted-foreground pointer-events-auto">
            No stays with map coordinates in this set.
          </div>
        </div>
      ) : null}

      {/* Sheet for "View details" — controlled by openStayId so a single
          marker click drives the same StayCard detail surface. */}
      <Sheet
        open={openStay !== null}
        onOpenChange={(o) => {
          if (!o) setOpenStayId(null);
        }}
      >
        {/* Required by Radix even when controlled — render an offscreen
            trigger so the Sheet has a focus return target. */}
        <SheetTrigger asChild>
          <button type="button" className="sr-only" aria-hidden tabIndex={-1}>
            open
          </button>
        </SheetTrigger>
        {openStay ? (
          <StayDetailSheet stay={openStay} />
        ) : (
          // Empty placeholder so Sheet can mount without a stay (it never opens
          // in this state, but Radix requires children).
          <SheetContent side="right" className="hidden" />
        )}
      </Sheet>
    </div>
  );
}
