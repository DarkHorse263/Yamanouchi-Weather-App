import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  ArrowUpRight,
  BellRing,
  CloudSun,
  Crosshair,
  GitCompareArrows,
  Loader2,
  Map,
  MountainSnow,
} from "lucide-react";
import { PlaceSearch } from "./PlaceSearch";
import { useAuthAccount } from "@/components/auth/SignUpProvider";
import { useUnits } from "@/components/auth/UserPrefsProvider";
import { track } from "@/lib/analytics";

interface RegionHeadline {
  feelsLikeC: number;
  tempC: number;
}

interface RegionSummary {
  id: string;
  name: string;
  href: string;
  country?: string;
  countryCode?: string;
  status: "live" | "soon";
  headline: RegionHeadline | null;
}

interface RegionsResponse {
  regions: RegionSummary[];
}

interface NearestRegion {
  id: string;
  name: string;
  href: string;
}

interface LocalWeatherResponse {
  nearestRegion: NearestRegion | null;
}

const LAST_NEAREST_KEY = "feelzlike.lastNearest";

function readLastNearest(): NearestRegion | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(LAST_NEAREST_KEY) ?? "null");
    return typeof parsed?.id === "string" &&
      typeof parsed?.name === "string" &&
      typeof parsed?.href === "string"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function HomeAction({
  href,
  icon: Icon,
  title,
  onClick,
}: {
  href?: string;
  icon: typeof Crosshair;
  title: string;
  onClick?: () => void;
}) {
  const classes =
    "home-action group flex min-h-[128px] flex-col rounded-2xl border border-white/35 bg-[#0044CC]/35 p-4 text-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80";
  const contents = (
    <>
      <span className="flex items-center justify-between">
        <Icon className="h-5 w-5" aria-hidden />
        <ArrowUpRight
          className="h-4 w-4 text-white transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
      <span className="flex flex-1 items-center justify-center px-2">
        <strong className="text-[20px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[22px]">
          {title}
        </strong>
      </span>
    </>
  );

  return href ? (
    <Link href={href} onClick={onClick} className={classes}>
      {contents}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={classes}>
      {contents}
    </button>
  );
}

