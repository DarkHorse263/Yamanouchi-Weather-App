import React, { createContext, useContext, useState, useEffect } from "react";

export type Season = "winter" | "green";

interface SeasonContextType {
  season: Season;
  setSeason: (s: Season) => void;
  isWinter: boolean;
  isGreen: boolean;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

function detectSeason(): Season {
  const month = new Date().getMonth() + 1;
  return month >= 12 || month <= 3 ? "winter" : "green";
}

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [season, setSeasonState] = useState<Season>(detectSeason);

  useEffect(() => {
    const saved = localStorage.getItem("yamanouchi-season") as Season;
    if (saved === "winter" || saved === "green") {
      setSeasonState(saved);
    }
  }, []);

  const setSeason = (s: Season) => {
    setSeasonState(s);
    localStorage.setItem("yamanouchi-season", s);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-season", season);
  }, [season]);

  return (
    <SeasonContext.Provider value={{ season, setSeason, isWinter: season === "winter", isGreen: season === "green" }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const context = useContext(SeasonContext);
  if (!context) throw new Error("useSeason must be used within SeasonProvider");
  return context;
}
