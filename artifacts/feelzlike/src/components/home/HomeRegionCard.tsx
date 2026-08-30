import { useQuery } from "@tanstack/react-query";
import { track } from "@/lib/analytics";
import { useUserPrefs, useUnits } from "@/components/auth/UserPrefsProvider";
import { useAuthAccount } from "@/components/auth/AuthAccountContext";
import { REGION_BY_ID } from "@/regions";
import { HomeRegionCardView } from "./HomeRegionCardView";

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

  const region = homeRegionId ? (REGION_BY_ID[homeRegionId] ?? null) : null;

  const stats = regionsQuery.data?.regions.find((r) => r.id === homeRegionId)?.headline;
  return (
    <HomeRegionCardView
      isAuthenticated={isAuthenticated}
      region={region}
      feelsLike={stats?.feelsLikeC != null ? String(u.temp(stats.feelsLikeC)) : null}
      isLoading={regionsQuery.isLoading}
      onNavigate={() => track("welcome_home_region_click", { category: "navigation" })}
    />
  );
}
