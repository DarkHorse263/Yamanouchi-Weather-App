import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Cloudy,
  LocateFixed,
  MapPin,
  Moon,
  Mountain,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
import { track } from "@/lib/analytics";

// ── server payload (GET /api/local-weather) ────────────────────────
interface LocalCurrent {
  tempC: number;
  feelsLikeC: number;
  windKph: number;
  windDirection: string;
  windDirectionDeg: number | null;
  description: string;
  weatherCode: number | null;
  isDay: boolean;
  observedAt: string;
  source: string;
}
interface NearestRegion {
  id: string;
  name: string;
  country: string;
  countryCode: "AU" | "JP";
  href: string;
  headlineLabel: string;
  distanceKm: number;
}
interface LocalWeatherResponse {
  place: { latitude: number; longitude: number };
  current: LocalCurrent | null;
  nearestRegion: NearestRegion | null;
  generatedAt: string;
}

// Minimal slice of GET /api/regions we read to enrich the nearest-region row
// with its current "feelzlike" temp. Shares the ["regions"] query cache with
// the country picker so this never costs an extra request.
interface RegionsLite {
  regions: Array<{ id: string; headline: { feelsLikeC: number; tempC: number } | null }>;
}

type GeoPhase = "locating" | "ready" | "denied" | "unsupported" | "error";

// Open-Meteo WMO weather code -> lucide icon. Day/night only swaps the clear
// glyph; everything else reads the same after dark.
function weatherIcon(code: number | null, isDay: boolean): LucideIcon {
  if (code == null) return Cloud;
  if (code === 0) return isDay ? Sun : Moon;
  if (code === 1 || code === 2) return Cloud;
  if (code === 3) return Cloudy;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return CloudRain;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

const PANEL =
  "mx-4 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/80 to-white shadow-[0_8px_30px_rgb(15,23,42,0.06)] md:mx-6";

/**
 * Location-first landing block. On mount it asks for the visitor's location
 * and shows their current local conditions plus the nearest live mountain
 * region (a one-tap shortcut into it). Every state degrades gracefully - a
 * denial/timeout/unsupported browser collapses to a slim, low-emphasis row
 * (or nothing) so the "pick a country" flow below is always the fallback.
 */
export function NearYou() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [phase, setPhase] = useState<GeoPhase>("locating");

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setPhase("unsupported");
      return;
    }
    setPhase("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setPhase("ready");
        track("welcome_nearyou_located", { category: "weather" });
      },
      (err) => {
        setPhase(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const localQuery = useQuery<LocalWeatherResponse>({
    queryKey: ["local-weather", coords?.lat, coords?.lon],
    queryFn: async () => {
      const res = await fetch(
        `/api/local-weather?latitude=${coords!.lat}&longitude=${coords!.lon}`,
      );
      if (!res.ok) throw new Error("failed to load local weather");
      return res.json();
    },
    enabled: phase === "ready" && !!coords,
    staleTime: 10 * 60 * 1000,
  });

  const regionsQuery = useQuery<RegionsLite>({
    queryKey: ["regions"],
    queryFn: async () => {
      const res = await fetch("/api/regions");
      if (!res.ok) throw new Error("failed to load regions");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: phase === "ready",
  });

  // Nothing useful to show + no path to recover -> stay out of the way.
  if (phase === "unsupported") return null;

  if (phase === "denied" || phase === "error") {
    return (
      <section className="px-4 pt-4 md:px-6">
        <div className={`${PANEL} flex items-center justify-between gap-3 px-4 py-3`}>
          <p className="text-[13px] leading-snug text-slate-500">
            {phase === "denied"
              ? "location is off, so we can't show your local conditions"
              : "we couldn't get your location just now"}
          </p>
          <button
            type="button"
            onClick={requestLocation}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-50"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            try again
          </button>
        </div>
      </section>
    );
  }

  const local = localQuery.data?.current ?? null;
  const nearest = localQuery.data?.nearestRegion ?? null;
  const nearestTemp = nearest
    ? regionsQuery.data?.regions.find((r) => r.id === nearest.id)?.headline?.feelsLikeC ?? null
    : null;
  const Icon = local ? weatherIcon(local.weatherCode, local.isDay) : Cloud;
  const loading = phase === "locating" || (phase === "ready" && localQuery.isLoading);

  return (
    <section className="px-4 pt-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={PANEL}
      >
        {/* LOCAL CONDITIONS ───────────────────────────── */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700/80">
            <MapPin className="h-3.5 w-3.5" />
            where you are now
          </div>

          {loading ? (
            <div className="mt-3 flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-full bg-sky-100" />
              <div className="space-y-2">
                <div className="h-7 w-24 animate-pulse rounded bg-sky-100" />
                <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ) : local ? (
            <div className="mt-3 flex items-center gap-4">
              <Icon className="h-12 w-12 shrink-0 text-sky-500" strokeWidth={1.5} />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold leading-none tabular-nums text-slate-900">
                    {local.feelsLikeC}&deg;
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-600">
                    feelzlike
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-snug text-slate-600">
                  {local.description.toLowerCase()} &middot; actually {local.tempC}&deg;
                  {local.windKph > 0 ? (
                    <>
                      {" "}
                      &middot; wind {local.windKph} km/h {local.windDirection.toLowerCase()}
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[13px] leading-snug text-slate-500">
              local conditions are unavailable right now
            </p>
          )}
        </div>

        {/* NEAREST REGION ─────────────────────────────── */}
        {nearest ? (
          <Link
            href={nearest.href}
            onClick={() =>
              track("welcome_nearest_region_click", {
                category: "navigation",
                data: { region: nearest.id },
              })
            }
            className="group flex items-center justify-between gap-3 border-t border-sky-100 px-5 py-3.5 transition-colors hover:bg-sky-50/60"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Mountain className="h-5 w-5 shrink-0 text-sky-600" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  nearest mountain region
                </p>
                <p className="truncate text-[15px] font-semibold text-slate-900">
                  {nearest.name.toLowerCase()}
                </p>
                <p className="text-[12px] tabular-nums text-slate-500">
                  {nearest.distanceKm.toLocaleString()} km away
                  {typeof nearestTemp === "number" ? (
                    <> &middot; feelzlike {nearestTemp}&deg;</>
                  ) : null}
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-sky-700 group-hover:text-sky-900">
              see
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : phase === "ready" && !loading ? (
          <div className="border-t border-sky-100 px-5 py-3 text-[12px] text-slate-400">
            pick a region below to explore the mountains
          </div>
        ) : null}
      </motion.div>
    </section>
  );
}
