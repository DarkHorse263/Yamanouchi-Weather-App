import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  getAllEats,
  getAllStays,
  getEatsByRegion,
  getEatsByTown,
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
  return useQuery({
    queryKey: ["stays", town] as const,
    queryFn: () => getStaysByTown(town),
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useEats(town: TownSlug): UseQueryResult<Eat[], Error> {
  return useQuery({
    queryKey: ["eats", town] as const,
    queryFn: () => getEatsByTown(town),
    ...STATIC_QUERY_OPTIONS,
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
