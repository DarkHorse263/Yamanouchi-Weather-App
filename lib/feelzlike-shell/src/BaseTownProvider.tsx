import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BaseTown, RegionConfig } from "./types";

interface BaseTownContextValue {
  /** Available base towns for the active region (may be empty) */
  towns: BaseTown[];
  /** Currently selected town, or undefined if region has no base towns */
  town: BaseTown | undefined;
  /** Select a town by id; no-op if id is unknown */
  setTownId: (id: string) => void;
}

const BaseTownContext = createContext<BaseTownContextValue | undefined>(undefined);

const storageKey = (regionId: string) => `feelzlike.baseTown.${regionId}`;

export function BaseTownProvider({
  region,
  children,
}: {
  region: RegionConfig;
  children: ReactNode;
}) {
  const towns = region.baseTowns ?? [];

  const [townId, setTownIdState] = useState<string | undefined>(() => {
    if (towns.length === 0) return undefined;
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(storageKey(region.id));
      if (stored && towns.some((t) => t.id === stored)) return stored;
    }
    return towns[0].id;
  });

  // When the region changes (SPA nav between regions), restore the previously
  // selected town for the new region from localStorage, falling back to its
  // default. We can't rely on the useState initializer here because the
  // provider instance persists across region changes.
  useEffect(() => {
    if (towns.length === 0) {
      setTownIdState(undefined);
      return;
    }
    let next: string | undefined;
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(storageKey(region.id));
      if (stored && towns.some((t) => t.id === stored)) next = stored;
    }
    if (!next) next = towns[0].id;
    setTownIdState(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region.id]);

  const setTownId = (id: string) => {
    if (!towns.some((t) => t.id === id)) return;
    setTownIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(region.id), id);
    }
  };

  const town = useMemo(
    () => towns.find((t) => t.id === townId),
    [towns, townId],
  );

  const value = useMemo<BaseTownContextValue>(
    () => ({ towns, town, setTownId }),
    [towns, town],
  );

  return <BaseTownContext.Provider value={value}>{children}</BaseTownContext.Provider>;
}

export function useBaseTown(): BaseTownContextValue {
  const ctx = useContext(BaseTownContext);
  if (!ctx) {
    // Permissive fallback so pages can call this safely even when a region
    // hasn't declared base towns yet.
    return { towns: [], town: undefined, setTownId: () => {} };
  }
  return ctx;
}
