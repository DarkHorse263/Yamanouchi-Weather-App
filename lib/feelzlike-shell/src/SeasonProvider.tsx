import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Season } from "./types";

interface SeasonContextValue {
  season: Season;
  setSeason: (s: Season) => void;
  isWinter: boolean;
  isGreen: boolean;
}

const SeasonContext = createContext<SeasonContextValue | undefined>(undefined);

function detectSeason(hemisphere: "north" | "south"): Season {
  const month = new Date().getMonth() + 1;
  if (hemisphere === "south") {
    // AU snow season ~ June–September
    return month >= 6 && month <= 9 ? "winter" : "green";
  }
  // Northern hemisphere snow season ~ December–March
  return month >= 12 || month <= 3 ? "winter" : "green";
}

export function SeasonProvider({
  regionId,
  hemisphere = "north",
  children,
}: {
  regionId: string;
  hemisphere?: "north" | "south";
  children: ReactNode;
}) {
  const storageKey = `feelzlike:${regionId}:season`;
  const [season, setSeasonState] = useState<Season>(() => detectSeason(hemisphere));

  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as Season | null;
    if (saved === "winter" || saved === "green") setSeasonState(saved);
  }, [storageKey]);

  const setSeason = (s: Season) => {
    setSeasonState(s);
    localStorage.setItem(storageKey, s);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-season", season);
  }, [season]);

  return (
    <SeasonContext.Provider
      value={{ season, setSeason, isWinter: season === "winter", isGreen: season === "green" }}
    >
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason(): SeasonContextValue {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error("useSeason must be used within a SeasonProvider");
  return ctx;
}

/**
 * Non-throwing variant for callers (like AppShell) that may render outside
 * a SeasonProvider - regions opt in via `region.seasons`. This MUST be used
 * instead of a conditional `region.seasons ? useSeason() : null` call,
 * which violates the Rules of Hooks and silently breaks state updates.
 */
export function useOptionalSeason(): SeasonContextValue | null {
  return useContext(SeasonContext) ?? null;
}
