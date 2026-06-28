import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  LocateFixed,
  MapPin,
  Mountain,
  Radar as RadarIcon,
  RotateCw,
} from "lucide-react";
import { RadarMap, type RadarRegionKey } from "@/regions/snowy-mountains/components/RadarMap";
import { nearestBomRadar } from "@/lib/bom-radar";
import { useTownWeather, type TownWeatherCurrent } from "@/lib/town-weather";
import {
  StaleNotice,
  WeatherHero,
  WeatherConditions,
  WeatherToday,
  WeatherHourly,
  WeatherOutlook,
} from "@/components/weather/WeatherSections";
import { HomeFooter } from "@/components/home/HomeFooter";
import { PageMeta } from "@/lib/seo/PageMeta";
import { track } from "@/lib/analytics";
import { PlaceSearch } from "@/components/home/PlaceSearch";
import { precipSummary } from "@/lib/precip";

// This page renders OUTSIDE the RegionLayout (no LanguageProvider), so it is
// English-only · matching the landing page. The shared weather sections take a
// `t(en, ja)` translator prop, so we hand them this identity-on-English shim.
const t = (en: string, _ja: string) => en;

// The radar's region prop drives the Windy / official-radar tabs (AU BOM, JP
// JMA). It arrives from /api/local-weather as a plain string, so narrow it to
// the six known keys; a far-away visitor falls back to snowy-mountains while
// the interactive RainViewer layer (global) still centres on their coords.
const RADAR_REGION_KEYS: RadarRegionKey[] = [
  "snowy-mountains",
  "victorias-high-country",
  "tasmania",
  "yamanouchi",
  "nozawa-onsen",
  "iiyama",
];
function asRadarRegion(id: string | null | undefined): RadarRegionKey {
  return RADAR_REGION_KEYS.includes(id as RadarRegionKey)
    ? (id as RadarRegionKey)
    : "snowy-mountains";
}

// Snow-season guess from hemisphere + month · feeds the radar map's precip
// styling, so an approximate call is fine. S hemisphere winter is Jun-Sep,
// N hemisphere winter is Nov-Mar.
function seasonFor(lat: number): "winter" | "green" {
  const m = new Date().getMonth(); // 0 = Jan
  if (lat < 0) return m >= 5 && m <= 8 ? "winter" : "green";
  return m <= 2 || m >= 10 ? "winter" : "green";
}

type Phase =
  | "checking"
  | "prompt"
  | "locating"
  | "ready"
  | "denied"
  | "unavailable"
  | "unsupported";

// Mirror of the landing card's remembered-grant key · used only as a fallback
// on browsers without the Permissions API (older Safari).
const CONSENT_KEY = "feelzlike.geoConsent";
function readConsentGranted(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

// The /api/local-weather "current" block · a small, cheap Open-Meteo request
// that stays reliable even when the big /api/town-weather forecast request is
// being throttled. We use it to render current conditions immediately and as a
// fallback hero when the extended forecast is unavailable.
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
  precipMm: number | null;
  snowfallCm: number | null;
  observedAt: string;
  source: string;
}

interface LocalWeatherResponse {
  place: { latitude: number; longitude: number; name: string | null };
  current: LocalCurrent | null;
  nearestRegion: {
    id: string;
    name: string;
    href: string;
    distanceKm: number;
  } | null;
}

// Adapt the cheap local-current payload to the richer TownWeatherCurrent shape
// the shared WeatherHero expects. Only the fields WeatherHero reads are
// meaningful; the rest are null and never surfaced (the conditions grid, which
// needs them, only renders when the full forecast is present).
function localToHeroCurrent(c: LocalCurrent): TownWeatherCurrent {
  return {
    time: c.observedAt,
    temperature: c.tempC,
    feelsLike: c.feelsLikeC,
    humidity: null,
    isDay: c.isDay,
    precipitation: c.precipMm,
    rain: null,
    showers: null,
    snowfall: c.snowfallCm,
    weatherCode: c.weatherCode,
    weatherDescription: c.description,
    cloudCover: null,
    pressure: null,
    windSpeed: c.windKph,
    windDirection: c.windDirectionDeg,
    windDirectionCompass: c.windDirection,
    windGust: null,
    visibility: null,
    uvIndex: null,
    dewpoint: null,
    // Surface provenance only when it's a real observation, not a model source
    // ("Open-Meteo"/"OpenWeatherMap"). Lets WeatherHero show the "observed" tag.
    observationSource: c.source && c.source.startsWith("JMA AMeDAS") ? c.source : null,
  };
}