export function HomeFourWay() {
  const [, navigate] = useLocation();
  const u = useUnits();
  const { isAuthenticated, promptSignUp } = useAuthAccount();
  const [nearestId, setNearestId] = useState<string | null>(() => readLastNearest()?.id ?? null);
  const [checkingLocation, setCheckingLocation] = useState(true);

  const regionsQuery = useQuery<RegionsResponse>({
    queryKey: ["regions"],
    queryFn: async () => {
      const response = await fetch("/api/regions");
      if (!response.ok) throw new Error("failed to load regions");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    let cancelled = false;

    async function resolveNearest() {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setCheckingLocation(false);
        return;
      }

      const permissions = (navigator as Navigator & { permissions?: Permissions }).permissions;
      if (!permissions?.query) {
        setCheckingLocation(false);
        return;
      }

      try {
        const status = await permissions.query({ name: "geolocation" as PermissionName });
        if (cancelled || status.state !== "granted") {
          setCheckingLocation(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const params = new URLSearchParams({
                lat: String(position.coords.latitude),
                lon: String(position.coords.longitude),
              });
              const response = await fetch(`/api/local-weather?${params}`);
              if (!response.ok) throw new Error("failed to resolve nearest region");
              const payload = (await response.json()) as LocalWeatherResponse;
              if (!cancelled && payload.nearestRegion) {
                setNearestId(payload.nearestRegion.id);
              }
            } catch {
              // The snapshot is optional. If location weather is temporarily
              // unavailable, keep the honest tap-to-locate fallback below.
            } finally {
              if (!cancelled) setCheckingLocation(false);
            }
          },
          () => {
            if (!cancelled) setCheckingLocation(false);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
        );
      } catch {
        if (!cancelled) setCheckingLocation(false);
      }
    }

    void resolveNearest();
    return () => {
      cancelled = true;
    };
  }, []);

  const nearest = useMemo(
    () => regionsQuery.data?.regions.find((region) => region.id === nearestId) ?? null,
    [nearestId, regionsQuery.data?.regions],
  );

  const openSnowAlerts = () => {
    track("home_snow_alert_action_click", { category: isAuthenticated ? "navigation" : "auth" });
    if (isAuthenticated) {
      navigate("/account");
    } else {
      promptSignUp({ feature: "home_snow_alert" });
    }
  };

  return (
    <main className="px-4 pb-8 md:px-6 md:pb-10">
      <section className="grid grid-cols-2 gap-3" aria-label="quick weather actions">
        <HomeAction
          href="/near-you"
          icon={Crosshair}
          title="current location"
          onClick={() => track("welcome_current_location_click", { category: "navigation" })}
        />
        <HomeAction
          href="/countries"
          icon={Map}
          title="choose a region"
          onClick={() => track("welcome_choose_region_click", { category: "navigation" })}
        />
      </section>

      <section className="relative z-30 py-4" aria-label="search places">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-white">
          search a town · mountain · region
        </p>
        <div className="[&>div>div:first-child]:min-h-[56px] [&>div>div:first-child]:rounded-2xl [&>div>div:first-child]:border-0 [&>div>div:first-child]:px-4 [&_input]:text-[15px] [&_input]:font-semibold">
          <PlaceSearch placeholder="search town or mountain" source="home_four_way" />
        </div>
      </section>

      <section
        className="mb-3 overflow-hidden rounded-2xl bg-white text-slate-900 shadow-xl"
        aria-label="nearest mountain snapshot"
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-700">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-snow-accent">
              <span className="absolute inset-[-4px] animate-ping rounded-full border border-snow-accent" />
            </span>
            nearest mountain snapshot
          </div>
          <span className="text-xs font-semibold text-slate-700">current weather</span>
        </div>

        {checkingLocation || regionsQuery.isLoading ? (
          <div className="flex min-h-[105px] items-center justify-center gap-2 px-4 text-sm font-semibold text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin text-[#0055FF]" aria-hidden />
            finding your nearest mountain
          </div>
        ) : nearest ? (
          <Link
            href={nearest.href}
            onClick={() => track("welcome_nearest_snapshot_click", { category: "navigation" })}
            className="group block"
          >
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 pb-4">
              <div className="min-w-0 text-center">
                <h2 className="truncate text-[22px] font-bold leading-none text-slate-900">
                  {nearest.name.toLowerCase()}
                </h2>
                <p className="mt-1.5 text-xs font-semibold text-slate-700">
                  nearest known mountain region · view conditions
                </p>
              </div>
              {nearest.headline ? (
                <div className="flex shrink-0 items-center gap-2 text-[#0055FF]">
                  <CloudSun className="h-7 w-7" aria-hidden />
                  <div className="text-center">
                    <span className="block text-[30px] font-bold leading-none tabular-nums">
                      {u.temp(nearest.headline.tempC)}°
                    </span>
                    <span className="mt-1 block text-xs font-bold leading-none text-slate-700">
                      feelzlike {u.temp(nearest.headline.feelsLikeC)}°
                    </span>
                  </div>
                </div>
              ) : (
                <MountainSnow className="h-8 w-8 shrink-0 text-[#0055FF]" aria-hidden />
              )}
            </div>
          </Link>
        ) : (
          <Link
            href="/near-you"
            className="group flex min-h-[105px] items-center justify-between gap-4 px-4 pb-4"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900">find your nearest mountain</h2>
              <p className="mt-1 text-xs font-semibold text-slate-700">
                use your location to see the closest region
              </p>
            </div>
            <Crosshair className="h-7 w-7 shrink-0 text-[#0055FF]" aria-hidden />
          </Link>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3" aria-label="browse and compare">
        <HomeAction
          icon={BellRing}
          title="snow alerts + premium"
          onClick={openSnowAlerts}
        />
        <HomeAction
          href="/compare"
          icon={GitCompareArrows}
          title="compare mountains"
          onClick={() => track("welcome_plan_link_click", { category: "navigation" })}
        />
      </section>
    </main>
  );
}