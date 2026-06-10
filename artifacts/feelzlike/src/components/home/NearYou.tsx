import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  RotateCw,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
import { track } from "@/lib/analytics";
import { readLastTown } from "@/lib/favouriteRegion";

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
  todayMaxC: number | null;
  todayMinC: number | null;
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
  place: { latitude: number; longitude: number; name: string | null };
  current: LocalCurrent | null;
  nearestRegion: NearestRegion | null;
  generatedAt: string;
}

// Slice of GET /api/regions we read to (a) enrich a region row with its current
// "feelzlike" temp and (b) pick a fallback region when we don't have the
// visitor's coordinates. Shares the ["regions"] query cache with the country
// picker so this never costs an extra request.
interface RegionLite {
  id: string;
  name: string;
  href: string;
  status: "live" | "soon";
  headline: { feelsLikeC: number; tempC: number } | null;
}
interface RegionsLite {
  regions: RegionLite[];
}

// A region to surface as the tap-through. distanceKm is only set when we know
// the visitor's location (the true "nearest" case); otherwise it's a softer
// "suggested region" fallback so the row still works when location is off.
interface SuggestedRegion {
  id: string;
  name: string;
  href: string;
  feelsLikeC: number | null;
  distanceKm: number | null;
}

type GeoPhase =
  | "checking" // working out the current permission state
  | "prompt" // permission not yet granted -> show a one-tap "use my location"
  | "locating" // actively resolving the position
  | "ready" // have coords -> show local conditions
  | "denied" // permission denied
  | "unavailable" // a transient failure (timeout / position unavailable)
  | "unsupported"; // browser has no geolocation at all

// Remembered grant, used only when the browser lacks the Permissions API (older
// Safari). With Permissions API present we trust the live permission state.
const CONSENT_KEY = "feelzlike.geoConsent";
// Last region we suggested, so a denied/offline returning visitor still gets a
// sensible tap-through before any picker interaction.
const LAST_NEAREST_KEY = "feelzlike.lastNearest";

function readConsentGranted(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}
function writeConsentGranted(): void {
  try {
    localStorage.setItem(CONSENT_KEY, "granted");
  } catch {
    /* private mode / storage disabled - non-fatal */
  }
}
function readLastNearest(): NearestRegion | null {
  try {
    const raw = localStorage.getItem(LAST_NEAREST_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.id === "string" && typeof p?.name === "string" && typeof p?.href === "string") {
      return p as NearestRegion;
    }
    return null;
  } catch {
    return null;
  }
}
function writeLastNearest(n: NearestRegion): void {
  try {
    localStorage.setItem(LAST_NEAREST_KEY, JSON.stringify(n));
  } catch {
    /* non-fatal */
  }
}

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

// Past this real distance the "nearest mountain region" framing reads oddly (a
// visitor in Europe is ~16,000 km from the closest live region). Beyond it we
// keep the honest distance but soften the copy so we never imply it's close.
const FAR_REGION_KM = 1000;

/**
 * Location-first landing block. It leads with the visitor's own current
 * conditions (temperature, feels-like, conditions, today's range, wind) under a
 * friendly place label, then offers the nearest live mountain region as a
 * one-tap shortcut, then the "choose a region" picker continues below.
 *
 * Permission is handled without nagging: returning visitors are never
 * auto-prompted. When permission is already granted we resolve silently; when
 * it isn't, we show a single "use my location" tap instead of the weather card.
 * Every state still surfaces a region suggestion (last-known or default) so the
 * path into the mountains is always reachable.
 */