/**
 * Full local-weather page for "wherever you are". Reached by tapping the
 * landing card's current-conditions block (where permission is already
 * granted, so we resolve silently) or by a direct visit (where we show a
 * one-tap prompt). Renders the same rich forecast as the town pages plus a
 * radar centred on the visitor.
 */
export default function NearYouWeather() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [phase, setPhase] = useState<Phase>("checking");

  // Mirror of `phase` for the Permissions API onchange handler, so a grant
  // arriving right after the user's own tap doesn't re-trigger a request.
  const phaseRef = useRef<Phase>("checking");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // A searched place arrives as ?lat=&lng=&name= (set by PlaceSearch). When the
  // coordinates are valid we treat them as the location directly - no GPS, no
  // permission prompt - so this same page can render any town or city the
  // visitor looked up. Reactive to the query string so re-searching here updates
  // in place.
  const search = useSearch();
  const searchPlace = useMemo(() => {
    const p = new URLSearchParams(search);
    const latRaw = p.get("lat");
    const lngRaw = p.get("lng");
    // URLSearchParams.get() returns null when a param is absent, and both
    // Number(null) and Number("") are 0 · so without these guards a bare
    // /near-you visit would parse as {lat:0,lng:0} (a valid coordinate!) and
    // wrongly skip GPS, showing the Gulf of Guinea. Require real, non-empty
    // values before trusting them.
    if (!latRaw || !latRaw.trim() || !lngRaw || !lngRaw.trim()) return null;
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    const name = p.get("name");
    if (
      Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
      Number.isFinite(lng) && lng >= -180 && lng <= 180
    ) {
      return { lat, lng, name: name && name.trim() ? name.trim() : null };
    }
    return null;
  }, [search]);
  const hasSearchPlace = searchPlace != null;

  // Apply a searched place as the active coordinates · skips geolocation. When
  // the visitor leaves searched mode (params cleared), hand control back to the
  // GPS flow by resetting coords + phase so the permission effect re-runs fresh
  // - it would otherwise hold the stale searched coords, since phase stays ready.
  const wasSearchRef = useRef(false);
  useEffect(() => {
    if (searchPlace) {
      wasSearchRef.current = true;
      setCoords({ lat: searchPlace.lat, lon: searchPlace.lng });
      setPhase("ready");
    } else if (wasSearchRef.current) {
      wasSearchRef.current = false;
      setCoords(null);
      setPhase("checking");
    }
  }, [searchPlace]);

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
        try {
          localStorage.setItem(CONSENT_KEY, "granted");
        } catch {
          /* private mode / storage disabled - non-fatal */
        }
        track("near_you_page_located", {
          category: "weather",
          data: { initiated: userInitiated ? "tap" : "auto" },
        });
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        setPhase(denied ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // Open from the *current* permission state · granted resolves silently,
  // prompt waits for a tap, denied shows re-enable guidance. Never auto-prompts.
  // Skipped entirely when a searched place owns the coordinates.
  useEffect(() => {
    if (hasSearchPlace) return;
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
          status.onchange = () => apply(status.state);
        })
        .catch(() => {
          if (cancelled) return;
          if (readConsentGranted()) requestLocation(false);
          else setPhase("prompt");
        });
    } else if (readConsentGranted()) {
      requestLocation(false);
    } else {
      setPhase("prompt");
    }
    return () => {
      cancelled = true;
    };
  }, [requestLocation, hasSearchPlace]);

  // Full forecast for the visitor's coords · the town-weather endpoint accepts
  // arbitrary lat/lng, so this is the same rich payload the town pages render.
  const weather = useTownWeather(coords?.lat, coords?.lon);

  // Friendly place name + nearest mountain region. Reuses the landing card's
  // exact query key so a visitor arriving from the card hits a warm cache.
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

  const placeName = searchPlace?.name ?? localQuery.data?.place?.name ?? null;
  const nearest = localQuery.data?.nearestRegion ?? null;
  const localCurrent = localQuery.data?.current ?? null;
  const showTap = phase === "prompt" || phase === "unavailable";

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'DIN Pro', system-ui, sans-serif" }}
    >
      <PageMeta
        title={placeName ? placeName.toLowerCase() : "your current location"}
        description="live conditions, hourly and 7-day forecast plus radar for wherever you are right now."
        path="/near-you"
        noIndex
      />
      <main className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-sky-700 transition-colors hover:text-sky-900"
        >
          <ArrowLeft className="h-4 w-4" />
          back
        </Link>

        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700/80">
          <MapPin className="h-3.5 w-3.5" />
          {hasSearchPlace ? "conditions for" : "your current location"}
        </div>
        <h1 className="mt-1 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          {placeName ? placeName.toLowerCase() : "weather right where you are"}
        </h1>

        {/* SEARCH ANY PLACE · always available, even when GPS is denied, so the
            visitor can look up conditions for any town or city. */}
        <div className="relative z-30 mt-4 max-w-md">
          <PlaceSearch source="near_you_page" placeholder="search another town or city" />
        </div>

        {phase === "checking" || phase === "locating" ? (
          <p className="mt-8 text-muted-foreground">finding your location…</p>
        ) : showTap ? (
          <div className="mt-8 rounded-2xl border border-border bg-white p-6 max-w-md">
            <p className="text-[14px] leading-snug text-slate-600">
              {phase === "unavailable"
                ? "we couldn't get your location just now"
                : "see live conditions and radar right where you are"}
            </p>
            <button
              type="button"
              onClick={() => requestLocation(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-4 py-2 text-[13px] font-semibold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-50"
            >
              <LocateFixed className="h-4 w-4" />
              {phase === "unavailable" ? "try again" : "show my local weather"}
            </button>
          </div>
        ) : phase === "denied" ? (
          <div className="mt-8 rounded-2xl border border-border bg-white p-6 max-w-md">
            <p className="text-[14px] leading-snug text-slate-600">
              location is blocked for this site, so we can&rsquo;t show your local
              weather
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-slate-500">
              tap the location icon in your browser&rsquo;s address bar, choose
              allow, then reload
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-4 py-2 text-[13px] font-semibold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-50"
            >
              <RotateCw className="h-4 w-4" />
              reload
            </button>
            <Link
              href="/countries"
              className="mt-4 block text-[13px] font-semibold text-sky-700 hover:text-sky-900"
            >
              or explore the mountains we cover
            </Link>
          </div>
        ) : phase === "unsupported" ? (
          <div className="mt-8 rounded-2xl border border-border bg-white p-6 max-w-md">
            <p className="text-[14px] leading-snug text-slate-600">
              this device can&rsquo;t share its location
            </p>
            <Link
              href="/countries"
              className="mt-3 block text-[13px] font-semibold text-sky-700 hover:text-sky-900"
            >
              explore the mountains we cover
            </Link>
          </div>
        ) : (
          <>
            {/* Weather block · current conditions + forecast. Degrades on its
                own: the heavy town-weather request is routinely throttled
                upstream and even the cheap local-current can blip. The radar
                below only needs coords, so it always renders regardless. */}
            {(() => {
              const full = weather.data;
              const heroCurrent: TownWeatherCurrent | null = full
                ? full.current
                : localCurrent
                  ? localToHeroCurrent(localCurrent)
                  : null;

              if (heroCurrent) {
                // Precip amount comes from whatever current powers the hero · the
                // rich town-weather current when present, else the cheap
                // local-current fallback (mapped in localToHeroCurrent). Keeps the
                // line consistent with the temperature shown right above it.
                const precip = precipSummary({
                  precipMm: heroCurrent.precipitation,
                  snowfallCm: heroCurrent.snowfall,
                });
                return (
                  <>
                    {full?._stale && <StaleNotice meta={full._stale} t={t} />}
                    <WeatherHero
                      current={heroCurrent}
                      town={placeName ?? "your location"}
                      placeLabel="your location"
                    />
                    {precip ? (
                      <p className={`mt-2 text-[13px] font-medium tabular-nums ${precip.tone}`}>
                        {precip.label}
                      </p>
                    ) : null}
                    {full ? (
                      <>
                        <WeatherConditions current={full.current} t={t} />
                        <WeatherToday daily={full.daily[0]} t={t} />
                        <WeatherHourly hourly={full.hourly} t={t} />
                        <WeatherOutlook days={full.daily.slice(1, 7)} t={t} />
                      </>
                    ) : weather.isError ? (
                      <WeatherNotice
                        title="extended forecast unavailable right now"
                        body="the live weather feed is being slow, so the hourly and 7-day forecast couldn't load. current conditions and radar are up to date."
                        isFetching={weather.isFetching}
                        onRetry={() => weather.refetch()}
                      />
                    ) : (
                      // Current conditions already render from the cheap
                      // local-weather payload while the heavier hourly/7-day
                      // forecast is still in flight · no false error during the gap.
                      <p className="mt-4 text-[13px] text-muted-foreground">
                        loading the hourly and 7-day forecast…
                      </p>
                    )}
                  </>
                );
              }

              if (weather.isLoading || localQuery.isLoading) {
                return (
                  <p className="mt-8 text-muted-foreground">
                    loading current conditions…
                  </p>
                );
              }

              // Conditions failed entirely · the radar below still renders.
              return (
                <WeatherNotice
                  title="live conditions unavailable right now"
                  body="the weather feed is being slow, so we couldn't load current conditions. the live radar below is still up to date."
                  isFetching={weather.isFetching}
                  onRetry={() => {
                    weather.refetch();
                    localQuery.refetch();
                  }}
                />
              );
            })()}

            {coords && (
              <RadarSection
                lat={coords.lat}
                lng={coords.lon}
                region={asRadarRegion(nearest?.id)}
              />
            )}

            {nearest && (
              <Link
                href={nearest.href}
                onClick={() =>
                  track("near_you_page_region_click", {
                    category: "navigation",
                    data: { region: nearest.id },
                  })
                }
                className="group mt-4 flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-5 py-4 transition-colors hover:bg-sky-100/60"
              >
                <span className="inline-flex min-w-0 items-center gap-3">
                  <Mountain className="h-5 w-5 shrink-0 text-sky-600" strokeWidth={1.75} />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      nearest mountain region
                    </span>
                    <span className="block truncate text-[15px] font-semibold text-slate-800">
                      {nearest.name.toLowerCase()} &middot;{" "}
                      {Math.round(nearest.distanceKm).toLocaleString()} km away
                    </span>
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-sky-700 group-hover:text-sky-900">
                  see
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            )}
          </>
        )}
      </main>
      <HomeFooter />
    </div>
  );
}

