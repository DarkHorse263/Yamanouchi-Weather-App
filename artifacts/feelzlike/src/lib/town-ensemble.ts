import { useQuery } from "@tanstack/react-query";

/**
 * Per-day ensemble entry for a town. Mirrors the backend
 * `EnsembleDay` shape from `getEnsembleForecast` - kept narrow here so we
 * only carry what the UI actually consumes.
 */
export interface TownEnsembleDay {
  date: string;
  tempMaxMean: number;
  tempMinMean: number;
  tempMaxSpread: number;
  precipMean: number;
  snowMean: number;
  snowSpread: number;
  sourcesCount: number;
  confidence: "high" | "medium" | "low";
}

export interface TownEnsembleResponse {
  days: TownEnsembleDay[];
  sources: Array<{ id: string; label: string; status: "ok" | "failed" }>;
  generatedAt: string;
}

/** Map our region id to the AU/JP/OTHER hint the API expects. */
function regionCode(regionId: string): "AU" | "JP" | "OTHER" {
  if (regionId === "snowy-mountains" || regionId === "victorias-high-country") return "AU";
  if (regionId === "yamanouchi") return "JP";
  return "OTHER";
}

export function useTownEnsemble(
  lat: number | undefined,
  lng: number | undefined,
  regionId: string | undefined,
) {
  const code = regionId ? regionCode(regionId) : "OTHER";
  return useQuery<TownEnsembleResponse>({
    queryKey: ["town-ensemble", lat, lng, code],
    enabled: lat !== undefined && lng !== undefined,
    // Ensemble is cached 30 min server-side; matching that here avoids
    // re-fetching every navigation while still getting a fresh number on
    // a hard refresh after half an hour.
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const url = `/api/town-ensemble?lat=${lat}&lng=${lng}&region=${code}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`town-ensemble ${res.status}`);
      return (await res.json()) as TownEnsembleResponse;
    },
  });
}

/**
 * Plain-language one-liner that explains today/tomorrow's ensemble agreement
 * in terms a non-meteorologist can act on. Keep it terse - this renders
 * inline under the headline numbers, not as a paragraph.
 *
 * Snowfall gets priority over temperature when there's any snow forecast,
 * because that's the variable people are making the trip decision on.
 */
export function confidencePhrase(day: TownEnsembleDay): string {
  const { confidence, snowMean, snowSpread, tempMaxSpread, sourcesCount } = day;
  // Snow-led phrasing when it actually matters
  if (snowMean >= 1) {
    if (confidence === "high") {
      return `models agree on ~${Math.round(snowMean)}cm`;
    }
    if (confidence === "medium") {
      const lo = Math.max(0, Math.round(snowMean - snowSpread / 2));
      const hi = Math.round(snowMean + snowSpread / 2);
      return `models split · range ${lo}-${hi}cm, recheck closer`;
    }
    const lo = Math.max(0, Math.round(snowMean - snowSpread / 2));
    const hi = Math.round(snowMean + snowSpread / 2);
    return `models disagree · range ${lo}-${hi}cm, don't lock in`;
  }
  // Temp-led phrasing when no snow on the table
  if (confidence === "high") return `${sourcesCount} models agree, plan with confidence`;
  if (confidence === "medium") return `models disagree by ±${tempMaxSpread.toFixed(0)}°, recheck closer`;
  return `models disagree by ±${tempMaxSpread.toFixed(0)}°, don't lock in plans`;
}

/** Tailwind tokens for the dot + pill background, matched to brand palette. */
export function confidenceTone(confidence: "high" | "medium" | "low") {
  switch (confidence) {
    case "high":
      return { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-900 border-emerald-200" };
    case "medium":
      return { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-900 border-amber-200" };
    case "low":
      return { dot: "bg-rose-500", pill: "bg-rose-50 text-rose-900 border-rose-200" };
  }
}
