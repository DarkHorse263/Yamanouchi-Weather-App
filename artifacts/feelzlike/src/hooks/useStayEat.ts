import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  getGetTownEatQueryKey,
  getGetTownEatsQueryKey,
  getGetTownStayQueryKey,
  getGetTownStaysQueryKey,
} from "@workspace/api-client-react";

import {
  getAllEats,
  getAllStays,
  getEatsByRegion,
  getEatsByTown,
  getRegionOfTown,
  getStaysByRegion,
  getStaysByTown,
} from "@/data";
import type { Eat, RegionSlug, Stay, TownSlug } from "@/types/stayEat";

const STATIC_QUERY_OPTIONS = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
} as const;

export function useStays(town: TownSlug): UseQueryResult<Stay[], Error> {
  const region = getRegionOfTown(town);
  return useQuery({
    queryKey: getGetTownStaysQueryKey(region, town),
    queryFn: () => getStaysByTown(town),
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useEats(town: TownSlug): UseQueryResult<Eat[], Error> {
  const region = getRegionOfTown(town);
  return useQuery({
    queryKey: getGetTownEatsQueryKey(region, town),
    queryFn: () => getEatsByTown(town),
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useStay(town: TownSlug, stayId: string): UseQueryResult<Stay, Error> {
  const region = getRegionOfTown(town);
  return useQuery({
    queryKey: getGetTownStayQueryKey(region, town, stayId),
    queryFn: () => {
      const found = getStaysByTown(town).find((s) => s.id === stayId);
      if (!found) {
        throw new Error(
          `Stay '${stayId}' not found in town '${town}' (region '${region}')`,
        );
      }
      return found;
    },
    ...STATIC_QUERY_OPTIONS,
    enabled: stayId.length > 0,
    // Static-handler errors are deterministic (id either matches or doesn't);
    // disable retries so 'not found' surfaces immediately instead of waiting
    // for TanStack's default 3 backoff cycles. Drop this when the queryFn
    // override is replaced by the generated useGetTownStay (network errors
    // there should retry).
    retry: false,
  });
}

export function useEat(town: TownSlug, eatId: string): UseQueryResult<Eat, Error> {
  const region = getRegionOfTown(town);
  return useQuery({
    queryKey: getGetTownEatQueryKey(region, town, eatId),
    queryFn: () => {
      const found = getEatsByTown(town).find((e) => e.id === eatId);
      if (!found) {
        throw new Error(
          `Eat '${eatId}' not found in town '${town}' (region '${region}')`,
        );
      }
      return found;
    },
    ...STATIC_QUERY_OPTIONS,
    enabled: eatId.length > 0,
    retry: false,
  });
}

export function useStaysByRegion(region: RegionSlug): UseQueryResult<Stay[], Error> {
  return useQuery({
    queryKey: ["stays", "region", region] as const,
    queryFn: () => getStaysByRegion(region),
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useEatsByRegion(region: RegionSlug): UseQueryResult<Eat[], Error> {
  return useQuery({
    queryKey: ["eats", "region", region] as const,
    queryFn: () => getEatsByRegion(region),
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useAllStays(): UseQueryResult<Stay[], Error> {
  return useQuery({
    queryKey: ["stays", "all"] as const,
    queryFn: () => getAllStays(),
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useAllEats(): UseQueryResult<Eat[], Error> {
  return useQuery({
    queryKey: ["eats", "all"] as const,
    queryFn: () => getAllEats(),
    ...STATIC_QUERY_OPTIONS,
  });
}
