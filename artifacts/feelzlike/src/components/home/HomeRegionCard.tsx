import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Map } from "lucide-react";
import { track } from "@/lib/analytics";
import { useUserPrefs, useUnits } from "@/components/auth/UserPrefsProvider";
import { useAuthAccount } from "@/components/auth/SignUpProvider";
import { REGION_BY_ID } from "@/regions";

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

export function HomeRegionCard() {
  const { isAuthenticated } = useAuthAccount();
  const { homeRegionId } = useUserPrefs();
  const u = useUnits();

  const regionsQuery = useQuery<RegionsLite>({
    queryKey: ["regions"],
    queryFn: async () => {
      const res = await fetch("/api/regions");
      if (!res.ok) throw new Error("failed to load regions");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!isAuthenticated || !homeRegionId) return null;

  const region = REGION_BY_ID[homeRegionId];
  if (!region) return null;

  const stats = regionsQuery.data?.regions.find((r) => r.id === homeRegionId)?.headline;
  const isLoading = regionsQuery.isLoading;

  return (
    <div className="mx-4 mb-6 overflow-hidden rounded-2xl bg-white text-[#0055FF] shadow-xl md:mx-6">
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <Map className="h-3.5 w-3.5" />
          your home region
        </div>
        <p className="mt-1 text-[18px] font-semibold leading-tight text-slate-900 md:text-[20px]">
          {region.name.toLowerCase()}
        </p>

        {isLoading ? (
          <div className="mt-3 flex items-center gap-4">
            <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <Link
            href={`/${region.id}/`}
            onClick={() => track("welcome_home_region_click", { category: "navigation" })}
            className="group mt-3 flex items-center gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold leading-none tabular-nums text-[#0055FF]">
                  {stats?.feelsLikeC != null ? u.temp(stats.feelsLikeC) : "--"}&deg;
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  feelzlike
                </span>
              </div>
              <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#0055FF]">
                see full forecast &amp; radar
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
