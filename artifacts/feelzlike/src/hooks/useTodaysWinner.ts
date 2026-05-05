import { useMemo } from "react";
import {
  useSeason,
  type RegionConfig,
} from "@workspace/feelzlike-shell";
import { useGetWeather } from "@workspace/api-client-react";
import type { RegionId } from "@workspace/api-client-react";

import {
  scoreMountain,
  type ScoreTone,
  type WeatherSnapshot,
} from "@/lib/mountainScore";
import { mountainIdToDriveKey } from "@/lib/urlState";

export interface TodaysWinner {
  /** Kebab-case mountain id (matches `MountainLink.id` and `/mountain/:id` URLs). */
  id: string;
  name: string;
  nameJa?: string;
  /** 0–100 composite score. */
  scoreTotal: number;
  scoreTone: ScoreTone;
  /**
   * snake_case key for `Stay.drive_min_to_each_mountain[driveKey]`. When
   * the winning mountain is a sub-area (e.g. `okushiga-kogen`), this resolves
   * to the parent (`shiga_kogen`) since the curated dataset only keys drive
   * times by parent resort granularity.
   */
  driveKey: string;
}

export interface UseTodaysWinnerResult {
  winner: TodaysWinner | null;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Compute today's #1 mountain for a region using the same scoring algorithm
 * the dashboard uses (`scoreMountain`). Returns the winner with a
 * pre-resolved `driveKey` ready to feed into `StayFilterBar.topMountainDriveKey`
 * and `StayMap.topMountainDriveKey`.
 *
 * Returns `null` when:
 * - the region has no mountains configured, OR
 * - the weather query is loading / errored, OR
 * - every mountain scored 0 (no live weather data for any of them — guard
 *   against showing a meaningless "winner" when the API is silent).
 *
 * The Stay page degrades gracefully on null: `applyStaySort` falls through
 * to nearest-mountain sort and the "today's #1" badge isn't rendered.
 */
export function useTodaysWinner(region: RegionConfig): UseTodaysWinnerResult {
  const { season } = useSeason();
  // `region.id` is the kebab string ("snowy-mountains" / "yamanouchi"); the
  // generated `RegionId` enum is the same string set, so the cast is
  // tautological — required only because `RegionConfig.id` is typed loosely
  // (`string`) over in `lib/feelzlike-shell` for forward-compatibility with
  // future regions.
  const weatherQ = useGetWeather({ region: region.id as RegionId });

  const winner = useMemo<TodaysWinner | null>(() => {
    const mountains = region.mountains ?? [];
    if (mountains.length === 0) return null;

    const scored = mountains
      .map((m) => {
        const entry = weatherQ.data?.locations.find(
          (l: { location: { id: string } }) => l.location.id === m.id,
        );
        const c = entry?.current;
        const w: WeatherSnapshot | null = c
          ? {
              temperature: c.temperature,
              feelsLike: c.feelsLike,
              windSpeed: c.windSpeed,
              windGust: c.windGust ?? undefined,
              snowDepth: c.snowDepth ?? 0,
              weatherCode: c.weatherCode,
              cloudCover: c.cloudCover,
              freezingLevel:
                (c as { freezingLevel?: number | null }).freezingLevel ?? null,
            }
          : null;
        return { m, score: scoreMountain(w, season) };
      })
      .sort((a, b) => b.score.total - a.score.total);

    const top = scored[0];
    if (!top || top.score.total <= 0) return null;

    // Sub-resorts (parentId set) roll up to their parent's curated drive-key.
    const driveSourceId = top.m.parentId ?? top.m.id;
    return {
      id: top.m.id,
      name: top.m.name,
      nameJa: top.m.nameJa,
      scoreTotal: top.score.total,
      scoreTone: top.score.tone,
      driveKey: mountainIdToDriveKey(driveSourceId),
    };
  }, [region.mountains, weatherQ.data, season]);

  return {
    winner,
    isLoading: weatherQ.isLoading,
    isError: weatherQ.isError,
  };
}