export function NearYou() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [phase, setPhase] = useState<GeoPhase>("checking");
  const [lastNearest, setLastNearest] = useState<NearestRegion | null>(null);

  // Mirror of `phase` for the Permissions API onchange handler, so a grant that
  // arrives right after the user's own tap doesn't re-trigger a request.
  const phaseRef = useRef<GeoPhase>("checking");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    setLastNearest(readLastNearest());
  }, []);

  // Funnel instrumentation: the one-tap entry impression is the denominator for
  // measuring tap-through grant rate (welcome_nearyou_located with
  // initiated:"tap") and the page-level grant rate (located vs page_view).
  // Fire once per mount even if the phase briefly revisits "prompt".
  const promptTrackedRef = useRef(false);
  useEffect(() => {
    if (phase === "prompt" && !promptTrackedRef.current) {
      promptTrackedRef.current = true;
      track("welcome_nearyou_prompt", { category: "weather" });
    }
  }, [phase]);

  const requestLocation = useCallback((userInitiated: boolean) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setPhase("unsupported");
      return;
    }
    setPhase("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setPhase("ready");
        writeConsentGranted();
        track("welcome_nearyou_located", {
          category: "weather",
          data: { initiated: userInitiated ? "tap" : "auto" },
        });
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        setPhase(denied ? "denied" : "unavailable");
        track(denied ? "welcome_nearyou_denied" : "welcome_nearyou_unavailable", {
          category: "weather",
          level: "warning",
          data: { initiated: userInitiated ? "tap" : "auto" },
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // Decide the opening behaviour from the *current* permission state so we never
  // re-prompt a returning visitor. Granted -> resolve silently; prompt -> wait
  // for an explicit tap; denied -> offer the tap but no auto-request.
  useEffect(() => {
    let cancelled = false;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setPhase("unsupported");
      return;
    }
    const perms = (navigator as Navigator & { permissions?: Permissions }).permissions;
    if (perms?.query) {
      perms
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          if (cancelled) return;
          const apply = (state: PermissionState) => {
            // Skip if a tap is already resolving/resolved - avoids a flicker and
            // a duplicate located event when onchange echoes the grant.
            const busy = phaseRef.current === "locating" || phaseRef.current === "ready";
            if (state === "granted") {
              if (!busy) requestLocation(false);
            } else if (state === "denied") {
              setPhase("denied");
            } else if (!busy) {
              setPhase("prompt");
            }
          };
          apply(status.state);
          // A returning visitor who already blocked us never makes a fresh
          // request (so no error-callback event fires); record the impression
          // once here so the funnel still sees them as a blocked outcome.
          if (status.state === "denied") {
            track("welcome_nearyou_denied", {
              category: "weather",
              data: { initiated: "check" },
            });
          }
          status.onchange = () => apply(status.state);
        })
        .catch(() => {
          if (cancelled) return;
          if (readConsentGranted()) requestLocation(false);
          else setPhase("prompt");
        });
    } else if (readConsentGranted()) {
      // No Permissions API: fall back to our own remembered grant.
      requestLocation(false);
    } else {
      setPhase("prompt");
    }
    return () => {
      cancelled = true;
    };
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

  // Always enabled (not gated on phase): the fallback region row needs this even
  // when location is denied/unavailable.
  const regionsQuery = useQuery<RegionsLite>({
    queryKey: ["regions"],
    queryFn: async () => {
      const res = await fetch("/api/regions");
      if (!res.ok) throw new Error("failed to load regions");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Persist the live nearest region so a future denied/offline visit can still
  // suggest it.
  const liveNearest = localQuery.data?.nearestRegion ?? null;
  useEffect(() => {
    if (liveNearest) {
      writeLastNearest(liveNearest);
      setLastNearest(liveNearest);
    }
  }, [liveNearest]);

  const regions = regionsQuery.data?.regions;
  const tempFor = useCallback(
    (id: string) => regions?.find((r) => r.id === id)?.headline?.feelsLikeC ?? null,
    [regions],
  );

  // The region to surface. Prefer the true nearest (real distance); else fall
  // back to last-known, then the user's last town, then the first live region.
  const suggested = useMemo<SuggestedRegion | null>(() => {
    if (liveNearest) {
      return {
        id: liveNearest.id,
        name: liveNearest.name,
        href: liveNearest.href,
        feelsLikeC: tempFor(liveNearest.id),
        distanceKm: liveNearest.distanceKm,
      };
    }
    if (lastNearest) {
      return {
        id: lastNearest.id,
        name: lastNearest.name,
        href: lastNearest.href,
        feelsLikeC: tempFor(lastNearest.id),
        distanceKm: null,
      };
    }
    const list = regions ?? [];
    const lt = readLastTown();
    const fromTown = lt ? list.find((r) => r.id === lt.regionId) : undefined;
    const fallback = fromTown ?? list.find((r) => r.status === "live");
    if (fallback) {
      return {
        id: fallback.id,
        name: fallback.name,
        href: fallback.href,
        feelsLikeC: fallback.headline?.feelsLikeC ?? null,
        distanceKm: null,
      };
    }
    return null;
  }, [liveNearest, lastNearest, regions, tempFor]);

  // Only meaningful for the true-nearest case (real distance known). When the
  // closest live region is beyond the threshold we drop the "nearest" framing.
  const isFar = suggested?.distanceKm != null && suggested.distanceKm >= FAR_REGION_KM;

  const local = localQuery.data?.current ?? null;
  const placeName = localQuery.data?.place?.name ?? null;
  const Icon = local ? weatherIcon(local.weatherCode, local.isDay) : Cloud;
  const skeleton =
    phase === "checking" ||
    phase === "locating" ||
    (phase === "ready" && localQuery.isLoading);
  // A tap can plausibly succeed for "prompt" (first ask) and "unavailable"
  // (transient failure). "denied" is intentionally excluded: re-requesting
  // while hard-blocked re-fails silently, so it gets re-enable guidance instead.
  const showTap = phase === "prompt" || phase === "unavailable";

  const todayRange: string[] = [];
  if (local?.todayMaxC != null) todayRange.push(`high ${local.todayMaxC}\u00b0`);
  if (local?.todayMinC != null) todayRange.push(`low ${local.todayMinC}\u00b0`);

  return (
    <section className="px-4 pt-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={PANEL}
      >
        {/* TOP: local conditions / loading / one-tap prompt ─────────── */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700/80">
            <MapPin className="h-3.5 w-3.5" />
            {phase === "ready" && placeName ? placeName.toLowerCase() : "where you are now"}
          </div>

          {skeleton ? (
            <div className="mt-3 flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-full bg-sky-100" />
              <div className="space-y-2">
                <div className="h-7 w-24 animate-pulse rounded bg-sky-100" />
                <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ) : phase === "ready" && local ? (
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
                {todayRange.length > 0 ? (
                  <p className="mt-0.5 text-[12px] tabular-nums text-slate-500">
                    today &middot; {todayRange.join(" \u00b7 ")}
                  </p>
                ) : null}
              </div>
            </div>
          ) : phase === "ready" ? (
            <p className="mt-3 text-[13px] leading-snug text-slate-500">
              local conditions are unavailable right now
            </p>
          ) : showTap ? (
            <div className="mt-3">
              <p className="text-[13px] leading-snug text-slate-600">
                {phase === "unavailable"
                  ? "we couldn't get your location just now"
                  : "see live conditions right where you are"}
              </p>
              <button
                type="button"
                onClick={() => requestLocation(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-50"
              >
                <LocateFixed className="h-3.5 w-3.5" />
                {phase === "unavailable" ? "try again" : "show my local conditions"}
              </button>
            </div>
          ) : phase === "denied" ? (
            // Hard-blocked: a retry would re-fail silently, so guide the visitor
            // through re-enabling and offer a reload (which re-checks permission)
            // rather than a button that quietly does nothing.
            <div className="mt-3">
              <p className="text-[13px] leading-snug text-slate-600">
                location is blocked for this site, so we can't show your local
                conditions
              </p>
              <p className="mt-1.5 text-[12px] leading-snug text-slate-500">
                tap the location icon in your browser's address bar, choose allow,
                then reload
              </p>
              <button
                type="button"
                onClick={() => {
                  track("welcome_nearyou_reload", { category: "weather" });
                  window.location.reload();
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-50"
              >
                <RotateCw className="h-3.5 w-3.5" />
                reload
              </button>
              <span className="ml-2 text-[12px] text-slate-400">
                or explore the mountains below
              </span>
            </div>
          ) : (
            // unsupported: no geolocation at all - no point offering a tap
            <p className="mt-3 text-[13px] leading-snug text-slate-500">
              this device can't share its location, but you can still explore the
              mountains below
            </p>
          )}
        </div>

        {/* REGION SUGGESTION (survives every state) ──────────────────── */}
        {suggested ? (
          <Link
            href={suggested.href}
            onClick={() =>
              track("welcome_nearest_region_click", {
                category: "navigation",
                data: {
                  region: suggested.id,
                  kind: suggested.distanceKm != null ? (isFar ? "far" : "nearest") : "suggested",
                },
              })
            }
            className="group flex items-center justify-between gap-3 border-t border-sky-100 px-5 py-3.5 transition-colors hover:bg-sky-50/60"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Mountain className="h-5 w-5 shrink-0 text-sky-600" strokeWidth={1.75} />
              <div className="min-w-0">
                {isFar ? (
                  <p className="mb-1 text-[12px] leading-snug text-slate-500">
                    the mountains are a long way from you, but here's where we cover
                  </p>
                ) : null}
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {suggested.distanceKm == null
                    ? "suggested region"
                    : isFar
                      ? "mountain region"
                      : "nearest mountain region"}
                </p>
                <p className="truncate text-[15px] font-semibold text-slate-900">
                  {suggested.name.toLowerCase()}
                </p>
                <p className="text-[12px] tabular-nums text-slate-500">
                  {suggested.distanceKm != null ? (
                    <>{suggested.distanceKm.toLocaleString()} km away</>
                  ) : null}
                  {suggested.distanceKm != null && suggested.feelsLikeC != null ? " \u00b7 " : null}
                  {suggested.feelsLikeC != null ? (
                    <>feelzlike {suggested.feelsLikeC}&deg;</>
                  ) : suggested.distanceKm == null ? (
                    <>tap to explore the mountains</>
                  ) : null}
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-sky-700 group-hover:text-sky-900">
              see
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : null}
      </motion.div>
    </section>
  );
}