// Inline amber notice for a partial-data state · the weather feed is slow but
// the page stays useful (the radar always renders below). Used both when only
// the extended forecast fails and when current conditions fail entirely.
// Offers a one-tap retry.
function WeatherNotice({
  title,
  body,
  isFetching,
  onRetry,
}: {
  title: string;
  body: string;
  isFetching: boolean;
  onRetry: () => void;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-5 py-4">
      <p className="text-[13px] font-semibold text-amber-900">{title}</p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-amber-800/90">{body}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isFetching}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-4 py-2 text-[13px] font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60"
      >
        <RotateCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        {isFetching ? "trying…" : "try again"}
      </button>
    </section>
  );
}

function RadarSection({
  lat,
  lng,
  region,
}: {
  lat: number;
  lng: number;
  region: RadarRegionKey;
}) {
  const season = seasonFor(lat);
  // Neutral label · "live radar" reads honestly everywhere, including spots
  // where it never snows. Season still drives the map's precip styling below.
  const headline = "live radar";
  const byline = "radar";
  // Official source is this exact coordinate's nearest covering BOM radar (or
  // null when none reaches it · outside every radar's sweep, or overseas), not
  // the nearest curated ski region's radar. Windy centres on the user. `region`
  // still drives the Interactive view's cross-region framing + country label.
  const official = nearestBomRadar(lat, lng);
  return (
    <section className="mt-4 rounded-2xl border border-border bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 flex-wrap">
        <div>
          <p className="byline text-muted-foreground/70 inline-flex items-center gap-1.5">
            <RadarIcon className="w-3 h-3" /> {byline}
          </p>
          <h2 className="font-display font-semibold text-lg text-foreground mt-1">
            {headline}
          </h2>
        </div>
        <a
          href="https://www.rainviewer.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          RainViewer <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <RadarMap
        center={{ lat, lng }}
        season={season}
        region={region}
        location={{ official, windy: { lat, lon: lng, zoom: 9 } }}
        markers={[{ id: "you", name: "you", lat, lng }]}
      />
      <p className="text-xs text-muted-foreground/70 px-5 py-3 border-t border-border">
        {official ? (
          <>
            the official tab shows the bureau of meteorology radar nearest you
            &middot; the interactive tab adds snowfall, wind, temperature and
            rain risk layers you can tap to read.
          </>
        ) : (
          <>
            no bureau of meteorology radar reaches this spot, so the interactive
            radar is on by default &middot; forecast frames show the next 30
            minutes. toggle snowfall, wind, temperature or rain risk, then tap
            any point to read its values.
          </>
        )}
      </p>
    </section>
  );
}
