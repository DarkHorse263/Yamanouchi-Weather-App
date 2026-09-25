/** Pure comparison contract, separate from catalogue imports for render tests. */
export interface PlannerForecastDay {
  date: string;
  tempMaxMean: number;
  tempMinMean: number;
  feelsLikeMaxMean: number | null;
  feelsLikeMinMean: number | null;
  /** Labels of models contributing a paired daily apparent high/low. */
  feelsLikeSources: string[];
  precipMean: number;
  snowMean: number;
  /** Model spread is available only with forecast.extended. */
  snowSpread: number | null;
  sourcesCount: number;
  confidence: "high" | "medium" | "low";
}

/** Optional fields allow old cached responses to degrade to unavailable. */
export type ForecastApiDay = Omit<PlannerForecastDay,
  "feelsLikeMaxMean" | "feelsLikeMinMean" | "feelsLikeSources" | "snowSpread"> &
  Partial<Pick<PlannerForecastDay, "snowSpread">> &
  Partial<Pick<PlannerForecastDay, "feelsLikeMaxMean" | "feelsLikeMinMean" | "feelsLikeSources">>;

export function toPlannerDay(d: ForecastApiDay): PlannerForecastDay {
  const sources = Array.isArray(d.feelsLikeSources)
    ? [...new Set(d.feelsLikeSources.filter((s) => typeof s === "string" && s.trim().length > 0))]
    : [];
  const high = d.feelsLikeMaxMean;
  const low = d.feelsLikeMinMean;
  const valid = typeof high === "number" && Number.isFinite(high) &&
    typeof low === "number" && Number.isFinite(low) && high >= low &&
    sources.length > 0 && sources.length <= d.sourcesCount;
  return {
    date: d.date,
    tempMaxMean: d.tempMaxMean,
    tempMinMean: d.tempMinMean,
    feelsLikeMaxMean: valid ? high : null,
    feelsLikeMinMean: valid ? low : null,
    feelsLikeSources: valid ? sources : [],
    precipMean: d.precipMean,
    snowMean: d.snowMean,
    snowSpread: typeof d.snowSpread === "number" && Number.isFinite(d.snowSpread)
      ? d.snowSpread : null,
    sourcesCount: d.sourcesCount,
    confidence: d.confidence,
  };
}